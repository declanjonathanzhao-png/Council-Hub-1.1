import React, { useState, useEffect } from 'react';
import { Department, CouncilDocument, FileFormat } from '../types';
import { User } from 'firebase/auth';
import { uploadFileToDrive } from '../services/googleDriveService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  user: User | null;
  guestProfile?: {
    name: string;
    role: string;
    departmentId: string;
    email?: string;
  } | null;
  onDocumentCreated: (doc: CouncilDocument) => void;
  defaultDepartmentId?: string;
  defaultType?: 'Proposal' | 'MoM' | 'Report' | 'Guidelines' | 'Notes' | 'Poster' | 'Sheet';
  defaultFolder?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  departments,
  user,
  guestProfile,
  onDocumentCreated,
  defaultDepartmentId,
  defaultType = 'Proposal',
  defaultFolder,
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'google_link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || 'dept-exec');
  const [docType, setDocType] = useState(defaultType);
  const [folder, setFolder] = useState<string>(defaultFolder || '');
  const [syncToDrive, setSyncToDrive] = useState(true);
  
  // Multi-stage loading system
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultDepartmentId) setDepartmentId(defaultDepartmentId);
      if (defaultType) setDocType(defaultType);
      if (defaultFolder) {
        setFolder(defaultFolder);
      } else {
        const currentDept = departments.find((d) => d.id === (defaultDepartmentId || departmentId));
        setFolder((currentDept?.folders && currentDept.folders[0]) || '');
      }
      setTitle('');
      setFile(null);
      setGoogleUrl('');
      setErrorMessage(null);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  }, [isOpen, defaultDepartmentId, defaultType, defaultFolder, departments, departmentId]);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const parseGoogleLink = (url: string) => {
    let driveFileId: string | undefined;
    let format: FileFormat = 'pdf';
    let detectedType = docType;

    if (url.includes('docs.google.com/document/d/')) {
      const match = url.match(/document\/d\/([a-zA-Z0-9-_]+)/);
      if (match) driveFileId = match[1];
      format = 'gdoc';
    } else if (url.includes('docs.google.com/spreadsheets/d/')) {
      const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) driveFileId = match[1];
      format = 'gsheet';
      detectedType = 'Sheet';
    } else if (url.includes('docs.google.com/presentation/d/')) {
      const match = url.match(/presentation\/d\/([a-zA-Z0-9-_]+)/);
      if (match) driveFileId = match[1];
      format = 'gslides';
    } else if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/file\/d\/([a-zA-Z0-9-_]+)/);
      if (match) driveFileId = match[1];
    }

    return { driveFileId, format, detectedType };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a document title.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadStage('Validating document & metadata...');
      await new Promise((r) => setTimeout(r, 200));

      const selectedDept = departments.find((d) => d.id === departmentId) || departments[0];
      let format: FileFormat = 'pdf';
      let driveFileId: string | undefined;
      let driveWebViewLink: string | undefined;
      let fileDataUrl: string | undefined;
      let calculatedSize = '1.2 MB';
      let finalDocType = docType;

      if (uploadMode === 'google_link') {
        setUploadProgress(40);
        setUploadStage('Connecting to Google Docs/Sheets Workspace...');
        const parsed = parseGoogleLink(googleUrl.trim());
        driveFileId = parsed.driveFileId;
        driveWebViewLink = googleUrl.trim();
        format = parsed.format;
        if (parsed.detectedType) finalDocType = parsed.detectedType;
        calculatedSize = 'Google Cloud Workspace Doc';
        await new Promise((r) => setTimeout(r, 300));
      } else {
        if (file) {
          calculatedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
          if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') format = 'xlsx';
          else if (ext === 'docx' || ext === 'doc') format = 'docx';
          else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') format = 'png';
          else if (ext === 'txt') format = 'txt';
          else format = 'pdf';

          setUploadProgress(45);
          setUploadStage('Reading file and generating local preview stream...');

          try {
            fileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } catch (readErr) {
            console.warn('Could not read file data URL:', readErr);
          }

          if (user && syncToDrive) {
            setUploadProgress(75);
            setUploadStage('Syncing copy to authorized Google Drive storage...');
            try {
              const driveRes = await uploadFileToDrive(file);
              driveFileId = driveRes.id;
              driveWebViewLink = driveRes.webViewLink;
            } catch (driveErr) {
              console.warn('Could not sync to drive:', driveErr);
            }
          }
        }
      }

      setUploadProgress(90);
      setUploadStage('Saving document and broadcasting live updates to council members...');
      await new Promise((r) => setTimeout(r, 250));

      const uploaderName = user?.displayName || guestProfile?.name || 'Council Member';
      const uploaderInitials = uploaderName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const newDoc: CouncilDocument = {
        id: `doc-${Date.now()}`,
        name: title.trim(),
        filename: file ? file.name : `${title.toLowerCase().replace(/\s+/g, '_')}.${format === 'gsheet' ? 'sheet' : format === 'gdoc' ? 'doc' : 'pdf'}`,
        format,
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
        folder: folder || (finalDocType === 'MoM' ? 'Minutes of Meeting' : 'Proposals'),
        type: finalDocType as any,
        uploadedBy: {
          name: uploaderName,
          initials: uploaderInitials,
          avatarUrl: user?.photoURL || '',
          role: guestProfile?.role || (user ? 'Council Administrator' : 'Council Member'),
        },
        uploadDate: 'Just now',
        fileSize: calculatedSize,
        status: finalDocType === 'Proposal' ? 'PENDING REVIEW' : 'APPROVED',
        driveFileId,
        driveWebViewLink,
        fileDataUrl,
        comments: [],
      };

      setUploadProgress(85);
      setUploadStage('Syncing to Firestore cloud database across all devices...');
      
      // Save document to Firestore and update state
      await onDocumentCreated(newDoc);

      setUploadProgress(100);
      setUploadStage('Upload & Cloud Sync Complete!');
      await new Promise((r) => setTimeout(r, 200));

      onClose();
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMessage(err.message || 'Upload failed. Please check your internet connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e2db]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054]">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Upload Council Document
              </h3>
              <p className="text-xs text-[#6e7976]">Submit proposals, minutes, Google Sheets, or Google Docs.</p>
            </div>
          </div>
          <button 
            disabled={isUploading}
            onClick={onClose} 
            className="p-1 rounded-xl hover:bg-[#f6f3ec] text-[#6e7976]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Upload Mode Selector */}
        <div className="flex p-1 bg-[#f6f3ec] rounded-xl my-4 text-xs font-semibold text-[#5D4037]">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              uploadMode === 'file'
                ? 'bg-white text-[#006054] font-bold shadow-xs'
                : 'hover:text-[#1c1c18]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">file_upload</span>
            <span>Upload File (PDF/Excel/Word)</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('google_link')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              uploadMode === 'google_link'
                ? 'bg-white text-[#006054] font-bold shadow-xs'
                : 'hover:text-[#1c1c18]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span>Google Docs / Sheets Link</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-[#ffdad6]/70 border border-[#ffdad6] rounded-xl text-[#ba1a1a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading System Indicator */}
          {isUploading && (
            <div className="p-4 bg-[#9ff2e1]/20 border border-[#006054]/30 rounded-2xl space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-[#006054]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#006054] border-t-transparent rounded-full animate-spin"></div>
                  <span>{uploadStage}</span>
                </div>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#bec9c5]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006054] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {uploadMode === 'file' ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-[#006054] bg-[#9ff2e1]/10'
                  : file
                  ? 'border-[#006054] bg-[#FAF7F0]'
                  : 'border-[#bec9c5] hover:border-[#006054] bg-[#f6f3ec]/50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <span className="material-symbols-outlined text-4xl text-[#006054] mb-2">
                  {file ? 'task' : 'cloud_upload'}
                </span>
                {file ? (
                  <div>
                    <p className="font-bold text-sm text-[#1c1c18]">{file.name}</p>
                    <p className="text-[11px] text-[#6e7976] mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm text-[#1c1c18]">
                      Drag and drop file here, or <span className="text-[#006054] underline">browse</span>
                    </p>
                    <p className="text-[11px] text-[#6e7976] mt-1">Supports PDF, XLSX, DOCX, PNG, CSV, TXT</p>
                  </div>
                )}
              </label>
            </div>
          ) : (
            /* Google Docs / Sheets URL input */
            <div className="space-y-2 p-4 bg-[#FAF7F0] rounded-2xl border border-[#bec9c5]/50">
              <label className="block font-bold text-[#5D4037]">
                Google Docs or Google Sheets Web URL <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#006054] text-[18px]">
                  link
                </span>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/... or /document/d/..."
                  value={googleUrl}
                  onChange={(e) => {
                    setGoogleUrl(e.target.value);
                    if (!title && e.target.value.includes('spreadsheets')) {
                      setTitle('Google Spreadsheet Master Sheet');
                    } else if (!title && e.target.value.includes('document')) {
                      setTitle('Google Docs Official Proposal');
                    }
                  }}
                  disabled={isUploading}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
                />
              </div>
              <p className="text-[11px] text-[#6e7976]">
                Paste any shared Google Sheet, Google Doc, or Google Slide link. It will load with live interactive preview.
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#5D4037] mb-1">
              Document Title <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FY24 Budget Allocation Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#5D4037] mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isUploading}
                className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#5D4037] mb-1">Target Folder Tab</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                disabled={isUploading}
                className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
              >
                {(departments.find((d) => d.id === departmentId)?.folders || []).length === 0 ? (
                  <option value="">General / Root</option>
                ) : (
                  (departments.find((d) => d.id === departmentId)?.folders || []).map((fName) => (
                    <option key={fName} value={fName}>
                      {fName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#5D4037] mb-1">Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                disabled={isUploading}
                className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
              >
                <option value="Proposal">Proposal</option>
                <option value="MoM">Minutes of Meeting (MoM)</option>
                <option value="Report">Report</option>
                <option value="Guidelines">Guidelines</option>
                <option value="Sheet">Spreadsheet</option>
                <option value="Notes">Notes</option>
              </select>
            </div>
          </div>

          {user && uploadMode === 'file' && (
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#9ff2e1]/20 rounded-xl border border-[#9ff2e1] text-[#006054]">
              <input
                type="checkbox"
                checked={syncToDrive}
                onChange={(e) => setSyncToDrive(e.target.checked)}
                disabled={isUploading}
                className="rounded accent-[#006054]"
              />
              <span className="font-semibold text-xs">
                Upload copy directly to my connected Google Drive
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e2db]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-[#5D4037] hover:bg-[#f6f3ec] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !title.trim() || (uploadMode === 'file' && !file && !title.trim()) || (uploadMode === 'google_link' && !googleUrl.trim())}
              className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              {isUploading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isUploading ? 'Uploading...' : 'Save & Upload'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
