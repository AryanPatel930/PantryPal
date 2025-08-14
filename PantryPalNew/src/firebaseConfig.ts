// src/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth, getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  for (const key of requiredKeys) {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      console.warn(`Firebase config missing: ${key}`);
      // Don't throw error in development, just warn
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Firebase config missing: ${key}`);
      }
    }
  }
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Validate configuration first
  validateConfig();

  // Initialize Firebase app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
    
    // Initialize Auth with persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('Firebase Auth initialized with persistence');
    } catch (error) {
      // Fallback if persistence fails
      console.warn('Auth persistence failed, using default auth:', error);
      auth = getAuth(app);
    }

    // Initialize Firestore
    db = getFirestore(app);
    console.log('Firestore initialized successfully');

    // Initialize Storage
    storage = getStorage(app);
    console.log('Firebase Storage initialized successfully');
  } else {
    // Use existing app and services
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Using existing Firebase services');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // Create a fallback app in case of config issues during development
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Creating fallback Firebase app for development');
    const fallbackConfig = {
      apiKey: "fallback-key",
      authDomain: "fallback.firebaseapp.com",
      projectId: "fallback-project",
      storageBucket: "fallback-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:fallback"
    };
    
    try {
      if (getApps().length === 0) {
        app = initializeApp(fallbackConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
      } else {
        app = getApps()[0];
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
      }
    } catch (fallbackError) {
      console.error('Even fallback initialization failed:', fallbackError);
      throw fallbackError;
    }
  } else {
    throw error;
  }
}

export { auth, db, app, storage };