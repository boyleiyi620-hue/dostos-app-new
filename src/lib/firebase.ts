import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  or,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCIfVxMvkXmeKXAd0qYjygsbvYj7QOJr78",
  authDomain: "dostos-app-ddc9e.firebaseapp.com",
  projectId: "dostos-app-ddc9e",
  storageBucket: "dostos-app-ddc9e.firebasestorage.app",
  messagingSenderId: "829870292382",
  appId: "1:829870292382:web:003f43858179ff66766a8f",
  measurementId: "G-WN4WV60MR3",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  or,
};
