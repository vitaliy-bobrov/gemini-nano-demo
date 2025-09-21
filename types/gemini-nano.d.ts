interface CreateMonitor {
  addEventListener(type: 'downloadprogress', listener: DownloadEventListener): void;
}

interface LanguageDetectorOptions {
  expectedInputLanguages?: string[];
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface LanguageDetectorResult {
  readonly detectedLanguage: string;
  readonly confidence: number;
}

interface LanguageDetector {
  availability(): Promise<AiApiAvailability>;
  create(options?: LanguageDetectorOptions): Promise<LanguageDetector>;
  detect(text: string, options?: { signal?: AbortSignal }): Promise<LanguageDetectorResult[]>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  destroy(): void;
  readonly inputQuota: number;
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
  readonly inputQuota: number;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

type SummarizerFormats = 'markdown' | 'plain-text';
type SummarizerSize = 'short' | 'medium' | 'long';
type SummarizerType = 'headline' | 'key-points' | 'teaser' | 'tldr';

interface SummarizerOptions {
  expectedContextLanguages?: string[];
  expectedInputLanguages?: string[];
  format?: SummarizerFormats;
  length?: SummarizerSize;
  outputLanguage?: string;
  sharedContext?: string;
  type?: SummarizerType;
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface Summarizer {
  availability(options?: SummarizerOptions): Promise<AiApiAvailability>;
  create(options?: SummarizerOptions): Promise<Summarizer>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  summarize(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<string>;
  summarizeStreaming(input: string, options?: { context?: string; signal?: AbortSignal }): ReadableStream<string>;
  destroy(): void;
  readonly inputQuota: number;
  expectedContextLanguages: readonly string[];
  expectedInputLanguages: readonly string[];
  readonly format: SummarizerFormats;
  readonly length: SummarizerSize;
  readonly outputLanguage: string;
  readonly sharedContext: string;
  readonly type: SummarizerType;
}

type AiApiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

declare global {
  interface Window {
    LanguageDetector?: LanguageDetector;
    Translator?: Translator;
    Summarizer?: Summarizer;
  }
}
