import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Configuración web del proyecto Firebase. No incluye claves privadas.
 * Sin variables de entorno completas, la app continúa en modo local.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Object.values(firebaseConfig).every(
  (valor) => typeof valor === 'string' && valor.trim().length > 0
);

export interface ServiciosFirebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let servicios: ServiciosFirebase | null = null;

/**
 * Inicialización bajo demanda: no activa lecturas, escrituras ni sesiones.
 */
export function obtenerServiciosFirebase(): ServiciosFirebase {
  if (!firebaseConfigurado) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
  }

  if (!servicios) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    servicios = { app, auth: getAuth(app), db: getFirestore(app) };
  }

  return servicios;
}
