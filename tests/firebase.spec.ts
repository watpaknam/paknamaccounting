import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore methods used by src/lib/firebase
vi.mock('firebase/firestore', () => {
  const setDoc = vi.fn().mockResolvedValue(undefined);
  const writeBatch = () => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) });
  const getDoc = vi.fn().mockResolvedValue({ exists: () => false });
  const getDocs = vi.fn().mockResolvedValue({ forEach: (fn: any) => {} });
  const getDocFromServer = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
  return { setDoc, writeBatch, getDoc, getDocs, getDocFromServer };
});

import { saveToCloud } from '../src/lib/firebase';

describe('saveToCloud', () => {
  it('completes without throwing for empty data', async () => {
    const data = { templeInfo: { name: 't', lastModified: 1 }, bankAccounts: [], transactions: [], users: [] };
    await expect(saveToCloud(data as any)).resolves.not.toThrow();
  });
});
