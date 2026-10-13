# Planifica · Integración Firebase (en preparación)

## Estado comprobado
- Firestore existe en el proyecto de Juan según las capturas aportadas.
- Las reglas mostradas eran `allow read, write: if false;`: se mantienen intactas.
- Esta rama incluye el SDK web, configuración opcional y funciones de lectura/escritura
  para planes y actuaciones. **No están conectadas todavía al AppContext**.
- Los datos continúan guardándose en `localStorage`. No hay sincronización real,
  autenticación Firebase ni migración ejecutada.
- No se han realizado escrituras a Firestore.

## Para completar la configuración de la aplicación web
1. En la cuenta de Juan, abrir Firebase Console > proyecto Planifica >
   Configuración del proyecto (engranaje) > General > Tus aplicaciones.
2. Si no existe aplicación Web, pulsar el icono `</>` y registrar **Planifica Web**.
   No es necesario activar Firebase Hosting.
3. Copiar los cuatro valores de `firebaseConfig`: `apiKey`, `authDomain`,
   `projectId`, `appId`. El ID del proyecto debe tomarse de la consola,
   no de un nombre deducido de capturas.
4. Configurarlos como variables `VITE_FIREBASE_*` en el entorno de ejecución.
   No subir el archivo `.env` al repositorio.
5. Instalar dependencias y actualizar el archivo `bun.lock` de forma reproducible.
6. Configurar Firebase Authentication y un modelo de roles comprobable.
   **Ser Editor en Firebase Console no inicia sesión en Firebase Authentication**.
7. Probar reglas de Firestore y de Storage con usuarios autorizados/no autorizados.
   No usar `allow read, write: if true`.
8. Exportar y verificar una copia de cada navegador que contenga datos reales.
   Distinguir los datos iniciales de demostración de los datos introducidos.
9. Diseñar migración sin duplicados, control de concurrencia, documentos grandes
   (límite de 1 MiB por documento Firestore), auditoría del servidor y reintentos.
10. Solo entonces conectar el contexto de React a Firestore y comprobar
    persistencia entre dispositivos, permisos y estados de sincronización.

## Precauciones
- La configuración Web de Firebase no es una credencial de administrador.
  La protección real depende de Authentication y las reglas del servidor.
- Las funciones de `src/firebase/repositorio.ts` exigen sesión de Firebase,
  pero por sí solas no sustituyen las reglas de seguridad.
- No activar sincronización automática con los datos iniciales; podría
  sobrescribir o duplicar información legítima.
- No publicar esta rama como aplicación de producción hasta completar
  autenticación, reglas, migración y pruebas.
