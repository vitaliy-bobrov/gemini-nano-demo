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

type WriterTone = 'formal' | 'neutral' | 'casual';
type WriterFormats = 'markdown' | 'plain-text';
type WriterSize = 'short' | 'medium' | 'long';

interface WriterOptions {
  tone?: WriterTone;
  format?: WriterFormats;
  length?: WriterSize;
  sharedContext?: string;
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface Writer {
  availability(): Promise<AiApiAvailability>;
  create(options?: WriterOptions): Promise<Writer>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  write(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<string>;
  writeStreaming(input: string, options?: { context?: string; signal?: AbortSignal }): ReadableStream<string>;
  destroy(): void;
  readonly inputQuota: number;
  readonly tone: WriterTone;
  readonly format: WriterFormats;
  readonly length: WriterSize;
  readonly sharedContext: string;
}

type RewriterTone = 'more-formal' | 'as-is' | 'more-casual';
type RewriterFormats = 'as-is' | 'markdown' | 'plain-text';
type RewriterSize = 'as-is' | 'shorter' | 'longer';

interface RewriterOptions {
  tone?: RewriterTone;
  format?: RewriterFormats;
  length?: RewriterSize;
  sharedContext?: string;
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface Rewriter {
  availability(): Promise<AiApiAvailability>;
  create(options?: RewriterOptions): Promise<Rewriter>;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  rewrite(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<string>;
  rewriteStreaming(input: string, options?: { context?: string; signal?: AbortSignal }): ReadableStream<string>;
  destroy(): void;
  readonly inputQuota: number;
  readonly tone: RewriterTone;
  readonly format: RewriterFormats;
  readonly length: RewriterSize;
  readonly sharedContext: string;
}

type ProofreadCorrectionType = 'spelling' | 'punctuation' | 'capitalization' | 'preposition' | 'missing-words' | 'grammar';

interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
  correction: string;
  type?: ProofreadCorrectionType;
  explanation?: string;
}

interface ProofreadResult {
  readonly corrected: string;
  corrections: readonly ProofreadCorrection[];
}

interface ProofreaderOptions {
  expectedInputLanguages: string[];
  includeCorrectionTypes?: boolean;
  includeCorrectionExplanations?: boolean;
  monitor?: (monitor: CreateMonitor) => void;
  signal?: AbortSignal;
}

interface Proofreader {
  availability(options?: ProofreaderOptions): Promise<AiApiAvailability>;
  create(options?: ProofreaderOptions): Promise<Proofreader>;
  proofread(input: string, options?: { signal?: AbortSignal }): ProofreadResult;
  measureInputUsage(text: string, options?: { signal?: AbortSignal }): number;
  destroy(): void;
  readonly inputQuota: number;
}

type AiApiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

declare global {
  interface Window {
    LanguageDetector?: LanguageDetector;
    Translator?: Translator;
    Summarizer?: Summarizer;
    Writer?: Writer;
    Rewriter?: Rewriter;
    Proofreader?: Proofreader;
  }
}
