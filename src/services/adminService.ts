import {
  AdminUser,
  AdminAuditLog,
  SecuritySettings,
  UserPermissions,
  UserRole,
  AccessControlSettings,
  UserSessionRecord,
} from '../types';

const STORAGE_KEY_SUPER_ADMIN_EMAIL = 'council_super_admin_email_v1';
const DEFAULT_SUPER_ADMIN_EMAIL = 'admin@studentcouncil.edu';

export const getSuperAdminEmail = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUPER_ADMIN_EMAIL);
    if (saved && saved.trim()) {
      const cleanSaved = saved.trim().toLowerCase();
      // Auto-migrate away from old personal defaults if present
      if (
        cleanSaved === 'kenzaltacc@gmail.com' ||
        cleanSaved.includes('binabangsa') ||
        cleanSaved.includes('declan')
      ) {
        localStorage.setItem(STORAGE_KEY_SUPER_ADMIN_EMAIL, DEFAULT_SUPER_ADMIN_EMAIL);
        return DEFAULT_SUPER_ADMIN_EMAIL;
      }
      return cleanSaved;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SUPER_ADMIN_EMAIL;
};

export const SUPER_ADMIN_EMAIL = getSuperAdminEmail();

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === getSuperAdminEmail().toLowerCase();
};

export const setSuperAdminEmail = (
  newEmail: string,
  actor: { name: string; email: string }
): { success: boolean; error?: string } => {
  const clean = newEmail.trim().toLowerCase();
  if (!clean || !clean.includes('@') || !clean.includes('.')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  const previousEmail = getSuperAdminEmail();
  try {
    localStorage.setItem(STORAGE_KEY_SUPER_ADMIN_EMAIL, clean);

    // Update Admins registry to reflect new administrator email
    const admins = getAdmins();
    const updatedAdmins = admins.map((a) => {
      if (a.email.toLowerCase() === previousEmail.toLowerCase() || a.role === 'superadmin' || a.role === 'admin') {
        return {
          ...a,
          email: clean,
          name: a.name || 'Executive Head',
          role: 'superadmin' as UserRole,
        };
      }
      return a;
    });

    saveAdmins(updatedAdmins);

    logAuditEvent({
      action: 'UPDATE_SUPER_ADMIN_EMAIL',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Transferred Lead Administrator authority from ${previousEmail} to ${clean}`,
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to save new Administrator email' };
  }
};

const STORAGE_KEY_SUPER_ADMIN_PWD = 'council_super_admin_pwd_v1';
const DEFAULT_SUPER_ADMIN_PASSWORD = 'admin';

export const getSuperAdminPassword = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUPER_ADMIN_PWD);
    if (saved) return saved;
  } catch {
    // fallback
  }
  return DEFAULT_SUPER_ADMIN_PASSWORD;
};

export const setSuperAdminPassword = (
  newPassword: string,
  actor?: { name: string; email: string }
): { success: boolean; error?: string } => {
  const clean = newPassword.trim();
  if (!clean || clean.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters long.' };
  }
  try {
    localStorage.setItem(STORAGE_KEY_SUPER_ADMIN_PWD, clean);
    if (actor) {
      logAuditEvent({
        action: 'UPDATE_SUPER_ADMIN_PASSWORD',
        actorName: actor.name,
        actorEmail: actor.email,
        details: 'Updated Administrator passcode credentials',
      });
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update passcode' };
  }
};

export const verifySuperAdminPassword = (password: string): boolean => {
  const current = getSuperAdminPassword();
  if (password === current) return true;
  // If not explicitly customized by user yet, accept initial master passwords
  if (!localStorage.getItem(STORAGE_KEY_SUPER_ADMIN_PWD)) {
    if (['admin', 'admin123', 'kenzo', 'kenzo2026', 'council2026'].includes(password)) {
      return true;
    }
  }
  return false;
};

const STORAGE_KEY_ADMINS = 'council_admin_registry_v1';
const STORAGE_KEY_AUDIT = 'council_audit_logs_v1';
const STORAGE_KEY_SECURITY = 'council_security_settings_v1';
const STORAGE_KEY_ACCESS_CONTROL = 'council_access_control_v1';
const STORAGE_KEY_SESSIONS = 'council_active_sessions_v1';

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  emergencyDeletionLock: false,
  requireApprovalForBulkDelete: true,
  allowGuestUploads: true,
  protectDefaultFolders: true,
};

const DEFAULT_ACCESS_CONTROL: AccessControlSettings = {
  portalMode: 'open',
  allowGuestLogins: true,
  allowedEmails: [
    'sarah.lee@studentcouncil.edu',
    'marcus.vance@studentcouncil.edu',
    'elena.rostova@studentcouncil.edu',
  ],
  allowedDomains: ['@studentcouncil.edu'],
  blockedEmails: [],
  whitelistPasswords: {
    'sarah.lee@studentcouncil.edu': 'council2026',
    'marcus.vance@studentcouncil.edu': 'council2026',
    'elena.rostova@studentcouncil.edu': 'council2026',
  },
};

export const getAccessControlSettings = (): AccessControlSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACCESS_CONTROL);
    if (saved) {
      return { ...DEFAULT_ACCESS_CONTROL, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load access control:', e);
  }
  localStorage.setItem(STORAGE_KEY_ACCESS_CONTROL, JSON.stringify(DEFAULT_ACCESS_CONTROL));
  return DEFAULT_ACCESS_CONTROL;
};

export const updateAccessControlSettings = (
  updates: Partial<AccessControlSettings>,
  actor: { name: string; email: string }
): AccessControlSettings => {
  const current = getAccessControlSettings();
  const updated: AccessControlSettings = { ...current, ...updates };
  try {
    localStorage.setItem(STORAGE_KEY_ACCESS_CONTROL, JSON.stringify(updated));
    logAuditEvent({
      action: 'ACCESS_GATE_MODE_CHANGE',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Modified access gateway policies: ${Object.keys(updates).join(', ')}`,
    });
  } catch (e) {
    console.warn('Failed to save access control:', e);
  }
  return updated;
};

export const addWhitelistItem = (
  item: string,
  initialPassword: string = 'council2026',
  actor: { name: string; email: string }
): { success: boolean; error?: string } => {
  const clean = item.trim().toLowerCase();
  if (!clean) return { success: false, error: 'Cannot add empty item' };

  const current = getAccessControlSettings();
  const whitelistPasswords = { ...(current.whitelistPasswords || {}) };

  if (clean.startsWith('@')) {
    if (current.allowedDomains.includes(clean)) {
      return { success: false, error: 'Domain already in whitelist' };
    }
    const updated = { ...current, allowedDomains: [...current.allowedDomains, clean] };
    updateAccessControlSettings(updated, actor);
    logAuditEvent({
      action: 'WHITELIST_ADD',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Added domain ${clean} to portal entry whitelist`,
    });
  } else {
    if (!clean.includes('@')) {
      return { success: false, error: 'Please enter a valid email or domain starting with @' };
    }
    if (current.allowedEmails.map((e) => e.toLowerCase()).includes(clean)) {
      return { success: false, error: 'Email is already in whitelist' };
    }
    whitelistPasswords[clean] = initialPassword.trim() || 'council2026';
    const updated = {
      ...current,
      allowedEmails: [...current.allowedEmails, clean],
      whitelistPasswords,
    };
    updateAccessControlSettings(updated, actor);
    logAuditEvent({
      action: 'WHITELIST_ADD',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Added email ${clean} to portal entry whitelist with password`,
    });
  }
  return { success: true };
};

export const setWhitelistPassword = (
  email: string,
  newPassword: string,
  actor: { name: string; email: string }
): { success: boolean; error?: string } => {
  const clean = email.trim().toLowerCase();
  const pass = newPassword.trim();
  if (!pass || pass.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters long.' };
  }
  const current = getAccessControlSettings();
  const whitelistPasswords = { ...(current.whitelistPasswords || {}) };
  whitelistPasswords[clean] = pass;
  const updated = { ...current, whitelistPasswords };
  updateAccessControlSettings(updated, actor);
  logAuditEvent({
    action: 'UPDATE_PERMISSIONS',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Updated password for whitelisted email ${clean}`,
  });
  return { success: true };
};

export const changeUserPassword = (
  email: string,
  currentPass: string,
  newPass: string,
  actorName: string
): { success: boolean; error?: string } => {
  const cleanEmail = email.trim().toLowerCase();
  if (!newPass || newPass.trim().length < 3) {
    return { success: false, error: 'New password must be at least 3 characters long.' };
  }

  // 1. Administrator
  if (isSuperAdminEmail(cleanEmail)) {
    if (!verifySuperAdminPassword(currentPass)) {
      return { success: false, error: 'Current Administrator password is incorrect.' };
    }
    return setSuperAdminPassword(newPass.trim(), { name: actorName, email: cleanEmail });
  }

  // 2. Admin
  const admins = getAdmins();
  const adminIndex = admins.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (adminIndex !== -1) {
    const adm = admins[adminIndex];
    const expected = adm.password || 'council2026';
    if (currentPass !== expected) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    const updatedAdmin = { ...adm, password: newPass.trim() };
    admins[adminIndex] = updatedAdmin;
    saveAdmins(admins);
    logAuditEvent({
      action: 'UPDATE_PERMISSIONS',
      actorName,
      actorEmail: cleanEmail,
      details: `Changed password for admin account ${cleanEmail}`,
    });
    return { success: true };
  }

  // 3. Whitelist email
  const settings = getAccessControlSettings();
  const isWhitelisted = settings.allowedEmails.map(e => e.toLowerCase()).includes(cleanEmail);
  if (isWhitelisted) {
    const expected = (settings.whitelistPasswords && settings.whitelistPasswords[cleanEmail]) || 'council2026';
    if (currentPass !== expected) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    return setWhitelistPassword(cleanEmail, newPass.trim(), { name: actorName, email: cleanEmail });
  }

  return { success: false, error: 'User account not found.' };
};

export const removeWhitelistItem = (
  item: string,
  actor: { name: string; email: string }
): void => {
  const clean = item.trim().toLowerCase();
  const current = getAccessControlSettings();
  const updated: AccessControlSettings = {
    ...current,
    allowedEmails: current.allowedEmails.filter((e) => e.toLowerCase() !== clean),
    allowedDomains: current.allowedDomains.filter((d) => d.toLowerCase() !== clean),
  };
  updateAccessControlSettings(updated, actor);
  logAuditEvent({
    action: 'WHITELIST_REMOVE',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Removed ${clean} from portal entry whitelist`,
  });
};

export const addBlockedUser = (
  email: string,
  actor: { name: string; email: string }
): { success: boolean; error?: string } => {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  if (isSuperAdminEmail(clean)) {
    return { success: false, error: 'Cannot block the Administrator' };
  }

  const current = getAccessControlSettings();
  if (current.blockedEmails.map((e) => e.toLowerCase()).includes(clean)) {
    return { success: false, error: 'User is already on the blocked list' };
  }

  const updated = {
    ...current,
    blockedEmails: [...current.blockedEmails, clean],
    // Also remove from whitelist if present
    allowedEmails: current.allowedEmails.filter((e) => e.toLowerCase() !== clean),
  };
  updateAccessControlSettings(updated, actor);

  // Terminate any active sessions immediately
  terminateSessionsForEmail(clean);

  logAuditEvent({
    action: 'BLOCK_USER',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Blocked ${clean} from entering the portal and terminated active sessions`,
  });

  return { success: true };
};

export const removeBlockedUser = (
  email: string,
  actor: { name: string; email: string }
): void => {
  const clean = email.trim().toLowerCase();
  const current = getAccessControlSettings();
  const updated = {
    ...current,
    blockedEmails: current.blockedEmails.filter((e) => e.toLowerCase() !== clean),
  };
  updateAccessControlSettings(updated, actor);
  logAuditEvent({
    action: 'UNBLOCK_USER',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Unblocked ${clean} and restored potential portal access`,
  });
};

export const getActiveSessions = (): UserSessionRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load active sessions:', e);
  }
  return [];
};

export const saveActiveSessions = (sessions: UserSessionRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save active sessions:', e);
  }
};

export const trackUserSession = (
  user: {
    email: string;
    name: string;
    role: string;
    departmentId?: string;
    isGuest?: boolean;
  }
): UserSessionRecord => {
  const sessions = getActiveSessions();
  const cleanEmail = user.email.trim().toLowerCase();

  // Deactivate old active sessions for the same email
  const updated = sessions.map((s) => {
    if (s.email.toLowerCase() === cleanEmail && s.status === 'active') {
      return { ...s, status: 'terminated' as const };
    }
    return s;
  });

  const newSession: UserSessionRecord = {
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId || 'dept-exec',
    isGuest: !!user.isGuest,
    loginTime: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    status: 'active',
  };

  const finalSessions = [newSession, ...updated].slice(0, 50);
  saveActiveSessions(finalSessions);
  return newSession;
};

export const terminateUserSession = (
  sessionId: string,
  actor: { name: string; email: string }
): { success: boolean } => {
  const sessions = getActiveSessions();
  let targetName = 'User';
  let targetEmail = '';

  const updated = sessions.map((s) => {
    if (s.id === sessionId) {
      targetName = s.name;
      targetEmail = s.email;
      return { ...s, status: 'terminated' as const };
    }
    return s;
  });

  saveActiveSessions(updated);

  logAuditEvent({
    action: 'TERMINATE_SESSION',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Kicked / Force-logged out ${targetName} (${targetEmail || 'Guest Session'})`,
  });

  return { success: true };
};

export const terminateSessionsForEmail = (email: string): void => {
  const clean = email.trim().toLowerCase();
  const sessions = getActiveSessions();
  const updated = sessions.map((s) => {
    if (s.email.toLowerCase() === clean) {
      return { ...s, status: 'terminated' as const };
    }
    return s;
  });
  saveActiveSessions(updated);
};

export const kickAllUsersExceptAdmin = (
  actor: { name: string; email: string }
): { success: boolean; count: number } => {
  const sessions = getActiveSessions();
  const superEmail = getSuperAdminEmail().toLowerCase();
  let kickedCount = 0;

  const updated = sessions.map((s) => {
    if (s.email.toLowerCase() !== superEmail && s.status === 'active') {
      kickedCount++;
      return { ...s, status: 'terminated' as const };
    }
    return s;
  });

  saveActiveSessions(updated);

  logAuditEvent({
    action: 'TERMINATE_SESSION',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Executed Master Force-Kick: Terminated all ${kickedCount} active user sessions`,
  });

  return { success: true, count: kickedCount };
};

/**
 * Gatekeeper entry check used before signing any user into the portal
 */
export const checkPortalAccess = (
  email?: string | null,
  isGuest?: boolean
): { allowed: boolean; reason?: string } => {
  const currentEmail = (email || '').trim().toLowerCase();
  const settings = getAccessControlSettings();
  const superEmail = getSuperAdminEmail().toLowerCase();

  // 1. Administrator is always granted entry
  if (currentEmail === superEmail) {
    return { allowed: true };
  }

  // 2. Check Blacklist / Blocked list
  if (currentEmail && settings.blockedEmails.some((b) => b.toLowerCase() === currentEmail)) {
    return {
      allowed: false,
      reason: 'Your account has been restricted from entering the Council Portal by the Administrator.',
    };
  }

  // 3. Portal in Administrator Lockdown / Maintenance Mode
  if (settings.portalMode === 'superadmin_only') {
    return {
      allowed: false,
      reason: 'The Council Portal is currently locked down in Administrator Maintenance Mode. Non-admin access is temporarily suspended.',
    };
  }

  // 4. Guest Login Disallowed
  if (isGuest && !settings.allowGuestLogins) {
    return {
      allowed: false,
      reason: 'Guest access is currently disabled by administrator policy. Please sign in with an authorized Google account.',
    };
  }

  // 5. Whitelist-Only Mode
  if (settings.portalMode === 'whitelist_only') {
    if (isGuest) {
      return {
        allowed: false,
        reason: 'Restricted Whitelist Mode is active. Guest sessions are not permitted. Please sign in with an approved email.',
      };
    }

    if (!currentEmail) {
      return {
        allowed: false,
        reason: 'An email address is required to verify whitelist access.',
      };
    }

    // Check if email is in whitelist
    const isEmailWhitelisted = settings.allowedEmails.some(
      (e) => e.toLowerCase() === currentEmail
    );

    // Check if domain matches allowed domains
    const isDomainWhitelisted = settings.allowedDomains.some((d) =>
      currentEmail.endsWith(d.toLowerCase())
    );

    // Check if user is an existing admin
    const admins = getAdmins();
    const isAdmin = admins.some((a) => a.email.toLowerCase() === currentEmail);

    if (!isEmailWhitelisted && !isDomainWhitelisted && !isAdmin) {
      return {
        allowed: false,
        reason: `Access Denied: ${currentEmail} is not on the approved council whitelist. Please contact the Administrator (${getSuperAdminEmail()}).`,
      };
    }
  }

  return { allowed: true };
};

const getInitialAdmins = (): AdminUser[] => [
  {
    id: 'admin-super-1',
    email: getSuperAdminEmail(),
    name: 'Executive Head',
    role: 'superadmin',
    title: 'Lead Administrator',
    departmentScope: 'all',
    canDeleteFiles: true,
    canDeleteFolders: true,
    canManageDepartments: true,
    canApproveDocs: true,
    addedAt: new Date().toISOString(),
    addedBy: 'System Core',
  },
  {
    id: 'admin-exec-1',
    email: 'sarah.lee@studentcouncil.edu',
    name: 'Sarah Lee',
    role: 'admin',
    title: 'Council President',
    departmentScope: 'all',
    canDeleteFiles: true,
    canDeleteFolders: true,
    canManageDepartments: true,
    canApproveDocs: true,
    addedAt: new Date().toISOString(),
    addedBy: getSuperAdminEmail(),
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    action: 'ADD_ADMIN',
    actorName: 'System Security',
    actorEmail: getSuperAdminEmail(),
    details: `Initialized Lead Administrator privileges for ${getSuperAdminEmail()}`,
  },
  {
    id: 'log-init-2',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    action: 'SECURITY_TOGGLE',
    actorName: 'Executive Head',
    actorEmail: getSuperAdminEmail(),
    details: 'Enabled strict consent validation for folder and document deletion',
  },
];

export function getAdmins(): AdminUser[] {
  const superEmail = getSuperAdminEmail();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMINS);
    if (saved) {
      let parsed: AdminUser[] = JSON.parse(saved);
      // Migrate / ensure primary super admin is present
      const hasPrimary = parsed.some(
        (a) => a.email.toLowerCase() === superEmail.toLowerCase()
      );
      if (!hasPrimary) {
        parsed = [getInitialAdmins()[0], ...parsed.filter((a) => !isSuperAdminEmail(a.email))];
        localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load admins from storage:', e);
  }
  const init = getInitialAdmins();
  localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(init));
  return init;
}

export function saveAdmins(admins: AdminUser[]): void {
  const superEmail = getSuperAdminEmail();
  try {
    // Ensure super admin cannot be stripped of superadmin role
    const sanitized = admins.map((a) => {
      if (isSuperAdminEmail(a.email)) {
        return {
          ...a,
          role: 'superadmin' as UserRole,
          canDeleteFiles: true,
          canDeleteFolders: true,
          canManageDepartments: true,
          canApproveDocs: true,
          departmentScope: 'all',
        };
      }
      return a;
    });

    const hasSuper = sanitized.some(
      (a) => a.email.toLowerCase() === superEmail.toLowerCase()
    );
    if (!hasSuper) {
      sanitized.unshift(getInitialAdmins()[0]);
    }

    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Failed to save admins to storage:', e);
  }
}

export function addAdmin(
  newAdmin: Omit<AdminUser, 'id' | 'addedAt'>,
  actor: { name: string; email: string }
): { success: boolean; error?: string; admin?: AdminUser } {
  const admins = getAdmins();
  const normalizedEmail = newAdmin.email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: 'Email address is required' };
  }

  if (admins.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'An admin with this email already exists' };
  }

  const created: AdminUser = {
    ...newAdmin,
    id: `admin-${Date.now()}`,
    email: normalizedEmail,
    addedAt: new Date().toISOString(),
    addedBy: actor.email,
  };

  const updated = [...admins, created];
  saveAdmins(updated);

  logAuditEvent({
    action: 'ADD_ADMIN',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Appointed ${created.name} (${created.email}) as ${created.role} with deletion permissions`,
    targetId: created.id,
    targetName: created.name,
  });

  return { success: true, admin: created };
}

export function updateAdmin(
  adminId: string,
  updates: Partial<AdminUser>,
  actor: { name: string; email: string }
): { success: boolean; error?: string; admin?: AdminUser } {
  const admins = getAdmins();
  const index = admins.findIndex((a) => a.id === adminId);
  if (index === -1) {
    return { success: false, error: 'Admin not found' };
  }

  const target = admins[index];
  if (
    isSuperAdminEmail(target.email) &&
    updates.role &&
    updates.role !== 'superadmin'
  ) {
    return { success: false, error: 'Cannot demote the primary Administrator' };
  }

  const updatedAdmin = { ...target, ...updates };
  admins[index] = updatedAdmin;
  saveAdmins(admins);

  logAuditEvent({
    action: 'UPDATE_PERMISSIONS',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Updated permissions for ${updatedAdmin.name} (${updatedAdmin.email})`,
    targetId: adminId,
    targetName: updatedAdmin.name,
  });

  return { success: true, admin: updatedAdmin };
}

export function removeAdmin(
  adminId: string,
  actor: { name: string; email: string }
): { success: boolean; error?: string } {
  const admins = getAdmins();
  const target = admins.find((a) => a.id === adminId);
  if (!target) {
    return { success: false, error: 'Admin not found' };
  }

  if (isSuperAdminEmail(target.email)) {
    return { success: false, error: 'Cannot remove primary Administrator' };
  }

  const filtered = admins.filter((a) => a.id !== adminId);
  saveAdmins(filtered);

  logAuditEvent({
    action: 'REMOVE_ADMIN',
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Revoked admin privileges from ${target.name} (${target.email})`,
    targetId: adminId,
    targetName: target.name,
  });

  return { success: true };
}

export function getAuditLogs(): AdminAuditLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load audit logs:', e);
  }
  localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
  return INITIAL_AUDIT_LOGS;
}

export function logAuditEvent(
  log: Omit<AdminAuditLog, 'id' | 'timestamp'>
): void {
  try {
    const logs = getAuditLogs();
    const newLog: AdminAuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 200); // keep recent 200
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save audit log:', e);
  }
}

export function getSecuritySettings(): SecuritySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SECURITY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load security settings:', e);
  }
  localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(DEFAULT_SECURITY_SETTINGS));
  return DEFAULT_SECURITY_SETTINGS;
}

export function updateSecuritySettings(
  settings: Partial<SecuritySettings>,
  actor: { name: string; email: string }
): SecuritySettings {
  const current = getSecuritySettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(updated));
    logAuditEvent({
      action: 'SECURITY_TOGGLE',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Updated security policies: ${Object.keys(settings).join(', ')}`,
    });
  } catch (e) {
    console.warn('Failed to save security settings:', e);
  }
  return updated;
}

/**
 * Check and resolve permissions for any active user or guest session
 */
export function resolveUserPermissions(
  userEmail?: string | null,
  guestRole?: { name: string; role: string; departmentId: string; email?: string } | null,
  cachedAdmins?: AdminUser[],
  cachedSecurity?: SecuritySettings
): UserPermissions {
  const normalizedEmail = (userEmail || guestRole?.email || '').trim().toLowerCase();
  const security = cachedSecurity || getSecuritySettings();
  const isEmergencyLocked = Boolean(security.emergencyDeletionLock);

  // 1. Is this the Administrator?
  if (isSuperAdminEmail(normalizedEmail) || (guestRole?.role && guestRole.role.toLowerCase().includes('administrator'))) {
    return {
      isSuperAdmin: true,
      isAdmin: true,
      canDeleteFiles: true,
      canDeleteFolders: true,
      canManageDepartments: true,
      canApproveDocs: true,
      canCreateTasks: true,
      canCreateEvents: true,
      canUploadFiles: true,
      canCreateFolders: true,
      role: 'superadmin',
      departmentScope: 'all',
    };
  }

  // 2. Check if this email or name is in the admin roster
  const admins = cachedAdmins && cachedAdmins.length > 0 ? cachedAdmins : getAdmins();
  const guestNameClean = (guestRole?.name || '').trim().toLowerCase();
  const guestEmailClean = (guestRole?.email || '').trim().toLowerCase();

  const foundAdmin = admins.find((a) => {
    const aEmail = a.email.trim().toLowerCase();
    const aName = a.name.trim().toLowerCase();
    if (normalizedEmail && aEmail === normalizedEmail) return true;
    if (guestEmailClean && aEmail === guestEmailClean) return true;
    if (guestNameClean && aName === guestNameClean) return true;
    return false;
  });

  if (foundAdmin) {
    const isSuper = foundAdmin.role === 'superadmin' || isSuperAdminEmail(foundAdmin.email);
    const hasDeletePermission = isSuper ? true : (isEmergencyLocked ? false : (foundAdmin.canDeleteFiles !== false));
    return {
      isSuperAdmin: isSuper,
      isAdmin: true,
      canDeleteFiles: hasDeletePermission,
      canDeleteFolders: isSuper ? true : (isEmergencyLocked ? false : (foundAdmin.canDeleteFolders !== false)),
      canManageDepartments: foundAdmin.canManageDepartments ?? true,
      canApproveDocs: foundAdmin.canApproveDocs ?? true,
      canCreateTasks: true,
      canCreateEvents: true,
      canUploadFiles: true,
      canCreateFolders: true,
      role: foundAdmin.role,
      departmentScope: foundAdmin.departmentScope || 'all',
    };
  }

  // 3. Guest profile checks - Administrator vs Department Head vs Member vs SC Viewer
  if (guestRole) {
    const roleLower = (guestRole.role || '').toLowerCase();
    const nameLower = (guestRole.name || '').toLowerCase();

    if (
      guestRole.name === 'SC Preview' ||
      roleLower === 'viewer' ||
      roleLower === 'sc viewer'
    ) {
      return {
        isSuperAdmin: false,
        isAdmin: false,
        canDeleteFiles: false,
        canDeleteFolders: false,
        canManageDepartments: false,
        canApproveDocs: false,
        canCreateTasks: false,
        canCreateEvents: false,
        canUploadFiles: false,
        canCreateFolders: false,
        role: 'viewer',
        departmentScope: guestRole.departmentId,
      };
    }

    const isAdminOrPresident =
      roleLower.includes('admin') ||
      roleLower.includes('president') ||
      roleLower.includes('executive') ||
      nameLower.includes('sarah lee');

    if (isAdminOrPresident) {
      return {
        isSuperAdmin: false,
        isAdmin: true,
        canDeleteFiles: !isEmergencyLocked,
        canDeleteFolders: !isEmergencyLocked,
        canManageDepartments: true,
        canApproveDocs: true,
        canCreateTasks: true,
        canCreateEvents: true,
        canUploadFiles: true,
        canCreateFolders: true,
        role: 'admin',
        departmentScope: 'all',
      };
    }

    if (roleLower.includes('head') || roleLower.includes('lead')) {
      return {
        isSuperAdmin: false,
        isAdmin: false,
        canDeleteFiles: false,
        canDeleteFolders: false,
        canManageDepartments: false,
        canApproveDocs: true,
        canCreateTasks: true,
        canCreateEvents: true,
        canUploadFiles: true,
        canCreateFolders: true,
        role: 'department_head',
        departmentScope: guestRole.departmentId,
      };
    }

    // Default member
    return {
      isSuperAdmin: false,
      isAdmin: false,
      canDeleteFiles: false,
      canDeleteFolders: false,
      canManageDepartments: false,
      canApproveDocs: false,
      canCreateTasks: true,
      canCreateEvents: true,
      canUploadFiles: true,
      canCreateFolders: true,
      role: 'member',
      departmentScope: guestRole.departmentId,
    };
  }

  // Default locked down
  return {
    isSuperAdmin: false,
    isAdmin: false,
    canDeleteFiles: false,
    canDeleteFolders: false,
    canManageDepartments: false,
    canApproveDocs: false,
    canCreateTasks: false,
    canCreateEvents: false,
    canUploadFiles: false,
    canCreateFolders: false,
    role: 'viewer',
  };
}
