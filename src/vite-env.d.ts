/// <reference types="vite/client" />

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

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
