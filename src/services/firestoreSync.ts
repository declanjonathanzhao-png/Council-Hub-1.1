import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { auth } from './firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  CouncilDocument, 
  CouncilTask, 
  CouncilEvent, 
  Department, 
  AdminUser, 
  SecuritySettings, 
  AccessControlSettings, 
  AdminAuditLog 
} from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

function getDbInstance() {
  try {
    const settings = {
      experimentalAutoDetectLongPolling: true,
    };
    return databaseId 
      ? initializeFirestore(app, settings, databaseId)
      : initializeFirestore(app, settings);
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

export const db = getDbInstance();

// Test server connectivity on startup as per skill instructions
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'system_settings', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / network check:', error.message);
    }
  }
}
testFirestoreConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation:', JSON.stringify(errInfo));
}

// Deeply removes undefined fields to comply with Firestore serialization constraints
export function cleanFirestorePayload<T = any>(obj: any): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestorePayload(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestorePayload(value);
    }
  }
  return cleaned as T;
}

// -------------------------------------------------------------
// DOCUMENTS & CLOUD FILE CHUNKING SYNC
// Allows storing files of any size seamlessly in Firestore
// so that all connected devices and members can download & view files
// -------------------------------------------------------------
export const fileDataMemoryCache = new Map<string, string>();
const CHUNK_SIZE = 250000; // ~180KB per chunk, fast and safely below Firestore limits

export async function saveDocumentToFirestore(docItem: CouncilDocument) {
  try {
    const rawPayload: any = { ...docItem };
    const rawFileDataUrl = docItem.fileDataUrl;

    if (rawFileDataUrl && typeof rawFileDataUrl === 'string' && rawFileDataUrl.length > 0) {
      // 1. Cache immediately in memory
      fileDataMemoryCache.set(docItem.id, rawFileDataUrl);

      // 2. Slice into lightweight Firestore chunks
      const totalLen = rawFileDataUrl.length;
      const totalChunks = Math.ceil(totalLen / CHUNK_SIZE);
      const chunkPromises: Promise<any>[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalLen);
        const chunkData = rawFileDataUrl.substring(start, end);

        const chunkRef = doc(db, 'documents', docItem.id, 'chunks', `chunk_${i}`);
        chunkPromises.push(
          setDoc(chunkRef, {
            index: i,
            totalChunks,
            data: chunkData,
            updatedAt: Date.now(),
          })
        );
      }

      await Promise.all(chunkPromises);

      rawPayload.hasCloudBlob = true;
      rawPayload.chunkCount = totalChunks;

      // Keep root doc compact (< 250KB) to prevent 1MB Firestore document limit errors
      if (totalLen > 250000) {
        delete rawPayload.fileDataUrl;
      }
    }

    const payload = cleanFirestorePayload(rawPayload);
    await setDoc(doc(db, 'documents', docItem.id), payload, { merge: true });
    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, `documents/${docItem.id}`);
    throw error;
  }
}

export async function loadDocumentFileData(
  docId: string,
  onProgress?: (progressPercent: number) => void
): Promise<string | null> {
  // 1. Return from memory cache if available
  if (fileDataMemoryCache.has(docId)) {
    return fileDataMemoryCache.get(docId)!;
  }

  try {
    if (onProgress) onProgress(20);

    // 2. Fetch chunks from Firestore subcollection
    const chunksColl = collection(db, 'documents', docId, 'chunks');
    const chunksSnap = await getDocs(chunksColl);

    if (!chunksSnap.empty) {
      if (onProgress) onProgress(60);
      const rawChunks: { index: number; data: string; totalChunks: number }[] = [];
      chunksSnap.forEach((c) => {
        rawChunks.push(c.data() as any);
      });

      rawChunks.sort((a, b) => a.index - b.index);
      const assembled = rawChunks.map((c) => c.data).join('');

      if (onProgress) onProgress(100);
      fileDataMemoryCache.set(docId, assembled);
      return assembled;
    }

    // 3. Fallback check on root document
    const rootSnap = await getDoc(doc(db, 'documents', docId));
    if (rootSnap.exists()) {
      const data = rootSnap.data();
      if (data?.fileDataUrl) {
        if (onProgress) onProgress(100);
        fileDataMemoryCache.set(docId, data.fileDataUrl);
        return data.fileDataUrl;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `documents/${docId}/chunks`);
  }

  return null;
}

export async function deleteDocumentFromFirestore(docId: string) {
  try {
    // 1. Delete all chunks in subcollection
    try {
      const chunksColl = collection(db, 'documents', docId, 'chunks');
      const chunksSnap = await getDocs(chunksColl);
      const chunkDeletes = chunksSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(chunkDeletes);
    } catch (err) {
      console.warn('Chunk delete cleanup warning:', err);
    }

    // 2. Delete root doc
    await deleteDoc(doc(db, 'documents', docId));
    fileDataMemoryCache.delete(docId);
    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${docId}`);
    throw error;
  }
}

export function subscribeToDocuments(
  callback: (docs: CouncilDocument[]) => void, 
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'documents'),
    (snapshot) => {
      const items: CouncilDocument[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as CouncilDocument;
        // If we have cached full file data in memory for this doc, attach it
        if (!item.fileDataUrl && fileDataMemoryCache.has(item.id)) {
          item.fileDataUrl = fileDataMemoryCache.get(item.id);
        }
        items.push(item);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// TASKS SYNC
// -------------------------------------------------------------
export async function saveTaskToFirestore(taskItem: CouncilTask) {
  try {
    await setDoc(doc(db, 'tasks', taskItem.id), cleanFirestorePayload(taskItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tasks/${taskItem.id}`);
  }
}

export async function deleteTaskFromFirestore(taskId: string) {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
}

export function subscribeToTasks(
  callback: (tasks: CouncilTask[]) => void, 
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'tasks'),
    (snapshot) => {
      const items: CouncilTask[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as CouncilTask);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// EVENTS SYNC
// -------------------------------------------------------------
export async function saveEventToFirestore(eventItem: CouncilEvent) {
  try {
    await setDoc(doc(db, 'events', eventItem.id), cleanFirestorePayload(eventItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventItem.id}`);
  }
}

export async function deleteEventFromFirestore(eventId: string) {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
}

export function subscribeToEvents(
  callback: (events: CouncilEvent[]) => void, 
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'events'),
    (snapshot) => {
      const items: CouncilEvent[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as CouncilEvent);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// DEPARTMENTS SYNC & MERGE ENGINE
// Guarantees all main council departments never get deleted or lost
// -------------------------------------------------------------
export function mergeDepartments(baseDepts: Department[], remoteDepts: Department[]): Department[] {
  const deptMap = new Map<string, Department>();
  const baseMap = new Map<string, Department>();

  // 1. Seed with base departments (ensures all 7 core departments are always present with logos)
  baseDepts.forEach((d) => {
    baseMap.set(d.id, d);
    deptMap.set(d.id, {
      ...d,
      folders: [...(d.folders || [])],
    });
  });

  // 2. Overlay remote or saved departments
  if (Array.isArray(remoteDepts)) {
    remoteDepts.forEach((r) => {
      if (!r || !r.id) return;
      const existing = deptMap.get(r.id);
      const baseItem = baseMap.get(r.id);
      if (existing) {
        deptMap.set(r.id, {
          ...existing,
          ...r,
          // Always use base badgeImage for core departments if present, otherwise fallback
          badgeImage: baseItem?.badgeImage || r.badgeImage || existing.badgeImage,
          folders: Array.isArray(r.folders) ? r.folders : existing.folders,
        });
      } else {
        deptMap.set(r.id, {
          ...r,
          badgeImage: baseItem?.badgeImage || r.badgeImage,
          folders: Array.isArray(r.folders) ? r.folders : [],
        });
      }
    });
  }

  return Array.from(deptMap.values());
}

export async function saveDepartmentToFirestore(deptItem: Department) {
  try {
    const payload: Partial<Department> = {
      id: deptItem.id,
      name: deptItem.name,
      slug: deptItem.slug,
      iconName: deptItem.iconName,
      memberCount: deptItem.memberCount || 4,
      activeFileCount: deptItem.activeFileCount || 0,
      folders: deptItem.folders || [],
    };
    if (deptItem.badgeImage && typeof deptItem.badgeImage === 'string' && !deptItem.badgeImage.startsWith('data:')) {
      payload.badgeImage = deptItem.badgeImage;
    }
    await setDoc(doc(db, 'departments', deptItem.id), cleanFirestorePayload(payload), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `departments/${deptItem.id}`);
  }
}

export async function saveAllDepartmentsToFirestore(departmentsList: Department[]) {
  try {
    for (const d of departmentsList) {
      await saveDepartmentToFirestore(d);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'departments/bulk');
  }
}

export async function deleteDepartmentFromFirestore(deptId: string) {
  try {
    // Prevent deletion of base 7 departments in Firestore
    const baseDeptIds = ['dept-exec', 'dept-house', 'dept-prefect', 'dept-welfare', 'dept-via', 'dept-media', 'dept-tech'];
    if (baseDeptIds.includes(deptId)) {
      console.warn('Cannot delete core council department from Firestore:', deptId);
      return;
    }
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `departments/${deptId}`);
  }
}

export function subscribeToDepartments(
  callback: (departments: Department[]) => void, 
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'departments'),
    (snapshot) => {
      const items: Department[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Department);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'departments');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// ADMINS SYNC (Fixes Cross-Device / Cross-User Admin Permissions)
// -------------------------------------------------------------
export async function saveAdminToFirestore(adminUser: AdminUser) {
  try {
    await setDoc(doc(db, 'admins', adminUser.id), cleanFirestorePayload(adminUser));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${adminUser.id}`);
  }
}

export async function deleteAdminFromFirestore(adminId: string) {
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admins/${adminId}`);
  }
}

export function subscribeToAdmins(
  callback: (admins: AdminUser[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'admins'),
    (snapshot) => {
      const items: AdminUser[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as AdminUser);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admins');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// SYSTEM & SECURITY SETTINGS SYNC
// -------------------------------------------------------------
export async function saveSecuritySettingsToFirestore(settings: SecuritySettings) {
  try {
    await setDoc(doc(db, 'system_settings', 'security'), cleanFirestorePayload(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_settings/security');
  }
}

export function subscribeToSecuritySettings(
  callback: (settings: SecuritySettings) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    doc(db, 'system_settings', 'security'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SecuritySettings);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_settings/security');
      if (onError) onError(error);
    }
  );
}

export async function saveAccessControlSettingsToFirestore(settings: AccessControlSettings) {
  try {
    await setDoc(doc(db, 'system_settings', 'access_control'), cleanFirestorePayload(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_settings/access_control');
  }
}

export function subscribeToAccessControlSettings(
  callback: (settings: AccessControlSettings) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    doc(db, 'system_settings', 'access_control'),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AccessControlSettings);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_settings/access_control');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// AUDIT LOGS SYNC
// -------------------------------------------------------------
export async function saveAuditLogToFirestore(logItem: AdminAuditLog) {
  try {
    await setDoc(doc(db, 'audit_logs', logItem.id), cleanFirestorePayload(logItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `audit_logs/${logItem.id}`);
  }
}

export function subscribeToAuditLogs(
  callback: (logs: AdminAuditLog[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, 'audit_logs'),
    (snapshot) => {
      const items: AdminAuditLog[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as AdminAuditLog);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// AUTO-SEED HELPER
// Ensures that on a fresh cloud database, all council data is populated
// so all connected devices immediately see and receive identical state!
// -------------------------------------------------------------
// -------------------------------------------------------------
// LOCAL-TO-CLOUD AUTO-RECOVERY & SEED HELPER
// Automatically rescues any documents uploaded while offline or with serialization errors,
// ensuring all connected devices immediately receive identical state!
// -------------------------------------------------------------
export async function syncLocalDocumentsToFirestore(localDocs: CouncilDocument[]) {
  if (!Array.isArray(localDocs) || localDocs.length === 0) return;
  try {
    const docSnap = await getDocs(collection(db, 'documents'));
    const remoteDocIds = new Set(docSnap.docs.map((d) => d.id));
    
    // Find documents stored locally that don't exist in Firestore yet
    const missingDocs = localDocs.filter((d) => d && d.id && !remoteDocIds.has(d.id));
    for (const missing of missingDocs) {
      console.info(`Syncing local document "${missing.name}" (${missing.id}) to Firestore...`);
      await saveDocumentToFirestore(missing);
    }
  } catch (err) {
    console.warn('Auto-sync of local documents to Firestore:', err);
  }
}

export async function seedFirestoreIfEmpty(
  initialDepts: Department[],
  initialDocs: CouncilDocument[],
  initialTasks: CouncilTask[],
  initialEvents: CouncilEvent[],
  initialAdmins: AdminUser[],
  initialSecurity: SecuritySettings,
  initialAccess: AccessControlSettings,
  currentLocalDocs?: CouncilDocument[]
) {
  try {
    // 1. Check departments - ensure ALL 7 core departments exist in Firestore
    const deptSnap = await getDocs(collection(db, 'departments'));
    const existingDeptIds = new Set(deptSnap.docs.map((d) => d.id));
    for (const d of initialDepts) {
      if (!existingDeptIds.has(d.id)) {
        await saveDepartmentToFirestore(d);
      }
    }

    // 2. Check documents & rescue any local unsynced docs
    const docSnap = await getDocs(collection(db, 'documents'));
    if (docSnap.empty && initialDocs.length > 0) {
      for (const d of initialDocs) {
        await saveDocumentToFirestore(d);
      }
    } else if (currentLocalDocs && currentLocalDocs.length > 0) {
      const existingDocIds = new Set(docSnap.docs.map((d) => d.id));
      for (const locDoc of currentLocalDocs) {
        if (locDoc && locDoc.id && !existingDocIds.has(locDoc.id)) {
          await saveDocumentToFirestore(locDoc);
        }
      }
    }

    // 3. Check tasks
    const taskSnap = await getDocs(collection(db, 'tasks'));
    if (taskSnap.empty && initialTasks.length > 0) {
      for (const t of initialTasks) {
        await setDoc(doc(db, 'tasks', t.id), cleanFirestorePayload(t));
      }
    }

    // 4. Check events
    const eventSnap = await getDocs(collection(db, 'events'));
    if (eventSnap.empty && initialEvents.length > 0) {
      for (const e of initialEvents) {
        await setDoc(doc(db, 'events', e.id), cleanFirestorePayload(e));
      }
    }

    // 5. Check admins
    const adminSnap = await getDocs(collection(db, 'admins'));
    const existingAdminIds = new Set(adminSnap.docs.map((a) => a.id));
    for (const a of initialAdmins) {
      if (!existingAdminIds.has(a.id)) {
        await setDoc(doc(db, 'admins', a.id), cleanFirestorePayload(a));
      }
    }

    // 6. Check security settings
    await setDoc(doc(db, 'system_settings', 'security'), cleanFirestorePayload(initialSecurity), { merge: true });
    await setDoc(doc(db, 'system_settings', 'access_control'), cleanFirestorePayload(initialAccess), { merge: true });
  } catch (err) {
    console.warn('Initial Firestore seed check:', err);
  }
}