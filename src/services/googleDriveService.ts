import { getAccessToken } from './firebaseAuth';
import { GoogleDriveFile } from '../types';

export const listDriveFiles = async (folderId?: string): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access requires signing in with Google.');
  }

  let q = "trashed = false";
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=50&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime,owners)&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Drive files (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access requires signing in with Google.');
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create folder in Google Drive');
  }

  return response.json();
};

export const uploadFileToDrive = async (
  file: File,
  parentFolderId?: string,
  onProgress?: (percent: number) => void
): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access requires signing in with Google.');
  }

  const metadata: any = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const fileContent = reader.result as ArrayBuffer;
        const contentType = file.type || 'application/octet-stream';
        
        const metadataPart = delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata);

        const mediaHeader = delimiter +
          `Content-Type: ${contentType}\r\n` +
          'Content-Transfer-Encoding: base64\r\n\r\n';

        // Convert file content to base64
        let binary = '';
        const bytes = new Uint8Array(fileContent);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        const multipartBody = metadataPart + mediaHeader + base64Data + close_delim;

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to upload file to Google Drive');
        }

        const uploadedFile = await response.json();
        resolve(uploadedFile);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file for upload'));
    reader.readAsArrayBuffer(file);
  });
};

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access requires signing in with Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete file from Google Drive');
  }
};
