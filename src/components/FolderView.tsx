import React, { useState } from 'react';
import { Department, CouncilDocument, ViewType } from '../types';

interface FolderViewProps {
  department: Department;
  folderName: string;
  departments: Department[];
  documents: CouncilDocument[];
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenUploadModal: (folder?: string) => void;
  onOpenNewFolderModal: (deptId?: string) => void;
  onRenameFolder: (departmentId: string, oldName: string, newName: string) => void;
  onDeleteFolder: (departmentId: string, folderName: string, deleteFiles?: boolean) => void;
  onMoveDocument: (docId: string, targetFolderName: string) => void;
  onMoveMultipleDocuments?: (docIds: string[], targetFolderName: string) => void;
  onDeleteDocument: (docId: string) => void;
  onDeleteMultipleDocuments?: (docIds: string[]) => void;
  onToggleStarDocument: (docId: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  department,
  folderName,
  departments,
  documents,
  onNavigate,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onRenameFolder,
  onDeleteFolder,
  onMoveDocument,
  onMoveMultipleDocuments,
  onDeleteDocument,
  onDeleteMultipleDocuments,
  onToggleStarDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  
  // Folder Renaming state
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState(folderName);
  
  // Folder deletion modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFolderFilesOption, setDeleteFolderFilesOption] = useState<'keep' | 'delete'>('keep');

  // Single Document Move modal state
  const [movingDoc, setMovingDoc] = useState<CouncilDocument | null>(null);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>('');

  // Single Document Delete modal state
  const [docToDelete, setDocToDelete] = useState<CouncilDocument | null>(null);

  // Multi-select & Bulk operations state
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkTargetFolder, setBulkTargetFolder] = useState<string>('');

  // Keep input in sync if folderName prop changes
  React.useEffect(() => {
    setCustomNameInput(folderName);
    setIsEditingName(false);
    setSelectedDocIds([]);
  }, [folderName, department.id]);

  // Filter documents that belong to this department and this folder
  const folderDocs = documents.filter((d) => {
    if (d.departmentId !== department.id) return false;
    if (d.folder) {
      return d.folder.toLowerCase() === folderName.toLowerCase();
    }
    return false;
  });

  const filtered = folderDocs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || d.status.toLowerCase().replace(/\s+/g, '') === statusFilter.toLowerCase().replace(/\s+/g, '');
    
    const matchesFormat =
      formatFilter === 'all' ||
      (formatFilter === 'docs' && ['docx', 'gdoc', 'pdf', 'txt'].includes(d.format)) ||
      (formatFilter === 'sheets' && ['xlsx', 'gsheet'].includes(d.format)) ||
      (formatFilter === 'media' && ['png', 'gslides'].includes(d.format));

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const allDepartmentFolders = department.folders || [];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customNameInput.trim();
    if (!trimmed || trimmed === folderName) {
      setIsEditingName(false);
      return;
    }
    onRenameFolder(department.id, folderName, trimmed);
    setIsEditingName(false);
  };

  const handleConfirmDeleteFolder = () => {
    onDeleteFolder(department.id, folderName, deleteFolderFilesOption === 'delete');
    setShowDeleteConfirm(false);
  };

  const handleExecuteMove = () => {
    if (movingDoc && targetMoveFolder) {
      onMoveDocument(movingDoc.id, targetMoveFolder);
      setMovingDoc(null);
    }
  };

  const handleExecuteBulkMove = () => {
    if (bulkTargetFolder && selectedDocIds.length > 0) {
      if (onMoveMultipleDocuments) {
        onMoveMultipleDocuments(selectedDocIds, bulkTargetFolder);
      } else {
        selectedDocIds.forEach((id) => onMoveDocument(id, bulkTargetFolder));
      }
      setShowBulkMoveModal(false);
      setSelectedDocIds([]);
    }
  };

  const handleConfirmSingleDeleteDoc = () => {
    if (docToDelete) {
      onDeleteDocument(docToDelete.id);
      setSelectedDocIds((prev) => prev.filter((id) => id !== docToDelete.id));
      setDocToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedDocIds.length > 0) {
      if (onDeleteMultipleDocuments) {
        onDeleteMultipleDocuments(selectedDocIds);
      } else {
        selectedDocIds.forEach((id) => onDeleteDocument(id));
      }
      setShowBulkDeleteModal(false);
      setSelectedDocIds([]);
    }
  };

  const toggleSelectDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.length === filtered.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filtered.map((d) => d.id));
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return { icon: 'picture_as_pdf', color: 'text-[#ba1a1a]', bg: 'bg-[#ba1a1a]/10' };
      case 'docx':
      case 'gdoc':
        return { icon: 'description', color: 'text-[#006054]', bg: 'bg-[#006054]/10' };
      case 'xlsx':
      case 'gsheet':
        return { icon: 'table_chart', color: 'text-[#1F7A6C]', bg: 'bg-[#1F7A6C]/10' };
      case 'gslides':
        return { icon: 'slideshow', color: 'text-[#745c00]', bg: 'bg-[#fed65b]/20' };
      case 'png':
        return { icon: 'image', color: 'text-[#5D4037]', bg: 'bg-[#5D4037]/10' };
      default:
        return { icon: 'article', color: 'text-[#6e7976]', bg: 'bg-[#f6f3ec]' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9ff2e1]/40 text-[#006054] border border-[#9ff2e1]">
            APPROVED
          </span>
        );
      case 'PENDING REVIEW':
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fed65b]/40 text-[#745c00] border border-[#fed65b]">
            PENDING
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f6f3ec] text-[#6e7976] border border-[#bec9c5]">
            DRAFT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f6f3ec] text-[#6e7976]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <nav className="pt-2 pb-3 flex items-center gap-1.5 text-xs text-[#5D4037]">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#006054] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <button
          onClick={() => onNavigate('department_hub', department.id)}
          className="hover:text-[#006054] transition-colors cursor-pointer"
        >
          {department.name}
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <span className="text-[#1c1c18] font-bold">{folderName}</span>
      </nav>

      {/* DEPARTMENT FOLDER TAB SELECTOR */}
      {allDepartmentFolders.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-[#e5e2db] custom-scrollbar">
          {allDepartmentFolders.map((fName) => {
            const isActive = fName.toLowerCase() === folderName.toLowerCase();
            const count = documents.filter(
              (d) =>
                d.departmentId === department.id &&
                d.folder?.toLowerCase() === fName.toLowerCase()
            ).length;

            return (
              <button
                key={fName}
                onClick={() => onNavigate('folder_view', { departmentId: department.id, folderName: fName })}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#006054] text-white shadow-xs'
                    : 'bg-white text-[#5D4037] hover:bg-[#f6f3ec] border border-[#bec9c5]/50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isActive ? 'text-white' : 'text-[#D4AF37]'
                  }`}
                >
                  folder
                </span>
                <span>{fName}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f6f3ec] text-[#6e7976]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Add Folder Tab Button */}
          <button
            onClick={() => onOpenNewFolderModal(department.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#006054] hover:bg-[#006054]/10 border border-dashed border-[#006054]/40 shrink-0 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
            <span>Add Folder Tab</span>
          </button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-white rounded-3xl p-5 md:p-7 border border-[#bec9c5]/40 shadow-xs mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#FAF7F0] to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[32px] md:text-[38px] fill-icon">
                folder
              </span>
            </div>

            <div>
              {/* Folder Title & Rename / Delete actions */}
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    autoFocus
                    placeholder="Enter folder tab name..."
                    className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18] bg-[#f6f3ec] border-2 border-[#006054] rounded-xl px-3 py-1 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#006054] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#1F7A6C] cursor-pointer"
                  >
                    Save Tab Name
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomNameInput(folderName);
                      setIsEditingName(false);
                    }}
                    className="px-3 py-1.5 bg-[#f6f3ec] hover:bg-[#e5e2db] text-[#5D4037] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#1c1c18] tracking-tight">
                    {folderName}
                  </h1>
                  
                  {/* Modify/Rename Tab Name Button */}
                  <button
                    onClick={() => setIsEditingName(true)}
                    title="Modify folder tab name"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#f6f3ec] border border-[#bec9c5]/60 text-xs font-semibold text-[#5D4037] hover:text-[#006054] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Rename Tab</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete folder tab"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 border border-[#ba1a1a]/30 text-xs font-semibold text-[#ba1a1a] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete Folder</span>
                  </button>
                </div>
              )}

              <p className="text-xs md:text-sm text-[#5D4037] mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#006054]">{department.name}</span>
                <span>•</span>
                <span>{folderDocs.length} {folderDocs.length === 1 ? 'file' : 'files'} stored</span>
                <span>•</span>
                <span className="text-[#6e7976]">Accessible by all {department.name} council members</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenUploadModal(folderName)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              <span>Upload to {folderName}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BULK SELECTION ACTION BAR (Appears when 1+ files selected) */}
      {selectedDocIds.length > 0 && (
        <div className="bg-[#006054] text-white rounded-2xl p-3.5 px-5 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
              {selectedDocIds.length}
            </div>
            <span className="text-xs md:text-sm font-semibold">
              {selectedDocIds.length} {selectedDocIds.length === 1 ? 'document' : 'documents'} selected
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs underline text-white/80 hover:text-white ml-2 cursor-pointer"
            >
              {selectedDocIds.length === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkTargetFolder(allDepartmentFolders.find((f) => f !== folderName) || folderName);
                setShowBulkMoveModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
              <span>Move Selected</span>
            </button>

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Delete Selected ({selectedDocIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedDocIds([])}
              className="p-1.5 text-white/70 hover:text-white rounded-lg cursor-pointer"
              title="Cancel selection"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 p-4 mb-5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {filtered.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#5D4037] hover:text-[#1c1c18] select-none">
              <input
                type="checkbox"
                checked={selectedDocIds.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-[#006054] focus:ring-[#006054] accent-[#006054] cursor-pointer"
              />
              <span className="hidden sm:inline">Select All</span>
            </label>
          )}

          <div className="relative flex-1 md:w-80 bg-[#f6f3ec] rounded-xl px-3.5 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
            <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
            <input
              type="text"
              placeholder={`Search in ${folderName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[#1c1c18]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[#6e7976] hover:text-[#1c1c18] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center bg-[#f6f3ec] p-1 rounded-xl border border-[#bec9c5]/60 text-xs">
            <button
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                formatFilter === 'all' ? 'bg-white text-[#006054] shadow-xs' : 'text-[#5D4037] hover:text-[#1c1c18]'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setFormatFilter('docs')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                formatFilter === 'docs' ? 'bg-white text-[#006054] shadow-xs' : 'text-[#5D4037] hover:text-[#1c1c18]'
              }`}
            >
              Docs & PDFs
            </button>
            <button
              onClick={() => setFormatFilter('sheets')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                formatFilter === 'sheets' ? 'bg-white text-[#006054] shadow-xs' : 'text-[#5D4037] hover:text-[#1c1c18]'
              }`}
            >
              Sheets
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#5D4037] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending review">Pending</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* DOCUMENT LIST / GRID */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const fmt = getFormatIcon(doc.format);
            const isSelected = selectedDocIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                  isSelected
                    ? 'border-[#006054] ring-2 ring-[#006054]/20 bg-[#006054]/5'
                    : 'border-[#bec9c5]/40 hover:border-[#006054]/40'
                }`}
              >
                <div>
                  {/* Top line: Selection checkbox, format icon, category, and star */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDoc(doc.id)}
                        className="w-4 h-4 rounded text-[#006054] focus:ring-[#006054] accent-[#006054] cursor-pointer"
                      />
                      <div
                        className={`w-9 h-9 rounded-xl ${fmt.bg} ${fmt.color} flex items-center justify-center shrink-0`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{fmt.icon}</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5D4037]">
                        {doc.format.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {getStatusBadge(doc.status)}
                      <button
                        onClick={() => onToggleStarDocument(doc.id)}
                        className="p-1 rounded-lg hover:bg-[#FAF7F0] text-[#6e7976] hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            doc.isStarred ? 'text-[#D4AF37] fill-icon' : ''
                          }`}
                        >
                          star
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h3
                    onClick={() => onNavigate('document_detail', doc.id)}
                    className="font-['Plus_Jakarta_Sans'] font-bold text-sm md:text-base text-[#1c1c18] group-hover:text-[#006054] transition-colors line-clamp-2 cursor-pointer mb-2"
                  >
                    {doc.name}
                  </h3>

                  <p className="text-[11px] text-[#6e7976] truncate mb-4">
                    {doc.filename}
                  </p>
                </div>

                {/* Bottom line: Author, date, size and action buttons */}
                <div className="pt-3 border-t border-[#f0eee7] flex items-center justify-between text-xs text-[#5D4037]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#006054]/10 text-[#006054] font-bold text-[10px] flex items-center justify-center">
                      {doc.uploadedBy.initials}
                    </div>
                    <div className="leading-tight">
                      <span className="font-semibold text-[#1c1c18] block text-[11px]">
                        {doc.uploadedBy.name}
                      </span>
                      <span className="text-[10px] text-[#6e7976]">{doc.uploadDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move document to another folder */}
                    <button
                      onClick={() => {
                        setMovingDoc(doc);
                        setTargetMoveFolder(
                          allDepartmentFolders.find((f) => f !== folderName) || folderName
                        );
                      }}
                      title="Move to another folder"
                      className="p-1.5 rounded-lg hover:bg-[#f6f3ec] text-[#6e7976] hover:text-[#006054] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                    </button>

                    {/* Delete single document button */}
                    <button
                      onClick={() => setDocToDelete(doc)}
                      title="Delete document"
                      className="p-1.5 rounded-lg hover:bg-[#ba1a1a]/10 text-[#6e7976] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>

                    {/* View Document */}
                    <button
                      onClick={() => onNavigate('document_detail', doc.id)}
                      title="Open Document"
                      className="px-2.5 py-1 bg-[#FAF7F0] hover:bg-[#006054] text-[#006054] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer ml-1"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="bg-white rounded-3xl p-10 border border-[#bec9c5]/40 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F0] border border-[#bec9c5]/50 flex items-center justify-center text-[#D4AF37] mb-4">
            <span className="material-symbols-outlined text-[36px]">folder_open</span>
          </div>

          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18] mb-1">
            {searchTerm ? 'No matching files found' : `This "${folderName}" folder is empty`}
          </h3>

          <p className="text-xs text-[#5D4037] max-w-sm mb-6">
            {searchTerm
              ? `No documents matched "${searchTerm}". Try a different search term or clear the filter.`
              : `There are currently no files in ${department.name}'s ${folderName} tab. Upload a document or create a new proposal to get started.`}
          </p>

          <div className="flex items-center gap-3">
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setFormatFilter('all');
                }}
                className="px-4 py-2 bg-[#f6f3ec] hover:bg-[#e5e2db] text-[#5D4037] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => onOpenUploadModal(folderName)}
              className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              <span>Upload Document to {folderName}</span>
            </button>
          </div>
        </div>
      )}

      {/* MOVE SINGLE DOCUMENT MODAL */}
      {movingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006054] text-[22px]">drive_file_move</span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                  Move Document
                </h3>
              </div>
              <button
                onClick={() => setMovingDoc(null)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#5D4037]">
              Move <strong>"{movingDoc.name}"</strong> to another folder tab in{' '}
              <strong>{department.name}</strong>:
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1c1c18] mb-1.5">
                Destination Folder Tab
              </label>
              <select
                value={targetMoveFolder}
                onChange={(e) => setTargetMoveFolder(e.target.value)}
                className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-sm font-semibold text-[#1c1c18] outline-none focus:border-[#006054]"
              >
                {allDepartmentFolders.map((fName) => (
                  <option key={fName} value={fName}>
                    {fName} {fName === folderName ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovingDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMove}
                disabled={targetMoveFolder === folderName}
                className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
              >
                Move File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MOVE DOCUMENTS MODAL */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006054] text-[22px]">drive_file_move</span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                  Move {selectedDocIds.length} Selected Documents
                </h3>
              </div>
              <button
                onClick={() => setShowBulkMoveModal(false)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#5D4037]">
              Choose which folder tab in <strong>{department.name}</strong> to move these{' '}
              <strong>{selectedDocIds.length} documents</strong> to:
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1c1c18] mb-1.5">
                Destination Folder Tab
              </label>
              <select
                value={bulkTargetFolder}
                onChange={(e) => setBulkTargetFolder(e.target.value)}
                className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-sm font-semibold text-[#1c1c18] outline-none focus:border-[#006054]"
              >
                {allDepartmentFolders.map((fName) => (
                  <option key={fName} value={fName}>
                    {fName} {fName === folderName ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkMove}
                disabled={bulkTargetFolder === folderName}
                className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
              >
                Move Selected Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SINGLE DOCUMENT DELETE MODAL */}
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
                <p className="text-[11px] text-[#6e7976]">This action removes the file from the council hub.</p>
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
                onClick={handleConfirmSingleDeleteDoc}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK DOCUMENTS DELETE MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base md:text-lg text-[#1c1c18]">
                  Delete {selectedDocIds.length} Documents?
                </h3>
                <p className="text-[11px] text-[#6e7976]">Batch delete selected files</p>
              </div>
            </div>

            <p className="text-xs text-[#5D4037]">
              Are you sure you want to delete all <strong>{selectedDocIds.length} selected documents</strong> from{' '}
              <strong>"{folderName}"</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Delete {selectedDocIds.length} Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE FOLDER MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="w-10 h-10 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">folder_delete</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Delete Folder Tab?
                </h3>
                <p className="text-[11px] text-[#6e7976]">Remove folder category "{folderName}"</p>
              </div>
            </div>

            <p className="text-xs text-[#5D4037]">
              You are about to delete the <strong>"{folderName}"</strong> folder in{' '}
              <strong>{department.name}</strong> ({folderDocs.length} {folderDocs.length === 1 ? 'file' : 'files'} inside).
            </p>

            {/* Deletion Option Choices */}
            {folderDocs.length > 0 && (
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
                    name="folderDeleteOption"
                    checked={deleteFolderFilesOption === 'keep'}
                    onChange={() => setDeleteFolderFilesOption('keep')}
                    className="mt-0.5 accent-[#006054]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1c1c18]">Keep Files (Recommended)</p>
                    <p className="text-[11px] text-[#6e7976]">
                      Retain all {folderDocs.length} files in {department.name}'s general files list and just remove this folder tab.
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
                    name="folderDeleteOption"
                    checked={deleteFolderFilesOption === 'delete'}
                    onChange={() => setDeleteFolderFilesOption('delete')}
                    className="mt-0.5 accent-[#ba1a1a]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#ba1a1a]">Delete Folder & All {folderDocs.length} File(s)</p>
                    <p className="text-[11px] text-[#6e7976]">
                      Permanently delete this folder and all documents contained inside it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFolder}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {deleteFolderFilesOption === 'delete' && folderDocs.length > 0
                  ? `Delete Folder & ${folderDocs.length} Files`
                  : 'Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
