import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    Translator?: Translator;
  }
}

/**
 * Service to interact with the Translator API.
 * documentation: https://developer.chrome.com/docs/ai/translator-api
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Translator
 */
@Injectable({
  providedIn: 'root',
})
export class TranslatorAPIService extends AiApiBaseService {
  private readonly translator = signal<Translator | null>(null);

  override async checkAvailability(options: TranslatorOptions = { targetLanguage: 'en', sourceLanguage: 'de' }) {
    if (self.Translator) {
      const result = await self.Translator.availability(options);
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createTranslator(options: TranslatorOptions = { targetLanguage: 'en', sourceLanguage: 'de' }) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Translator API is not available.');
      case 'checking':
        throw new Error('Translator API availability is still being checked.');
      case 'downloading':
        throw new Error('Translator API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Translator API.');
        }
        if (self.Translator) {
          const translator = await self.Translator!.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability(options);
          this.translator.set(translator);
        }
        return this.translator();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async translate(text: string, options: TranslatorOptions) {
    // Recreate translator with new options.
    this.destroy();
    const translator = await this.createTranslator(options);

    if (!translator) {
      throw new Error('Translator API is not available.');
    }

    const totalInputQuota = translator.inputQuota;
    const inputUsage = await translator.measureInputUsage(text);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to translate.");
    }

    return translator.translate(text);
  }

  async translateStreaming(text: string, options: TranslatorOptions) {
    // Recreate translator with new options.
    this.destroy();
    const translator = await this.createTranslator(options);

    if (!translator) {
      throw new Error('Translator API is not available.');
    }

    const totalInputQuota = translator.inputQuota;
    const inputUsage = await translator.measureInputUsage(text);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to translate.");
    }

    return translator.translateStreaming(text);
  }

  destroy() {
    this.translator()?.destroy();
    this.translator.set(null);
  }
}
