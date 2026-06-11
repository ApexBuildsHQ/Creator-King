/// <reference types="vite/client" />

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob<T = Record<string, unknown>>(pattern: string, options?: { eager?: boolean }): Record<string, T>;
  globEager<T = Record<string, unknown>>(pattern: string): Record<string, T>;
}

declare interface ImportMetaEnv {}
