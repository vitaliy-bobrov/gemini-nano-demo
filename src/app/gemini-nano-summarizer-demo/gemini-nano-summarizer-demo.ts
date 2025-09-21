import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SummarizerAPIService } from '../services/summarizer-api.service';
import { AIAPIInfoComponent } from '../shared/ai-api-info/ai-api-info';
import { APIInfo } from '../shared/api-info';
import { Comment } from '../shared/comment';
import { COMMENTS } from './data';

@Component({
  selector: 'gmd-gemini-nano-summarizer-demo',
  templateUrl: './gemini-nano-summarizer-demo.html',
  styleUrl: './gemini-nano-summarizer-demo.scss',
  imports: [
    AIAPIInfoComponent,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiNanoSummarizerDemoComponent implements OnDestroy {
  protected readonly comments = COMMENTS;
  private readonly summarizerAPIService = inject(SummarizerAPIService);
  protected readonly summarizerAPIError = signal<string | null>(null);

  protected readonly summarizerAPIInfo: APIInfo = {
    name: 'Summarizer API',
    availability: this.summarizerAPIService.availability,
    downloadProgress: this.summarizerAPIService.downloadProgress,
    error: this.summarizerAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/summarizer-api',
        name: 'Chrome Developers Docs',
      },
      {
        link: 'https://developer.mozilla.org/en-US/docs/Web/API/Summarizer',
        name: 'MDN Docs',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#summarization-api-for-gemini-nano',
        name: 'chrome://flags/#summarization-api-for-gemini-nano',
      },
      {
        link: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
        name: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
      },
    ],
  };
  protected readonly summary = signal<string | null>(null);
  protected readonly isSummaryInProgress = signal(false);

  protected readonly summarizerFormats: SummarizerFormats[] = ['markdown', 'plain-text'];
  protected readonly summarizerSizes: SummarizerSize[] = ['short', 'medium', 'long'];
  protected readonly summarizerTypes: SummarizerType[] = ['headline', 'key-points', 'teaser', 'tldr'];
  protected readonly outputLanguages = ['en', 'es', 'ja'].map((langCode) => {
    return {
      displayValue: this.languageTagToHumanReadable(langCode, 'en') ?? langCode,
      value: langCode,
    };
  });

  protected formValue: SummarizerOptions & { context?: string } = {
    outputLanguage: 'en',
    format: 'plain-text',
  };

  protected downloadSummarizerModel() {
    this.summarizerAPIService.createSummarizer().catch((error) => {
      this.summarizerAPIError.set(error ? error.message : 'Unknown error occurred');
    });
  }

  protected async summarizeComments(comments: Comment[]) {
    this.summary.set(null);
    this.summarizerAPIError.set(null);
    this.isSummaryInProgress.set(true);

    const { context, ...options } = this.formValue;
    const input = this.createSummarizerInput(comments);

    const summary = await this.summarizerAPIService.summarize(
      input,
      options,
      context
    ).catch((error) => {
      this.summarizerAPIError.set(error ? error.message : 'Unknown error occurred');
    }).finally(() => {
      this.isSummaryInProgress.set(false);
    });

    this.summary.set(summary ?? null);

  }

  protected async summarizeCommentsStream(comments: Comment[]) {
    this.summary.set(null);
    this.summarizerAPIError.set(null);
    this.isSummaryInProgress.set(true);

    const { context, ...options } = this.formValue;
    const input = this.createSummarizerInput(comments);
    console.log(options);
    try {
      const summaryStream = await this.summarizerAPIService.summarizeStreaming(
        input,
        options,
        context
      );

      const reader = summaryStream.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        this.summary.update((current) => (current ?? '') + value);
      }

    } catch (error: unknown) {
      this.summarizerAPIError.set(error ? (error as Error).message : 'Unknown error occurred');
    } finally {
      this.isSummaryInProgress.set(false);

    }
  }

  private createSummarizerInput(comments: Comment[]) {
    return comments.reduce((text, comment) => {
      const author = `${comment.author} wrote`;
      const date = `on ${comment.date}`;
      const content = `info: ${comment.content}`;

      return `${text}\n\n${author} ${date}\n${content}`;
    }, '');
  }

  private languageTagToHumanReadable(languageTag: string, targetLanguage: string) {
    const displayNames = new Intl.DisplayNames([targetLanguage], {
      type: 'language',
    });
    return displayNames.of(languageTag);
  }

  ngOnDestroy() {
    this.summarizerAPIService.destroy();
  }
}
