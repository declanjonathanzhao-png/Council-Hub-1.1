import React, { useState } from 'react';
import { Department, CouncilDocument, ViewType } from '../types';

interface MoMListViewProps {
  department: Department;
  documents: CouncilDocument[];
  onNavigate: (view: ViewType, data?: any) => void;
  onOpenUploadModal: () => void;
}

export const MoMListView: React.FC<MoMListViewProps> = ({
  department,
  documents,
  onNavigate,
  onOpenUploadModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const momDocs = documents.filter(
    (d) => d.type === 'MoM' && d.departmentId === department.id
  );

  const filtered = momDocs.filter((d) => {
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
        <span className="text-[#1c1c18] font-bold">MoM</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#bec9c5]/40 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054]">
            <span className="material-symbols-outlined text-[28px] fill-icon">history_edu</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18]">
              Minutes of Meeting (MoM)
            </h1>
            <p className="text-xs md:text-sm text-[#5D4037] mt-0.5">
              {department.name} official records, agenda decisions, and meeting notes.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">upload</span>
          <span>Upload New MoM</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80 bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
          <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search MoMs by title or author..."
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* MoM List Table */}
      <div className="bg-white rounded-2xl border border-[#bec9c5]/40 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[32px]">history_edu</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-1">
              No MoM Files Found
            </h3>
            <p className="text-xs text-[#5D4037] max-w-sm mb-4">
              There are currently no Minutes of Meeting uploaded in this department folder.
            </p>
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">upload</span>
              <span>Upload First MoM</span>
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0eee7] text-[#5D4037] text-xs font-semibold uppercase tracking-wider border-b border-[#e5e2db]">
                  <th className="py-3.5 px-6">Document Name</th>
                  <th className="py-3.5 px-6">Meeting Date</th>
                  <th className="py-3.5 px-6">Uploaded By</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee7] text-sm text-[#1c1c18]">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigate('document_detail', doc.id)}
                    className={`hover:bg-[#f6f3ec] transition-colors cursor-pointer group ${
                      doc.isStarred ? 'bg-[#fed65b]/5' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#006054]/10 text-[#006054] flex items-center justify-center font-bold text-xs shrink-0">
                          DOC
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1c1c18] group-hover:text-[#006054] transition-colors">
                              {doc.name}
                            </span>
                            {doc.isStarred && (
                              <span className="material-symbols-outlined text-[16px] text-[#D4AF37] fill-icon">
                                star
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#6e7976]">{doc.fileSize}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#5D4037] font-medium">{doc.uploadDate}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#fed65b] text-[#745c00] text-[10px] font-bold flex items-center justify-center">
                          {doc.uploadedBy.initials}
                        </div>
                        <span className="text-xs text-[#1c1c18]">{doc.uploadedBy.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {doc.status === 'APPROVED' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#006054]/10 text-[#006054]">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#fed65b]/30 text-[#745c00]">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('document_detail', doc.id);
                        }}
                        className="p-1.5 rounded-lg text-[#6e7976] hover:text-[#006054] hover:bg-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-[#e5e2db] flex items-center justify-between text-xs text-[#5D4037]">
              <span>Showing 1 to {filtered.length} of {filtered.length} documents</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1 rounded-lg border border-[#bec9c5] bg-white hover:bg-[#f6f3ec] text-[#1c1c18] font-medium">
                  1
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
