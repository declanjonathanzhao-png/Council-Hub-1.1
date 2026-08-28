import React from 'react';
import { User } from 'firebase/auth';
import { CouncilDocument, ViewType } from '../types';

interface HomeViewProps {
  user?: User | null;
  guestProfile?: {
    name: string;
    role: string;
    departmentId: string;
    email?: string;
  } | null;
  documents: CouncilDocument[];
  pendingCount: number;
  tasksCount: number;
  eventsCount: number;
  recentUploadsCount: number;
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenNewModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  guestProfile,
  documents,
  pendingCount,
  tasksCount,
  eventsCount,
  recentUploadsCount,
  onNavigate,
  onOpenNewModal,
}) => {
  const displayName = user?.displayName || guestProfile?.name || 'Kenzo';
  const roleName = guestProfile?.role || 'Executive Committee';
  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ba1a1a] text-xs">PDF</span>
          </div>
        );
      case 'docx':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#9ff2e1]/30 flex items-center justify-center shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#006054] text-xs">DOCX</span>
          </div>
        );
      case 'xlsx':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#87655b]/20 flex items-center justify-center shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#5D4037] text-xs">XLSX</span>
          </div>
        );
      case 'png':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#fed65b]/30 flex items-center justify-center shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#745c00] text-xs">PNG</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#e5e2db] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#5D4037] text-[20px]">description</span>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fed65b]/40 text-[#745c00] border border-[#fed65b]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#745c00] mr-1.5"></span>
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#9ff2e1]/40 text-[#006054] border border-[#9ff2e1]">
            <span className="material-symbols-outlined text-[14px] text-[#006054] mr-1 fill-icon">check_circle</span>
            Approved
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]">
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e5e2db] text-[#3e4946]">
            <span className="material-symbols-outlined text-[13px] mr-1">edit_document</span>
            Draft
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Welcome Header */}
      <div className="pt-2 md:pt-4 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-4xl font-bold text-[#1c1c18] tracking-tight">
                Welcome back, {displayName}
              </h1>
              <div className="inline-flex items-center bg-[#fed65b] rounded-full px-3 py-1 shadow-xs">
                <span className="material-symbols-outlined text-[14px] text-[#745c00] mr-1 fill-icon">stars</span>
                <span className="text-[11px] font-bold text-[#745c00] uppercase tracking-wider">
                  {roleName}
                </span>
              </div>
            </div>
            <p className="text-sm md:text-base text-[#5D4037] mt-1 font-normal">
              Here's a summary of what's happening across your council departments today.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onNavigate('tasks')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#bec9c5]/60 hover:bg-[#f6f3ec] text-[#5D4037] text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#006054] text-[20px]">assignment</span>
              <span>View Tasks</span>
            </button>
            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006054] hover:bg-[#1F7A6C] text-white text-sm font-semibold transition-all shadow-md shadow-[#006054]/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Upload or Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {/* Mobile Horizontal Scrolling / Desktop 4-column Grid */}
      <div className="my-2 overflow-hidden relative">
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 hide-scrollbar snap-x">
          {/* Card 1: Pending Approvals */}
          <div
            onClick={() => onNavigate('approvals')}
            className="snap-start flex-none w-[160px] md:w-auto bg-white rounded-2xl p-5 border border-[#e7bdb1]/40 shadow-[0_2px_8px_rgba(93,64,55,0.04)] hover:shadow-md hover:border-[#006054]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-full bg-[#83d6c5]/20 flex items-center justify-center text-[#006054] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">fact_check</span>
              </div>
              <span className="text-[11px] font-semibold text-[#006054] bg-[#006054]/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Needs Vote
              </span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-3xl md:text-4xl font-bold text-[#006054] mb-1 leading-tight">
                {pendingCount}
              </div>
              <div className="text-xs md:text-sm font-semibold text-[#5D4037]">Pending Approvals</div>
            </div>
          </div>

          {/* Card 2: Tasks Due */}
          <div
            onClick={() => onNavigate('tasks')}
            className="snap-start flex-none w-[160px] md:w-auto bg-white rounded-2xl p-5 border border-[#e7bdb1]/40 shadow-[0_2px_8px_rgba(93,64,55,0.04)] hover:shadow-md hover:border-[#D4AF37]/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">assignment_late</span>
              </div>
              <span className="text-[11px] font-semibold text-[#745c00] bg-[#fed65b]/40 px-2 py-0.5 rounded-full hidden sm:inline-block">
                This Week
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="font-['Plus_Jakarta_Sans'] text-3xl md:text-4xl font-bold text-[#1c1c18] mb-1 leading-tight">
                  {tasksCount}
                </div>
                <span className="text-xs text-[#6e7976] hidden sm:inline">This Week</span>
              </div>
              <div className="text-xs md:text-sm font-semibold text-[#5D4037]">Tasks Due</div>
            </div>
          </div>

          {/* Card 3: Upcoming Events */}
          <div
            onClick={() => onNavigate('calendar')}
            className="snap-start flex-none w-[160px] md:w-auto bg-white rounded-2xl p-5 border border-[#e7bdb1]/40 shadow-[0_2px_8px_rgba(93,64,55,0.04)] hover:shadow-md hover:border-[#D4AF37]/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-full bg-[#ffe088]/50 flex items-center justify-center text-[#745c00] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <span className="text-[11px] font-semibold text-[#006054] bg-[#9ff2e1]/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Synced
              </span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-3xl md:text-4xl font-bold text-[#1c1c18] mb-1 leading-tight">
                {eventsCount}
              </div>
              <div className="text-xs md:text-sm font-semibold text-[#5D4037]">Upcoming Events</div>
            </div>
          </div>

          {/* Card 4: Recent Uploads */}
          <div
            onClick={() => onNavigate('drive_browser')}
            className="snap-start flex-none w-[160px] md:w-auto bg-white rounded-2xl p-5 border border-[#e7bdb1]/40 shadow-[0_2px_8px_rgba(93,64,55,0.04)] hover:shadow-md hover:border-[#006054]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdbd0]/50 flex items-center justify-center text-[#6c4d44] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
              </div>
              <span className="text-[11px] font-semibold text-[#5D4037] bg-[#f0eee7] px-2 py-0.5 rounded-full hidden sm:inline-block">
                Drive
              </span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-3xl md:text-4xl font-bold text-[#1c1c18] mb-1 leading-tight">
                {recentUploadsCount}
              </div>
              <div className="text-xs md:text-sm font-semibold text-[#5D4037]">Recent Uploads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-4 flex-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg md:text-xl font-bold text-[#1c1c18]">
            Recent Activity Across All Departments
          </h2>
          <button
            onClick={() => onNavigate('department_hub', 'dept-exec')}
            className="text-xs md:text-sm font-bold text-[#006054] hover:text-[#1F7A6C] uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-2xl border border-[#bec9c5]/40 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0eee7] text-[#5D4037] text-xs font-semibold uppercase tracking-wider border-b border-[#e5e2db]">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Uploaded By</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eee7] text-sm text-[#1c1c18]">
              {documents.slice(0, 6).map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onNavigate('document_detail', doc.id)}
                  className="hover:bg-[#f6f3ec]/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      {getFormatBadge(doc.format)}
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1c1c18] group-hover:text-[#006054] transition-colors truncate max-w-[280px]">
                          {doc.name}
                        </span>
                        <span className="text-xs text-[#6e7976]">{doc.filename}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#006054]/10 text-[#006054]">
                      {doc.departmentName}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-[#5D4037] font-medium">{doc.uploadedBy.name}</td>
                  <td className="py-3.5 px-6 text-[#6e7976]">{doc.uploadDate}</td>
                  <td className="py-3.5 px-6 text-center">{getStatusBadge(doc.status)}</td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('document_detail', doc.id);
                      }}
                      className="p-1 text-[#6e7976] hover:text-[#006054] rounded-lg hover:bg-white transition-colors"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden bg-white rounded-2xl border border-[#e7bdb1]/40 shadow-xs overflow-hidden divide-y divide-[#f0eee7]">
          {documents.slice(0, 5).map((doc) => (
            <div
              key={doc.id}
              onClick={() => onNavigate('document_detail', doc.id)}
              className="p-4 flex flex-col gap-3 active:bg-[#f6f3ec] transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {getFormatBadge(doc.format)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#1c1c18] truncate mb-0.5">{doc.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold uppercase">
                      {doc.departmentName}
                    </span>
                    <span className="text-[#6e7976] text-[11px]">{doc.uploadDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pl-13">
                <div>{getStatusBadge(doc.status)}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('document_detail', doc.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[#6e7976] hover:text-[#006054]"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={onOpenNewModal}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1F7A6C] rounded-2xl shadow-[0_4px_16px_rgba(31,122,108,0.4)] flex items-center justify-center text-white hover:bg-[#006054] transition-all z-30 active:scale-95"
        aria-label="Upload document"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
};
