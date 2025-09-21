import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    Proofreader?: Proofreader;
  }
}

/**
 * Service to interact with the Proofreader API.
 * documentation: https://developer.chrome.com/docs/ai/proofreader-api
 * explainer: https://github.com/webmachinelearning/proofreader-api
 */
@Injectable({
  providedIn: 'root',
})
export class ProofreaderAPIService extends AiApiBaseService {
  private readonly proofreader = signal<Proofreader | null>(null);

  override async checkAvailability(options: ProofreaderOptions = { expectedInputLanguages: ['en'] }) {
    if (self.Proofreader) {
      const result = await self.Proofreader.availability(options);
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createProofreader(options: ProofreaderOptions = { expectedInputLanguages: ['en'] }) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Proofreader API is not available.');
      case 'checking':
        throw new Error('Proofreader API availability is still being checked.');
      case 'downloading':
        throw new Error('Proofreader API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Proofreader API.');
        }
        if (self.Proofreader) {
          const proofreader = await self.Proofreader!.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability(options);
          this.proofreader.set(proofreader);
        }
        return this.proofreader();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async proofread(input: string, options?: ProofreaderOptions) {
    // Recreate proofreader with new options.
    this.destroy();
    const proofreader = await this.createProofreader(options);

    if (!proofreader) {
      throw new Error('Proofreader API is not available.');
    }

    const totalInputQuota = proofreader.inputQuota;
    const inputUsage = await proofreader.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process content.");
    }

    return proofreader.proofread(input);
  }

  destroy() {
    this.proofreader()?.destroy();
    this.proofreader.set(null);
  }
}
