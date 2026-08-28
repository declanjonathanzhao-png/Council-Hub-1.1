import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#006054]/10 text-[#006054]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDestructive ? 'warning' : 'help_outline'}
            </span>
          </div>
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
              {title}
            </h3>
            <p className="text-xs text-[#6e7976] mt-0.5">Please confirm your action.</p>
          </div>
        </div>

        <p className="text-xs md:text-sm text-[#3e4946] leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e2db]">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5D4037] hover:bg-[#f6f3ec] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              isDestructive
                ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                : 'bg-[#006054] hover:bg-[#1F7A6C]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
