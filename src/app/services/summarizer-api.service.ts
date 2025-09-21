import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    Summarizer?: Summarizer;
  }
}

/**
 * Service to interact with the Summarizer API.
 * documentation: https://developer.chrome.com/docs/ai/summarizer-api
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Summarizer_API
 */
@Injectable({
  providedIn: 'root',
})
export class SummarizerAPIService extends AiApiBaseService {
  private readonly summarizer = signal<Summarizer | null>(null);

  override async checkAvailability(options: SummarizerOptions = { outputLanguage: 'en' }) {
    if (self.Summarizer) {
      const result = await self.Summarizer.availability(options);
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createSummarizer(options: SummarizerOptions = { outputLanguage: 'en' }) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Summarizer API is not available.');
      case 'checking':
        throw new Error('Summarizer API availability is still being checked.');
      case 'downloading':
        throw new Error('Summarizer API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Summarizer API.');
        }
        if (self.Summarizer) {
          const summarizer = await self.Summarizer!.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability(options);
          this.summarizer.set(summarizer);
        }
        return this.summarizer();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async summarize(input: string, options?: SummarizerOptions, context?: string) {
    // Recreate summarizer with new options.
    this.destroy();
    const summarizer = await this.createSummarizer(options);

    if (!summarizer) {
      throw new Error('Summarizer API is not available.');
    }

    const totalInputQuota = summarizer.inputQuota;
    const inputUsage = await summarizer.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to summarize content.");
    }

    return summarizer.summarize(input, { context });
  }

  async summarizeStreaming(input: string, options?: SummarizerOptions, context?: string) {
    // Recreate summarizer with new options.
    this.destroy();
    const summarizer = await this.createSummarizer(options);

    if (!summarizer) {
      throw new Error('Summarizer API is not available.');
    }

    const totalInputQuota = summarizer.inputQuota;
    const inputUsage = await summarizer.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to summarize content.");
    }

    return summarizer.summarizeStreaming(input, { context })
  }

  destroy() {
    this.summarizer()?.destroy();
    this.summarizer.set(null);
  }
}
