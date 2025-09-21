import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    Writer?: Writer;
  }
}

/**
 * Service to interact with the Writer API.
 * documentation: https://developer.chrome.com/docs/ai/writer-api
 */
@Injectable({
  providedIn: 'root',
})
export class WriterAPIService extends AiApiBaseService {
  static readonly DefaultOptions: WriterOptions = {
    outputLanguage: 'en'
  };
  private readonly writer = signal<Writer | null>(null);

  override async checkAvailability(options: WriterOptions = WriterAPIService.DefaultOptions) {
    if (self.Writer) {
      const result = await self.Writer.availability(options);
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createWriter(options: WriterOptions = WriterAPIService.DefaultOptions) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Writer API is not available.');
      case 'checking':
        throw new Error('Writer API availability is still being checked.');
      case 'downloading':
        throw new Error('Writer API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Writer API.');
        }
        if (self.Writer) {
          const writer = await self.Writer!.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability(options);
          this.writer.set(writer);
        }
        return this.writer();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async write(input: string, options: WriterOptions = WriterAPIService.DefaultOptions, context?: string) {
    // Recreate writer with new options.
    this.destroy();
    const writer = await this.createWriter(options);

    if (!writer) {
      throw new Error('Writer API is not available.');
    }

    const totalInputQuota = writer.inputQuota;
    const inputUsage = await writer.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process content.");
    }

    return writer.write(input, { context });
  }

  async writeStreaming(input: string, options: WriterOptions = WriterAPIService.DefaultOptions, context?: string) {
    // Recreate writer with new options.
    this.destroy();
    const writer = await this.createWriter(options);

    if (!writer) {
      throw new Error('Writer API is not available.');
    }

    const totalInputQuota = writer.inputQuota;
    const inputUsage = await writer.measureInputUsage(input);

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process content.");
    }

    return writer.writeStreaming(input, { context });
  }

  destroy() {
    this.writer()?.destroy();
    this.writer.set(null);
  }
}
