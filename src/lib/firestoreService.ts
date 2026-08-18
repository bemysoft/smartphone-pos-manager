import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { getResolvedTenantId } from './api';

/**
 * Tenant-Isolated Firestore Service Layer
 * Automatically enforces and injects `tenantId` into every Firestore collection query,
 * document insertion, and update to strictly prevent cross-tenant data leakage.
 */

// Helper to get active tenant ID with safe fallback
export function getActiveTenantId(): string {
  return getResolvedTenantId() || 'default';
}

/**
 * Get tenant-isolated collection reference and query
 * Automatically appends `where('tenantId', '==', tenantId)`
 */
export function getTenantCollectionQuery(collectionName: string, additionalConstraints: QueryConstraint[] = []) {
  const currentTenantId = getActiveTenantId();
  const colRef = collection(db, collectionName);
  return query(
    colRef,
    where('tenantId', '==', currentTenantId),
    ...additionalConstraints
  );
}

/**
 * Fetch all documents in a collection belonging strictly to the current tenant
 */
export async function getTenantDocuments<T = DocumentData>(
  collectionName: string, 
  additionalConstraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = getTenantCollectionQuery(collectionName, additionalConstraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as T[];
  } catch (error) {
    console.warn(`[Firestore Tenant Service] Error fetching ${collectionName} for tenant:`, error);
    return [];
  }
}

/**
 * Fetch a single document by ID, verifying tenant isolation match
 */
export async function getTenantDocument<T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<T | null> {
  try {
    const currentTenantId = getActiveTenantId();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    // Validate tenantId match to strictly avoid leakage if document ID is directly queried
    if (data.tenantId && data.tenantId !== currentTenantId && currentTenantId !== 'superadmin') {
      console.warn(`[Security Alert] Tenant ID mismatch for doc ${docId}. Expected ${currentTenantId}, found ${data.tenantId}`);
      return null;
    }

    return {
      id: docSnap.id,
      ...data
    } as T;
  } catch (error) {
    console.warn(`[Firestore Tenant Service] Error getting doc ${docId}:`, error);
    return null;
  }
}

/**
 * Save / Create a new document in Firestore with automatic tenantId injection
 */
export async function saveTenantDocument<T extends Record<string, any>>(
  collectionName: string, 
  data: T, 
  customDocId?: string
): Promise<string> {
  const currentTenantId = getActiveTenantId();
  const payload = {
    ...data,
    tenantId: currentTenantId,
    updatedAt: new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString()
  };

  if (customDocId) {
    const docRef = doc(db, collectionName, customDocId);
    await setDoc(docRef, payload, { merge: true });
    return customDocId;
  } else {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

/**
 * Update an existing document, ensuring tenant validation
 */
export async function updateTenantDocument<T extends Record<string, any>>(
  collectionName: string, 
  docId: string, 
  updates: Partial<T>
): Promise<boolean> {
  try {
    const currentTenantId = getActiveTenantId();
    const docRef = doc(db, collectionName, docId);
    
    // Verify document belongs to current tenant first
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const data = existing.data();
      if (data.tenantId && data.tenantId !== currentTenantId && currentTenantId !== 'superadmin') {
        throw new Error(`Unauthorized cross-tenant mutation attempted on ${docId}`);
      }
    }

    await updateDoc(docRef, {
      ...updates,
      tenantId: currentTenantId,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`[Firestore Tenant Service] Update failed on ${docId}:`, error);
    throw error;
  }
}

/**
 * Delete a document with strict tenantId validation
 */
export async function deleteTenantDocument(
  collectionName: string, 
  docId: string
): Promise<boolean> {
  try {
    const currentTenantId = getActiveTenantId();
    const docRef = doc(db, collectionName, docId);
    
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const data = existing.data();
      if (data.tenantId && data.tenantId !== currentTenantId && currentTenantId !== 'superadmin') {
        throw new Error(`Unauthorized cross-tenant deletion attempted on ${docId}`);
      }
    }

    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`[Firestore Tenant Service] Delete failed on ${docId}:`, error);
    throw error;
  }
}

/**
 * Real-time listener for tenant-scoped collections
 */
export function subscribeTenantCollection<T = DocumentData>(
  collectionName: string,
  onUpdate: (docs: T[]) => void,
  onError?: (err: Error) => void,
  additionalConstraints: QueryConstraint[] = []
): Unsubscribe {
  const q = getTenantCollectionQuery(collectionName, additionalConstraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as T[];
      onUpdate(docs);
    },
    (error) => {
      console.warn(`[Firestore Subscription Error on ${collectionName}]:`, error);
      if (onError) onError(error);
    }
  );
}
