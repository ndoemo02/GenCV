declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

export {};
