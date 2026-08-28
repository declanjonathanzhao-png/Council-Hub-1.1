import React from 'react';
import { COUNCIL_LOGO_SRC } from '../assets/logo';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoggingIn: boolean;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  isLoggingIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 text-center space-y-5">
        {/* CouncilHub & Google Workspace Brand */}
        <div className="flex items-center justify-center gap-3">
          <img
            src={COUNCIL_LOGO_SRC}
            alt="CouncilHub Logo"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full object-cover shadow-sm"
          />
        </div>

        <div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl md:text-2xl text-[#1c1c18]">
            Connect Google Workspace
          </h2>
          <p className="text-xs md:text-sm text-[#5D4037] mt-1.5 leading-relaxed">
            Sign in to synchronize council proposals and minutes directly with <strong>Google Drive</strong>, and seamlessly manage meetings in <strong>Google Calendar</strong>.
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-[#FAF7F0] rounded-2xl p-4 text-left text-xs space-y-2 border border-[#e5e2db]">
          <div className="flex items-center gap-2 text-[#006054] font-semibold">
            <span className="material-symbols-outlined text-[18px]">cloud</span>
            <span>Browse & upload files directly to Google Drive</span>
          </div>
          <div className="flex items-center gap-2 text-[#745c00] font-semibold">
            <span className="material-symbols-outlined text-[18px]">event</span>
            <span>Sync committee agendas with Google Calendar</span>
          </div>
          <div className="flex items-center gap-2 text-[#5D4037] font-semibold">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Secure official Google token cached strictly in memory</span>
          </div>
        </div>

        {/* Official Google Sign-In Button from skill specs */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full h-12 px-4 rounded-xl border border-[#bec9c5] bg-white hover:bg-[#f6f3ec] text-[#1c1c18] font-medium text-sm flex items-center justify-center gap-3 shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span className="font-semibold text-sm">
              {isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-xs font-semibold text-[#6e7976] hover:text-[#1c1c18] transition-colors"
          >
            Continue as Guest (Local Preview)
          </button>
        </div>
      </div>
    </div>
  );
};
