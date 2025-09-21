import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    LanguageDetector?: LanguageDetector;
  }
}

export interface DetectionResult extends LanguageDetectorResult {
  languageDisplayName: string;
  confidencePercentage: string;
}

/**
 * Service to interact with the LanguageDetector API.
 * documentation: https://developer.chrome.com/docs/ai/language-detection
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/LanguageDetector
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageDetectorAPIService extends AiApiBaseService {
  private readonly languageDetector = signal<LanguageDetector | null>(null);

  override async checkAvailability() {
    if (self.LanguageDetector) {
      const result = await self.LanguageDetector.availability();
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createDetector() {
    switch (this.availability()) {
      case 'available': {
        if (!this.languageDetector() && self.LanguageDetector) {
          const detector = await self.LanguageDetector.create();
          this.languageDetector.set(detector);
        }
        return this.languageDetector();
      }
      case 'unavailable':
        throw new Error('Language Detector API is not available.');
      case 'checking':
        throw new Error('Language Detector API availability is still being checked.');
      case 'downloading':
        throw new Error('Language Detector API is currently downloading.');
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Language Detector API.');
        }

        const detector = await self.LanguageDetector!.create({
          monitor: (monitor) => {
            this.downloadProgressState.set(0);

            monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
              this.modelTotalSizeState.set(event.total ?? null);
              this.downloadProgressState.set(event.loaded * 100);
            });
          },
        });

        this.languageDetector.set(detector);
        await this.checkAvailability();
        return this.languageDetector();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async detect(text: string): Promise<DetectionResult> {
    const detector = await this.createDetector();

    if (!detector) {
      throw new Error('Language Detector API is not available.');
    }

    const totalInputQuota = detector.inputQuota;
    const inputUsage = await detector.measureInputUsage(text);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to detect languages.");
    }

    const results = await detector.detect(text);
    const predicted = this.predictedLanguage(results);

    return {
      ...predicted,
      languageDisplayName: this.languageTagToHumanReadable(predicted.detectedLanguage, 'en') ?? 'Unknown',
      confidencePercentage: `${(predicted.confidence * 100).toFixed(0)}%`,
    };
  }

  destroy() {
    this.languageDetector()?.destroy();
    this.languageDetector.set(null);
  }

  private predictedLanguage(detectionResults: LanguageDetectorResult[]) {
    const mostConfidentLanguage = detectionResults.sort((a, b) => b.confidence - a.confidence)[0];

    if (!mostConfidentLanguage) {
      throw new Error(`Language Detector API can't detect language.`);
    }

    return mostConfidentLanguage;
  }

  private languageTagToHumanReadable(languageTag: string, targetLanguage: string) {
    const displayNames = new Intl.DisplayNames([targetLanguage], {
      type: 'language',
    });
    return displayNames.of(languageTag);
  }
}
