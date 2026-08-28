import React from 'react';
import { getSuperAdminEmail } from '../services/adminService';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  requiredPermission: string;
  onSwitchToAdmin?: () => void;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  actionName,
  requiredPermission,
  onSwitchToAdmin,
}) => {
  if (!isOpen) return null;
  const superAdminEmail = getSuperAdminEmail();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 border border-[#ba1a1a]/20 shadow-xs">
            <span className="material-symbols-outlined text-[28px]">shield_lock</span>
          </div>
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
              Admin Permission Required
            </h3>
            <p className="text-xs text-[#5D4037] mt-1 leading-relaxed">
              You do not have permission to <strong className="text-[#ba1a1a]">{actionName}</strong>. 
              Only authorized council administrators can modify or delete council resources.
            </p>
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-3.5 border border-[#e5e2db] space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#5D4037]">
            <span className="font-semibold">Required Right:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#fed65b]/40 text-[#745c00] font-bold text-[11px]">
              {requiredPermission}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#5D4037]">
            <span className="font-semibold">Master Admin:</span>
            <span className="font-mono text-[11px] text-[#006054] font-bold">
              {superAdminEmail}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#6e7976] leading-snug">
          To prevent unauthorized deletion of folders and files, deletions must be executed by an appointed admin.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#bec9c5]/60 hover:bg-[#f6f3ec] text-[#5D4037] font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
          {onSwitchToAdmin && (
            <button
              onClick={() => {
                onClose();
                onSwitchToAdmin();
              }}
              className="px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Sign in as Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
