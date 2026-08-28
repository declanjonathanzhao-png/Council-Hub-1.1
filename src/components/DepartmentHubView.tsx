import React, { useState } from 'react';
import { Department, CouncilDocument, ViewType } from '../types';

interface DepartmentHubViewProps {
  department: Department;
  documents: CouncilDocument[];
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
  onDeleteFolder?: (departmentId: string, folderName: string, deleteFiles?: boolean) => void;
  onDeleteDocument?: (docId: string) => void;
  onUpdateDepartment?: (departmentId: string, updates: Partial<Department>) => void;
  canEditDepartment?: boolean;
}

export const DepartmentHubView: React.FC<DepartmentHubViewProps> = ({
  department,
  documents,
  onNavigate,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onDeleteFolder,
  onDeleteDocument,
  onUpdateDepartment,
  canEditDepartment = true,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [tempMemberCount, setTempMemberCount] = useState<number>(department.memberCount || 4);
  
  // Folder deletion modal state from Hub
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deleteFolderFilesOption, setDeleteFolderFilesOption] = useState<'keep' | 'delete'>('keep');

  // Document deletion modal state from Hub
  const [docToDelete, setDocToDelete] = useState<CouncilDocument | null>(null);

  const deptDocs = documents.filter((d) => d.departmentId === department.id);

  const filteredDocs = deptDocs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getDocIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <span className="material-symbols-outlined text-[#ba1a1a] text-[20px] fill-icon">picture_as_pdf</span>;
      case 'docx':
        return <span className="material-symbols-outlined text-[#006054] text-[20px] fill-icon">description</span>;
      case 'xlsx':
        return <span className="material-symbols-outlined text-[#87655b] text-[20px] fill-icon">table_chart</span>;
      default:
        return <span className="material-symbols-outlined text-[#6e7976] text-[20px]">insert_drive_file</span>;
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="px-2 py-0.5 bg-[#9ff2e1]/30 border border-[#9ff2e1] rounded text-[#006054] text-[10px] font-bold tracking-wider uppercase">
          Approved
        </span>
      );
    }
    if (status === 'PENDING' || status === 'PENDING REVIEW') {
      return (
        <span className="px-2 py-0.5 bg-[#fed65b]/20 border border-[#fed65b] rounded text-[#745c00] text-[10px] font-bold tracking-wider uppercase">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-[#f6f3ec] border border-[#bec9c5] rounded text-[#6e7976] text-[10px] font-bold tracking-wider uppercase">
        {status}
      </span>
    );
  };

  const handleConfirmDeleteFolder = () => {
    if (folderToDelete && onDeleteFolder) {
      onDeleteFolder(department.id, folderToDelete, deleteFolderFilesOption === 'delete');
      setFolderToDelete(null);
    }
  };

  const handleConfirmDeleteDoc = () => {
    if (docToDelete && onDeleteDocument) {
      onDeleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  const folderDocsCount = (fName: string) => {
    return deptDocs.filter((d) => d.folder === fName).length;
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <nav className="pt-2 pb-3 flex items-center gap-1.5 text-xs text-[#5D4037]">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#006054] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <span className="text-[#1c1c18] font-bold">{department.name}</span>
      </nav>

      {/* Department Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#bec9c5]/40 shadow-xs mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {department.badgeImage ? (
              <>
                <img
                  src={department.badgeImage}
                  alt={department.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shrink-0 border-2 border-[#D4AF37] shadow-md"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const next = e.currentTarget.nextElementSibling as HTMLElement;
                    if (next) next.style.display = 'flex';
                  }}
                />
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#006054]/10 items-center justify-center text-[#006054] shrink-0 border border-[#006054]/20 hidden">
                  <span className="material-symbols-outlined text-[32px] md:text-[36px] fill-icon">
                    {department.iconName}
                  </span>
                </div>
              </>
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054] shrink-0 border border-[#006054]/20">
                <span className="material-symbols-outlined text-[32px] md:text-[36px] fill-icon">
                  {department.iconName}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#1c1c18] tracking-tight">
                {department.name}
              </h1>
              <div className="flex items-center gap-3 text-xs md:text-sm text-[#5D4037] mt-1 font-medium flex-wrap">
                {isEditingMembers ? (
                  <div className="flex items-center gap-1.5 bg-[#f6f3ec] px-2 py-1 rounded-xl border border-[#bec9c5]">
                    <span className="material-symbols-outlined text-[16px] text-[#006054]">group</span>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={tempMemberCount}
                      onChange={(e) => setTempMemberCount(parseInt(e.target.value, 10) || 0)}
                      className="w-16 px-1.5 py-0.5 bg-white border border-[#bec9c5] rounded text-xs font-bold text-[#1c1c18] text-center outline-none focus:border-[#006054]"
                    />
                    <span className="text-xs text-[#5D4037]">Members</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateDepartment) {
                          onUpdateDepartment(department.id, { memberCount: tempMemberCount });
                        }
                        setIsEditingMembers(false);
                      }}
                      className="p-1 text-white bg-[#006054] hover:bg-[#1F7A6C] rounded text-[11px] font-bold cursor-pointer"
                      title="Save member count"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempMemberCount(department.memberCount || 4);
                        setIsEditingMembers(false);
                      }}
                      className="p-1 text-[#6e7976] hover:text-[#ba1a1a] rounded text-[11px] cursor-pointer"
                      title="Cancel"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 group/members">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>{department.memberCount || 0} Members</span>
                    {canEditDepartment && onUpdateDepartment && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempMemberCount(department.memberCount || 4);
                          setIsEditingMembers(true);
                        }}
                        className="ml-1 p-0.5 text-[#6e7976] hover:text-[#006054] hover:bg-[#f6f3ec] rounded transition-colors cursor-pointer"
                        title="Change amount of members"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                    )}
                  </span>
                )}
                <span className="w-1 h-1 rounded-full bg-[#bec9c5]"></span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">folder</span>
                  <span>{deptDocs.length} Active Files</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-[#bec9c5]"></span>
                <span className="text-[#6e7976]">
                  {(department.folders || []).length} Custom Folder Tabs
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('drive_browser')}
              className="flex-1 sm:flex-none py-2.5 px-4 bg-white border border-[#bec9c5] text-[#5D4037] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#f6f3ec] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#006054]">cloud</span>
              <span>Drive Files</span>
            </button>
            <button
              onClick={onOpenUploadModal}
              className="flex-1 sm:flex-none py-2.5 px-5 bg-[#006054] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1F7A6C] shadow-md shadow-[#006054]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Folders Management Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base md:text-lg font-bold text-[#1c1c18]">
              Department Folders
            </h2>
            <span className="text-xs text-[#6e7976]">
              ({(department.folders || []).length})
            </span>
          </div>
          <button
            onClick={onOpenNewFolderModal}
            className="text-xs font-semibold text-[#006054] hover:text-[#1F7A6C] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
            <span>+ New Folder</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {/* Dynamically mapped folders */}
          {(department.folders || []).map((folderName) => {
            const count = folderDocsCount(folderName);

            return (
              <div
                key={folderName}
                className="group relative flex flex-col items-center justify-center gap-2 p-5 bg-white border border-[#dcdad3] rounded-2xl hover:bg-[#f6f3ec] hover:border-[#D4AF37] transition-all shadow-xs"
              >
                {/* Delete Folder Quick Action Button */}
                {onDeleteFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folderName);
                    }}
                    title={`Delete "${folderName}" folder`}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/80 hover:bg-[#ba1a1a] text-[#6e7976] hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}

                <div
                  onClick={() => onNavigate('folder_view', { departmentId: department.id, folderName })}
                  className="w-full flex flex-col items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#D4AF37] text-[36px] md:text-[44px] fill-icon mb-1">
                    folder
                  </span>
                  <div className="text-center w-full px-1">
                    <span className="font-semibold text-sm md:text-base text-[#1c1c18] block truncate group-hover:text-[#006054] transition-colors">
                      {folderName}
                    </span>
                    <span className="text-[11px] text-[#6e7976]">
                      {count} {count === 1 ? 'document' : 'documents'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New Folder Button */}
          <button
            onClick={onOpenNewFolderModal}
            className="flex flex-col items-center justify-center gap-2 p-5 bg-[#f6f3ec] border-2 border-dashed border-[#bec9c5] rounded-2xl hover:bg-[#f0eee7] hover:border-[#006054] transition-all group active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#6e7976] group-hover:text-[#006054] text-[36px] md:text-[40px] transition-colors">
              create_new_folder
            </span>
            <div className="text-center">
              <span className="font-semibold text-sm md:text-base text-[#5D4037] block group-hover:text-[#006054]">
                New Folder
              </span>
              <span className="text-[11px] text-[#6e7976]">Create category</span>
            </div>
          </button>
        </div>
      </div>

      {/* Department Files List & Table */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#e5e2db] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-['Plus_Jakarta_Sans'] text-base md:text-lg font-bold text-[#1c1c18]">
            Department Files ({deptDocs.length})
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60 bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
              <span className="material-symbols-outlined text-[#6e7976] mr-1.5 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[#1c1c18] placeholder:text-[#6e7976]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#5D4037] outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="proposal">Proposals</option>
              <option value="mom">MoM</option>
              <option value="sheet">Sheets</option>
              <option value="notes">Notes</option>
            </select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-10 text-center text-[#6e7976]">
            <span className="material-symbols-outlined text-4xl text-[#bec9c5] mb-2">folder_off</span>
            <p className="font-semibold text-sm">No files found matching criteria</p>
            <button
              onClick={onOpenUploadModal}
              className="mt-3 text-xs font-bold text-[#006054] hover:underline cursor-pointer"
            >
              Upload a document to this department
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#f0eee7]">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onNavigate('document_detail', doc.id)}
                className="p-3.5 md:p-4 hover:bg-[#f6f3ec] flex items-center justify-between gap-3 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#f0eee7] flex items-center justify-center rounded-xl shrink-0">
                    {getDocIcon(doc.format)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-[#1c1c18] truncate group-hover:text-[#006054] transition-colors">
                        {doc.name}
                      </h3>
                      {doc.folder && (
                        <span className="px-2 py-0.2 bg-[#D4AF37]/15 text-[#745c00] rounded-full text-[10px] font-bold">
                          {doc.folder}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6e7976] truncate">
                      {doc.filename} • Updated {doc.uploadDate} • {doc.fileSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusChip(doc.status)}
                  
                  {/* Delete Document Quick Button */}
                  {onDeleteDocument && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocToDelete(doc);
                      }}
                      title="Delete document"
                      className="p-1.5 rounded-lg hover:bg-[#ba1a1a]/10 text-[#6e7976] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('document_detail', doc.id);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#6e7976] hover:text-[#006054] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM DELETE FOLDER MODAL */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">folder_delete</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Delete Folder?
                </h3>
                <p className="text-[11px] text-[#6e7976]">Remove folder "{folderToDelete}"</p>
              </div>
            </div>

            <p className="text-xs text-[#5D4037]">
              Are you sure you want to delete the <strong>"{folderToDelete}"</strong> folder from{' '}
              <strong>{department.name}</strong> ({folderDocsCount(folderToDelete)} files inside)?
            </p>

            {/* Folder Deletion Options */}
            {folderDocsCount(folderToDelete) > 0 && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-[#1c1c18] mb-1">
                  How should files inside this folder be handled?
                </label>

                <div
                  onClick={() => setDeleteFolderFilesOption('keep')}
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    deleteFolderFilesOption === 'keep'
                      ? 'border-[#006054] bg-[#006054]/5 ring-1 ring-[#006054]'
                      : 'border-[#bec9c5]/50 hover:bg-[#f6f3ec]'
                  }`}
                >
                  <input
                    type="radio"
                    name="hubFolderDeleteOption"
                    checked={deleteFolderFilesOption === 'keep'}
                    onChange={() => setDeleteFolderFilesOption('keep')}
                    className="mt-0.5 accent-[#006054]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1c1c18]">Keep Files (Recommended)</p>
                    <p className="text-[11px] text-[#6e7976]">
                      Keep all {folderDocsCount(folderToDelete)} files in the department and remove the folder tag.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setDeleteFolderFilesOption('delete')}
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    deleteFolderFilesOption === 'delete'
                      ? 'border-[#ba1a1a] bg-[#ba1a1a]/5 ring-1 ring-[#ba1a1a]'
                      : 'border-[#bec9c5]/50 hover:bg-[#f6f3ec]'
                  }`}
                >
                  <input
                    type="radio"
                    name="hubFolderDeleteOption"
                    checked={deleteFolderFilesOption === 'delete'}
                    onChange={() => setDeleteFolderFilesOption('delete')}
                    className="mt-0.5 accent-[#ba1a1a]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#ba1a1a]">Delete Folder & All {folderDocsCount(folderToDelete)} File(s)</p>
                    <p className="text-[11px] text-[#6e7976]">
                      Permanently delete this folder and all documents inside it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFolder}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {deleteFolderFilesOption === 'delete' && folderDocsCount(folderToDelete) > 0
                  ? `Delete Folder & ${folderDocsCount(folderToDelete)} Files`
                  : 'Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DOCUMENT MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base md:text-lg text-[#1c1c18]">
                  Delete Document?
                </h3>
                <p className="text-[11px] text-[#6e7976]">Remove file from {department.name}</p>
              </div>
            </div>

            <div className="p-3 bg-[#f6f3ec] rounded-2xl border border-[#e5e2db] space-y-1">
              <p className="text-xs font-bold text-[#1c1c18] truncate">{docToDelete.name}</p>
              <p className="text-[11px] text-[#6e7976]">{docToDelete.filename} • {docToDelete.fileSize}</p>
            </div>

            <p className="text-xs text-[#5D4037]">
              Are you sure you want to permanently delete this document?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

