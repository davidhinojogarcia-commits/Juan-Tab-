import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Actuacion, PlanSubvencion } from '../types';
import { obtenerServiciosFirebase } from './client';

/**
 * Puerta de acceso explícita a Firestore.
 *
 * No sustituye aún localStorage: se conectará al AppContext cuando existan
 * autenticación real, reglas de seguridad probadas y copia de los datos.
 */
function obtenerBaseAutenticada() {
  const { auth, db } = obtenerServiciosFirebase();
  if (!auth.currentUser) {
    throw new Error('Debes iniciar sesión mediante Firebase Authentication antes de acceder a Firestore.');
  }
  return db;
}

function idDocumento(id: string): string {
  if (!id || id.includes('/') || id === '.' || id === '..') {
    throw new Error('Identificador de documento no válido.');
  }
  return id;
}

function datosFirestore<T>(dato: T): T {
  // Elimina propiedades undefined, que Firestore rechaza; no altera el origen.
  return JSON.parse(JSON.stringify(dato)) as T;
}

export async function leerPlanesFirebase(): Promise<PlanSubvencion[]> {
  const db = obtenerBaseAutenticada();
  const resultado = await getDocs(collection(db, 'planes'));
  return resultado.docs.map((item) => item.data().contenido as PlanSubvencion);
}

export async function leerActuacionesFirebase(): Promise<Actuacion[]> {
  const db = obtenerBaseAutenticada();
  const resultado = await getDocs(collection(db, 'actuaciones'));
  return resultado.docs.map((item) => item.data().contenido as Actuacion);
}

/**
 * Operaciones de escritura deliberadamente explícitas; NO se ejecutan
 * automáticamente al arrancar ni al cambiar datos en el navegador.
 */
export async function guardarPlanFirebase(plan: PlanSubvencion): Promise<void> {
  const db = obtenerBaseAutenticada();
  await setDoc(doc(db, 'planes', idDocumento(plan.id)), {
    contenido: datosFirestore(plan),
    actualizadoEn: serverTimestamp(),
  });
}

export async function guardarActuacionFirebase(actuacion: Actuacion): Promise<void> {
  const db = obtenerBaseAutenticada();
  await setDoc(doc(db, 'actuaciones', idDocumento(actuacion.id)), {
    contenido: datosFirestore(actuacion),
    actualizadoEn: serverTimestamp(),
  });
}
