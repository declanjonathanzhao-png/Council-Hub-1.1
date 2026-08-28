import React, { useState } from 'react';
import { Department, CouncilDocument, ViewType } from '../types';

interface ProposalsListViewProps {
  department: Department;
  documents: CouncilDocument[];
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenUploadModal: () => void;
}

export const ProposalsListView: React.FC<ProposalsListViewProps> = ({
  department,
  documents,
  onNavigate,
  onOpenUploadModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const proposals = documents.filter(
    (d) => d.type === 'Proposal' && d.departmentId === department.id
  );

  const filtered = proposals.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Breadcrumbs */}
      <nav className="pt-2 pb-3 flex items-center gap-1.5 text-xs text-[#5D4037]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#006054] transition-colors">
          Home
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <button onClick={() => onNavigate('department_hub', department.id)} className="hover:text-[#006054] transition-colors">
          Departments
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <button onClick={() => onNavigate('department_hub', department.id)} className="hover:text-[#006054] transition-colors">
          {department.name}
        </button>
        <span className="material-symbols-outlined text-[14px] text-[#bec9c5]">chevron_right</span>
        <span className="text-[#1c1c18] font-bold">Proposals</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#bec9c5]/40 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fed65b]/30 flex items-center justify-center text-[#745c00]">
            <span className="material-symbols-outlined text-[28px] fill-icon">lightbulb</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18]">
              Department Proposals & Initiatives
            </h1>
            <p className="text-xs md:text-sm text-[#5D4037] mt-0.5">
              Official event proposals, budget allocations, and council policy submissions.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          <span>Submit Proposal</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80 bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
          <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[#1c1c18]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#5D4037] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#bec9c5]/40 shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fed65b]/30 text-[#745c00] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px]">lightbulb</span>
          </div>
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-1">
            No Proposals Found
          </h3>
          <p className="text-xs text-[#5D4037] max-w-sm mb-4">
            There are currently no proposals or initiatives submitted for this department.
          </p>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            <span>Submit New Proposal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onNavigate('document_detail', doc.id)}
              className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs hover:shadow-md hover:border-[#006054]/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold uppercase tracking-wider">
                    {doc.departmentName}
                  </span>
                  {doc.status === 'APPROVED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold uppercase">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#fed65b]/40 text-[#745c00] text-[10px] font-bold uppercase">
                      Pending
                    </span>
                  )}
                </div>

                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] group-hover:text-[#006054] transition-colors line-clamp-2 mb-2">
                  {doc.name}
                </h3>

                <p className="text-xs text-[#5D4037] line-clamp-2 mb-3">
                  {doc.content?.description || `${doc.filename} submitted for formal council review and decision.`}
                </p>
              </div>

              <div className="pt-3 border-t border-[#e5e2db] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#fed65b] text-[#745c00] text-[10px] font-bold flex items-center justify-center">
                    {doc.uploadedBy.initials}
                  </div>
                  <span className="text-[#1c1c18] font-medium">{doc.uploadedBy.name}</span>
                </div>
                <span className="text-[#6e7976]">{doc.uploadDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
