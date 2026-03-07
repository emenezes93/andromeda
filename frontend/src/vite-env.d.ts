/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Optional: email for "Contatar suporte" in help center (R3). */
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
