import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch,
  getDocFromServer
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

// Test connection on boot as requested by skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is offline. Running in local cache mode.");
    } else {
      console.log("Firebase connection test complete.");
    }
  }
}
testConnection();

// Cloud storage synchronization interfaces
import { TempleInfo, BankAccount, Transaction, UserAccount } from "../types";

export interface TempleBackupData {
  templeInfo: TempleInfo;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  users: UserAccount[];
}

// 1. Fetch entire database from Firestore
export async function fetchFromCloud(): Promise<TempleBackupData | null> {
  try {
    // 1.1 Fetch Temple Info
    const templeInfoDoc = await getDoc(doc(db, "templeConfig", "info"));
    if (!templeInfoDoc.exists()) {
      return null;
    }
    const info = templeInfoDoc.data() as TempleInfo;

    // 1.2 Fetch Bank Accounts
    const bankQuery = await getDocs(collection(db, "bankAccounts"));
    const bankAccounts: BankAccount[] = [];
    bankQuery.forEach((doc) => {
      bankAccounts.push(doc.data() as BankAccount);
    });

    // 1.3 Fetch Transactions
    const txQuery = await getDocs(collection(db, "transactions"));
    const transactions: Transaction[] = [];
    txQuery.forEach((doc) => {
      transactions.push(doc.data() as Transaction);
    });

    // 1.4 Fetch Users
    const usersQuery = await getDocs(collection(db, "users"));
    const users: UserAccount[] = [];
    usersQuery.forEach((doc) => {
      users.push(doc.data() as UserAccount);
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

// 2. Save entire database to Firestore in a batched/parallel way
export async function saveToCloud(data: TempleBackupData): Promise<void> {
  try {
    // 2.1 Save Temple Info
    await setDoc(doc(db, "templeConfig", "info"), data.templeInfo);

    // 2.2 Save Bank Accounts
    const bankBatch = writeBatch(db);
    // First we could delete existing or simply overwrite.
    // For general sync, we write/overwrite each account.
    for (const bank of data.bankAccounts) {
      const bankRef = doc(db, "bankAccounts", bank.id);
      bankBatch.set(bankRef, bank);
    }
    await bankBatch.commit();

    // 2.3 Save Transactions
    // Firestore batches are limited to 500 writes. We will write transactions in chunks.
    const CHUNK_SIZE = 400;
    for (let i = 0; i < data.transactions.length; i += CHUNK_SIZE) {
      const chunk = data.transactions.slice(i, i + CHUNK_SIZE);
      const txBatch = writeBatch(db);
      for (const tx of chunk) {
        const txRef = doc(db, "transactions", tx.id);
        txBatch.set(txRef, tx);
      }
      await txBatch.commit();
    }

    // 2.4 Save Users
    const usersBatch = writeBatch(db);
    for (const u of data.users) {
      const uRef = doc(db, "users", u.username);
      usersBatch.set(uRef, u);
    }
    await usersBatch.commit();

  } catch (error) {
    console.error("Error saving to Firebase cloud:", error);
    throw error;
  }
}
