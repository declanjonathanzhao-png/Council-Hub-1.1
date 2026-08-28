import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { GoogleDriveFile, UserPermissions } from '../types';
import { COUNCIL_LOGO_SRC } from '../assets/logo';
import { isSuperAdminEmail, getSuperAdminEmail } from '../services/adminService';

interface HeaderProps {
  user: User | null;
  guestProfile?: { name: string; role: string; departmentId: string; email?: string } | null;
  permissions?: UserPermissions;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenNewModal: () => void;
  onNavigate: (view: any, data?: any) => void;
  driveFilesCount?: number;
  calendarSynced?: boolean;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  guestProfile,
  permissions,
  isLoggingIn,
  onLogin,
  onLogout,
  onSearch,
  searchQuery,
  onOpenNewModal,
  onNavigate,
  driveFilesCount = 0,
  calendarSynced = false,
  onOpenMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isSuperAdmin =
    permissions?.isSuperAdmin ||
    isSuperAdminEmail(user?.email) ||
    isSuperAdminEmail(guestProfile?.email);

  const isAdmin = permissions?.isAdmin || isSuperAdmin;

  const notifications = [
    {
      id: 'n1',
      title: 'New Proposal Pending Review',
      desc: 'Annual Gala 2024 was submitted by Sarah Lee',
      time: '2 hours ago',
      unread: true,
      action: () => onNavigate('document_detail', 'doc-gala-2024'),
    },
    {
      id: 'n2',
      title: 'Task Overdue Notice',
      desc: 'Incident Report 092 requires sign-off',
      time: 'Yesterday',
      unread: true,
      action: () => onNavigate('tasks'),
    },
    {
      id: 'n3',
      title: 'Calendar Sync Notice',
      desc: 'Executive Weekly Sync scheduled for Friday 4 PM',
      time: '2 days ago',
      unread: false,
      action: () => onNavigate('calendar'),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#FAF7F0]/90 backdrop-blur-xl border-b border-[#bec9c5]/40 px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Mobile brand & logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-[#3e4946] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <img
            src={COUNCIL_LOGO_SRC}
            alt="CouncilHub logo"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover shadow-xs transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg md:text-xl text-[#006054] tracking-tight leading-none">
              CouncilHub
            </span>
            <span className="text-[10px] text-[#5D4037] font-semibold tracking-wider uppercase hidden sm:block">
              Student Council Suite
            </span>
          </div>
        </button>
      </div>

      {/* Global Search Bar (Desktop & Tablet) */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div className="relative flex items-center bg-[#f6f3ec] rounded-full px-4 py-2 border border-[#bec9c5]/60 focus-within:border-[#006054] focus-within:bg-[#ffffff] focus-within:ring-2 focus-within:ring-[#006054]/20 transition-all shadow-xs">
          <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search proposals, minutes of meeting, or files..."
            className="bg-transparent border-none outline-none text-sm w-full text-[#1c1c18] placeholder:text-[#6e7976]/70"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="text-[#6e7976] hover:text-[#1c1c18] text-xs p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions & Account Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Quick New Button on mobile/tablet */}
        <button
          onClick={onOpenNewModal}
          className="hidden sm:inline-flex md:hidden items-center gap-1.5 bg-[#006054] hover:bg-[#1F7A6C] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New</span>
        </button>

        {/* Administrator Quick Status Indicator */}
        {isAdmin && (
          <div 
            onClick={() => onNavigate('admin_panel')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006054]/10 text-[#006054] text-xs font-semibold border border-[#006054]/20 hover:bg-[#006054]/20 transition-colors cursor-pointer"
            title="Administrator Control Center"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006054]">shield</span>
            <span>Administrator Control</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#3e4946] hover:bg-[#ebe8e1] transition-colors relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-[#FAF7F0]"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#bec9c5]/50 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2 border-b border-[#e5e2db] flex items-center justify-between">
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-sm text-[#1c1c18]">Notifications</span>
                <span className="text-[11px] font-semibold text-[#006054] bg-[#006054]/10 px-2 py-0.5 rounded-full">2 unread</span>
              </div>
              <div className="divide-y divide-[#f0eee7] max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      n.action();
                      setShowNotifications(false);
                    }}
                    className={`p-3 hover:bg-[#FAF7F0] cursor-pointer transition-colors ${
                      n.unread ? 'bg-[#f6f3ec]/60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1c1c18]">{n.title}</span>
                      <span className="text-[10px] text-[#6e7976] whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#3e4946] mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pt-2 border-t border-[#e5e2db] text-center">
                <button 
                  onClick={() => {
                    onNavigate('approvals');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-[#006054] hover:underline"
                >
                  View all council updates
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Google Auth menu */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#006054]/30 transition-all focus:outline-none cursor-pointer"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-[#bec9c5]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#006054] text-white flex items-center justify-center font-semibold text-sm shadow-xs">
                  {user.displayName?.charAt(0) || 'A'}
                </div>
              )}
            </button>
          ) : guestProfile ? (
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#006054]/30 transition-all focus:outline-none cursor-pointer"
              title="Council Member Profile"
            >
              <div className="w-9 h-9 rounded-full bg-[#006054] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {guestProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </button>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-9 h-9 rounded-full bg-[#006054] hover:bg-[#1F7A6C] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              title="Sign in with Google"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </button>
          )}

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#bec9c5]/50 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-[#e5e2db]">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-11 h-11 rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#006054] text-white flex items-center justify-center font-bold text-base">
                    {user?.displayName?.charAt(0) || guestProfile?.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1c1c18] truncate">
                    {user?.displayName || guestProfile?.name || 'Council Member'}
                  </p>
                  <p className="text-xs text-[#6e7976] truncate">
                    {user?.email || guestProfile?.email || 'Council Session Active'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSuperAdmin || isAdmin
                        ? 'bg-[#006054]/10 text-[#006054]'
                        : 'bg-[#f0eee7] text-[#6e7976]'
                    }`}>
                      {isSuperAdmin || isAdmin ? '🛡️ Administrator' : '👤 Council Member'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-2 space-y-1 text-xs">
                {isAdmin && (
                  <button
                    onClick={() => {
                      onNavigate('admin_panel');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#006054]/10 hover:bg-[#006054]/20 flex items-center gap-2 text-[#006054] font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Admin Control Panel</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onNavigate('tasks');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAF7F0] flex items-center gap-2 text-[#1c1c18] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006054]">task_alt</span>
                  <span>My Council Tasks</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('calendar');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAF7F0] flex items-center gap-2 text-[#1c1c18] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006054]">calendar_today</span>
                  <span>Council Calendar</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAF7F0] flex items-center gap-2 text-[#1c1c18] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006054]">settings</span>
                  <span>Account & Preferences</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#e5e2db]">
                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 font-medium text-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign out / Switch account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
