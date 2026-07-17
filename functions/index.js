const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// HTTP function to merge a TempleBackupData payload into Firestore using lastModified checks.
exports.mergeBackup = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send({ error: 'Method not allowed. Use POST.' });
    }
    const data = req.body;
    if (!data) return res.status(400).send({ error: 'Missing body' });

    const db = admin.firestore();
    const now = Date.now();

    // Merge templeConfig/info using a transaction (single doc)
    await db.runTransaction(async (tx) => {
      const infoRef = db.doc('templeConfig/info');
      const server = await tx.get(infoRef);
      const serverLast = server.exists ? (server.data().lastModified || 0) : 0;
      const localLast = (data.templeInfo && data.templeInfo.lastModified) || 0;
      if (localLast >= serverLast) {
        tx.set(infoRef, { ...data.templeInfo, lastModified: now }, { merge: true });
      }
    });

    // For collections, use batched writes and per-doc lastModified comparison.
    const batch = db.batch();

    async function processCollection(collName, items, idField) {
      if (!Array.isArray(items) || items.length === 0) return;
      for (const item of items) {
        const id = item[idField];
        if (!id) continue;
        const ref = db.collection(collName).doc(String(id));
        const snap = await ref.get();
        const serverLast = snap.exists ? (snap.data().lastModified || 0) : 0;
        const localLast = item.lastModified || 0;
        if (localLast >= serverLast) {
          batch.set(ref, { ...item, lastModified: now }, { merge: true });
        }
      }
    }

    await processCollection('bankAccounts', data.bankAccounts || [], 'id');
    await processCollection('transactions', data.transactions || [], 'id');
    await processCollection('users', data.users || [], 'username');

    // Commit batched writes (if any)
    await batch.commit();

    // Update collection-level syncMeta timestamps
    const meta = { lastModified: now };
    await db.collection('syncMeta').doc('bankAccounts').set(meta, { merge: true });
    await db.collection('syncMeta').doc('transactions').set(meta, { merge: true });
    await db.collection('syncMeta').doc('users').set(meta, { merge: true });

    return res.json({ ok: true });
  } catch (err) {
    console.error('mergeBackup error', err);
    return res.status(500).send({ error: String(err) });
  }
});
