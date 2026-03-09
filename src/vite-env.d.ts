/// <reference types="vite/client" />

declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: any) => Promise<void>>;
  }
}

export {};
