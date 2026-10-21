# PLANIFICA: integración compartida sobre el repositorio de Juan

Rama `feat/firebase-shared-integration`, adaptada sobre `main`
`d2e1d975b0a3c46ef5f87c40f19db87d16da02b0` de `juantabuoficial/Juan-Tab-`.
Conserva los informes, herramientas de datos, Excel y papelera añadidos por Juan.
No fusionada ni desplegada; no se ha migrado ningún dato real.

## Comportamiento

- La identidad automática de Juan y la simulación de biometría/2FA se sustituyen por Firebase Authentication y membresía activa `members/{uid}`. Solo el administrador del proyecto puede provisionar miembros. Los perfiles del navegador no conceden permisos.
- Planes, actuaciones, comentarios, auditoría funcional y papelera se sincronizan juntos en `workspaces/planifica`. Una transacción exige la revisión esperada y crea un evento inmutable con UID, fecha de servidor y hash SHA-256. No hay confirmación por temporizador.
- Cola persistente en IndexedDB por cuenta y pestaña. Los cambios pendientes sobreviven a recarga y desconexión. Los reintentos confirmados no duplican la operación. Los conflictos conservan el borrador local y requieren descargar copia antes de cargar la versión remota.
- La importación es explícita, solo para administrador y solo sobre un espacio vacío. Reconoce las claves actuales `v2` y las anteriores `v1.1`; bloquea versiones distintas, JSON inválido, IDs repetidos, papelera incorrecta o exceso de tamaño. No borra ni sobrescribe las claves originales.
- La copia de origen incluye todas las claves `adl_cadiz_`, también el directorio local y las preferencias. No importa cuentas locales como usuarios autorizados. Las notificaciones y preferencias permanecen locales.
- Se utiliza un único documento revisionado (máximo 700 kB). Si se supera el límite, se bloquea el envío y se permite exportar; nunca se truncan listas. Para más volumen se necesita un modelo por entidad.

## Configuración y reglas

La configuración pública del SDK apunta a la app existente `planifica-cadiz` y admite las variables `VITE_FIREBASE_*` documentadas en `.env.example`. Nunca introducir credenciales administrativas en variables `VITE_`.

El paquete de integración anterior identificó la base `(default)` como Firestore Estándar nativo, región eur3. En esta ejecución la consulta administrativa por CLI no pudo autenticar; no se ha cambiado su edición, configuración ni contenido. Las pruebas usan exclusivamente proyectos `demo-*` y emuladores.

Las reglas propuestas sustituyen las reglas del repositorio para el nuevo modelo; NO se han desplegado. Los roles `admin` y `editor` editan el conjunto compartido; `auditor` solo consulta. No existe separación por técnico ni validación interna del JSON desde las reglas: se valida el sobre, autor, revisión, tamaño y evento vinculado. Este modelo de permisos debe aceptarse antes de producción.

El directorio actual muestra la cuenta autenticada. Antes de habilitar asignación a otros técnicos se necesita un directorio compartido de perfiles sin credenciales y un mapeo revisado de los IDs antiguos a los UID de Firebase. Las asignaciones ya existentes se conservan en los datos importados.

## Pruebas reproducibles

Node 24; Java 17 para Firebase CLI 14 (Java 21 si se actualiza a CLI 15 o posterior):

```bash
npm ci --ignore-scripts
npm run lint
npm test
npm run build
npx -y firebase-tools@14 emulators:exec --project demo-planifica --only firestore,auth 'npm run test:rules'
```

Las pruebas del motor y de importación cubren recarga, dos dispositivos, conflictos, pérdida de respuesta, fallo de cuota, escrituras en curso, tamaños y conservación de la papelera. Las del SDK y reglas comprueban autenticación, autorización, revisión optimista, idempotencia y evidencia de servidor; las denegaciones deliberadas generan mensajes PERMISSION_DENIED.

## Pendiente antes de fusionar/publicar

1. Revisar reglas, rol de editor, volumen representativo real y directorio de técnicos.
2. Desplegar las reglas y configurar/verificar las cuentas de Firebase en un entorno autorizado. La conexión GitHub no concede acceso administrativo a Firebase.
3. Conservar copias de TODOS los navegadores de origen y conciliar sus datos antes de importar. Probar recuentos, contenido e importes con datos privados.
4. Validar interfaz en navegador: el navegador disponible devolvió ERR_CONNECTION_REFUSED al servidor local, por lo que NO se acredita el recorrido visual ni iPhone/Safari, iPad o Android físico.
5. Comprobar CI del HEAD del PR. No confundir pruebas locales con CI remota.

El service worker sigue desactivado: no se garantiza abrir la app desde cero sin red ni ejecución en segundo plano de iOS. Los endpoints Express de IA no se modifican en esta integración; no se afirma una auditoría completa de seguridad de la aplicación.
