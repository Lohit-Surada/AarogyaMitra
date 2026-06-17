import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDgANsSVdpeOgN-felEACQ5Bh-AkTpsgTE',
  authDomain: 'aarogyamitra-76326.firebaseapp.com',
  projectId: 'aarogyamitra-76326',
  storageBucket: 'aarogyamitra-76326.firebasestorage.app',
  messagingSenderId: '613138079416',
  appId: '1:613138079416:web:637c5d00c5b2175a7e1e4d',
  databaseURL: 'https://aarogyamitra-76326-default-rtdb.firebaseio.com',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);