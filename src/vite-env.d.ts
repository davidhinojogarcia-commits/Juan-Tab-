/// <reference types="vite/client" />

declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  const content: any;
  export default content;
  export const WorkerMessageHandler: any;
}
