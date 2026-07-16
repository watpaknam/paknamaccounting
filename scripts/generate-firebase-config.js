import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env if present
dotenv.config();

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error("Missing required environment variables:", missing.join(", "));
  console.error("Please set them in your environment or in a .env file before running this script.");
  process.exit(1);
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || "default"
};

const outPath = path.resolve(process.cwd(), "firebase-applet-config.json");
fs.writeFileSync(outPath, JSON.stringify(config, null, 2), { encoding: "utf8" });
console.log(`Wrote ${outPath}`);
