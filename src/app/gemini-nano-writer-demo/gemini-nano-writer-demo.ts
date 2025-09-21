import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProofreaderAPIService } from '../services/proofreader-api.service';
import { RewriterAPIService } from '../services/rewriter-api.service';
import { WriterAPIService } from '../services/writer-api.service';
import { AIAPIInfoComponent } from '../shared/ai-api-info/ai-api-info';
import { APIInfo } from '../shared/api-info';

@Component({
  selector: 'gmd-gemini-nano-writer-demo',
  templateUrl: './gemini-nano-writer-demo.html',
  styleUrls: ['./gemini-nano-writer-demo.scss'],
  imports: [
    AIAPIInfoComponent,
    MatCardModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiNanoWriterDemoComponent implements OnDestroy {
  readonly writerApiService = inject(WriterAPIService);
  readonly rewriterApiService = inject(RewriterAPIService);
  readonly proofreaderApiService = inject(ProofreaderAPIService);

  readonly writerAPIError = signal<string | null>(null);
  readonly rewriterAPIError = signal<string | null>(null);
  readonly proofreaderAPIError = signal<string | null>(null);

  protected readonly isWritingInProgress = signal(false);
  protected readonly isRewritingInProgress = signal(false);
  protected readonly isProofreadingInProgress = signal(false);

  readonly writerAPIInfo: APIInfo = {
    name: 'Writer API',
    availability: this.writerApiService.availability,
    downloadProgress: this.writerApiService.downloadProgress,
    error: this.writerAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/writer-api',
        name: 'Chrome Developers Docs',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#writer-api-for-gemini-nano',
        name: 'chrome://flags/#writer-api-for-gemini-nano',
      },
    ],
  };

  readonly rewriterAPIInfo: APIInfo = {
    name: 'Rewriter API',
    availability: this.rewriterApiService.availability,
    downloadProgress: this.rewriterApiService.downloadProgress,
    error: this.rewriterAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/rewriter-api',
        name: 'Chrome Developers Docs',
      },
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#rewriter-api-for-gemini-nano',
        name: 'chrome://flags/#rewriter-api-for-gemini-nano',
      },
    ],
  };

  readonly proofreaderAPIInfo: APIInfo = {
    name: 'Proofreader API',
    availability: this.proofreaderApiService.availability,
    downloadProgress: this.proofreaderApiService.downloadProgress,
    error: this.proofreaderAPIError,
    docsLinks: [
      {
        link: 'https://developer.chrome.com/docs/ai/proofreader-api',
        name: 'Chrome Developers Docs',
      },
      {
        link: 'https://github.com/webmachinelearning/proofreader-api',
        name: 'Explainer',
      }
    ],
    chromeInternalLinks: [
      {
        link: 'chrome://on-device-internals',
        name: 'chrome://on-device-internals',
      },
      {
        link: 'chrome://flags/#proofreader-api-for-gemini-nano',
        name: 'chrome://flags/#proofreader-api-for-gemini-nano',
      },
    ],
  };

  writerConfig = {
    tone: 'formal',
    format: 'plain-text',
    length: 'short',
    context: 'Bug reports are related to software issues on that galaxy spaceship that is controlled by hybrid AI-improved humanoids.',
    outputLanguage: 'en',
  };

  rewriterConfig = {
    tone: 'more-casual',
    format: 'as-is',
    length: 'as-is',
    context: 'Include a call to action for Galaxy Commander General Geminius Nand to take care of the problem and hide all the proofs.',
    outputLanguage: 'en',
  };

  bugReportText = 'Please write a bug report about security issue.';

  protected readonly writerTones: WriterTone[] = ['formal', 'neutral', 'casual'];
  protected readonly writerFormats: WriterFormats[] = ['markdown', 'plain-text'];
  protected readonly writerSizes: WriterSize[] = ['short', 'medium', 'long'];

  protected readonly rewriterTones: RewriterTone[] = ['more-formal', 'as-is', 'more-casual'];
  protected readonly rewriterFormats: RewriterFormats[] = ['as-is', 'markdown', 'plain-text'];
  protected readonly rewriterSizes: RewriterSize[] = ['as-is', 'shorter', 'longer'];

  protected readonly writerResult = signal('');
  protected readonly rewriterResult = signal('');
  protected readonly proofreaderResult = signal<ProofreadResult | null>(null);
  protected readonly outputLanguages = ['en', 'es', 'ja'].map((langCode) => {
    return {
      displayValue: this.languageTagToHumanReadable(langCode, 'en') ?? langCode,
      value: langCode,
    };
  });

  downloadWriterModel() {
    this.writerApiService.createWriter().catch((error) => {
      this.writerAPIError.set(error.message);
    });
  }

  downloadRewriterModel() {
    this.rewriterApiService.createRewriter().catch((error) => {
      this.rewriterAPIError.set(error.message);
    });
  }

  downloadProofreaderModel() {
    this.proofreaderApiService.createProofreader().catch((error) => {
      this.proofreaderAPIError.set(error.message);
    });
  }

  async write() {
    this.writerAPIError.set(null);
    this.isWritingInProgress.set(true);
    try {
      const result = await this.writerApiService.write(
        this.bugReportText ?? '',
        this.writerConfig as WriterOptions,
        this.writerConfig.context ?? undefined,
      );
      this.writerResult.set(result);
    } catch (e: unknown) {
      this.writerAPIError.set((e as Error).message);
    } finally {
      this.isWritingInProgress.set(false);
    }
  }

  async writeStreaming() {
    this.writerAPIError.set(null);
    this.isWritingInProgress.set(true);
    try {
      const stream = await this.writerApiService.writeStreaming(
        this.bugReportText ?? '',
        this.writerConfig as WriterOptions,
        this.writerConfig.context ?? undefined,
      );
      this.writerResult.set('');
      for await (const chunk of stream) {
        this.writerResult.update(value => value + chunk);
      }
    } catch (e: unknown) {
      this.writerAPIError.set((e as Error).message);
    } finally {
      this.isWritingInProgress.set(false);
    }
  }

  async rewrite() {
    this.rewriterAPIError.set(null);
    this.isRewritingInProgress.set(true);
    try {
      const result = await this.rewriterApiService.rewrite(
        this.bugReportText ?? '',
        this.rewriterConfig as RewriterOptions,
        this.rewriterConfig.context ?? undefined,
      );
      this.rewriterResult.set(result);
    } catch (error: unknown) {
      this.rewriterAPIError.set((error as Error).message);
    } finally {
      this.isRewritingInProgress.set(false);
    }
  }

  async rewriteStreaming() {
    this.rewriterAPIError.set(null);
    this.isRewritingInProgress.set(true);
    try {
      const stream = await this.rewriterApiService.rewriteStreaming(
        this.bugReportText ?? '',
        this.rewriterConfig as RewriterOptions,
        this.rewriterConfig.context ?? undefined,
      );
      this.rewriterResult.set('');
      for await (const chunk of stream) {
        this.rewriterResult.update(value => value + chunk);
      }
    } catch (error: unknown) {
      this.rewriterAPIError.set((error as Error).message);
    } finally {
      this.isRewritingInProgress.set(false);
    }
  }

  async proofread() {
    this.proofreaderAPIError.set(null);
    this.isProofreadingInProgress.set(true);
    try {
      const result = await this.proofreaderApiService.proofread(
        this.bugReportText ?? '',
      );
      this.proofreaderResult.set(result);
    } catch (error: unknown) {
      this.proofreaderAPIError.set((error as Error).message);
    } finally {
      this.isProofreadingInProgress.set(false);
    }
  }

  ngOnDestroy() {
    this.writerApiService.destroy();
    this.rewriterApiService.destroy();
    this.proofreaderApiService.destroy();
  }

  private languageTagToHumanReadable(languageTag: string, targetLanguage: string) {
    const displayNames = new Intl.DisplayNames([targetLanguage], {
      type: 'language',
    });
    return displayNames.of(languageTag);
  }
}
