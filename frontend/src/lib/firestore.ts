import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export async function getUser(uid: string) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateUser(uid: string, data: any) {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data);
}

export async function createScan(data: any) {
  const docRef = await addDoc(collection(db, 'scans'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getUserScans(uid: string, resultLimit = 50) {
  const q = query(
    collection(db, 'scans'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(resultLimit)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function getSubscription(uid: string) {
  const docRef = doc(db, 'subscriptions', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}
