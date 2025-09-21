import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SummarizerAPIService } from '../services/summarizer-api.service';
import { ExternalLinkComponent } from '../shared/external-link/external-link';
import { Comment } from '../shared/comment';
import { COMMENTS } from './data';

@Component({
  selector: 'app-gemini-nano-summarizer-demo',
  templateUrl: './gemini-nano-summarizer-demo.html',
  styleUrl: './gemini-nano-summarizer-demo.scss',
  imports: [
    ExternalLinkComponent,
    FormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiNanoSummarizerDemoComponent implements OnDestroy {
  protected readonly comments = COMMENTS;
  private readonly summarizerAPIService = inject(SummarizerAPIService);

  protected readonly summarizerAPIAvailability = computed(() => {
    return this.summarizerAPIService.availability();
  });
  protected readonly summarizerAPIStatusText = computed(() => {
    return `Status: ${this.summarizerAPIService.availability()}`;
  });
  protected readonly summarizerAPIDownloadProgress = computed(() => {
    if (this.summarizerAPIAvailability() === 'available') {
      return 100
    }
    return this.summarizerAPIService.downloadProgress();
  });
  protected readonly summarizerAPIError = signal<string | null>(null);
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

  protected downloadSummarizerModel(event: Event) {
    event.preventDefault();

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
