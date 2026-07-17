const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

async function verifyAdmin(req) {
  const authHeader = req.get('Authorization') || req.get('authorization') || '';
  const match = authHeader.match(/Bearer\s+(.+)/i);
  if (!match) throw { status: 401, message: 'Missing or invalid Authorization header' };
  const idToken = match[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  if (!decoded || !decoded.admin) throw { status: 403, message: 'Forbidden: admin claim required' };
  return decoded;
}

async function getServerMetaLastModified(db, name) {
  try {
    const metaRef = db.doc(`syncMeta/${name}`);
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) {
      const d = metaSnap.data();
      return typeof d?.lastModified === 'number' ? d.lastModified : 0;
    }
    return 0;
  } catch (e) {
    // If we can't read meta (offline or permission), return 0 to allow writes
    return 0;
  }
}

async function updateServerMetaLastModified(db, name, timestamp) {
  try {
    const metaRef = db.doc(`syncMeta/${name}`);
    await metaRef.set({ lastModified: timestamp }, { merge: true });
  } catch (e) {
    console.warn('Failed to update syncMeta for', name, e);
  }
}

async function chunkedWrites(db, collName, items, idField, now) {
  if (!Array.isArray(items) || items.length === 0) return { written: 0 };
  const CHUNK = 400; // keep below Firestore limit 500
  let written = 0;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const batch = db.batch();
    for (const item of chunk) {
      const id = item[idField];
      if (!id) continue;
      const ref = db.collection(collName).doc(String(id));
      batch.set(ref, { ...item, lastModified: now }, { merge: true });
      written++;
    }
    await batch.commit();
  }
  return { written };
}

exports.mergeBackup = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Authenticate + authorize
    try {
      await verifyAdmin(req);
    } catch (authErr) {
      const code = authErr.status || 401;
      return res.status(code).json({ error: authErr.message || 'Unauthorized' });
    }

    const data = req.body;
    if (!data) return res.status(400).json({ error: 'Missing body' });

    const db = admin.firestore();
    const now = Date.now();

    // Temple info: use collection-level meta approach
    try {
      const serverMeta = await getServerMetaLastModified(db, 'templeInfo');
      const localLast = (data.templeInfo && data.templeInfo.lastModified) || 0;
      const infoRef = db.doc('templeConfig/info');
      if (serverMeta > localLast) {
        // skip: server is newer
        console.log('Skipping templeInfo write because cloud is newer.');
      } else {
        await infoRef.set({ ...data.templeInfo, lastModified: now }, { merge: true });
        await updateServerMetaLastModified(db, 'templeInfo', now);
      }
    } catch (e) {
      console.warn('TempleInfo: fallback write due to error', e);
      await db.doc('templeConfig/info').set({ ...data.templeInfo, lastModified: now }, { merge: true });
      await updateServerMetaLastModified(db, 'templeInfo', now);
    }

    // Collections: bankAccounts, transactions, users
    const results = { bankAccounts: 0, transactions: 0, users: 0 };

    // bankAccounts
    try {
      const serverMeta = await getServerMetaLastModified(db, 'bankAccounts');
      const localMax = Array.isArray(data.bankAccounts)
        ? data.bankAccounts.reduce((m, b) => Math.max(m, (b?.lastModified) || 0), 0)
        : 0;
      if (serverMeta > localMax) {
        console.log('Skipping bankAccounts because cloud is newer.');
      } else {
        const r = await chunkedWrites(db, 'bankAccounts', data.bankAccounts || [], 'id', now);
        results.bankAccounts = r.written;
        await updateServerMetaLastModified(db, 'bankAccounts', now);
      }
    } catch (e) {
      console.error('bankAccounts error', e);
    }

    // transactions (chunked already inside)
    try {
      const serverMeta = await getServerMetaLastModified(db, 'transactions');
      const localMax = Array.isArray(data.transactions)
        ? data.transactions.reduce((m, t) => Math.max(m, (t?.lastModified) || 0), 0)
        : 0;
      if (serverMeta > localMax) {
        console.log('Skipping transactions because cloud is newer.');
      } else {
        const r = await chunkedWrites(db, 'transactions', data.transactions || [], 'id', now);
        results.transactions = r.written;
        await updateServerMetaLastModified(db, 'transactions', now);
      }
    } catch (e) {
      console.error('transactions error', e);
    }

    // users
    try {
      const serverMeta = await getServerMetaLastModified(db, 'users');
      const localMax = Array.isArray(data.users)
        ? data.users.reduce((m, u) => Math.max(m, (u?.lastModified) || 0), 0)
        : 0;
      if (serverMeta > localMax) {
        console.log('Skipping users because cloud is newer.');
      } else {
        const r = await chunkedWrites(db, 'users', data.users || [], 'username', now);
        results.users = r.written;
        await updateServerMetaLastModified(db, 'users', now);
      }
    } catch (e) {
      console.error('users error', e);
    }

    return res.json({ ok: true, results });
  } catch (err) {
    console.error('mergeBackup error', err);
    return res.status(500).json({ error: String(err) });
  }
});
