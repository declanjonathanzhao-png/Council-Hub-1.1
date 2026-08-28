import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { changeUserPassword } from '../services/adminService';

interface SettingsViewProps {
  user: User | null;
  guestProfile?: { name: string; role: string; departmentId: string; email?: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  guestProfile,
  onLogin,
  onLogout,
  isLoggingIn,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const userEmail = guestProfile?.email || user?.email || 'sarah.lee@studentcouncil.edu';
  const userName = guestProfile?.name || user?.displayName || 'Council Member';

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setPasswordError('New password must be at least 3 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = changeUserPassword(userEmail, currentPassword, newPassword, userName);
    if (res.success) {
      setPasswordSuccess('Password successfully updated and secured!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-24 md:pb-12 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#bec9c5]/40 shadow-xs">
        <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1c1c18] mb-1">
          CouncilHub Settings
        </h1>
        <p className="text-xs text-[#5D4037]">Manage security credentials and council member profile.</p>
      </div>

      {/* Account & Profile Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#bec9c5]/40 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#006054]/10 flex items-center justify-center text-[#006054] font-bold text-base">
              {user?.displayName?.charAt(0) || guestProfile?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1c1c18]">
                {userName}
              </h2>
              <p className="text-xs text-[#6e7976]">
                {guestProfile?.role || 'Executive Committee'} • <code className="text-[#006054] font-semibold">{userEmail}</code>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-[#ffdad6] hover:bg-[#ffdad6]/80 text-[#ba1a1a] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Sign Out / Switch
          </button>
        </div>
      </div>

      {/* Change Password Security Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#bec9c5]/40 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#e5e2db]">
          <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#1c1c18]">Change Account Password</h2>
            <p className="text-[11px] text-[#5D4037]">Secure your account against default credentials (Default: council2026 or admin)</p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-[#ffdad6]/80 text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-[#006054]/10 text-[#006054] text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1c1c18] mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="e.g. council2026"
              className="w-full p-2.5 bg-[#FAF7F0] border border-[#bec9c5]/70 rounded-xl text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1c18] mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 3 characters"
              className="w-full p-2.5 bg-[#FAF7F0] border border-[#bec9c5]/70 rounded-xl text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1c1c18] mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-2.5 bg-[#FAF7F0] border border-[#bec9c5]/70 rounded-xl text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
