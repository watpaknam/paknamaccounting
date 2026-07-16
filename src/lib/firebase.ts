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

// Helper: safe get server doc lastModified (returns number or 0)
async function getServerLastModified(ref: any): Promise<number> {
  try {
    const serverDoc = await getDocFromServer(ref);
    if (serverDoc.exists()) {
      const data = serverDoc.data() as any;
      return typeof data.lastModified === "number" ? data.lastModified : 0;
    }
    return 0;
  } catch (e) {
    // If we cannot reach server (offline), return 0 so client may write to local cache
    return 0;
  }
}

// 2. Save entire database to Firestore in a batched/parallel way
// Adds lastModified timestamps and checks server-side timestamps to avoid overwriting newer cloud data.
export async function saveToCloud(data: TempleBackupData): Promise<void> {
  try {
    const now = Date.now();

    // 2.1 Save Temple Info (with check)
    try {
      const infoRef = doc(db, "templeConfig", "info");
      const serverLast = await getServerLastModified(infoRef);
      const localLast = (data.templeInfo && data.templeInfo.lastModified) || 0;
      if (serverLast > localLast) {
        console.log("Skipping templeInfo write because cloud is newer.");
      } else {
        await setDoc(infoRef, { ...data.templeInfo, lastModified: now });
      }
    } catch (e) {
      console.warn("TempleInfo save encountered an issue, attempting to set locally:", e);
      await setDoc(doc(db, "templeConfig", "info"), { ...data.templeInfo, lastModified: now });
    }

    // 2.2 Save Bank Accounts
    const bankBatch = writeBatch(db);
    for (const bank of data.bankAccounts) {
      const bankRef = doc(db, "bankAccounts", bank.id);
      const serverLast = await getServerLastModified(bankRef);
      const localLast = (bank as any).lastModified || 0;
      if (serverLast > localLast) {
        console.log(`Skipping bank ${bank.id} because cloud is newer.`);
        continue;
      }
      bankBatch.set(bankRef, { ...bank, lastModified: now });
    }
    await bankBatch.commit();

    // 2.3 Save Transactions (chunked)
    // Firestore batches are limited to 500 writes. We will write transactions in chunks.
    const CHUNK_SIZE = 400;
    for (let i = 0; i < data.transactions.length; i += CHUNK_SIZE) {
      const chunk = data.transactions.slice(i, i + CHUNK_SIZE);
      const txBatch = writeBatch(db);
      for (const tx of chunk) {
        const txRef = doc(db, "transactions", tx.id);
        const serverLast = await getServerLastModified(txRef);
        const localLast = (tx as any).lastModified || 0;
        if (serverLast > localLast) {
          console.log(`Skipping transaction ${tx.id} because cloud is newer.`);
          continue;
        }
        txBatch.set(txRef, { ...tx, lastModified: now });
      }
      await txBatch.commit();
    }

    // 2.4 Save Users
    const usersBatch = writeBatch(db);
    for (const u of data.users) {
      const uRef = doc(db, "users", u.username);
      const serverLast = await getServerLastModified(uRef);
      const localLast = (u as any).lastModified || 0;
      if (serverLast > localLast) {
        console.log(`Skipping user ${u.username} because cloud is newer.`);
        continue;
      }
      usersBatch.set(uRef, { ...u, lastModified: now });
    }
    await usersBatch.commit();

  } catch (error) {
    console.error("Error saving to Firebase cloud:", error);
    throw error;
  }
}
