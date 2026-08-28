import React, { useState, useEffect } from 'react';
import {
  AdminUser,
  AdminAuditLog,
  SecuritySettings,
  UserPermissions,
  Department,
  UserRole,
  AccessControlSettings,
  UserSessionRecord,
} from '../types';
import {
  getSuperAdminEmail,
  setSuperAdminEmail,
  isSuperAdminEmail,
  getSuperAdminPassword,
  setSuperAdminPassword,
  getAccessControlSettings,
  updateAccessControlSettings,
  addWhitelistItem,
  setWhitelistPassword,
  removeWhitelistItem,
  addBlockedUser,
  removeBlockedUser,
  getActiveSessions,
  terminateUserSession,
  kickAllUsersExceptAdmin,
} from '../services/adminService';

interface AdminPanelViewProps {
  currentUserEmail?: string | null;
  permissions: UserPermissions;
  admins: AdminUser[];
  departments: Department[];
  auditLogs: AdminAuditLog[];
  securitySettings: SecuritySettings;
  onAddAdmin: (newAdmin: Omit<AdminUser, 'id' | 'addedAt'>) => { success: boolean; error?: string };
  onUpdateAdmin: (adminId: string, updates: Partial<AdminUser>) => { success: boolean; error?: string };
  onRemoveAdmin: (adminId: string) => { success: boolean; error?: string };
  onCreateDepartment: (dept: Omit<Department, 'id' | 'memberCount' | 'activeFileCount'>) => void;
  onUpdateDepartment: (deptId: string, updates: Partial<Department>) => void;
  onDeleteDepartment: (deptId: string) => void;
  onUpdateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  onNavigate: (view: any, data?: any) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUserEmail,
  permissions,
  admins,
  departments,
  auditLogs,
  securitySettings,
  onAddAdmin,
  onUpdateAdmin,
  onRemoveAdmin,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onUpdateSecuritySettings,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'admins' | 'access' | 'departments' | 'security' | 'audit'
  >('admins');
  const [searchAdminQuery, setSearchAdminQuery] = useState('');
  const [searchAuditQuery, setSearchAuditQuery] = useState('');
  const [searchWhitelistQuery, setSearchWhitelistQuery] = useState('');
  const [searchBlockedQuery, setSearchBlockedQuery] = useState('');

  // Access Control Local State
  const [accessSettings, setAccessSettings] = useState<AccessControlSettings>(() =>
    getAccessControlSettings()
  );
  const [activeSessions, setActiveSessions] = useState<UserSessionRecord[]>(() =>
    getActiveSessions()
  );

  // Administrator Credentials State
  const [currentSuperAdminEmail, setCurrentSuperAdminEmail] = useState<string>(() =>
    getSuperAdminEmail()
  );
  const [newSuperAdminEmailInput, setNewSuperAdminEmailInput] = useState('');
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);

  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  // Whitelist / Blacklist inputs
  const [newWhitelistInput, setNewWhitelistInput] = useState('');
  const [whitelistError, setWhitelistError] = useState<string | null>(null);
  const [newBlockedInput, setNewBlockedInput] = useState('');
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [sessionActionNotice, setSessionActionNotice] = useState<string | null>(null);

  // Add Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('council2026');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('admin');
  const [newAdminTitle, setNewAdminTitle] = useState('Council Administrator');
  const [newAdminDeptScope, setNewAdminDeptScope] = useState('all');
  const [newCanDeleteFiles, setNewCanDeleteFiles] = useState(true);
  const [newCanDeleteFolders, setNewCanDeleteFolders] = useState(true);
  const [newCanManageDepts, setNewCanManageDepts] = useState(true);
  const [newCanApproveDocs, setNewCanApproveDocs] = useState(true);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);

  // Edit Admin Permissions Modal State
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editCanDeleteFiles, setEditCanDeleteFiles] = useState(false);
  const [editCanDeleteFolders, setEditCanDeleteFolders] = useState(false);
  const [editCanManageDepts, setEditCanManageDepts] = useState(false);
  const [editCanApproveDocs, setEditCanApproveDocs] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editDeptScope, setEditDeptScope] = useState('all');

  // Department Modal State
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptSlug, setDeptSlug] = useState('');
  const [deptIcon, setDeptIcon] = useState('folder');
  const [deptFoldersText, setDeptFoldersText] = useState(
    'Minutes of Meeting, Proposals, Reports, Guidelines'
  );

  // Edit Department State
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptIcon, setEditDeptIcon] = useState('');
  const [editDeptMemberCount, setEditDeptMemberCount] = useState<number>(4);
  const [editDeptFoldersText, setEditDeptFoldersText] = useState('');

  // Confirm Delete Dept State
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Confirm Delete Admin State
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [deleteAdminError, setDeleteAdminError] = useState<string | null>(null);

  // Whitelist Password Editing State
  const [editingWhitelistEmail, setEditingWhitelistEmail] = useState<string | null>(null);
  const [whitelistPasswordInput, setWhitelistPasswordInput] = useState('');

  const isCurrentSuper =
    isSuperAdminEmail(currentUserEmail) ||
    permissions.isSuperAdmin;

  const currentActor = {
    name: isCurrentSuper ? 'Executive Head' : 'Council Administrator',
    email: currentUserEmail || currentSuperAdminEmail,
  };

  const refreshAccessState = () => {
    setAccessSettings(getAccessControlSettings());
    setActiveSessions(getActiveSessions());
    setCurrentSuperAdminEmail(getSuperAdminEmail());
  };

  useEffect(() => {
    refreshAccessState();
  }, []);

  // Filtered Admins
  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchAdminQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchAdminQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchAdminQuery.toLowerCase())
  );

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(
    (l) =>
      l.details.toLowerCase().includes(searchAuditQuery.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchAuditQuery.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(searchAuditQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchAuditQuery.toLowerCase())
  );

  // Filtered Whitelist
  const filteredAllowedEmails = accessSettings.allowedEmails.filter((e) =>
    e.toLowerCase().includes(searchWhitelistQuery.toLowerCase())
  );
  const filteredAllowedDomains = accessSettings.allowedDomains.filter((d) =>
    d.toLowerCase().includes(searchWhitelistQuery.toLowerCase())
  );

  // Filtered Blocked
  const filteredBlockedEmails = accessSettings.blockedEmails.filter((e) =>
    e.toLowerCase().includes(searchBlockedQuery.toLowerCase())
  );

  // Handlers for Administrator Email & Password
  const handleUpdateSuperEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeError(null);
    setEmailChangeSuccess(null);

    const result = setSuperAdminEmail(newSuperAdminEmailInput, currentActor);
    if (result.success) {
      const updated = getSuperAdminEmail();
      setCurrentSuperAdminEmail(updated);
      setNewSuperAdminEmailInput('');
      setEmailChangeSuccess(`Administrator email successfully transferred to ${updated}!`);
      refreshAccessState();
    } else {
      setEmailChangeError(result.error || 'Failed to update Administrator email.');
    }
  };

  const handleUpdateSuperPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage(null);
    setPasswordSuccessMessage(null);

    const result = setSuperAdminPassword(newMasterPassword, currentActor);
    if (result.success) {
      setNewMasterPassword('');
      setPasswordSuccessMessage('Administrator passcode credentials successfully updated!');
    } else {
      setPasswordErrorMessage(result.error || 'Passcode must be at least 3 characters long.');
    }
  };

  // Handlers for Access Control
  const handlePortalModeChange = (mode: AccessControlSettings['portalMode']) => {
    const updated = updateAccessControlSettings({ portalMode: mode }, currentActor);
    setAccessSettings(updated);
    setSessionActionNotice(`Portal Gateway Mode switched to: ${mode.toUpperCase().replace('_', ' ')}`);
    setTimeout(() => setSessionActionNotice(null), 4000);
  };

  const handleToggleGuestLogins = (allowed: boolean) => {
    const updated = updateAccessControlSettings({ allowGuestLogins: allowed }, currentActor);
    setAccessSettings(updated);
    setSessionActionNotice(allowed ? 'Guest log-in enabled' : 'Guest log-in disabled');
    setTimeout(() => setSessionActionNotice(null), 4000);
  };

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    setWhitelistError(null);
    const res = addWhitelistItem(newWhitelistInput, 'council2026', currentActor);
    if (res.success) {
      setNewWhitelistInput('');
      refreshAccessState();
    } else {
      setWhitelistError(res.error || 'Could not add to whitelist');
    }
  };

  const handleRemoveWhitelist = (item: string) => {
    removeWhitelistItem(item, currentActor);
    refreshAccessState();
  };

  const handleAddBlocked = (e: React.FormEvent) => {
    e.preventDefault();
    setBlockedError(null);
    const res = addBlockedUser(newBlockedInput, currentActor);
    if (res.success) {
      setNewBlockedInput('');
      refreshAccessState();
    } else {
      setBlockedError(res.error || 'Could not block user');
    }
  };

  const handleRemoveBlocked = (email: string) => {
    removeBlockedUser(email, currentActor);
    refreshAccessState();
  };

  const handleTerminateSession = (sessionId: string) => {
    terminateUserSession(sessionId, currentActor);
    refreshAccessState();
    setSessionActionNotice('User session terminated and logged out.');
    setTimeout(() => setSessionActionNotice(null), 4000);
  };

  const handleKickAllExceptAdmin = () => {
    const res = kickAllUsersExceptAdmin(currentActor);
    refreshAccessState();
    setSessionActionNotice(`Emergency kick completed: ${res.count} active sessions terminated.`);
    setTimeout(() => setSessionActionNotice(null), 5000);
  };

  const handleOpenEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditCanDeleteFiles(admin.canDeleteFiles);
    setEditCanDeleteFolders(admin.canDeleteFolders);
    setEditCanManageDepts(admin.canManageDepartments);
    setEditCanApproveDocs(admin.canApproveDocs);
    setEditRole(admin.role);
    setEditDeptScope(admin.departmentScope || 'all');
  };

  const handleSaveEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    const res = onUpdateAdmin(editingAdmin.id, {
      canDeleteFiles: editCanDeleteFiles,
      canDeleteFolders: editCanDeleteFolders,
      canManageDepartments: editCanManageDepts,
      canApproveDocs: editCanApproveDocs,
      role: editRole,
      departmentScope: editDeptScope,
    });
    if (res.success) {
      setEditingAdmin(null);
    }
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError(null);
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      setAddAdminError('Please fill in both name and email.');
      return;
    }

    const res = onAddAdmin({
      email: newAdminEmail.trim(),
      password: newAdminPassword.trim() || 'council2026',
      name: newAdminName.trim(),
      role: newAdminRole,
      title: newAdminTitle.trim() || 'Council Administrator',
      departmentScope: newAdminDeptScope,
      canDeleteFiles: newCanDeleteFiles,
      canDeleteFolders: newCanDeleteFolders,
      canManageDepartments: newCanManageDepts,
      canApproveDocs: newCanApproveDocs,
      addedBy: currentUserEmail || currentSuperAdminEmail,
    });

    if (res.success) {
      setShowAddAdminModal(false);
      setNewAdminEmail('');
      setNewAdminPassword('council2026');
      setNewAdminName('');
      setNewAdminTitle('Council Administrator');
      setNewAdminDeptScope('all');
    } else {
      setAddAdminError(res.error || 'Failed to appoint admin.');
    }
  };

  const handleCreateDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    const folders = deptFoldersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onCreateDepartment({
      name: deptName.trim(),
      slug: deptSlug.trim() || deptName.toLowerCase().replace(/\s+/g, '-'),
      iconName: deptIcon.trim() || 'folder_special',
      memberCount: 4,
      folders: folders.length > 0 ? folders : ['Minutes of Meeting', 'Proposals', 'General'],
    });

    setShowCreateDeptModal(false);
    setDeptName('');
    setDeptSlug('');
  };

  const handleSaveEditDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    const folders = editDeptFoldersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateDepartment(editingDept.id, {
      name: editDeptName.trim(),
      iconName: editDeptIcon.trim() || editingDept.iconName,
      memberCount: Number(editDeptMemberCount) >= 0 ? Number(editDeptMemberCount) : editingDept.memberCount,
      folders: folders.length > 0 ? folders : editingDept.folders,
    });

    setEditingDept(null);
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* Administrator Top Shield Banner */}
      <div className="bg-linear-to-r from-[#006054] to-[#1F7A6C] rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#D4AF37] text-[#241a00] flex items-center justify-center font-bold shadow-lg shrink-0">
              <span className="material-symbols-outlined text-[32px] md:text-[36px]">
                admin_panel_settings
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold tracking-tight">
                  Council Governance & Security Panel
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fed65b] text-[#745c00] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Administrator Controlled
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#b3ffee] mt-1">
                Administrator: <strong className="text-white underline">{currentSuperAdminEmail}</strong> • Control portal entry, appoint admins, update credentials & manage departments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Portal</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <p className="text-[11px] text-[#b3ffee] uppercase font-bold">Appointed Admins</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{admins.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <p className="text-[11px] text-[#b3ffee] uppercase font-bold">Gateway Mode</p>
            <p className="text-sm font-bold text-[#fed65b] mt-1.5 uppercase">
              {accessSettings.portalMode.replace('_', ' ')}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <p className="text-[11px] text-[#b3ffee] uppercase font-bold">Active Sessions</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {activeSessions.filter((s) => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <p className="text-[11px] text-[#b3ffee] uppercase font-bold">Audit History Logs</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{auditLogs.length}</p>
          </div>
        </div>
      </div>

      {/* Global Notification Banner if present */}
      {sessionActionNotice && (
        <div className="mb-4 p-3.5 bg-[#006054] text-white rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{sessionActionNotice}</span>
          </div>
          <button
            onClick={() => setSessionActionNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Admin Panel Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#bec9c5]/60 mb-6 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'admins'
              ? 'bg-[#006054] text-white shadow-sm'
              : 'text-[#5D4037] hover:bg-white hover:text-[#1c1c18]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Council Admins & Roles ({admins.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('access');
            refreshAccessState();
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'access'
              ? 'bg-[#006054] text-white shadow-sm'
              : 'text-[#5D4037] hover:bg-white hover:text-[#1c1c18]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">door_open</span>
          <span>Access Control & Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'departments'
              ? 'bg-[#006054] text-white shadow-sm'
              : 'text-[#5D4037] hover:bg-white hover:text-[#1c1c18]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          <span>Department Control ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'bg-[#006054] text-white shadow-sm'
              : 'text-[#5D4037] hover:bg-white hover:text-[#1c1c18]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          <span>Security & Administrator Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#006054] text-white shadow-sm'
              : 'text-[#5D4037] hover:bg-white hover:text-[#1c1c18]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: ADMINS & ROLES */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#bec9c5]/40 shadow-xs">
            <div className="relative flex-1 max-w-md bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
              <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search administrators by name, email, or role..."
                value={searchAdminQuery}
                onChange={(e) => setSearchAdminQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[#1c1c18]"
              />
            </div>

            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Appoint New Admin</span>
            </button>
          </div>

          {/* Admins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdmins.map((admin) => {
              const isSuper = isSuperAdminEmail(admin.email);
              const deptName =
                admin.departmentScope === 'all'
                  ? 'All Departments'
                  : departments.find((d) => d.id === admin.departmentScope)?.name ||
                    admin.departmentScope;

              return (
                <div
                  key={admin.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isSuper
                      ? 'bg-linear-to-br from-[#006054]/5 to-[#fed65b]/20 border-[#fed65b] shadow-md'
                      : 'bg-white border-[#bec9c5]/50 shadow-xs hover:border-[#006054]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                          isSuper
                            ? 'bg-[#D4AF37] text-white'
                            : 'bg-[#006054]/10 text-[#006054]'
                        }`}
                      >
                        {admin.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                            {admin.name}
                          </h2>
                          {isSuper && (
                            <span className="px-2 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-extrabold uppercase">
                              Administrator
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#5D4037]">{admin.email}</p>
                        <p className="text-xs font-medium text-[#6e7976] mt-0.5">
                          {admin.title} • {deptName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditAdmin(admin)}
                        className="p-2 rounded-xl text-[#5D4037] hover:bg-[#f6f3ec] hover:text-[#006054] transition-colors cursor-pointer"
                        title="Edit Permissions"
                      >
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                      </button>

                      {!isSuper && (
                        <button
                          onClick={() => setAdminToDelete(admin)}
                          className="p-2 rounded-xl text-[#5D4037] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                          title="Revoke Admin"
                        >
                          <span className="material-symbols-outlined text-[20px]">person_remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Capabilities Tags */}
                  <div className="mt-4 pt-4 border-t border-[#bec9c5]/30 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        admin.canDeleteFiles
                          ? 'bg-[#006054]/10 text-[#006054]'
                          : 'bg-[#f6f3ec] text-[#6e7976]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {admin.canDeleteFiles ? 'check' : 'close'}
                      </span>
                      Delete Files
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        admin.canDeleteFolders
                          ? 'bg-[#006054]/10 text-[#006054]'
                          : 'bg-[#f6f3ec] text-[#6e7976]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {admin.canDeleteFolders ? 'check' : 'close'}
                      </span>
                      Delete Folder Tabs
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        admin.canManageDepartments
                          ? 'bg-[#006054]/10 text-[#006054]'
                          : 'bg-[#f6f3ec] text-[#6e7976]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {admin.canManageDepartments ? 'check' : 'close'}
                      </span>
                      Manage Depts
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        admin.canApproveDocs
                          ? 'bg-[#006054]/10 text-[#006054]'
                          : 'bg-[#f6f3ec] text-[#6e7976]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {admin.canApproveDocs ? 'check' : 'close'}
                      </span>
                      Approve Proposals
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CONTROL & GATEWAY (WHO CAN GO IN OR OUT) */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Top Gateway Mode Selector */}
          <div className="bg-white p-6 rounded-3xl border border-[#bec9c5]/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">vpn_key</span>
                </div>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                    Portal Entry Gateway Mode
                  </h2>
                  <p className="text-xs text-[#5D4037]">
                    Choose who is allowed to enter or access the Council Management Portal.
                  </p>
                </div>
              </div>

              {/* Guest Logins Switch */}
              <div className="flex items-center gap-3 p-2.5 bg-[#FAF7F0] rounded-2xl border border-[#e5e2db]">
                <div>
                  <p className="text-xs font-bold text-[#1c1c18]">Allow Guest Previews</p>
                  <p className="text-[10px] text-[#6e7976]">One-click member roles</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessSettings.allowGuestLogins}
                    onChange={(e) => handleToggleGuestLogins(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#bec9c5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#006054]"></div>
                </label>
              </div>
            </div>

            {/* 3 Gateway Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePortalModeChange('open')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  accessSettings.portalMode === 'open'
                    ? 'bg-[#006054]/10 border-[#006054] shadow-sm'
                    : 'bg-[#f6f3ec]/60 border-[#bec9c5]/60 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-[24px] text-[#006054]">
                      public
                    </span>
                    {accessSettings.portalMode === 'open' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#006054] text-white text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1c18]">Open Gateway</h3>
                  <p className="text-xs text-[#5D4037] mt-1 leading-snug">
                    Standard entry: Authenticated students and council accounts can enter normally (unless blacklisted).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePortalModeChange('whitelist_only')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  accessSettings.portalMode === 'whitelist_only'
                    ? 'bg-[#fed65b]/25 border-[#D4AF37] shadow-sm'
                    : 'bg-[#f6f3ec]/60 border-[#bec9c5]/60 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-[24px] text-[#745c00]">
                      verified_user
                    </span>
                    {accessSettings.portalMode === 'whitelist_only' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#fed65b] text-[#745c00] text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1c18]">Strict Whitelist Only</h3>
                  <p className="text-xs text-[#5D4037] mt-1 leading-snug">
                    Only pre-approved email addresses or matching institutional domain suffixes are allowed entry.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePortalModeChange('superadmin_only')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  accessSettings.portalMode === 'superadmin_only'
                    ? 'bg-[#ffdad6]/60 border-[#ba1a1a] shadow-sm'
                    : 'bg-[#f6f3ec]/60 border-[#bec9c5]/60 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-[24px] text-[#ba1a1a]">
                      lock
                    </span>
                    {accessSettings.portalMode === 'superadmin_only' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#1c1c18]">Administrator Lockdown</h3>
                  <p className="text-xs text-[#5D4037] mt-1 leading-snug">
                    Emergency lockdown. All non-admin logins are immediately halted. Only {currentSuperAdminEmail} can enter.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Whitelist and Blacklist 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: Approved Whitelist */}
            <div className="bg-white p-6 rounded-3xl border border-[#bec9c5]/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">Entry Whitelist</h3>
                    <p className="text-[11px] text-[#5D4037]">Allowed emails & domain wildcards</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#006054] bg-[#006054]/10 px-2.5 py-0.5 rounded-full">
                  {accessSettings.allowedEmails.length + accessSettings.allowedDomains.length} Approved
                </span>
              </div>

              <form onSubmit={handleAddWhitelist} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newWhitelistInput}
                    onChange={(e) => {
                      setNewWhitelistInput(e.target.value);
                      if (whitelistError) setWhitelistError(null);
                    }}
                    placeholder="e.g. john@school.edu or @studentcouncil.edu"
                    className="flex-1 px-3.5 py-2 bg-[#FAF7F0] border border-[#bec9c5]/70 rounded-xl text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add</span>
                  </button>
                </div>
                {whitelistError && (
                  <p className="text-[11px] text-[#ba1a1a] font-semibold">{whitelistError}</p>
                )}
              </form>

              {/* Whitelist Search */}
              <div className="relative bg-[#FAF7F0] rounded-xl px-3 py-1.5 border border-[#bec9c5]/50 flex items-center text-xs">
                <span className="material-symbols-outlined text-[#6e7976] mr-1.5 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter whitelist..."
                  value={searchWhitelistQuery}
                  onChange={(e) => setSearchWhitelistQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1c18] text-xs"
                />
              </div>

              {/* Whitelist items */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {filteredAllowedDomains.map((d) => (
                  <div
                    key={d}
                    className="p-2.5 bg-[#FAF7F0] rounded-xl border border-[#e5e2db] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#006054]/15 text-[#006054] font-bold text-[10px]">
                        DOMAIN
                      </span>
                      <span className="font-mono font-semibold text-[#1c1c18]">{d}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelist(d)}
                      className="p-1 rounded text-[#6e7976] hover:text-[#ba1a1a] hover:bg-white cursor-pointer"
                      title="Remove domain"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}

                {filteredAllowedEmails.map((e) => {
                  const currentPw = (accessSettings.whitelistPasswords && accessSettings.whitelistPasswords[e]) || 'council2026';
                  return (
                    <div
                      key={e}
                      className="p-2.5 bg-[#FAF7F0] rounded-xl border border-[#e5e2db] flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#fed65b]/40 text-[#745c00] font-bold text-[10px]">
                            EMAIL
                          </span>
                          <span className="font-mono text-[#1c1c18]">{e}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWhitelistEmail(editingWhitelistEmail === e ? null : e);
                              setWhitelistPasswordInput(currentPw);
                            }}
                            className="px-2 py-1 rounded bg-[#006054]/10 text-[#006054] font-bold text-[11px] hover:bg-[#006054]/20 cursor-pointer"
                            title="Set or change password for whitelisted user"
                          >
                            Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWhitelist(e)}
                            className="p-1 rounded text-[#6e7976] hover:text-[#ba1a1a] hover:bg-white cursor-pointer"
                            title="Remove email"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>

                      {editingWhitelistEmail === e && (
                        <div className="flex items-center gap-2 pt-1 border-t border-[#e5e2db]">
                          <input
                            type="text"
                            value={whitelistPasswordInput}
                            onChange={(ev) => setWhitelistPasswordInput(ev.target.value)}
                            placeholder="New whitelist password"
                            className="flex-1 px-2.5 py-1.5 bg-white border border-[#bec9c5]/70 rounded-lg text-xs font-mono text-[#1c1c18]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const res = setWhitelistPassword(e, whitelistPasswordInput, currentActor);
                              if (res.success) {
                                setEditingWhitelistEmail(null);
                                refreshAccessState();
                              } else {
                                alert(res.error);
                              }
                            }}
                            className="px-3 py-1.5 bg-[#006054] text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredAllowedDomains.length === 0 && filteredAllowedEmails.length === 0 && (
                  <p className="text-xs text-center text-[#6e7976] py-3">No whitelist entries found.</p>
                )}
              </div>
            </div>

            {/* COLUMN 2: Blocked / Blacklisted Users */}
            <div className="bg-white p-6 rounded-3xl border border-[#bec9c5]/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">block</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">Blocked / Blacklisted Users</h3>
                    <p className="text-[11px] text-[#5D4037]">Restricted from portal entry</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full">
                  {accessSettings.blockedEmails.length} Banned
                </span>
              </div>

              <form onSubmit={handleAddBlocked} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newBlockedInput}
                    onChange={(e) => {
                      setNewBlockedInput(e.target.value);
                      if (blockedError) setBlockedError(null);
                    }}
                    placeholder="Enter email to block & ban..."
                    className="flex-1 px-3.5 py-2 bg-[#FAF7F0] border border-[#bec9c5]/70 rounded-xl text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#ba1a1a]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span>Block</span>
                  </button>
                </div>
                {blockedError && (
                  <p className="text-[11px] text-[#ba1a1a] font-semibold">{blockedError}</p>
                )}
              </form>

              {/* Blocked Search */}
              <div className="relative bg-[#FAF7F0] rounded-xl px-3 py-1.5 border border-[#bec9c5]/50 flex items-center text-xs">
                <span className="material-symbols-outlined text-[#6e7976] mr-1.5 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter blocked users..."
                  value={searchBlockedQuery}
                  onChange={(e) => setSearchBlockedQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1c1c18] text-xs"
                />
              </div>

              {/* Blocked items list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {filteredBlockedEmails.map((b) => (
                  <div
                    key={b}
                    className="p-2.5 bg-[#ffdad6]/40 rounded-xl border border-[#ba1a1a]/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#ba1a1a] text-white font-bold text-[10px]">
                        BLOCKED
                      </span>
                      <span className="font-mono text-[#ba1a1a] font-semibold">{b}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlocked(b)}
                      className="px-2 py-1 rounded-lg bg-white border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white font-semibold text-[11px] cursor-pointer transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}

                {filteredBlockedEmails.length === 0 && (
                  <p className="text-xs text-center text-[#6e7976] py-3">
                    No users currently blocked.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* LIVE ACTIVE SESSIONS / IN-AND-OUT MONITOR */}
          <div className="bg-white p-6 rounded-3xl border border-[#bec9c5]/50 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">sensors</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                    Live Portal Presence & Active Sessions
                  </h3>
                  <p className="text-xs text-[#5D4037]">
                    Monitor who is currently inside the portal and force-logout / kick sessions.
                  </p>
                </div>
              </div>

              {isCurrentSuper && (
                <button
                  type="button"
                  onClick={handleKickAllExceptAdmin}
                  className="px-4 py-2 bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Force-Kick All Non-Admins</span>
                </button>
              )}
            </div>

            {/* Sessions Table / List */}
            <div className="divide-y divide-[#e5e2db]">
              {activeSessions.map((s) => {
                const isSuper = isSuperAdminEmail(s.email);
                const isActive = s.status === 'active';

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isActive ? 'bg-[#FAF7F0]/60 hover:bg-[#FAF7F0]' : 'opacity-60 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuper
                            ? 'bg-[#D4AF37] text-white'
                            : isActive
                            ? 'bg-[#006054] text-white'
                            : 'bg-[#bec9c5] text-white'
                        }`}
                      >
                        {s.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-[#1c1c18]">{s.name}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-[#006054]/10 text-[#006054]'
                                : 'bg-[#bec9c5]/30 text-[#6e7976]'
                            }`}
                          >
                            {s.status}
                          </span>
                          {s.isGuest && (
                            <span className="px-1.5 py-0.2 rounded bg-[#fed65b]/40 text-[#745c00] text-[9px] font-semibold">
                              Guest Session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5D4037]">
                          {s.email || 'Guest Login'} • <span className="font-semibold">{s.role}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-[#6e7976]">Signed In</p>
                        <p className="text-[11px] text-[#5D4037] font-medium">
                          {new Date(s.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {isActive && !isSuper && (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(s.id)}
                          className="px-3 py-1.5 bg-white border border-[#ba1a1a]/40 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">logout</span>
                          <span>Kick Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {activeSessions.length === 0 && (
                <p className="text-xs text-center text-[#6e7976] py-6">
                  No active session records registered.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#bec9c5]/40 shadow-xs">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                Council Department Hubs ({departments.length})
              </h2>
              <p className="text-xs text-[#5D4037]">
                Manage dedicated folders, committees, and department storage structures.
              </p>
            </div>

            <button
              onClick={() => setShowCreateDeptModal(true)}
              className="px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              <span>Create Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white p-5 rounded-3xl border border-[#bec9c5]/50 shadow-xs hover:border-[#006054]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">
                        {dept.iconName || 'folder'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDept(dept);
                          setEditDeptName(dept.name);
                          setEditDeptIcon(dept.iconName);
                          setEditDeptMemberCount(dept.memberCount || 4);
                          setEditDeptFoldersText(dept.folders.join(', '));
                        }}
                        className="p-1.5 text-[#5D4037] hover:text-[#006054] hover:bg-[#f6f3ec] rounded-lg transition-colors cursor-pointer"
                        title="Edit Department Folders & Name"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      {['dept-exec', 'dept-house', 'dept-prefect', 'dept-welfare', 'dept-via', 'dept-media', 'dept-tech'].includes(dept.id) ? (
                        <span 
                          className="px-2 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold tracking-wider uppercase"
                          title="Core Council Department (Protected)"
                        >
                          Core Board
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeptToDelete(dept)}
                          className="p-1.5 text-[#5D4037] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors cursor-pointer"
                          title="Delete Department"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mt-3">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-[#6e7976] font-mono">ID: {dept.id}</p>

                  <div className="mt-3 pt-3 border-t border-[#e5e2db] space-y-1.5">
                    <p className="text-[11px] font-bold text-[#5D4037] uppercase">
                      Default Department Folders:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {dept.folders.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 bg-[#FAF7F0] border border-[#bec9c5]/60 rounded-md text-[10px] text-[#1c1c18]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#e5e2db] flex items-center justify-between text-xs text-[#5D4037]">
                  <span>{dept.activeFileCount || 0} Files Recorded</span>
                  <span>{dept.memberCount || 4} Council Members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & ADMINISTRATOR CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* ADMINISTRATOR CREDENTIALS & PROFILE MANAGER */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#006054]/30 shadow-md space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e5e2db]">
              <div className="w-12 h-12 rounded-2xl bg-[#006054] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[28px]">shield_person</span>
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1c1c18]">
                  Administrator Profile & Credentials
                </h2>
                <p className="text-xs text-[#5D4037]">
                  Change your designated Administrator email and access password.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Administrator Email Card */}
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#bec9c5]/60 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">
                      Change Administrator Email
                    </h3>
                    <p className="text-[11px] text-[#5D4037]">
                      Current: <strong className="text-[#006054] font-mono">{currentSuperAdminEmail}</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateSuperEmail} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1c1c18] mb-1">
                      New Administrator Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#6e7976] material-symbols-outlined text-[18px]">
                        alternate_email
                      </span>
                      <input
                        type="email"
                        required
                        value={newSuperAdminEmailInput}
                        onChange={(e) => {
                          setNewSuperAdminEmailInput(e.target.value);
                          setEmailChangeError(null);
                          setEmailChangeSuccess(null);
                        }}
                        placeholder="e.g. stu0074.kenzo@binabangsaschool.com"
                        className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#bec9c5] text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
                      />
                    </div>
                  </div>

                  {emailChangeSuccess && (
                    <div className="p-2.5 rounded-xl bg-[#006054]/10 border border-[#006054]/30 text-[#006054] text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{emailChangeSuccess}</span>
                    </div>
                  )}

                  {emailChangeError && (
                    <div className="p-2.5 rounded-xl bg-[#ffdad6]/80 border border-[#ba1a1a]/30 text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{emailChangeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Transfer Administrator Email</span>
                  </button>
                </form>
              </div>

              {/* Change Administrator Password Card */}
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#bec9c5]/60 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">
                      Change Administrator Password
                    </h3>
                    <p className="text-[11px] text-[#5D4037]">
                      Required for Administrator credential sign-in
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateSuperPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1c1c18] mb-1">
                      New Passcode / Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#6e7976] material-symbols-outlined text-[18px]">
                        lock
                      </span>
                      <input
                        type={showPasswordInput ? 'text' : 'password'}
                        required
                        value={newMasterPassword}
                        onChange={(e) => {
                          setNewMasterPassword(e.target.value);
                          setPasswordErrorMessage(null);
                          setPasswordSuccessMessage(null);
                        }}
                        placeholder="Enter new administrator password"
                        className="w-full pl-9 pr-10 py-2 bg-white rounded-xl border border-[#bec9c5] text-xs font-mono text-[#1c1c18] focus:outline-none focus:border-[#006054]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordInput(!showPasswordInput)}
                        className="absolute right-2.5 top-2 text-[#6e7976] hover:text-[#1c1c18] p-0.5 cursor-pointer"
                        title={showPasswordInput ? 'Hide' : 'Show'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPasswordInput ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {passwordSuccessMessage && (
                    <div className="p-2.5 rounded-xl bg-[#006054]/10 border border-[#006054]/30 text-[#006054] text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{passwordSuccessMessage}</span>
                    </div>
                  )}

                  {passwordErrorMessage && (
                    <div className="p-2.5 rounded-xl bg-[#ffdad6]/80 border border-[#ba1a1a]/30 text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{passwordErrorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Update Administrator Password</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* System Security Policies Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#bec9c5]/50 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e5e2db]">
              <div className="w-10 h-10 rounded-2xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Repository Safeguards & Deletion Locks
                </h2>
                <p className="text-xs text-[#5D4037]">
                  Configure global protection protocols against unauthorized deletions and structural modifications.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Emergency Lockdown */}
              <div className="p-4 rounded-2xl bg-[#ffdad6]/30 border border-[#ba1a1a]/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px] mt-0.5">
                    lock_clock
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">
                      Emergency Deletion Lockdown
                    </h3>
                    <p className="text-xs text-[#5D4037] mt-0.5 leading-relaxed">
                      When enabled, all folder and document deletions are instantly blocked across the entire system. 
                      Only the Administrator ({currentSuperAdminEmail}) can execute deletions.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={securitySettings.emergencyDeletionLock}
                    onChange={(e) =>
                      onUpdateSecuritySettings({ emergencyDeletionLock: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#bec9c5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ba1a1a]"></div>
                </label>
              </div>

              {/* Bulk Delete Safeguard */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#bec9c5]/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006054] text-[24px] mt-0.5">
                    checklist
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">
                      Require Admin Confirmation for Multi-File Deletion
                    </h3>
                    <p className="text-xs text-[#5D4037] mt-0.5">
                      Prompts for explicit confirmation and records detailed audit logs when deleting more than 1 file at once.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireApprovalForBulkDelete}
                    onChange={(e) =>
                      onUpdateSecuritySettings({ requireApprovalForBulkDelete: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#bec9c5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006054]"></div>
                </label>
              </div>

              {/* Protect Default Folders */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#bec9c5]/40 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006054] text-[24px] mt-0.5">
                    shield
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1c18]">
                      Protect Default Core Statutory Folders
                    </h3>
                    <p className="text-xs text-[#5D4037] mt-0.5">
                      Prevents deleting primary statutory folders (Minutes of Meeting, Proposals) without Administrator override.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={securitySettings.protectDefaultFolders}
                    onChange={(e) =>
                      onUpdateSecuritySettings({ protectDefaultFolders: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#bec9c5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006054]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#bec9c5]/40 shadow-xs">
            <div className="relative flex-1 max-w-md bg-[#f6f3ec] rounded-xl px-3 py-2 border border-[#bec9c5]/60 flex items-center text-xs">
              <span className="material-symbols-outlined text-[#6e7976] mr-2 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search audit trail by actor, action, or details..."
                value={searchAuditQuery}
                onChange={(e) => setSearchAuditQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[#1c1c18]"
              />
            </div>
            <span className="text-xs font-semibold text-[#5D4037]">
              Total Records: {filteredLogs.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#bec9c5]/50 overflow-hidden shadow-xs">
            <div className="divide-y divide-[#e5e2db]">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-[#FAF7F0] transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#006054]/10 text-[#006054] flex items-center justify-center shrink-0 text-xs">
                    <span className="material-symbols-outlined text-[18px]">
                      {log.action.includes('DELETE')
                        ? 'delete'
                        : log.action.includes('ADMIN') || log.action.includes('SUPER')
                        ? 'manage_accounts'
                        : log.action.includes('ACCESS') || log.action.includes('WHITELIST') || log.action.includes('BLOCK')
                        ? 'door_open'
                        : 'shield'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold text-[#1c1c18]">{log.details}</p>
                      <span className="text-[11px] text-[#6e7976]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5D4037] mt-0.5">
                      Triggered by: <span className="font-semibold">{log.actorName}</span> ({log.actorEmail})
                    </p>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <p className="text-xs text-center text-[#6e7976] py-8">
                  No matching audit logs found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Appoint New Admin */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                    Appoint Council Administrator
                  </h3>
                  <p className="text-xs text-[#5D4037]">Assign verified deletion and department control rights.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {addAdminError && (
              <div className="p-3 bg-[#ffdad6]/60 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{addAdminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Full Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Institutional / Google Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.smith@studentcouncil.edu"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Login Password <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter password for member login"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Council Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as UserRole)}
                    className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                  >
                    <option value="admin">Council Admin</option>
                    <option value="department_head">Department Head</option>
                    <option value="superadmin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Department Scope</label>
                  <select
                    value={newAdminDeptScope}
                    onChange={(e) => setNewAdminDeptScope(e.target.value)}
                    className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Council Title</label>
                <input
                  type="text"
                  placeholder="e.g. Head of Student Welfare / Council Secretary"
                  value={newAdminTitle}
                  onChange={(e) => setNewAdminTitle(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              {/* Permission Checkboxes */}
              <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#e5e2db] space-y-2.5">
                <p className="font-bold text-[#1c1c18] uppercase tracking-wider text-[11px]">
                  Granted Capabilities:
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanDeleteFolders}
                    onChange={(e) => setNewCanDeleteFolders(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Delete Custom Folder Tabs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanDeleteFiles}
                    onChange={(e) => setNewCanDeleteFiles(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Delete Files & Proposals</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanManageDepts}
                    onChange={(e) => setNewCanManageDepts(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Create / Modify Departments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanApproveDocs}
                    onChange={(e) => setNewCanApproveDocs(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Approve / Reject Submitted Proposals</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Appoint Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Admin Permissions */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                    Edit Admin Permissions
                  </h3>
                  <p className="text-xs text-[#5D4037]">
                    Modifying rights for <span className="font-bold text-[#1c1c18]">{editingAdmin.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Role</label>
                  <select
                    value={editRole}
                    disabled={isSuperAdminEmail(editingAdmin.email)}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054] disabled:opacity-50"
                  >
                    <option value="admin">Council Admin</option>
                    <option value="department_head">Department Head</option>
                    <option value="superadmin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Department Scope</label>
                  <select
                    value={editDeptScope}
                    onChange={(e) => setEditDeptScope(e.target.value)}
                    className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permission Checkboxes */}
              <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#e5e2db] space-y-2.5">
                <p className="font-bold text-[#1c1c18] uppercase tracking-wider text-[11px]">
                  Granted Capabilities:
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanDeleteFolders}
                    onChange={(e) => setEditCanDeleteFolders(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Delete Custom Folder Tabs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanDeleteFiles}
                    onChange={(e) => setEditCanDeleteFiles(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Delete Files & Proposals</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanManageDepts}
                    onChange={(e) => setEditCanManageDepts(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Create / Modify Departments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCanApproveDocs}
                    onChange={(e) => setEditCanApproveDocs(e.target.checked)}
                    className="w-4 h-4 text-[#006054] rounded focus:ring-0"
                  />
                  <span>Can Approve / Reject Submitted Proposals</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Department */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Create Council Department Hub
              </h3>
              <button
                onClick={() => setShowCreateDeptModal(false)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDeptSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Department Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logistics & Operations"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Material Symbol Icon Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. inventory, campaign, sports_esports, local_activity"
                  value={deptIcon}
                  onChange={(e) => setDeptIcon(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Default Core Folders (Comma Separated)
                </label>
                <input
                  type="text"
                  value={deptFoldersText}
                  onChange={(e) => setDeptFoldersText(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDeptModal(false)}
                  className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Department */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                Edit Department Hub
              </h3>
              <button
                onClick={() => setEditingDept(null)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditDept} className="space-y-4">
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Material Icon Name</label>
                <input
                  type="text"
                  value={editDeptIcon}
                  onChange={(e) => setEditDeptIcon(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Number of Members</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={editDeptMemberCount}
                  onChange={(e) => setEditDeptMemberCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Default Folders</label>
                <input
                  type="text"
                  value={editDeptFoldersText}
                  onChange={(e) => setEditDeptFoldersText(e.target.value)}
                  className="w-full p-3 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl outline-none focus:border-[#006054]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Department */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#ba1a1a]/30 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Delete Department Hub?
                </h3>
                <p className="text-xs text-[#5D4037] mt-1">
                  Are you sure you want to remove <strong className="text-[#1c1c18]">{deptToDelete.name}</strong>? 
                  This will archive its folder tabs from the main directory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDepartment(deptToDelete.id);
                  setDeptToDelete(null);
                }}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Revoke Admin */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#ba1a1a]/30 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">person_remove</span>
              </div>
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  Revoke Administrator Rights?
                </h3>
                <p className="text-xs text-[#5D4037] mt-1">
                  Are you sure you want to revoke admin authority from <strong className="text-[#1c1c18]">{adminToDelete.name}</strong> ({adminToDelete.email})?
                </p>
              </div>
            </div>

            {deleteAdminError && (
              <p className="text-xs text-[#ba1a1a] font-semibold">{deleteAdminError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAdminToDelete(null);
                  setDeleteAdminError(null);
                }}
                className="px-4 py-2.5 text-[#5D4037] hover:bg-[#f6f3ec] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = onRemoveAdmin(adminToDelete.id);
                  if (res.success) {
                    setAdminToDelete(null);
                  } else {
                    setDeleteAdminError(res.error || 'Failed to remove admin');
                  }
                }}
                className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Revoke Admin Rights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
