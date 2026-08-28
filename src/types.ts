export type ViewType = 
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'approvals'
  | 'department_hub'
  | 'folder_view'
  | 'mom_list'
  | 'proposals_list'
  | 'document_detail'
  | 'drive_browser'
  | 'settings'
  | 'help'
  | 'admin_panel';

export type UserRole = 'superadmin' | 'admin' | 'department_head' | 'member' | 'viewer';

export interface UserPermissions {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canDeleteFiles: boolean;
  canDeleteFolders: boolean;
  canManageDepartments: boolean;
  canApproveDocs: boolean;
  canCreateTasks: boolean;
  canCreateEvents: boolean;
  canUploadFiles: boolean;
  canCreateFolders: boolean;
  role: UserRole;
  departmentScope?: string; // 'all' or specific departmentId
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  departmentScope: string; // 'all' or departmentId
  password?: string;
  canDeleteFiles: boolean;
  canDeleteFolders: boolean;
  canManageDepartments: boolean;
  canApproveDocs: boolean;
  addedAt: string;
  addedBy: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: 
    | 'DELETE_FILE' 
    | 'DELETE_FOLDER' 
    | 'DELETE_DEPARTMENT' 
    | 'CREATE_DEPARTMENT' 
    | 'UPDATE_DEPARTMENT' 
    | 'ADD_ADMIN' 
    | 'REMOVE_ADMIN' 
    | 'UPDATE_PERMISSIONS' 
    | 'SECURITY_TOGGLE'
    | 'UPDATE_SUPER_ADMIN_EMAIL'
    | 'UPDATE_SUPER_ADMIN_PASSWORD'
    | 'ACCESS_GATE_MODE_CHANGE'
    | 'WHITELIST_ADD'
    | 'WHITELIST_REMOVE'
    | 'BLOCK_USER'
    | 'UNBLOCK_USER'
    | 'TERMINATE_SESSION';
  actorName: string;
  actorEmail: string;
  details: string;
  targetId?: string;
  targetName?: string;
}

export interface AccessControlSettings {
  portalMode: 'open' | 'whitelist_only' | 'superadmin_only';
  allowGuestLogins: boolean;
  allowedEmails: string[];
  allowedDomains: string[];
  blockedEmails: string[];
  whitelistPasswords?: Record<string, string>;
}

export interface UserSessionRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string;
  isGuest: boolean;
  loginTime: string;
  lastActive: string;
  status: 'active' | 'terminated' | 'blocked';
}

export interface SecuritySettings {
  emergencyDeletionLock: boolean; // if true, only superadmin can delete anything
  requireApprovalForBulkDelete: boolean;
  allowGuestUploads: boolean;
  protectDefaultFolders: boolean;
}

export type DocumentStatus = 'PENDING' | 'PENDING REVIEW' | 'APPROVED' | 'DRAFT' | 'OVERDUE' | 'REJECTED';

export type FileFormat = 'pdf' | 'docx' | 'xlsx' | 'png' | 'txt' | 'gdoc' | 'gsheet' | 'gslides';

export interface CouncilDocument {
  id: string;
  name: string;
  filename: string;
  format: FileFormat;
  departmentId: string;
  departmentName: string;
  folder?: string;
  type: 'Proposal' | 'MoM' | 'Report' | 'Guidelines' | 'Notes' | 'Poster' | 'Sheet';
  uploadedBy: {
    name: string;
    initials: string;
    avatarUrl?: string;
    role?: string;
  };
  uploadDate: string;
  fileSize: string;
  status: DocumentStatus;
  isStarred?: boolean;
  driveFileId?: string;
  driveWebViewLink?: string;
  fileDataUrl?: string;
  hasCloudBlob?: boolean;
  chunkCount?: number;
  content?: {
    title: string;
    subtitle: string;
    description: string;
    sections: {
      title: string;
      body: string;
      images?: {
        url: string;
        alt: string;
      }[];
      table?: {
        headers: string[];
        rows: { category: string; cost: string }[];
        total?: string;
      };
    }[];
  };
  comments?: DocumentComment[];
}

export interface DocumentComment {
  id: string;
  author: string;
  role: string;
  timeAgo: string;
  avatarUrl?: string;
  initials: string;
  text: string;
  replies?: DocumentComment[];
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  memberCount: number;
  activeFileCount: number;
  folders: string[];
  badgeImage?: string;
}

export interface CouncilTask {
  id: string;
  title: string;
  department: string;
  assignee: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  dueDate: string;
  dueLabel: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  description?: string;
}

export interface CouncilEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  department: string;
  attendeesCount: number;
  googleCalendarEventId?: string;
  isGoogleSynced?: boolean;
  description?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
  owners?: { displayName: string }[];
}
