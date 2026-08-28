import React, { useState, useEffect } from 'react';
import { GoogleDriveFile, Department, CouncilDocument, FileFormat } from '../types';
import { listDriveFiles, createDriveFolder, uploadFileToDrive, deleteDriveFile } from '../services/googleDriveService';
import { ConfirmationDialog } from './ConfirmationDialog';

interface GoogleDriveBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: Department[];
  currentDepartmentId?: string;
  onImportDocument?: (doc: CouncilDocument) => void;
  onSelectDriveFile?: (file: GoogleDriveFile) => void;
}

export const GoogleDriveBrowserModal: React.FC<GoogleDriveBrowserModalProps> = ({
  isOpen,
  onClose,
  departments = [],
  currentDepartmentId,
  onImportDocument,
  onSelectDriveFile,
}) => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMime, setFilterMime] = useState<'all' | 'sheets' | 'docs' | 'folders'>('all');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importingFileId, setImportingFileId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setActionError(null);
      const items = await listDriveFiles();
      setFiles(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Drive workspace items. Please verify your Google account connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      setActionSuccess(null);
      setActionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(20);
      setActionError(null);
      setActionSuccess(null);
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 200);

      await uploadFileToDrive(file);
      clearInterval(interval);
      setUploadProgress(100);
      setActionSuccess(`Successfully uploaded "${file.name}" to Google Drive.`);
      await fetchFiles();
    } catch (err: any) {
      setActionError(err.message || 'Failed to upload file to Google Drive');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setFolderError(null);
      await createDriveFolder(newFolderName.trim());
      setShowNewFolderModal(false);
      setNewFolderName('');
      setActionSuccess(`Folder "${newFolderName.trim()}" created successfully.`);
      await fetchFiles();
    } catch (err: any) {
      setFolderError(err.message || 'Failed to create folder');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      setActionError(null);
      await deleteDriveFile(fileToDelete.id);
      setActionSuccess(`Deleted "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete file from Google Drive');
    }
  };

  const handleImportToCouncil = async (file: GoogleDriveFile) => {
    if (!onImportDocument) {
      if (onSelectDriveFile) onSelectDriveFile(file);
      return;
    }

    try {
      setImportingFileId(file.id);
      const isSheet = file.mimeType?.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv');
      const isDoc = file.mimeType?.includes('document') || file.name.endsWith('.docx');
      const isSlides = file.mimeType?.includes('presentation') || file.name.endsWith('.pptx');

      let format: FileFormat = 'pdf';
      let docType: any = 'Proposal';
      if (isSheet) {
        format = 'gsheet';
        docType = 'Sheet';
      } else if (isDoc) {
        format = 'gdoc';
        docType = 'Proposal';
      } else if (isSlides) {
        format = 'gslides';
        docType = 'Report';
      }

      const targetDept = departments.find((d) => d.id === currentDepartmentId) || departments[0] || {
        id: 'dept-exec',
        name: 'Executive Board',
        folders: ['Proposals', 'Minutes of Meeting'],
      };

      const importedDoc: CouncilDocument = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        format,
        departmentId: targetDept.id,
        departmentName: targetDept.name,
        folder: isSheet ? 'Financial Sheets' : isDoc ? 'Proposals' : 'General',
        type: docType,
        uploadedBy: {
          name: 'Google Drive Sync',
          initials: 'GD',
          role: 'Google Workspace',
        },
        uploadDate: 'Just now',
        fileSize: file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(1)} MB` : 'Google Workspace Cloud Doc',
        status: 'APPROVED',
        driveFileId: file.id,
        driveWebViewLink: file.webViewLink,
        comments: [],
      };

      onImportDocument(importedDoc);
      setActionSuccess(`Imported "${file.name}" to ${targetDept.name}!`);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setActionError(err.message || 'Could not import file.');
    } finally {
      setImportingFileId(null);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMime === 'sheets') {
      return f.mimeType?.includes('spreadsheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv');
    }
    if (filterMime === 'docs') {
      return f.mimeType?.includes('document') || f.name.endsWith('.docx') || f.name.endsWith('.pdf');
    }
    if (filterMime === 'folders') {
      return f.mimeType === 'application/vnd.google-apps.folder';
    }
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] max-h-[750px] shadow-2xl border border-[#bec9c5]/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 md:px-6 border-b border-[#e5e2db] flex items-center justify-between bg-[#FAF7F0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054]">
                <span className="material-symbols-outlined text-[24px]">cloud</span>
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Google Drive Workspace
                </h2>
                <p className="text-xs text-[#5D4037]">
                  Browse, load, and attach Google Sheets and Google Docs directly to Council Departments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3.5 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>{uploading ? 'Uploading...' : 'Upload to Drive'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-3.5 py-2 bg-white border border-[#bec9c5] hover:bg-[#f6f3ec] text-[#5D4037] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
                <span>New Folder</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#6e7976] hover:bg-[#e5e2db] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar & Filter Tabs */}
          <div className="p-4 border-b border-[#e5e2db] flex flex-col gap-3 bg-white">
            {actionError && (
              <div className="p-2.5 bg-[#ffdad6]/70 border border-[#ffdad6] rounded-xl text-[#ba1a1a] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{actionError}</span>
                </div>
                <button onClick={() => setActionError(null)} className="p-1 hover:text-[#93000a]">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {actionSuccess && (
              <div className="p-2.5 bg-[#9ff2e1]/30 border border-[#006054]/30 rounded-xl text-[#006054] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span className="font-semibold">{actionSuccess}</span>
                </div>
                <button onClick={() => setActionSuccess(null)} className="p-1 hover:text-[#004d40]">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {uploading && (
              <div className="p-3 bg-[#9ff2e1]/20 border border-[#006054]/20 rounded-xl space-y-1.5 animate-pulse">
                <div className="flex justify-between text-[11px] font-bold text-[#006054]">
                  <span>Uploading file to Google Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#bec9c5]/30 rounded-full overflow-hidden">
                  <div className="h-full bg-[#006054] transition-all" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
                <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search Google Docs, Sheets, or PDFs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1c18]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setFilterMime('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMime === 'all' ? 'bg-[#006054] text-white' : 'bg-[#f6f3ec] text-[#5D4037] hover:bg-[#e5e2db]'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setFilterMime('sheets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    filterMime === 'sheets' ? 'bg-[#006054] text-white' : 'bg-[#f6f3ec] text-[#5D4037] hover:bg-[#e5e2db]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">table_chart</span>
                  <span>Sheets</span>
                </button>
                <button
                  onClick={() => setFilterMime('docs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    filterMime === 'docs' ? 'bg-[#006054] text-white' : 'bg-[#f6f3ec] text-[#5D4037] hover:bg-[#e5e2db]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">article</span>
                  <span>Docs</span>
                </button>
                <button
                  onClick={() => setFilterMime('folders')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    filterMime === 'folders' ? 'bg-[#006054] text-white' : 'bg-[#f6f3ec] text-[#5D4037] hover:bg-[#e5e2db]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">folder</span>
                  <span>Folders</span>
                </button>

                <button
                  onClick={fetchFiles}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-[#bec9c5]/60 hover:bg-[#f6f3ec] text-[#5D4037] cursor-pointer ml-1"
                  title="Refresh items from Google Drive"
                >
                  <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* File Explorer Content with Loading Skeletons */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#FAF7F0]/40">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-[#bec9c5]/40 shadow-xs animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e5e2db]"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-[#e5e2db] rounded-md w-3/4"></div>
                        <div className="h-2.5 bg-[#e5e2db] rounded-md w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-[#f6f3ec] rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-[#ffdad6]/40 border border-[#ffdad6] rounded-2xl p-6 text-center max-w-md mx-auto my-12 space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#ba1a1a]">cloud_off</span>
                <p className="text-xs text-[#ba1a1a] font-medium">{error}</p>
                <button
                  onClick={fetchFiles}
                  className="px-4 py-2 bg-[#006054] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">folder_open</span>
                </div>
                <p className="text-sm font-semibold text-[#1c1c18]">No Google Drive items found</p>
                <p className="text-xs text-[#6e7976]">Upload a proposal, Google Sheet, or create a folder to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredFiles.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const isSheet = file.mimeType?.includes('spreadsheet') || file.name.endsWith('.xlsx');
                  const isDoc = file.mimeType?.includes('document') || file.name.endsWith('.docx');
                  const isSlides = file.mimeType?.includes('presentation') || file.name.endsWith('.pptx');

                  return (
                    <div
                      key={file.id}
                      className="bg-white rounded-2xl p-4 border border-[#bec9c5]/50 shadow-xs hover:shadow-md hover:border-[#006054]/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isFolder
                              ? 'bg-[#fed65b]/30 text-[#745c00]'
                              : isSheet
                              ? 'bg-[#107c41]/10 text-[#107c41]'
                              : isDoc
                              ? 'bg-[#185abd]/10 text-[#185abd]'
                              : isSlides
                              ? 'bg-[#e37400]/10 text-[#e37400]'
                              : 'bg-[#006054]/10 text-[#006054]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isFolder ? 'folder' : isSheet ? 'table_chart' : isDoc ? 'article' : isSlides ? 'slideshow' : 'description'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-bold text-[#1c1c18] truncate group-hover:text-[#006054] transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </h4>
                          <p className="text-[10px] text-[#6e7976] mt-0.5">
                            {isSheet ? 'Google Sheet' : isDoc ? 'Google Doc' : isSlides ? 'Google Slides' : isFolder ? 'Drive Folder' : 'Drive File'} •{' '}
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Active'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#e5e2db] text-xs gap-1.5">
                        {!isFolder && onImportDocument && (
                          <button
                            onClick={() => handleImportToCouncil(file)}
                            disabled={importingFileId === file.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            {importingFileId === file.id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-outlined text-[13px]">add_link</span>
                            )}
                            <span>Attach</span>
                          </button>
                        )}

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#006054] hover:underline flex items-center gap-0.5 ml-auto"
                          >
                            <span>Open</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          </a>
                        )}

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1 rounded-md transition-colors cursor-pointer ml-1"
                          title="Delete from Google Drive"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-3">
              Create New Folder in Google Drive
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              {folderError && (
                <div className="p-2.5 bg-[#ffdad6]/70 border border-[#ffdad6] rounded-xl text-[#ba1a1a] text-xs">
                  {folderError}
                </div>
              )}
              <input
                type="text"
                required
                placeholder="Folder name (e.g. 2026 Executive MoMs)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full text-xs p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3.5 py-2 rounded-xl text-[#5D4037] hover:bg-[#f6f3ec] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006054] text-white font-bold rounded-xl cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={!!fileToDelete}
        title="Delete Google Drive File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.name}" from your Google Drive? This action cannot be undone.`}
        confirmLabel="Delete from Drive"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFileToDelete(null)}
      />
    </>
  );
};
