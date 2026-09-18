declare module "mespeak" {
  interface SpeakOptions {
    voice?: string;
    rawdata?: "array" | "base64" | "mime" | "buffer" | boolean;
    speed?: number;
    pitch?: number;
    amplitude?: number;
    wordgap?: number;
  }

  function speak(text: string, options?: SpeakOptions): number[] | string | null;
  function loadConfig(json: object): void;
  function loadVoice(json: object): void;
  function isConfigLoaded(): boolean;
  function isVoiceLoaded(voice: string): boolean;

  const meSpeak: {
    speak: typeof speak;
    loadConfig: typeof loadConfig;
    loadVoice: typeof loadVoice;
    isConfigLoaded: typeof isConfigLoaded;
    isVoiceLoaded: typeof isVoiceLoaded;
  };
  export default meSpeak;
}
