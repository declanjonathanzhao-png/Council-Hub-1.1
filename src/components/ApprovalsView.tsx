import React, { useState } from 'react';
import { CouncilDocument, ViewType } from '../types';

interface ApprovalsViewProps {
  documents: CouncilDocument[];
  isViewer?: boolean;
  onNavigate: (view: ViewType, data?: any) => void;
  onApprove: (docId: string) => void;
  onReject: (docId: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  documents,
  isViewer,
  onNavigate,
  onApprove,
  onReject,
}) => {
  const [filter, setFilter] = useState<'pending' | 'history'>('pending');

  const pendingDocs = documents.filter(
    (d) => d.status === 'PENDING' || d.status === 'PENDING REVIEW'
  );
  const historyDocs = documents.filter(
    (d) => d.status === 'APPROVED' || d.status === 'REJECTED'
  );

  const displayDocs = filter === 'pending' ? pendingDocs : historyDocs;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#bec9c5]/40 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fed65b]/40 flex items-center justify-center text-[#745c00]">
            <span className="material-symbols-outlined text-[28px] fill-icon">fact_check</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18]">
              Executive Approvals Queue
            </h1>
            <p className="text-xs md:text-sm text-[#5D4037] mt-0.5">
              Review and vote on council proposals, financial budgets, and department policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f6f3ec] p-1 rounded-xl border border-[#bec9c5]/60">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-[#006054] text-white shadow-xs'
                : 'text-[#5D4037] hover:text-[#1c1c18]'
            }`}
          >
            Pending ({pendingDocs.length})
          </button>
          <button
            onClick={() => setFilter('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'history'
                ? 'bg-[#006054] text-white shadow-xs'
                : 'text-[#5D4037] hover:text-[#1c1c18]'
            }`}
          >
            Decision History ({historyDocs.length})
          </button>
        </div>
      </div>

      {/* Approvals Cards */}
      <div className="space-y-4">
        {displayDocs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#bec9c5]/40">
            <span className="material-symbols-outlined text-4xl text-[#006054] mb-2">verified</span>
            <h3 className="font-bold text-base text-[#1c1c18]">All Caught Up!</h3>
            <p className="text-xs text-[#6e7976] mt-1">There are no pending proposals waiting for your review.</p>
          </div>
        ) : (
          displayDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onNavigate('document_detail', doc.id)}
              className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs hover:border-[#006054]/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#ffdad6]/40 flex items-center justify-center text-[#ba1a1a] font-bold text-xs shrink-0">
                  {doc.format.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[11px] font-bold uppercase tracking-wider">
                      {doc.departmentName}
                    </span>
                    <span className="text-xs text-[#6e7976]">• Submitted {doc.uploadDate}</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] group-hover:text-[#006054] transition-colors truncate">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-[#5D4037] mt-0.5">
                    Submitted by <strong className="text-[#1c1c18]">{doc.uploadedBy.name}</strong> • {doc.fileSize}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {filter === 'pending' ? (
                  isViewer ? (
                    <span className="px-3 py-1 rounded-full bg-[#bec9c5]/20 text-[#5D4037] text-xs font-bold uppercase tracking-wider">
                      View Only
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject(doc.id);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(doc.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#006054] hover:bg-[#1F7A6C] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Approve</span>
                      </button>
                    </>
                  )
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      doc.status === 'APPROVED'
                        ? 'bg-[#006054]/10 text-[#006054]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {doc.status}
                  </span>
                )}
                <span className="material-symbols-outlined text-[#6e7976] group-hover:text-[#006054] transition-colors">
                  chevron_right
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
