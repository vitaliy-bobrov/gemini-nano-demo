import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PromptAPIService } from '../services/prompt-api.service';
import { AIAPIInfoComponent } from '../shared/ai-api-info/ai-api-info';
import { APIInfo } from '../shared/api-info';

@Component({
  selector: 'gemini-nano-prompt-demo',
  templateUrl: './gemini-nano-prompt-demo.html',
  styleUrl: './gemini-nano-prompt-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AIAPIInfoComponent],
})
export class GeminiNanoPromptDemoComponent {
  private readonly promptAPIService = inject(PromptAPIService);
  protected readonly promptAPIError = signal<string | null>(null);

  protected readonly promptAPIInfo: APIInfo = {
    name: 'Prompt API',
    availability: this.promptAPIService.availability,
    downloadProgress: this.promptAPIService.downloadProgress,
    error: this.promptAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/prompt-api',
        name: 'Chrome Developers Docs',
      },
      {
        link: 'https://github.com/webmachinelearning/prompt-api',
        name: 'Explainer',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
        name: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
      },
    ],
  };

  protected downloadPromptModel() {
    this.promptAPIService.createLanguageModel().catch((error) => {
      this.promptAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }
}
