
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DetectionResult, LanguageDetectorAPIService } from '../services/language-detector-api.service';
import { TranslatorAPIService } from '../services/translator-api.service';
import { AIAPIInfoComponent } from '../shared/ai-api-info/ai-api-info';
import { APIInfo } from '../shared/api-info';
import { Comment } from '../shared/comment';
import { COMMENTS } from './data';

type CommentsTranslationState = DetectionResult & {
  translation?: string;
  translationStream?: WritableSignal<string | null>;
}

@Component({
  selector: 'gmd-gemini-nano-translator-demo',
  templateUrl: './gemini-nano-translator-demo.html',
  styleUrl: './gemini-nano-translator-demo.scss',
  imports: [
    AIAPIInfoComponent,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiNanoTranslatorDemoComponent implements OnDestroy {
  protected readonly comments = COMMENTS;
  private readonly languageDetectorAPIService = inject(
    LanguageDetectorAPIService
  );
  private readonly translatorAPIService = inject(TranslatorAPIService);
  protected readonly languageDetectorAPIError = signal<string | null>(null);
  protected readonly translatorAPIError = signal<string | null>(null);

  protected readonly languageDetectorAPIInfo: APIInfo = {
    name: 'Language Detector API',
    availability: this.languageDetectorAPIService.availability,
    downloadProgress: this.languageDetectorAPIService.downloadProgress,
    error: this.languageDetectorAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/language-detection',
        name: 'Chrome Developers Docs',
      },
      {
        link: 'https://developer.mozilla.org/en-US/docs/Web/API/LanguageDetector',
        name: 'MDN Docs',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#language-detection-api',
        name: 'chrome://flags/#language-detection-api',
      },
    ],
  };

  protected readonly translatorAPIInfo: APIInfo = {
    name: 'Translator API',
    availability: this.translatorAPIService.availability,
    downloadProgress: this.translatorAPIService.downloadProgress,
    error: this.translatorAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/translator-api',
        name: 'Chrome Developers Docs',
      },
      {
        link: 'https://developer.mozilla.org/en-US/docs/Web/API/Translator',
        name: 'MDN Docs',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#translation-api',
        name: 'chrome://flags/#translation-api',
      },
    ],
  };

  /**
   * Keeps comments translations state.
   * Key is a combination of author and date to make it unique enough.
   */
  protected readonly commentsTranslations = signal<Record<string, CommentsTranslationState>>({});

  protected downloadLanguageDetectorModel() {
    this.languageDetectorAPIService.createDetector().catch((error) => {
      this.languageDetectorAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }

  protected async detectLanguage(text: string) {
    return await this.languageDetectorAPIService.detect(text).catch((error) => {
      this.languageDetectorAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }

  protected async detectCommentLanguage(comment: Comment) {
    const detectionData = await this.detectLanguage(comment.content);
    if (detectionData) {
      this.commentsTranslations.update((current) => ({
        ...current,
        [`${comment.author}-${comment.date}}`]: detectionData,
      }));
    }
  }

  protected async translateComment(comment: Comment, detectionData: DetectionResult) {
    this.translatorAPIError.set(null);
    const translation = await this.translatorAPIService.translate(
      comment.content,
      {
        sourceLanguage: detectionData.detectedLanguage,
        targetLanguage: 'en',
      }
    ).catch((error) => {
      this.translatorAPIError.set(error ? error.message : 'Unknown error occurred');
    });
    const key = `${comment.author}-${comment.date}}`;
    this.commentsTranslations.update((current) => ({
      ...current,
      [key]: {
        ...current[key],
        translation: translation ?? '',
      },
    }));
  }

  protected async translateCommentStream(comment: Comment, detectionData: DetectionResult) {
    this.translatorAPIError.set(null);
    const key = `${comment.author}-${comment.date}}`;
    try {
      const translationStream = await this.translatorAPIService.translateStreaming(
        comment.content,
        {
          sourceLanguage: detectionData.detectedLanguage,
          targetLanguage: 'en',
        }
      );
      const translationSignal = signal<string | null>(null);
      this.commentsTranslations.update((current) => ({
        ...current,
        [key]: {
          ...current[key],
          translationStream: translationSignal,
        },
      }));
      const reader = translationStream.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        translationSignal.update((current) => (current ?? '') + value);
      }

    } catch (error: unknown) {
      this.translatorAPIError.set(error ? (error as Error).message : 'Unknown error occurred');
    }
  }

  protected downloadTranslatorModel() {
    this.translatorAPIService.createTranslator().catch((error) => {
      this.translatorAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }

  ngOnDestroy() {
    this.languageDetectorAPIService.destroy();
    this.translatorAPIService.destroy();
  }
}
