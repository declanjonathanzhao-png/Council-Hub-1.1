import React, { useState } from 'react';

interface UserInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserInstructionsModal: React.FC<UserInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'overview' | 'departments' | 'documents' | 'workspace' | 'governance'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'overview', label: 'Quick Start', icon: 'rocket_launch' },
    { id: 'departments', label: 'Departments & Folders', icon: 'folder' },
    { id: 'documents', label: 'Proposals & Approvals', icon: 'fact_check' },
    { id: 'workspace', label: 'Google Docs & Drive', icon: 'cloud' },
    { id: 'governance', label: 'Roles & Admin Panel', icon: 'admin_panel_settings' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="user-instructions-modal"
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-[#bec9c5]/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 md:px-6 border-b border-[#e5e2db] flex items-center justify-between bg-[#FAF7F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054]">
              <span className="material-symbols-outlined text-[24px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                User Instructions & Guide
              </h2>
              <p className="text-xs text-[#5D4037]">Student Council System workflows, folder management, and features.</p>
            </div>
          </div>
          <button
            id="close-user-instructions-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6e7976] hover:bg-[#e5e2db] transition-colors cursor-pointer"
            title="Close instructions"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-5 py-3 border-b border-[#e5e2db] bg-white flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`instruction-cat-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#006054] text-white shadow-xs'
                  : 'bg-[#f6f3ec] text-[#5D4037] hover:bg-[#e5e2db]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 bg-[#FAF7F0]/40 border-b border-[#e5e2db]">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[#6e7976] text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search instructions (e.g. upload, folders, approval, Google Sheets)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#bec9c5]/60 rounded-xl text-xs text-[#1c1c18] outline-none focus:border-[#006054]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#6e7976] hover:text-[#1c1c18]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar text-xs text-[#3e4946] space-y-4">
          {activeCategory === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#006054]/5 rounded-2xl border border-[#006054]/20 space-y-2">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#006054] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Welcome to CouncilHub
                </h3>
                <p className="leading-relaxed">
                  CouncilHub is the unified platform for student council operations across all 7 core departments. You can submit proposals, manage meeting minutes (MoMs), assign committee tasks, schedule council events, and synchronize live with Google Workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-[#bec9c5]/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1c1c18]">
                    <span className="w-5 h-5 rounded-full bg-[#006054] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Navigate Departments</span>
                  </div>
                  <p className="text-[#6e7976] leading-normal">
                    Select your board from the sidebar or dashboard (Executive, House, Prefects, Welfare, VIA, Media, Tech) to access department-specific folders.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#bec9c5]/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1c1c18]">
                    <span className="w-5 h-5 rounded-full bg-[#006054] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Submit Proposals & Docs</span>
                  </div>
                  <p className="text-[#6e7976] leading-normal">
                    Use the <strong>+ New</strong> or <strong>Upload Document</strong> button to submit proposals, upload local files (PDF/Excel/Word), or paste live Google Sheets links.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#bec9c5]/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1c1c18]">
                    <span className="w-5 h-5 rounded-full bg-[#006054] text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Review & Vote</span>
                  </div>
                  <p className="text-[#6e7976] leading-normal">
                    Executive members review pending documents, start comment discussions, request revisions, and register formal approvals.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#bec9c5]/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1c1c18]">
                    <span className="w-5 h-5 rounded-full bg-[#006054] text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Sync Google Workspace</span>
                  </div>
                  <p className="text-[#6e7976] leading-normal">
                    Connect your Google account to browse Drive files, attach live sheets with interactive preview, and sync events to Google Calendar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'departments' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-[#bec9c5]/50 space-y-3">
                <h3 className="font-bold text-sm text-[#1c1c18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006054] text-[20px]">folder_open</span>
                  Managing Department Folders
                </h3>
                <ul className="space-y-2 list-disc list-inside leading-relaxed text-[#3e4946]">
                  <li>
                    <strong>7 Core Departments:</strong> The 7 main boards are permanently protected and cannot be deleted.
                  </li>
                  <li>
                    <strong>Adding Folders:</strong> Click <strong>"+ Add Folder"</strong> inside any department to create custom sub-categories (e.g. <em>"Orientation 2026"</em>, <em>"Q3 Financials"</em>).
                  </li>
                  <li>
                    <strong>Renaming Folders:</strong> Click the edit icon next to any folder tab to rename it. All documents inside will automatically move to the renamed folder.
                  </li>
                  <li>
                    <strong>Deleting Folders:</strong> Click the delete icon on a folder to remove empty or obsolete categories.
                  </li>
                  <li>
                    <strong>Cloud Persistence:</strong> All folder additions and changes automatically sync in real-time across devices via Firestore.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeCategory === 'documents' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-[#bec9c5]/50 space-y-3">
                <h3 className="font-bold text-sm text-[#1c1c18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006054] text-[20px]">fact_check</span>
                  Proposal Workflow & Approval Statuses
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 bg-[#fed65b]/20 rounded-xl border border-[#fed65b]/40">
                    <span className="px-2 py-0.5 rounded-full bg-[#fed65b] text-[#745c00] font-bold text-[10px]">PENDING</span>
                    <p className="text-[#5D4037]">
                      Default status for newly submitted proposals. Awaiting review by the Executive Committee or Department Head.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-[#9ff2e1]/30 rounded-xl border border-[#006054]/30">
                    <span className="px-2 py-0.5 rounded-full bg-[#006054] text-white font-bold text-[10px]">APPROVED</span>
                    <p className="text-[#006054]">
                      Proposal passed executive review and is approved for implementation or budget allocation.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-[#ffdad6]/40 rounded-xl border border-[#ffdad6]">
                    <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white font-bold text-[10px]">REVISIONS</span>
                    <p className="text-[#ba1a1a]">
                      Requires amendments. Reviewers can leave specific comments in the document discussion thread.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e2db]">
                  <p className="font-bold text-[#1c1c18] mb-1">Document Detail View Features:</p>
                  <p className="text-[#6e7976]">
                    Click any document to inspect metadata, zoom in/out, view embedded Google Docs or Sheets, post threaded comments, and download copies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'workspace' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-[#bec9c5]/50 space-y-3">
                <h3 className="font-bold text-sm text-[#1c1c18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006054] text-[20px]">cloud_sync</span>
                  Google Workspace & Drive Integration
                </h3>
                <ul className="space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#107c41] text-[18px] shrink-0 mt-0.5">table_chart</span>
                    <span>
                      <strong>Google Sheets & Docs Link:</strong> Paste any shared Google Sheet or Doc link in the upload modal to load it with real-time interactive preview.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#185abd] text-[18px] shrink-0 mt-0.5">cloud</span>
                    <span>
                      <strong>Drive Browser:</strong> Open the Google Drive Explorer to browse your Workspace documents and attach them directly to any department with 1 click.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#745c00] text-[18px] shrink-0 mt-0.5">calendar_month</span>
                    <span>
                      <strong>Google Calendar:</strong> Council meetings and deadlines scheduled in CouncilHub sync with Google Calendar so members stay informed.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeCategory === 'governance' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-[#bec9c5]/50 space-y-3">
                <h3 className="font-bold text-sm text-[#1c1c18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006054] text-[20px]">admin_panel_settings</span>
                  Role Hierarchy & Admin Controls
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#bec9c5]/40">
                    <span className="font-bold text-[#006054] block">Administrator</span>
                    <span className="text-[#6e7976]">Full system configuration, admin management, role assignment, and security policies.</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#bec9c5]/40">
                    <span className="font-bold text-[#1c1c18] block">Department Lead / Exco</span>
                    <span className="text-[#6e7976]">Proposal approvals, folder management, task delegation, and event scheduling.</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#bec9c5]/40">
                    <span className="font-bold text-[#1c1c18] block">Committee Member</span>
                    <span className="text-[#6e7976]">Proposal submissions, file uploads, task completion, and discussion participation.</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#bec9c5]/40">
                    <span className="font-bold text-[#1c1c18] block">SC Viewer</span>
                    <span className="text-[#6e7976]">Read-only access to approved documents, public minutes, and published schedules.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e2db] bg-[#FAF7F0] flex items-center justify-between">
          <span className="text-[11px] text-[#6e7976]">
            Tip: Press <strong>Esc</strong> or click close to return to your workspace.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
