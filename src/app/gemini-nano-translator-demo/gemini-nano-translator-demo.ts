
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal, WritableSignal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DetectionResult, LanguageDetectorAPIService } from '../services/language-detector-api.service';
import { TranslatorAPIService } from '../services/translator-api.service';
import { ExternalLinkComponent } from '../shared/external-link/external-link';
import { Comment } from '../shared/comment';
import { COMMENTS } from './data';

type CommentsTranslationState = DetectionResult & {
  translation?: string;
  translationStream?: WritableSignal<string | null>;
}

@Component({
  selector: 'app-gemini-nano-translator-demo',
  templateUrl: './gemini-nano-translator-demo.html',
  styleUrl: './gemini-nano-translator-demo.scss',
  imports: [
    ExternalLinkComponent,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiNanoTranslatorDemoComponent implements OnDestroy {
  protected readonly comments = COMMENTS;
  private readonly languageDetectorAPIService = inject(
    LanguageDetectorAPIService
  );
  private readonly translatorAPIService = inject(TranslatorAPIService);
  protected readonly languageDetectorAPIAvailability = computed(() => {
    return this.languageDetectorAPIService.availability();
  });
  protected readonly languageDetectorAPIStatusText = computed(() => {
    return `Status: ${this.languageDetectorAPIService.availability()}`;
  });
  protected readonly languageDetectorAPIDownloadProgress = computed(() => {
    if (this.languageDetectorAPIAvailability() === 'available') {
      return 100
    }
    return this.languageDetectorAPIService.downloadProgress();
  });
  protected readonly languageDetectorAPIError = signal<string | null>(null);

  protected readonly translatorAPIAvailability = computed(() => {
    return this.translatorAPIService.availability();
  });
  protected readonly translatorAPIStatusText = computed(() => {
    return `Status: ${this.translatorAPIService.availability()}`;
  });
  protected readonly translatorAPIDownloadProgress = computed(() => {
    if (this.translatorAPIAvailability() === 'available') {
      return 100
    }
    return this.translatorAPIService.downloadProgress();
  });
  protected readonly translatorAPIError = signal<string | null>(null);

  protected readonly badgeColorClass = computed(() => {
    switch (this.languageDetectorAPIAvailability()) {
      case 'available':
        return 'badge-available';
      case 'unavailable':
        return 'badge-unavailable';
      case 'checking':
        return 'badge-checking';
      case 'downloadable':
        return 'badge-downloadable';
      case 'downloading':
        return 'badge-downloading';
      default:
        return '';
    }
  });

  /**
   * Keeps comments translations state.
   * Key is a combination of author and date to make it unique enough.
   */
  protected readonly commentsTranslations = signal<Record<string, CommentsTranslationState>>({});

  protected downloadLanguageDetectorModel(event: Event) {
    event.preventDefault();

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

  protected downloadTranslatorModel(event: Event) {
    event.preventDefault();

    this.translatorAPIService.createTranslator().catch((error) => {
      this.translatorAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }

  ngOnDestroy() {
    this.languageDetectorAPIService.destroy();
    this.translatorAPIService.destroy();
  }
}
