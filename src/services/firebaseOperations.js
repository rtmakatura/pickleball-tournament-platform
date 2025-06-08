// src/services/firebaseOperations.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Basic CRUD operations
export const create = async (collectionName, data) => {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
};

export const read = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const update = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await updateDoc(docRef, updateData);
};

export const remove = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// Query operations
export const getAll = async (collectionName, filters = {}) => {
  let q = collection(db, collectionName);
  
  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(field, '==', value));
    }
  });
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Real-time subscriptions
export const subscribe = (collectionName, callback, filters = {}) => {
  let q = collection(db, collectionName);
  
  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      q = query(q, where(field, '==', value));
    }
  });
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

export const subscribeToDoc = (collectionName, id, callback) => {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (doc) => {
    const data = doc.exists() ? { id: doc.id, ...doc.data() } : null;
    callback(data);
  });
};

export default {
  create,
  read,
  update,
  remove,
  getAll,
  subscribe,
  subscribeToDoc
};