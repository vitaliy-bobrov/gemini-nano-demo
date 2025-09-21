import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    Rewriter?: Rewriter;
  }
}

/**
 * Service to interact with the Rewriter API.
 * documentation: https://developer.chrome.com/docs/ai/rewriter-api
 */
@Injectable({
  providedIn: 'root',
})
export class RewriterAPIService extends AiApiBaseService {
  private readonly rewriter = signal<Rewriter | null>(null);

  override async checkAvailability() {
    if (self.Rewriter) {
      const result = await self.Rewriter.availability();
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createRewriter(options: RewriterOptions = {}) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Rewriter API is not available.');
      case 'checking':
        throw new Error('Rewriter API availability is still being checked.');
      case 'downloading':
        throw new Error('Rewriter API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Rewriter API.');
        }
        if (self.Rewriter) {
          const rewriter = await self.Rewriter!.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability();
          this.rewriter.set(rewriter);
        }
        return this.rewriter();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async rewrite(input: string, options?: RewriterOptions, context?: string) {
    // Recreate rewriter with new options.
    this.destroy();
    const rewriter = await this.createRewriter(options);

    if (!rewriter) {
      throw new Error('Rewriter API is not available.');
    }

    const totalInputQuota = rewriter.inputQuota;
    const inputUsage = await rewriter.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process content.");
    }

    return rewriter.rewrite(input, { context });
  }

  async rewriteStreaming(input: string, options?: RewriterOptions, context?: string) {
    // Recreate rewriter with new options.
    this.destroy();
    const rewriter = await this.createRewriter(options);

    if (!rewriter) {
      throw new Error('Rewriter API is not available.');
    }

    const totalInputQuota = rewriter.inputQuota;
    const inputUsage = await rewriter.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process content.");
    }

    return rewriter.rewriteStreaming(input, { context });
  }

  destroy() {
    this.rewriter()?.destroy();
    this.rewriter.set(null);
  }
}
