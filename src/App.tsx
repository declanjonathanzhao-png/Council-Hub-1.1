import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  ViewType,
  CouncilDocument,
  Department,
  CouncilTask,
  CouncilEvent,
  AdminUser,
  SecuritySettings,
  AdminAuditLog,
  UserPermissions,
  DocumentComment,
} from './types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_TASKS,
  INITIAL_EVENTS,
} from './data/initialData';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from './services/googleCalendarService';
import {
  subscribeToDocuments,
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  subscribeToTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  subscribeToEvents,
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToDepartments,
  saveDepartmentToFirestore,
  deleteDepartmentFromFirestore,
  subscribeToAdmins,
  saveAdminToFirestore,
  deleteAdminFromFirestore,
  subscribeToSecuritySettings,
  saveSecuritySettingsToFirestore,
  subscribeToAccessControlSettings,
  saveAccessControlSettingsToFirestore,
  subscribeToAuditLogs,
  saveAuditLogToFirestore,
  mergeDepartments,
  seedFirestoreIfEmpty,
} from './services/firestoreSync';
import {
  getSuperAdminEmail,
  isSuperAdminEmail,
  verifySuperAdminPassword,
  checkPortalAccess,
  getAdmins,
  saveAdmins,
  addAdmin,
  updateAdmin,
  removeAdmin,
  getAuditLogs,
  logAuditEvent,
  getSecuritySettings,
  updateSecuritySettings,
  resolveUserPermissions,
  getAccessControlSettings,
} from './services/adminService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { DepartmentHubView } from './components/DepartmentHubView';
import { MoMListView } from './components/MoMListView';
import { ProposalsListView } from './components/ProposalsListView';
import { DocumentDetailView } from './components/DocumentDetailView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { ApprovalsView } from './components/ApprovalsView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { FolderView } from './components/FolderView';
import { AdminPanelView } from './components/AdminPanelView';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { GoogleDriveBrowserModal } from './components/GoogleDriveBrowserModal';
import { GoogleSignInModal } from './components/GoogleSignInModal';
import { UserInstructionsModal } from './components/UserInstructionsModal';
import { SignInScreen } from './components/SignInScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUserInstructions, setShowUserInstructions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [targetFolderDeptId, setTargetFolderDeptId] = useState<string>('dept-exec');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Session / Guest Profile state - Login page is ALWAYS the initial first screen
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [guestProfile, setGuestProfile] = useState<{
    name: string;
    role: string;
    departmentId: string;
    email?: string;
  } | null>(null);

  // Admin & Security Management State
  const [admins, setAdminsState] = useState<AdminUser[]>(() => getAdmins());
  const [securitySettings, setSecuritySettingsState] = useState<SecuritySettings>(() =>
    getSecuritySettings()
  );
  const [auditLogs, setAuditLogsState] = useState<AdminAuditLog[]>(() => getAuditLogs());

  // Access Denied Modal state
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    actionTitle: string;
    reason: string;
    requiredRole?: string;
  }>({
    isOpen: false,
    actionTitle: '',
    reason: '',
  });

  const currentEmail = user?.email || guestProfile?.email || null;

  // Compute Current User Permissions
  const userPermissions: UserPermissions = useMemo(() => {
    return resolveUserPermissions(currentEmail, guestProfile, admins, securitySettings);
  }, [currentEmail, guestProfile, admins, securitySettings]);

  // App Navigation & Data State
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept-exec');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-house-guidelines');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFolder, setUploadFolder] = useState<string>('');

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('council_departments_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeDepartments(INITIAL_DEPARTMENTS, parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load departments from localStorage:', e);
    }
    return INITIAL_DEPARTMENTS;
  });
  const [documents, setDocuments] = useState<CouncilDocument[]>(() => {
    try {
      const saved = localStorage.getItem('council_documents_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load documents from localStorage:', e);
    }
    return INITIAL_DOCUMENTS;
  });

  const [tasks, setTasks] = useState<CouncilTask[]>(() => {
    try {
      const saved = localStorage.getItem('council_tasks_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load tasks from localStorage:', e);
    }
    return INITIAL_TASKS;
  });

  const [events, setEvents] = useState<CouncilEvent[]>(() => {
    try {
      const saved = localStorage.getItem('council_events_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load events from localStorage:', e);
    }
    return INITIAL_EVENTS;
  });
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('council_documents_v1', JSON.stringify(documents));
    } catch (e) {
      console.warn('Failed to save documents to localStorage:', e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('council_tasks_v1', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('council_events_v1', JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save events to localStorage:', e);
    }
  }, [events]);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<'Proposal' | 'MoM' | 'Report' | 'Guidelines' | 'Notes' | 'Poster' | 'Sheet'>('Proposal');
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [showGlobalNewMenu, setShowGlobalNewMenu] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setIsSessionActive(true);
        try {
          localStorage.setItem('council_session_active', 'true');
        } catch {
          // ignore
        }
        syncGoogleCalendar();
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Initial Firestore Cloud Seed (ensures all 7 core departments and settings exist in Firestore)
  useEffect(() => {
    seedFirestoreIfEmpty(
      INITIAL_DEPARTMENTS,
      INITIAL_DOCUMENTS,
      INITIAL_TASKS,
      INITIAL_EVENTS,
      admins,
      securitySettings,
      getAccessControlSettings(),
      documents
    );
  }, []);

  // Firestore real-time sync for documents, tasks, events, departments, admins, security, and access control
  useEffect(() => {
    const unsubDocs = subscribeToDocuments((remoteDocs) => {
      if (remoteDocs) {
        setDocuments(remoteDocs);
        try {
          localStorage.setItem('council_documents_v1', JSON.stringify(remoteDocs));
        } catch {
          // ignore
        }
      }
    });

    const unsubTasks = subscribeToTasks((remoteTasks) => {
      if (remoteTasks) {
        setTasks(remoteTasks);
        try {
          localStorage.setItem('council_tasks_v1', JSON.stringify(remoteTasks));
        } catch {
          // ignore
        }
      }
    });

    const unsubEvents = subscribeToEvents((remoteEvents) => {
      if (remoteEvents) {
        setEvents(remoteEvents);
        try {
          localStorage.setItem('council_events_v1', JSON.stringify(remoteEvents));
        } catch {
          // ignore
        }
      }
    });

    const unsubDepts = subscribeToDepartments((remoteDepts) => {
      if (remoteDepts) {
        setDepartments((prev) => {
          const merged = mergeDepartments(INITIAL_DEPARTMENTS, remoteDepts);
          try {
            localStorage.setItem('council_departments_v3', JSON.stringify(merged));
          } catch (e) {
            console.warn('Failed to save merged departments:', e);
          }
          return merged;
        });
      }
    });

    const unsubAdmins = subscribeToAdmins((remoteAdmins) => {
      if (remoteAdmins && remoteAdmins.length > 0) {
        setAdminsState(remoteAdmins);
        saveAdmins(remoteAdmins);
      }
    });

    const unsubSecurity = subscribeToSecuritySettings((remoteSec) => {
      if (remoteSec) {
        setSecuritySettingsState(remoteSec);
        try {
          localStorage.setItem('council_security_settings_v1', JSON.stringify(remoteSec));
        } catch {
          // ignore
        }
      }
    });

    const unsubAudit = subscribeToAuditLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        setAuditLogsState(remoteLogs);
        try {
          localStorage.setItem('council_audit_logs_v1', JSON.stringify(remoteLogs));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      if (unsubDocs) unsubDocs();
      if (unsubTasks) unsubTasks();
      if (unsubEvents) unsubEvents();
      if (unsubDepts) unsubDepts();
      if (unsubAdmins) unsubAdmins();
      if (unsubSecurity) unsubSecurity();
      if (unsubAudit) unsubAudit();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setIsSessionActive(true);
        try {
          localStorage.setItem('council_session_active', 'true');
        } catch {
          // ignore
        }
        setShowSignInModal(false);
        await syncGoogleCalendar();
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err?.message || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailSignIn = (email: string, password: string) => {
    setAuthError(null);
    const emailClean = email.trim().toLowerCase();
    if (!emailClean) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    // 1. Check Administrator
    if (isSuperAdminEmail(emailClean)) {
      if (verifySuperAdminPassword(password)) {
        handleGuestSignIn({
          name: 'Executive Head',
          role: 'Administrator',
          departmentId: 'dept-exec',
          email: emailClean,
        });
        return;
      } else {
        setAuthError('Incorrect Administrator password. (Default: admin)');
        return;
      }
    }

    // 2. Check registered Admins/Members
    const admins = getAdmins();
    const foundAdmin = admins.find((a) => a.email.toLowerCase() === emailClean);
    if (foundAdmin) {
      if (foundAdmin.password && foundAdmin.password !== password) {
        setAuthError('Incorrect password for this member account.');
        return;
      }
      handleGuestSignIn({
        name: foundAdmin.name,
        role:
          foundAdmin.role === 'superadmin'
            ? 'Administrator'
            : foundAdmin.role === 'admin'
            ? 'Council Administrator'
            : foundAdmin.role === 'department_head'
            ? 'Department Head'
            : 'Member',
        departmentId:
          foundAdmin.departmentScope === 'all'
            ? 'dept-exec'
            : foundAdmin.departmentScope,
        email: foundAdmin.email,
      });
      return;
    }

    // 3. Dynamic email/password allowed by portal access policy
    const access = checkPortalAccess(emailClean, false);
    if (!access.allowed) {
      setAuthError(access.reason || 'Access denied by administrator policy.');
      return;
    }

    // Verify whitelist password if whitelisted email
    const accessSettings = getAccessControlSettings();
    const isWhitelistedEmail = accessSettings.allowedEmails.map(e => e.toLowerCase()).includes(emailClean);
    if (isWhitelistedEmail) {
      const expectedWhitelistPass = (accessSettings.whitelistPasswords && accessSettings.whitelistPasswords[emailClean]) || 'council2026';
      if (password !== expectedWhitelistPass) {
        setAuthError('Incorrect password for whitelisted email. (Default: council2026)');
        return;
      }
    }

    handleGuestSignIn({
      name: emailClean
        .split('@')[0]
        .replace('.', ' ')
        .replace(/^./, (str) => str.toUpperCase()),
      role: 'Member',
      departmentId: 'dept-exec',
      email: emailClean,
    });
  };

  const handleGuestSignIn = (roleData?: {
    name: string;
    role: string;
    departmentId: string;
    email?: string;
  }) => {
    if (roleData) {
      setGuestProfile(roleData);
      try {
        localStorage.setItem('council_guest_profile', JSON.stringify(roleData));
      } catch {
        // ignore
      }
    }
    setIsSessionActive(true);
    try {
      localStorage.setItem('council_session_active', 'true');
    } catch {
      // ignore
    }
    setShowSignInModal(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setGuestProfile(null);
      setIsSessionActive(false);
      try {
        localStorage.removeItem('council_session_active');
        localStorage.removeItem('council_guest_profile');
      } catch {
        // ignore
      }
      setCurrentView('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const syncGoogleCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const gEvents = await listCalendarEvents();
      if (gEvents && gEvents.length > 0) {
        setEvents((prev) => {
          const nonGoogle = prev.filter((e) => !e.isGoogleSynced);
          return [...nonGoogle, ...gEvents];
        });
      }
      alert('Calendar successfully synchronized with Google Calendar.');
    } catch (e: any) {
      console.warn('Google Calendar sync notice:', e);
      alert('Google Calendar sync requires Google account sign-in. Your Council calendar is saved and active locally and in the cloud database.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleAddEvent = async (newEvent: Omit<CouncilEvent, 'id'>) => {
    const event: CouncilEvent = {
      ...newEvent,
      id: `ev-${Date.now()}`,
    };
    setEvents((prev) => [event, ...prev]);
    await saveEventToFirestore(event);

    if (user) {
      try {
        await createCalendarEvent({
          title: newEvent.title,
          description: newEvent.description,
          location: newEvent.location,
          startDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endDate: new Date().toISOString().split('T')[0],
          endTime: '11:00',
        });
      } catch (err) {
        console.warn('Could not post event to Google Calendar directly:', err);
      }
    }
  };

  const handleUpdateEvent = async (eventId: string, updatedData: any) => {
    let targetEvt: CouncilEvent | undefined;
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId) {
          targetEvt = {
            ...evt,
            title: updatedData.title,
            date: updatedData.startDate,
            time: `${updatedData.startTime} - ${updatedData.endTime}`,
            location: updatedData.location,
            department: updatedData.department,
            attendeesCount: updatedData.attendeesCount,
            description: updatedData.description,
          };
          return targetEvt;
        }
        return evt;
      })
    );
    if (targetEvt) {
      await saveEventToFirestore(targetEvt);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteEventFromFirestore(eventId);
    if (target?.googleCalendarEventId && user) {
      try {
        await deleteCalendarEvent(target.googleCalendarEventId);
      } catch (err) {
        console.warn('Could not delete Google Calendar event:', err);
      }
    }
  };

  const handleNavigate = (view: ViewType, data?: any) => {
    if (view === 'folder_view') {
      if (data && typeof data === 'object') {
        if (data.departmentId) setSelectedDepartmentId(data.departmentId);
        if (data.folderName) setSelectedFolderName(data.folderName);
      } else if (typeof data === 'string') {
        setSelectedDepartmentId(data);
      }
      setCurrentView('folder_view');
    } else if (view === 'mom_list') {
      if (typeof data === 'string') {
        setSelectedDepartmentId(data);
      }
      setSelectedFolderName('MoM');
      setCurrentView('folder_view');
    } else if (view === 'proposals_list') {
      if (typeof data === 'string') {
        setSelectedDepartmentId(data);
      }
      setSelectedFolderName('Proposal');
      setCurrentView('folder_view');
    } else if (view === 'department_hub') {
      if (typeof data === 'string') {
        setSelectedDepartmentId(data);
      }
      setCurrentView(view);
    } else if (view === 'document_detail') {
      if (typeof data === 'string') {
        setSelectedDocId(data);
      }
      setCurrentView('document_detail');
    } else if (view === 'admin_panel') {
      if (!userPermissions.isAdmin) {
        setAccessDeniedModal({
          isOpen: true,
          actionTitle: 'Admin Panel Restricted',
          reason: `The Admin Control Panel is reserved for designated administrators (${getSuperAdminEmail()}). Unauthorized members cannot access administration.`,
          requiredRole: 'Administrator',
        });
        return;
      }
      setCurrentView('admin_panel');
    } else if (view === 'drive_browser') {
      if (!user) {
        setShowSignInModal(true);
      } else {
        setShowDriveBrowser(true);
      }
    } else {
      setSelectedDepartmentId('');
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Management Actions
  const actor = {
    name: user?.displayName || guestProfile?.name || 'Administrator',
    email: currentEmail || getSuperAdminEmail(),
  };

  const checkViewer = () => {
    if (userPermissions.role === 'viewer') {
      alert('SC Preview is in read-only viewer mode and cannot edit or modify items.');
      return true;
    }
    return false;
  };

  const handleAddAdminAction = async (newAdmin: Omit<AdminUser, 'id' | 'addedAt'>) => {
    const res = addAdmin(newAdmin, actor);
    if (res.success && res.admin) {
      setAdminsState(getAdmins());
      setAuditLogsState(getAuditLogs());
      await saveAdminToFirestore(res.admin);
      await saveAuditLogToFirestore({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'ADD_ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        details: `Appointed ${res.admin.name} (${res.admin.email}) as ${res.admin.role}`,
        targetId: res.admin.id,
        targetName: res.admin.name,
      });
    }
    return res;
  };

  const handleUpdateAdminAction = async (adminId: string, updates: Partial<AdminUser>) => {
    const res = updateAdmin(adminId, updates, actor);
    if (res.success && res.admin) {
      setAdminsState(getAdmins());
      setAuditLogsState(getAuditLogs());
      await saveAdminToFirestore(res.admin);
      await saveAuditLogToFirestore({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'UPDATE_PERMISSIONS',
        actorName: actor.name,
        actorEmail: actor.email,
        details: `Updated permissions for ${res.admin.name} (${res.admin.email})`,
        targetId: res.admin.id,
        targetName: res.admin.name,
      });
    }
    return res;
  };

  const handleRemoveAdminAction = async (adminId: string) => {
    const res = removeAdmin(adminId, actor);
    if (res.success) {
      setAdminsState(getAdmins());
      setAuditLogsState(getAuditLogs());
      await deleteAdminFromFirestore(adminId);
      await saveAuditLogToFirestore({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'REMOVE_ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        details: `Revoked admin privileges from admin ID ${adminId}`,
        targetId: adminId,
      });
    }
    return res;
  };

  const handleUpdateSecuritySettingsAction = async (settings: Partial<SecuritySettings>) => {
    const updated = updateSecuritySettings(settings, actor);
    setSecuritySettingsState(updated);
    setAuditLogsState(getAuditLogs());
    await saveSecuritySettingsToFirestore(updated);
  };

  const handleCreateDepartmentAction = async (dept: Omit<Department, 'id' | 'memberCount' | 'activeFileCount'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      folders: dept.folders && dept.folders.length > 0 ? dept.folders : ['MoM', 'Proposal', 'General'],
      memberCount: 4,
      activeFileCount: 0,
    };
    setDepartments((prev) => {
      const updated = mergeDepartments(INITIAL_DEPARTMENTS, [...prev, newDept]);
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save departments:', e);
      }
      return updated;
    });
    await saveDepartmentToFirestore(newDept);
    logAuditEvent({
      action: 'CREATE_DEPARTMENT',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Created department: "${newDept.name}"`,
      targetId: newDept.id,
      targetName: newDept.name,
    });
    setAuditLogsState(getAuditLogs());
  };

  const handleUpdateDepartmentAction = async (deptId: string, updates: Partial<Department>) => {
    let updatedDept: Department | undefined;
    setDepartments((prev) => {
      const updated = prev.map((d) => {
        if (d.id === deptId) {
          updatedDept = { ...d, ...updates };
          return updatedDept;
        }
        return d;
      });
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save departments:', e);
      }
      return updated;
    });
    if (updatedDept) {
      await saveDepartmentToFirestore(updatedDept);
    }
    logAuditEvent({
      action: 'UPDATE_DEPARTMENT',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Updated department settings for "${deptId}"`,
      targetId: deptId,
    });
    setAuditLogsState(getAuditLogs());
  };

  const handleDeleteDepartmentAction = async (deptId: string) => {
    const baseDeptIds = ['dept-exec', 'dept-house', 'dept-prefect', 'dept-welfare', 'dept-via', 'dept-media', 'dept-tech'];
    if (baseDeptIds.includes(deptId)) {
      alert('Core student council departments cannot be deleted.');
      return;
    }
    const dept = departments.find((d) => d.id === deptId);
    setDepartments((prev) => {
      const updated = prev.filter((d) => d.id !== deptId);
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save departments:', e);
      }
      return updated;
    });
    await deleteDepartmentFromFirestore(deptId);
    logAuditEvent({
      action: 'DELETE_DEPARTMENT',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Deleted department "${dept?.name || deptId}"`,
      targetId: deptId,
      targetName: dept?.name,
    });
    setAuditLogsState(getAuditLogs());
  };

  const handleApproveDocument = async (docId: string, comment?: string) => {
    if (userPermissions.role === 'viewer') {
      alert('SC Viewers have view-only access and cannot approve proposals.');
      return;
    }
    let updatedDocToSave: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const updatedComments = comment
            ? [
                ...(d.comments || []),
                {
                  id: `c-${Date.now()}`,
                  author: actor.name,
                  role: 'Executive',
                  timeAgo: 'Just now',
                  avatarUrl: user?.photoURL || undefined,
                  initials: actor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(),
                  text: `[Approved] ${comment}`,
                },
              ]
            : d.comments;
          updatedDocToSave = {
            ...d,
            status: 'APPROVED',
            comments: updatedComments,
          };
          return updatedDocToSave;
        }
        return d;
      })
    );
    if (updatedDocToSave) {
      await saveDocumentToFirestore(updatedDocToSave);
    }
  };

  const handleRejectDocument = async (docId: string, reason?: string) => {
    if (userPermissions.role === 'viewer') {
      alert('SC Viewers have view-only access and cannot reject proposals.');
      return;
    }
    let updatedDocToSave: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const updatedComments = reason
            ? [
                ...(d.comments || []),
                {
                  id: `c-${Date.now()}`,
                  author: actor.name,
                  role: 'Executive',
                  timeAgo: 'Just now',
                  avatarUrl: user?.photoURL || undefined,
                  initials: actor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(),
                  text: `[Returned with Revision Request] ${reason}`,
                },
              ]
            : d.comments;
          updatedDocToSave = {
            ...d,
            status: 'REJECTED',
            comments: updatedComments,
          };
          return updatedDocToSave;
        }
        return d;
      })
    );
    if (updatedDocToSave) {
      await saveDocumentToFirestore(updatedDocToSave);
    }
  };

  const handleAddComment = async (docId: string, commentText: string) => {
    let updatedDocToSave: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          updatedDocToSave = {
            ...d,
            comments: [
              ...(d.comments || []),
              {
                id: `c-${Date.now()}`,
                author: user?.displayName || guestProfile?.name || 'Council Member',
                role: 'Executive Committee',
                timeAgo: 'Just now',
                avatarUrl: user?.photoURL || undefined,
                initials: (user?.displayName || guestProfile?.name || 'Council Member')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
                text: commentText,
              },
            ],
          };
          return updatedDocToSave;
        }
        return d;
      })
    );
    if (updatedDocToSave) {
      await saveDocumentToFirestore(updatedDocToSave);
    }
  };

  const handleAddReply = async (docId: string, parentCommentId: string, replyText: string) => {
    let updatedDocToSave: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const updatedComments = (d.comments || []).map((c) => {
            if (c.id === parentCommentId) {
              const newReply: DocumentComment = {
                id: `r-${Date.now()}`,
                author: user?.displayName || guestProfile?.name || 'Council Member',
                role: 'Executive Committee',
                timeAgo: 'Just now',
                avatarUrl: user?.photoURL || undefined,
                initials: (user?.displayName || guestProfile?.name || 'Council Member')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
                text: replyText,
              };
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          });
          updatedDocToSave = {
            ...d,
            comments: updatedComments,
          };
          return updatedDocToSave;
        }
        return d;
      })
    );
    if (updatedDocToSave) {
      await saveDocumentToFirestore(updatedDocToSave);
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    let targetTask: CouncilTask | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          targetTask = {
            ...t,
            status: t.status === 'Completed' ? 'Pending' : 'Completed',
          };
          return targetTask;
        }
        return t;
      })
    );
    if (targetTask) {
      await saveTaskToFirestore(targetTask);
    }
  };

  const handleAddTask = async (newTask: Omit<CouncilTask, 'id'>) => {
    const task: CouncilTask = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [task, ...prev]);
    await saveTaskToFirestore(task);
  };

  const handleUpdateTask = async (updatedTask: CouncilTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    await saveTaskToFirestore(updatedTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTaskFromFirestore(taskId);
  };

  const handleCreateFolder = async (deptId: string, folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    if (userPermissions.role === 'viewer' || !userPermissions.canCreateFolders) {
      alert('SC Viewers have view-only access and cannot create folders.');
      return;
    }
    let updatedDeptToSave: Department | undefined;
    setDepartments((prev) => {
      const base = mergeDepartments(INITIAL_DEPARTMENTS, prev);
      const updated = base.map((d) => {
        if (d.id === deptId) {
          const currentFolders = Array.isArray(d.folders) ? d.folders : [];
          if (!currentFolders.includes(trimmed)) {
            updatedDeptToSave = {
              ...d,
              folders: [...currentFolders, trimmed],
            };
            return updatedDeptToSave;
          }
          return d;
        }
        return d;
      });
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save updated departments:', e);
      }
      return updated;
    });
    if (updatedDeptToSave) {
      await saveDepartmentToFirestore(updatedDeptToSave);
    }
    setSelectedDepartmentId(deptId);
    setSelectedFolderName(trimmed);
    setCurrentView('folder_view');
  };

  const handleRenameFolder = async (deptId: string, oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;
    let updatedDeptToSave: Department | undefined;
    setDepartments((prev) => {
      const base = mergeDepartments(INITIAL_DEPARTMENTS, prev);
      const updated = base.map((d) => {
        if (d.id === deptId) {
          const currentFolders = Array.isArray(d.folders) ? d.folders : [];
          updatedDeptToSave = {
            ...d,
            folders: currentFolders.map((f) => (f === oldName ? trimmedNew : f)),
          };
          return updatedDeptToSave;
        }
        return d;
      });
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save updated departments:', e);
      }
      return updated;
    });
    if (updatedDeptToSave) {
      await saveDepartmentToFirestore(updatedDeptToSave);
    }

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.departmentId === deptId && doc.folder === oldName) {
          return { ...doc, folder: trimmedNew };
        }
        return doc;
      })
    );

    if (selectedFolderName === oldName) {
      setSelectedFolderName(trimmedNew);
    }
  };

  // GUARDED FOLDER DELETION
  const handleDeleteFolder = async (deptId: string, folderName: string, deleteFiles = false) => {
    if (!userPermissions.canDeleteFolders) {
      setAccessDeniedModal({
        isOpen: true,
        actionTitle: 'Folder Deletion Blocked',
        reason: securitySettings.emergencyDeletionLock
          ? `Emergency Deletion Lock is active across the council repository. Only Administrator (${getSuperAdminEmail()}) can bypass this lock.`
          : 'You do not have administrative permission to delete folder tabs. Random and unverified users cannot delete folders without admin consent.',
        requiredRole: 'Administrator',
      });
      return;
    }

    let remainingFirstFolder = '';
    let updatedDeptToSave: Department | undefined;
    setDepartments((prev) => {
      const base = mergeDepartments(INITIAL_DEPARTMENTS, prev);
      const updated = base.map((d) => {
        if (d.id === deptId) {
          const filteredFolders = (Array.isArray(d.folders) ? d.folders : []).filter((f) => f !== folderName);
          if (filteredFolders.length > 0) {
            remainingFirstFolder = filteredFolders[0];
          }
          updatedDeptToSave = {
            ...d,
            folders: filteredFolders,
          };
          return updatedDeptToSave;
        }
        return d;
      });
      try {
        localStorage.setItem('council_departments_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save updated departments:', e);
      }
      return updated;
    });

    if (updatedDeptToSave) {
      await saveDepartmentToFirestore(updatedDeptToSave);
    }

    if (deleteFiles) {
      const toDelete = documents.filter((doc) => doc.departmentId === deptId && doc.folder === folderName);
      setDocuments((prev) =>
        prev.filter((doc) => !(doc.departmentId === deptId && doc.folder === folderName))
      );
      for (const d of toDelete) {
        await deleteDocumentFromFirestore(d.id);
      }
    } else {
      const toUpdate: CouncilDocument[] = [];
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.departmentId === deptId && doc.folder === folderName) {
            const { folder, ...rest } = doc;
            const updated = { ...rest };
            toUpdate.push(updated as CouncilDocument);
            return updated;
          }
          return doc;
        })
      );
      for (const d of toUpdate) {
        await saveDocumentToFirestore(d);
      }
    }

    logAuditEvent({
      action: 'DELETE_FOLDER',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Deleted folder tab "${folderName}" from department (${deptId}). Delete files: ${deleteFiles ? 'YES' : 'NO'}`,
      targetId: `${deptId}/${folderName}`,
    });
    setAuditLogsState(getAuditLogs());

    if (currentView === 'folder_view' && selectedDepartmentId === deptId && selectedFolderName === folderName) {
      if (remainingFirstFolder) {
        setSelectedFolderName(remainingFirstFolder);
      } else {
        setCurrentView('department_hub');
      }
    }
  };

  const handleMoveDocument = async (docId: string, targetFolderName: string) => {
    let movedDoc: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          movedDoc = { ...doc, folder: targetFolderName };
          return movedDoc;
        }
        return doc;
      })
    );
    if (movedDoc) {
      await saveDocumentToFirestore(movedDoc);
    }
  };

  const handleMoveMultipleDocuments = async (docIds: string[], targetFolderName: string) => {
    const movedDocs: CouncilDocument[] = [];
    setDocuments((prev) =>
      prev.map((doc) => {
        if (docIds.includes(doc.id)) {
          const updated = { ...doc, folder: targetFolderName };
          movedDocs.push(updated);
          return updated;
        }
        return doc;
      })
    );
    for (const d of movedDocs) {
      await saveDocumentToFirestore(d);
    }
  };

  // GUARDED DOCUMENT DELETION
  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    
    // Check if user is the document author/owner
    const isDocOwner = doc && (
      (user?.displayName && doc.uploadedBy?.name === user.displayName) ||
      (guestProfile?.name && doc.uploadedBy?.name?.toLowerCase() === guestProfile.name.toLowerCase())
    );

    if (!userPermissions.canDeleteFiles && !userPermissions.isSuperAdmin && !isDocOwner) {
      setAccessDeniedModal({
        isOpen: true,
        actionTitle: 'File Deletion Blocked',
        reason: securitySettings.emergencyDeletionLock
          ? 'Emergency Deletion Lock is active. Files cannot be removed without Administrator override.'
          : 'You do not have permission to delete files from the council repository. File deletion is restricted to authorized administrators.',
        requiredRole: 'Administrator',
      });
      return;
    }

    const filteredDocs = documents.filter((d) => d.id !== docId);
    setDocuments(filteredDocs);
    try {
      localStorage.setItem('council_documents_v1', JSON.stringify(filteredDocs));
    } catch {
      // ignore
    }

    await deleteDocumentFromFirestore(docId);

    const logEntry: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE_FILE',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Deleted file "${doc?.name || docId}" (${doc?.filename || 'file'}) from ${doc?.departmentName || 'department'}`,
      targetId: docId,
      targetName: doc?.name,
    };
    logAuditEvent(logEntry);
    await saveAuditLogToFirestore(logEntry);
    setAuditLogsState(getAuditLogs());
  };

  const handleDeleteMultipleDocuments = async (docIds: string[]) => {
    if (!userPermissions.canDeleteFiles && !userPermissions.isSuperAdmin) {
      setAccessDeniedModal({
        isOpen: true,
        actionTitle: 'Bulk File Deletion Blocked',
        reason: 'Bulk deletion is restricted to authorized administrators.',
        requiredRole: 'Administrator',
      });
      return;
    }

    const filteredDocs = documents.filter((d) => !docIds.includes(d.id));
    setDocuments(filteredDocs);
    try {
      localStorage.setItem('council_documents_v1', JSON.stringify(filteredDocs));
    } catch {
      // ignore
    }

    for (const id of docIds) {
      await deleteDocumentFromFirestore(id);
    }

    const logEntry: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE_FILE',
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Bulk deleted ${docIds.length} files from repository`,
      targetId: docIds.join(','),
    };
    logAuditEvent(logEntry);
    await saveAuditLogToFirestore(logEntry);
    setAuditLogsState(getAuditLogs());
  };

  const handleToggleStarDocument = async (docId: string) => {
    let toggled: CouncilDocument | undefined;
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          toggled = { ...d, isStarred: !d.isStarred };
          return toggled;
        }
        return d;
      })
    );
    if (toggled) {
      await saveDocumentToFirestore(toggled);
    }
  };

  const handleDocumentCreated = async (newDoc: CouncilDocument) => {
    if (userPermissions.role === 'viewer' || !userPermissions.canUploadFiles) {
      alert('SC Viewers have view-only access and cannot upload files.');
      return;
    }
    
    // Update local state and persistent storage immediately
    setDocuments((prev) => {
      let updated: CouncilDocument[];
      if (prev.some((d) => d.id === newDoc.id)) {
        updated = prev.map((d) => (d.id === newDoc.id ? newDoc : d));
      } else {
        updated = [newDoc, ...prev];
      }
      try {
        localStorage.setItem('council_documents_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Save to Firestore for cross-device synchronization
    try {
      await saveDocumentToFirestore(newDoc);
    } catch (err) {
      console.warn('Firestore sync warning for new document:', err);
    }

    setSelectedDocId(newDoc.id);
    setCurrentView('document_detail');
  };

  // Selected Department & Document
  const currentDept =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0];
  const currentDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0];

  // Counts
  const pendingApprovalsCount = documents.filter(
    (d) => d.status === 'PENDING' || d.status === 'PENDING REVIEW'
  ).length;
  const tasksDueCount = tasks.filter(
    (t) => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue'
  ).length;

  // Search filtered docs if query is active
  const searchFilteredDocs = searchQuery
    ? documents.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  // If not logged in and no active session, render the full dedicated Sign In Screen instantly
  if (!user && !isSessionActive) {
    return (
      <SignInScreen
        onEmailSignIn={handleEmailSignIn}
        onGuestSignIn={handleGuestSignIn}
        isLoggingIn={isLoggingIn}
        errorMessage={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1c1c18] font-sans antialiased flex flex-col selection:bg-[#006054] selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        guestProfile={guestProfile}
        permissions={userPermissions}
        isLoggingIn={isLoggingIn}
        onLogin={() => setShowSignInModal(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onOpenNewModal={() => setShowGlobalNewMenu(true)}
        onNavigate={handleNavigate}
        calendarSynced={!!user}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-[260px] bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <Sidebar
              currentView={currentView}
              selectedDepartmentId={selectedDepartmentId}
              selectedFolderName={selectedFolderName}
              departments={departments}
              permissions={userPermissions}
              onNavigate={(view, data) => {
                handleNavigate(view, data);
                setMobileMenuOpen(false);
              }}
              onOpenNewModal={() => {
                setShowGlobalNewMenu(true);
                setMobileMenuOpen(false);
              }}
              onOpenNewFolderModal={(deptId) => {
                setTargetFolderDeptId(deptId || selectedDepartmentId || 'dept-exec');
                setShowNewFolderModal(true);
                setMobileMenuOpen(false);
              }}
              onDeleteFolder={handleDeleteFolder}
              pendingApprovalsCount={pendingApprovalsCount}
              tasksDueCount={tasksDueCount}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 pt-16">
        {/* Desktop Left Sidebar */}
        <div className="hidden md:block w-[240px] shrink-0">
          <Sidebar
            currentView={currentView}
            selectedDepartmentId={selectedDepartmentId}
            selectedFolderName={selectedFolderName}
            departments={departments}
            permissions={userPermissions}
            onNavigate={handleNavigate}
            onOpenNewModal={() => setShowGlobalNewMenu(true)}
            onOpenNewFolderModal={(deptId) => {
              setTargetFolderDeptId(deptId || selectedDepartmentId || 'dept-exec');
              setShowNewFolderModal(true);
            }}
            onDeleteFolder={handleDeleteFolder}
            pendingApprovalsCount={pendingApprovalsCount}
            tasksDueCount={tasksDueCount}
          />
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-6">
          {searchQuery ? (
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1c1c18]">
                  Search Results for "{searchQuery}"
                </h2>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-[#006054] hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchFilteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSearchQuery('');
                      handleNavigate('document_detail', doc.id);
                    }}
                    className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs hover:border-[#006054]/40 cursor-pointer"
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold uppercase tracking-wider block w-fit mb-2">
                      {doc.departmentName}
                    </span>
                    <h3 className="font-bold text-sm text-[#1c1c18] mb-1 truncate">{doc.name}</h3>
                    <p className="text-xs text-[#6e7976]">{doc.filename} • {doc.uploadDate}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {currentView === 'home' && (
                <HomeView
                  user={user}
                  guestProfile={guestProfile}
                  documents={documents}
                  pendingCount={pendingApprovalsCount}
                  tasksCount={tasksDueCount}
                  eventsCount={events.length}
                  recentUploadsCount={documents.length}
                  onNavigate={handleNavigate}
                  onOpenNewModal={() => setShowGlobalNewMenu(true)}
                />
              )}

              {currentView === 'department_hub' && (
                <DepartmentHubView
                  department={currentDept}
                  documents={documents}
                  onNavigate={handleNavigate}
                  onOpenUploadModal={() => setShowUploadModal(true)}
                  onOpenNewFolderModal={() => {
                    setTargetFolderDeptId(currentDept.id);
                    setShowNewFolderModal(true);
                  }}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteDocument={handleDeleteDocument}
                  onUpdateDepartment={handleUpdateDepartmentAction}
                  canEditDepartment={userPermissions.canManageDepartments || userPermissions.isSuperAdmin}
                />
              )}

              {currentView === 'folder_view' && (
                <FolderView
                  department={currentDept}
                  folderName={selectedFolderName}
                  departments={departments}
                  documents={documents}
                  onNavigate={handleNavigate}
                  onOpenUploadModal={() => {
                    setUploadDocType(selectedFolderName === 'MoM' ? 'MoM' : 'Proposal');
                    setUploadFolder(selectedFolderName);
                    setShowUploadModal(true);
                  }}
                  onOpenNewFolderModal={() => {
                    setTargetFolderDeptId(currentDept.id);
                    setShowNewFolderModal(true);
                  }}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveDocument={handleMoveDocument}
                  onMoveMultipleDocuments={handleMoveMultipleDocuments}
                  onDeleteDocument={handleDeleteDocument}
                  onDeleteMultipleDocuments={handleDeleteMultipleDocuments}
                  onToggleStarDocument={handleToggleStarDocument}
                />
              )}

              {currentView === 'mom_list' && (
                <MoMListView
                  department={currentDept}
                  documents={documents}
                  onNavigate={handleNavigate}
                  onOpenUploadModal={() => {
                    setUploadDocType('MoM');
                    setUploadFolder('MoM');
                    setShowUploadModal(true);
                  }}
                />
              )}

              {currentView === 'proposals_list' && (
                <ProposalsListView
                  department={currentDept}
                  documents={documents}
                  onNavigate={handleNavigate}
                  onOpenUploadModal={() => {
                    setUploadDocType('Proposal');
                    setUploadFolder('Proposal');
                    setShowUploadModal(true);
                  }}
                />
              )}

              {currentView === 'document_detail' && (
                <DocumentDetailView
                  document={currentDoc}
                  isViewer={userPermissions.role === 'viewer'}
                  onNavigate={handleNavigate}
                  onApprove={handleApproveDocument}
                  onReject={handleRejectDocument}
                  onAddComment={handleAddComment}
                  onAddReply={handleAddReply}
                  onDeleteDocument={handleDeleteDocument}
                  onOpenInDrive={() => setShowDriveBrowser(true)}
                />
              )}

              {currentView === 'calendar' && (
                <CalendarView
                  events={events}
                  user={user}
                  isViewer={userPermissions.role === 'viewer'}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onSyncGoogleCalendar={syncGoogleCalendar}
                  isLoading={isSyncingCalendar}
                />
              )}

              {currentView === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  isViewer={userPermissions.role === 'viewer'}
                  onToggleTaskStatus={handleToggleTaskStatus}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {currentView === 'approvals' && (
                <ApprovalsView
                  documents={documents}
                  isViewer={userPermissions.role === 'viewer'}
                  onNavigate={handleNavigate}
                  onApprove={handleApproveDocument}
                  onReject={handleRejectDocument}
                />
              )}

              {currentView === 'admin_panel' && (
                <AdminPanelView
                  currentUserEmail={currentEmail}
                  permissions={userPermissions}
                  admins={admins}
                  departments={departments}
                  auditLogs={auditLogs}
                  securitySettings={securitySettings}
                  onAddAdmin={handleAddAdminAction}
                  onUpdateAdmin={handleUpdateAdminAction}
                  onRemoveAdmin={handleRemoveAdminAction}
                  onCreateDepartment={handleCreateDepartmentAction}
                  onUpdateDepartment={handleUpdateDepartmentAction}
                  onDeleteDepartment={handleDeleteDepartmentAction}
                  onUpdateSecuritySettings={handleUpdateSecuritySettingsAction}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  user={user}
                  guestProfile={guestProfile}
                  onLogin={() => setShowSignInModal(true)}
                  onLogout={handleLogout}
                  isLoggingIn={isLoggingIn}
                />
              )}

              {currentView === 'help' && <HelpView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={(v) => handleNavigate(v)}
        pendingApprovalsCount={pendingApprovalsCount}
        tasksDueCount={tasksDueCount}
      />

      {/* Global "+ New" Action Menu Modal */}
      {showGlobalNewMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#bec9c5]/50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e2db]">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18]">
                Create or Upload
              </h3>
              <button
                onClick={() => setShowGlobalNewMenu(false)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setShowGlobalNewMenu(false);
                  setShowUploadModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#e5e2db] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#006054]/10 text-[#006054] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </div>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">Upload Document / Proposal</span>
                  <span className="text-[#6e7976]">Submit a PDF, DOCX, or Sheet</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowGlobalNewMenu(false);
                  handleNavigate('calendar');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#e5e2db] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#fed65b]/40 text-[#745c00] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">event</span>
                </div>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">Schedule Council Event</span>
                  <span className="text-[#6e7976]">Add session to Google Calendar</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowGlobalNewMenu(false);
                  handleNavigate('tasks');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#e5e2db] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add_task</span>
                </div>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">Assign Committee Task</span>
                  <span className="text-[#6e7976]">Set deadlines and duty roster</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowGlobalNewMenu(false);
                  setTargetFolderDeptId(selectedDepartmentId || 'dept-exec');
                  setShowNewFolderModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#e5e2db] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#745c00] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
                </div>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">Create Department Folder</span>
                  <span className="text-[#6e7976]">Add a new folder category</span>
                </div>
              </button>

              {userPermissions.isAdmin && (
                <button
                  onClick={() => {
                    setShowGlobalNewMenu(false);
                    handleNavigate('admin_panel');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#006054]/10 hover:bg-[#006054]/20 border border-[#006054]/30 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#006054] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#006054] block text-sm">Admin Control Panel</span>
                    <span className="text-[#5D4037]">Manage admins, departments & permissions</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setShowGlobalNewMenu(false);
                  if (!user) setShowSignInModal(true);
                  else setShowDriveBrowser(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#f0eee7] border border-[#e5e2db] transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#9ff2e1]/30 text-[#006054] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">cloud</span>
                </div>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">Open Google Drive Explorer</span>
                  <span className="text-[#6e7976]">Browse all Workspace files</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Denied Reusable Guard Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedModal.isOpen}
        onClose={() => setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }))}
        actionTitle={accessDeniedModal.actionTitle}
        reason={accessDeniedModal.reason}
        requiredRole={accessDeniedModal.requiredRole}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        departments={departments}
        user={user}
        guestProfile={guestProfile}
        onDocumentCreated={handleDocumentCreated}
        defaultDepartmentId={selectedDepartmentId}
        defaultType={uploadDocType}
        defaultFolder={uploadFolder}
      />

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        department={departments.find((d) => d.id === targetFolderDeptId) || null}
        departments={departments}
        onCreateFolder={handleCreateFolder}
      />

      {/* Google Drive Explorer Modal */}
      <GoogleDriveBrowserModal
        isOpen={showDriveBrowser}
        onClose={() => setShowDriveBrowser(false)}
        onImportDocument={handleDocumentCreated}
      />

      {/* Google Workspace Sign-In Prompt Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
      />

      {/* User Instructions Modal */}
      <UserInstructionsModal
        isOpen={showUserInstructions}
        onClose={() => setShowUserInstructions(false)}
      />

      {/* Floating User Instructions Button Bottom Right */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
        <button
          id="user-instructions-floating-btn"
          onClick={() => setShowUserInstructions(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-full shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
          title="Open User Instructions & Guide"
          aria-label="User Instructions"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
            menu_book
          </span>
          <span className="text-xs font-bold font-['Plus_Jakarta_Sans'] tracking-wide">
            Instructions
          </span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'department_hub') {
            setMobileMenuOpen(true);
          } else {
            handleNavigate(view);
          }
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        tasksDueCount={tasksDueCount}
      />
    </div>
  );
}
