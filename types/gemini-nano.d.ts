interface CreateMonitor {
  addEventListener(type: 'downloadprogress', listener: DownloadEventListener): void;
}

interface LanguageDetectorOptions {
  expectedInputLanguages?: string[];
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface LanguageDetectorResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetector {
  availability(): Promise<AiApiAvailability>;
  create(options?: LanguageDetectorOptions): Promise<LanguageDetector>;
  detect(text: string, options?: { signal?: AbortSignal }): Promise<LanguageDetectorResult[]>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  destroy(): void;
  inputQuota: number;
  expectedInputLanguages: readonly string[];
}

interface TranslatorOptions {
  sourceLanguage?: string;
  targetLanguage: string;
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface Translator {
  availability(options?: TranslatorOptions): Promise<AiApiAvailability>;
  create(options?: TranslatorOptions): Promise<Translator>;
  translate(text: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(text: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  destroy(): void;
  inputQuota: number;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

type AiApiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

declare global {
  interface Window {
    LanguageDetector?: LanguageDetector;
    Translator?: Translator;
  }
}
