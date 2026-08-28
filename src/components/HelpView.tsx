import React from 'react';

export const HelpView: React.FC = () => {
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#bec9c5]/40 shadow-xs">
        <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1c1c18] mb-1">
          CouncilHub Help & Documentation
        </h1>
        <p className="text-xs text-[#5D4037]">Student Council System guidelines, workflows, and integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#006054] font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            <span>Submitting Proposals</span>
          </div>
          <p className="text-[#3e4946] leading-relaxed">
            Click "+ New" or "Upload Document" inside any Department Hub to submit proposals with budgets, theme moodboards, and agendas for executive vote.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#006054] font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">cloud</span>
            <span>Google Drive Synchronization</span>
          </div>
          <p className="text-[#3e4946] leading-relaxed">
            When signed in with Google Workspace, your documents are synced directly to your cloud drive and available in the Drive Browser.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#745c00] font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <span>Google Calendar Sync</span>
          </div>
          <p className="text-[#3e4946] leading-relaxed">
            Council meetings and committee sessions scheduled in CouncilHub automatically sync with Google Calendar so members never miss a deadline.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#ba1a1a] font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span>Executive Review & Approvals</span>
          </div>
          <p className="text-[#3e4946] leading-relaxed">
            Executive committee members can review submissions, participate in feedback discussion threads, and record approvals or requests for revision.
          </p>
        </div>
      </div>
    </div>
  );
};
