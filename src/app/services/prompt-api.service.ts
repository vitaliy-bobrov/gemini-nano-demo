import { HttpDownloadProgressEvent } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { AiApiBaseService } from './ai-api-base.service';

declare global {
  interface Window {
    LanguageModel?: LanguageModel;
  }
}

/**
 * Service to interact with the Prompt API.
 * documentation: https://developer.chrome.com/docs/ai/prompt-api
 * explainer: https://github.com/webmachinelearning/prompt-api
 */
@Injectable({
  providedIn: 'root',
})
export class PromptAPIService extends AiApiBaseService {
  static readonly DefaultOptions: LanguageModelOptions = {
    expectedInputLanguages: ['en'],
    outputLanguage: 'en',
    expectedInputs: [{ type: 'text' }],
  };
  private readonly session = signal<LanguageModel | null>(null);
  readonly languageModelParams = signal<LanguageModelParams | null>(null);

  override async checkAvailability(options: LanguageModelOptions = PromptAPIService.DefaultOptions) {
    if (self.LanguageModel) {
      const params = await self.LanguageModel.params();
      this.languageModelParams.set(params);
      const result = await self.LanguageModel.availability(options);
      this.availabilityStatus.set(result);
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }

  async createLanguageModel(options: LanguageModelOptions = PromptAPIService.DefaultOptions) {
    switch (this.availability()) {
      case 'unavailable':
        throw new Error('Prompt API is not available.');
      case 'checking':
        throw new Error('Prompt API availability is still being checked.');
      case 'downloading':
        throw new Error('Prompt API is currently downloading.');
      case 'available':
      case 'downloadable': {
        if (!this.isUserActivated()) {
          throw new Error('User activation is required to download the Prompt API.');
        }
        if (self.LanguageModel) {
          const model = await self.LanguageModel.create({
            ...options,
            monitor: (monitor) => {
              monitor.addEventListener('downloadprogress', (event: HttpDownloadProgressEvent) => {
                this.modelTotalSizeState.set(event.total ?? null);
                this.downloadProgressState.set(event.loaded * 100);
              });
            },
          });

          await this.checkAvailability(options);
          this.session.set(model);
        }
        return this.session();
      }
      default:
        throw new Error('Unknown availability status.');
    }
  }

  async prompt(input: LanguageModelPromptInput, options: LanguageModelOptions = PromptAPIService.DefaultOptions) {
    // Recreate language model with new options.
    this.destroy();
    const session = await this.createLanguageModel(options);

    if (!session) {
      throw new Error('Prompt API is not available.');
    }

    const totalInputQuota = session.inputQuota;
    const inputUsage = session.inputUsage;

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process input.");
    }

    return session.prompt(input);
  }

  async promptStreaming(input: LanguageModelPromptInput, options: LanguageModelOptions = PromptAPIService.DefaultOptions) {
    // Recreate language model with new options.
    this.destroy();
    const session = await this.createLanguageModel(options);

    if (!session) {
      throw new Error('Prompt API is not available.');
    }

    const totalInputQuota = session.inputQuota;
    const inputUsage = session.inputUsage;

    if (inputUsage > totalInputQuota) {
      throw new Error("Insufficient quota to process input.");
    }

    return session.promptStreaming(input);
  }

  destroy() {
    this.session()?.destroy();
    this.session.set(null);
  }
}
