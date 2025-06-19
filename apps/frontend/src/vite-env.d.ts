/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CHUNK_POSTFIX: string;
  readonly VITE_CHUNK_PREFIX: string;
  readonly VITE_CODE_PREFIX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
