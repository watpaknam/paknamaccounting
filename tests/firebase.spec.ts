import { describe, it, expect, vi } from 'vitest';

// Mock firebase/firestore exports used by src/lib/firebase.ts
vi.mock('firebase/firestore', () => {
  const makeSnap = (exists = false, dataObj: any = {}) => ({
    exists: () => exists,
    data: () => dataObj
  });

  const getDoc = vi.fn().mockResolvedValue(makeSnap(false));
  const getDocFromServer = vi.fn().mockResolvedValue(makeSnap(false));
  const getDocs = vi.fn().mockResolvedValue({ forEach: (fn: any) => {} });
  const setDoc = vi.fn().mockResolvedValue(undefined);
  const writeBatch = () => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) });
  const enableIndexedDbPersistence = vi.fn().mockResolvedValue(undefined);
  const getFirestore = vi.fn();
  const collection = vi.fn();
  const doc = vi.fn();

  return {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    writeBatch,
    getDocFromServer,
    enableIndexedDbPersistence
  };
});

import { saveToCloud } from '../src/lib/firebase';

describe('saveToCloud', () => {
  it('completes without throwing for empty data', async () => {
    const data = { templeInfo: { name: 't', lastModified: 1 }, bankAccounts: [], transactions: [], users: [] };
    await expect(saveToCloud(data as any)).resolves.not.toThrow();
  });
});
