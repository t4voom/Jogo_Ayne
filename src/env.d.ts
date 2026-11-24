/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do App da Web do Apps Script (termina em /exec). Vazia = só local. */
  readonly VITE_SHEETS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versão do package.json, injetada no build. */
declare const __APP_VERSION__: string;
