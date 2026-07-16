import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch,
  getDocFromServer,
  enableIndexedDbPersistence
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Initialize Firestore
// Use custom database ID from config if present
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "default");

// Enable IndexedDB persistence for offline support (best effort)
enableIndexedDbPersistence(db).catch((err) => {
  // Typical errors: failed-precondition (multiple tabs), unimplemented (browser)
  console.warn("Could not enable IndexedDB persistence for Firestore:", err && (err as any).code ? (err as any).code : err);
});

// Test connection on boot as requested by skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection test complete.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is offline. Running in local cache mode.");
    } else {
      // Not necessarily fatal; report for visibility
      console.log("Firebase connection test error (using cached data if available):", error);
    }
  }
}
testConnection();

// helper to check online status (uses browser navigator)
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Cloud storage synchronization interfaces
import { TempleInfo, BankAccount, Transaction, UserAccount } from "../types";

export interface TempleBackupData {
  templeInfo: TempleInfo & { lastModified?: number };
  bankAccounts: (BankAccount & { lastModified?: number })[];
  transactions: (Transaction & { lastModified?: number })[];
  users: (UserAccount & { lastModified?: number })[];
}

// 1. Fetch entire database from Firestore
export async function fetchFromCloud(): Promise<TempleBackupData | null> {
  try {
    // 1.1 Fetch Temple Info
    const templeInfoDoc = await getDoc(doc(db, "templeConfig", "info"));
    if (!templeInfoDoc.exists()) {
      return null;
    }
    const info = templeInfoDoc.data() as TempleInfo & { lastModified?: number };

    // 1.2 Fetch Bank Accounts
    const bankQuery = await getDocs(collection(db, "bankAccounts"));
    const bankAccounts: (BankAccount & { lastModified?: number })[] = [];
    bankQuery.forEach((d) => {
      bankAccounts.push(d.data() as BankAccount & { lastModified?: number });
    });

    // 1.3 Fetch Transactions
    const txQuery = await getDocs(collection(db, "transactions"));
    const transactions: (Transaction & { lastModified?: number })[] = [];
    txQuery.forEach((d) => {
      transactions.push(d.data() as Transaction & { lastModified?: number });
    });

    // 1.4 Fetch Users
    const usersQuery = await getDocs(collection(db, "users"));
    const users: (UserAccount & { lastModified?: number })[] = [];
    usersQuery.forEach((d) => {
      users.push(d.data() as UserAccount & { lastModified?: number });
    });

    return {
      templeInfo: info,
      bankAccounts,
      transactions,
      users
    };
  } catch (error) {
    console.error("Error fetching from Firebase cloud:", error);
    throw error;
  }
}

// Helper: get server-side lastModified from a syncMeta doc for a collection
async function getServerMetaLastModified(name: string): Promise<number> {
  try {
    const metaRef = doc(db, "syncMeta", name);
    const metaDoc = await getDocFromServer(metaRef);
    if (metaDoc.exists()) {
      const data = metaDoc.data() as any;
      return typeof data.lastModified === "number" ? data.lastModified : 0;
    }
    return 0;
  } catch (e) {
    // If offline or error, return 0 so client may write to local cache
    return 0;
  }
}

// Helper: update syncMeta lastModified for a collection
async function updateServerMetaLastModified(name: string, timestamp: number) {
  try {
    const metaRef = doc(db, "syncMeta", name);
    await setDoc(metaRef, { lastModified: timestamp }, { merge: true });
  } catch (e) {
    console.warn("Failed to update syncMeta for", name, e);
  }
}

// 2. Save entire database to Firestore in a batched/parallel way
// Uses collection-level lastModified checks (syncMeta) to reduce per-doc reads.
export async function saveToCloud(data: TempleBackupData): Promise<void> {
  try {
    const now = Date.now();

    // 2.1 Temple Info
    try {
      const serverMeta = await getServerMetaLastModified("templeInfo");
      const localLast = (data.templeInfo && data.templeInfo.lastModified) || 0;
      const infoRef = doc(db, "templeConfig", "info");
      if (serverMeta > localLast) {
        console.log("Skipping templeInfo write because cloud is newer.");
      } else {
        await setDoc(infoRef, { ...data.templeInfo, lastModified: now });
        await updateServerMetaLastModified("templeInfo", now);
      }
    } catch (e) {
      console.warn("TempleInfo save encountered an issue:", e);
      await setDoc(doc(db, "templeConfig", "info"), { ...data.templeInfo, lastModified: now });
      await updateServerMetaLastModified("templeInfo", now);
    }

    // 2.2 Bank Accounts
    const bankServerMeta = await getServerMetaLastModified("bankAccounts");
    const localBankMax = data.bankAccounts.reduce((m, b) => Math.max(m, (b as any).lastModified || 0), 0);
    if (bankServerMeta > localBankMax) {
      console.log("Skipping bankAccounts write because cloud is newer.");
    } else {
      const bankBatch = writeBatch(db);
      for (const bank of data.bankAccounts) {
        const bankRef = doc(db, "bankAccounts", bank.id);
        bankBatch.set(bankRef, { ...bank, lastModified: now });
      }
      await bankBatch.commit();
      await updateServerMetaLastModified("bankAccounts", now);
    }

    // 2.3 Transactions (chunked)
    const txServerMeta = await getServerMetaLastModified("transactions");
    const localTxMax = data.transactions.reduce((m, t) => Math.max(m, (t as any).lastModified || 0), 0);
    if (txServerMeta > localTxMax) {
      console.log("Skipping transactions write because cloud is newer.");
    } else {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < data.transactions.length; i += CHUNK_SIZE) {
        const chunk = data.transactions.slice(i, i + CHUNK_SIZE);
        const txBatch = writeBatch(db);
        for (const tx of chunk) {
          const txRef = doc(db, "transactions", tx.id);
          txBatch.set(txRef, { ...tx, lastModified: now });
        }
        await txBatch.commit();
      }
      await updateServerMetaLastModified("transactions", now);
    }

    // 2.4 Users
    const usersServerMeta = await getServerMetaLastModified("users");
    const localUsersMax = data.users.reduce((m, u) => Math.max(m, (u as any).lastModified || 0), 0);
    if (usersServerMeta > localUsersMax) {
      console.log("Skipping users write because cloud is newer.");
    } else {
      const usersBatch = writeBatch(db);
      for (const u of data.users) {
        const uRef = doc(db, "users", u.username);
        usersBatch.set(uRef, { ...u, lastModified: now });
      }
      await usersBatch.commit();
      await updateServerMetaLastModified("users", now);
    }

  } catch (error) {
    console.error("Error saving to Firebase cloud:", error);
    throw error;
  }
}
