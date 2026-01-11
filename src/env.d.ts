/// <reference types="vite/client" />

// TypeScript declarations for Vite environment variables
interface ImportMetaEnv {
    readonly VITE_API_BASE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
