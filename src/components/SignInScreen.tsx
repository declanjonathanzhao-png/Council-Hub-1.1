import React, { useState, useEffect } from 'react';
import { COUNCIL_LOGO_SRC } from '../assets/logo';
import {
  getSuperAdminEmail,
  isSuperAdminEmail,
  verifySuperAdminPassword,
  getAccessControlSettings,
  checkPortalAccess,
} from '../services/adminService';
import { AccessControlSettings } from '../types';

interface SignInScreenProps {
  onEmailSignIn: (email: string, password: string) => void;
  onGuestSignIn: (roleData?: { name: string; role: string; departmentId: string; email?: string }) => void;
  isLoggingIn: boolean;
  errorMessage?: string | null;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onEmailSignIn,
  onGuestSignIn,
  isLoggingIn,
  errorMessage,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [guestAuthError, setGuestAuthError] = useState<string | null>(null);
  const [accessSettings, setAccessSettings] = useState<AccessControlSettings>(() => getAccessControlSettings());

  const currentSuperEmail = getSuperAdminEmail();

  useEffect(() => {
    setAccessSettings(getAccessControlSettings());
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailClean = emailInput.trim().toLowerCase();
    if (!emailClean) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!passwordInput) {
      setFormError('Please enter your password.');
      return;
    }

    onEmailSignIn(emailClean, passwordInput);
  };

  const handleGuestSubmit = () => {
    setGuestAuthError(null);
    const access = checkPortalAccess(undefined, true);
    if (!access.allowed) {
      setGuestAuthError(access.reason || 'Preview login is restricted by administrator policy.');
      return;
    }

    onGuestSignIn({
      name: 'SC Preview',
      role: 'Viewer',
      departmentId: 'dept-exec',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-between selection:bg-[#006054]/20 selection:text-[#006054]">
      {/* Top Navigation Bar */}
      <header className="w-full px-6 py-4 border-b border-[#bec9c5]/40 bg-white/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={COUNCIL_LOGO_SRC}
            alt="CouncilHub Crest"
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-cover shadow-xs"
          />
          <div>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#006054] tracking-tight block leading-none">
              CouncilHub
            </span>
            <span className="text-[10px] text-[#5D4037] font-semibold tracking-wider uppercase">
              Student Council Management & Protection Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#006054]/10 text-[#006054] border border-[#006054]/20">
            <span className="w-2 h-2 rounded-full bg-[#006054] animate-pulse"></span>
            Academic Year 2026–2027
          </span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand & Security Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fed65b]/40 text-[#745c00] text-xs font-bold uppercase tracking-wider border border-[#fed65b]">
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37] fill-icon">
                  shield
                </span>
                Protected Council Repository
              </div>

              <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl md:text-5xl text-[#1c1c18] tracking-tight leading-[1.15]">
                Centralized Governance, <br />
                <span className="text-[#006054]">Strict Deletion Protection</span>
              </h1>

              <p className="text-sm md:text-base text-[#5D4037] leading-relaxed max-w-xl">
                Collaborate safely on student council initiatives. Sign in with your assigned email and password.
                An admin manages permissions and secures council records.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#bec9c5]/40 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1c1c18]">
                    Admin Control
                  </h2>
                  <p className="text-xs text-[#5D4037] mt-0.5 leading-snug">
                    Dedicated Admin Panel to manage council roles, assign passwords, and monitor audit trails.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#bec9c5]/40 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/60 text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1c1c18]">
                    Protected Deletions
                  </h2>
                  <p className="text-xs text-[#5D4037] mt-0.5 leading-snug">
                    Unauthorized users cannot delete folders or files without verified admin consent.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#bec9c5]/40 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fed65b]/30 text-[#745c00] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">account_tree</span>
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1c1c18]">
                    Department Hubs
                  </h2>
                  <p className="text-xs text-[#5D4037] mt-0.5 leading-snug">
                    Dedicated folder tabs for Executive, House, Prefects, Welfare, VIA, and Tech.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#bec9c5]/40 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1c1c18]">
                    Real-Time Cloud Sync
                  </h2>
                  <p className="text-xs text-[#5D4037] mt-0.5 leading-snug">
                    Instant synchronization of documents, tasks, and calendar events across connected devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Email & Password Sign In Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#bec9c5]/50 shadow-xl space-y-5">
              <div className="text-center space-y-1.5 pb-2 border-b border-[#e5e2db]">
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1c1c18]">
                  Council Portal Sign In
                </h2>
                <p className="text-xs text-[#5D4037]">
                  Enter your email and password to access your council workspace.
                </p>
              </div>

              {/* Error alert if any */}
              {(errorMessage || formError) && (
                <div className="p-3 bg-[#ffdad6]/60 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMessage || formError}</span>
                </div>
              )}

              {/* Portal Gate Mode Notices */}
              {accessSettings.portalMode === 'superadmin_only' && (
                <div className="p-3 bg-[#ffdad6]/80 border border-[#ba1a1a]/40 rounded-2xl text-xs text-[#ba1a1a] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] shrink-0">lock</span>
                  <div>
                    <p className="font-bold">Admin Lockdown Mode Active</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Non-admin access is currently suspended. Only an admin can enter.
                    </p>
                  </div>
                </div>
              )}

              {/* Email & Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1c1c18] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-[#6e7976] material-symbols-outlined text-[18px]">
                      alternate_email
                    </span>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="e.g. member@binabangsaschool.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#f6f3ec] rounded-xl border border-[#bec9c5]/80 text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054] focus:ring-1 focus:ring-[#006054]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#1c1c18]">
                      Password
                    </label>
                    <span className="text-[10px] text-[#6e7976]">Admin Default: <code className="text-[#006054] font-bold">admin</code></span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-[#6e7976] material-symbols-outlined text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f6f3ec] rounded-xl border border-[#bec9c5]/80 text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054] focus:ring-1 focus:ring-[#006054]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#6e7976] hover:text-[#1c1c18] p-0.5 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-11 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Sign In to CouncilHub</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#e5e2db] w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-[#6e7976] uppercase tracking-wider">
                  Or Quick Preview
                </span>
                <div className="border-t border-[#e5e2db] w-full"></div>
              </div>

              {/* Secondary Method: SC Preview (Viewer Mode) */}
              <div className="space-y-3">
                {guestAuthError && (
                  <div className="p-2.5 rounded-xl bg-[#ffdad6]/80 border border-[#ba1a1a]/30 text-[#ba1a1a] text-[11px] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                    <span>{guestAuthError}</span>
                  </div>
                )}

                <button
                  id="guest-signin-btn"
                  onClick={handleGuestSubmit}
                  disabled={!accessSettings.allowGuestLogins}
                  className="w-full h-11 bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#bec9c5] text-[#1c1c18] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006054]">visibility</span>
                  <span>Enter as SC Preview (Viewer)</span>
                </button>
              </div>

              {/* Security & compliance footer note */}
              <div className="pt-2 border-t border-[#e5e2db] flex items-center justify-between text-[10px] text-[#6e7976]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-[#006054]">verified_user</span>
                  <span>Secure Email & Password Auth</span>
                </div>
                <span className="font-semibold text-[#006054]">Admin Managed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-[#bec9c5]/30 text-center text-xs text-[#5D4037]">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-2">
          <span>CouncilHub Academic Management Suite • 2026–2027</span>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#006054]">
            <span>Administrator Protected</span>
            <span>•</span>
            <span>Email & Password Auth</span>
            <span>•</span>
            <span>Audit Trail Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
