/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_YOUTUBE_API_KEY: string
    readonly VITE_YOUTUBE_CHANNEL_ID?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
