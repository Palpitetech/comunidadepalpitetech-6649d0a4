/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: any) => Promise<void>>;
  }
}

export {};
