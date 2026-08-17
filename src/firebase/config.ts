import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use the explicit firestore database ID provided in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
