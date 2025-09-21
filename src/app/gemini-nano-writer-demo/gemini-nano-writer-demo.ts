import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    ReactiveFormsModule,
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
      {
        link: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
        name: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
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
      {
        link: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
        name: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
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
      {
        link: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
        name: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
      },
    ],
  };

  readonly writerForm = new FormGroup({
    tone: new FormControl<WriterTone>('formal'),
    format: new FormControl<WriterFormats>('markdown'),
    length: new FormControl<WriterSize>('medium'),
    context: new FormControl(''),
  });

  readonly rewriterForm = new FormGroup({
    tone: new FormControl<RewriterTone>('as-is'),
    format: new FormControl<RewriterFormats>('as-is'),
    length: new FormControl<RewriterSize>('as-is'),
    context: new FormControl(''),
  });

  readonly bugReportControl = new FormControl('Please write a bug report about a button that is not working.');

  readonly writerTones: WriterTone[] = ['formal', 'neutral', 'casual'];
  readonly writerFormats: WriterFormats[] = ['markdown', 'plain-text'];
  readonly writerSizes: WriterSize[] = ['short', 'medium', 'long'];

  readonly rewriterTones: RewriterTone[] = ['more-formal', 'as-is', 'more-casual'];
  readonly rewriterFormats: RewriterFormats[] = ['as-is', 'markdown', 'plain-text'];
  readonly rewriterSizes: RewriterSize[] = ['as-is', 'shorter', 'longer'];

  readonly writerResult = signal('');
  readonly rewriterResult = signal('');
  readonly proofreaderResult = signal<ProofreadResult | null>(null);

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
    try {
      const result = await this.writerApiService.write(
        this.bugReportControl.value ?? '',
        this.writerForm.value as WriterOptions,
        this.writerForm.value.context ?? undefined,
      );
      this.writerResult.set(result);
    } catch (e: unknown) {
      this.writerAPIError.set((e as Error).message);
    }
  }

  async writeStreaming() {
    this.writerAPIError.set(null);
    try {
      const stream = await this.writerApiService.writeStreaming(
        this.bugReportControl.value ?? '',
        this.writerForm.value as WriterOptions,
        this.writerForm.value.context ?? undefined,
      );
      this.writerResult.set('');
      for await (const chunk of stream) {
        this.writerResult.update(value => value + chunk);
      }
    } catch (e: unknown) {
      this.writerAPIError.set((e as Error).message);
    }
  }

  async rewrite() {
    this.rewriterAPIError.set(null);
    try {
      const result = await this.rewriterApiService.rewrite(
        this.bugReportControl.value ?? '',
        this.rewriterForm.value as RewriterOptions,
        this.rewriterForm.value.context ?? undefined,
      );
      this.rewriterResult.set(result);
    } catch (e: unknown) {
      this.rewriterAPIError.set((e as Error).message);
    }
  }

  async rewriteStreaming() {
    this.rewriterAPIError.set(null);
    try {
      const stream = await this.rewriterApiService.rewriteStreaming(
        this.bugReportControl.value ?? '',
        this.rewriterForm.value as RewriterOptions,
        this.rewriterForm.value.context ?? undefined,
      );
      this.rewriterResult.set('');
      for await (const chunk of stream) {
        this.rewriterResult.update(value => value + chunk);
      }
    } catch (e: unknown) {
      this.rewriterAPIError.set((e as Error).message);
    }
  }

  async proofread() {
    this.proofreaderAPIError.set(null);
    try {
      const result = await this.proofreaderApiService.proofread(
        this.bugReportControl.value ?? '',
      );
      this.proofreaderResult.set(result);
    } catch (e: unknown) {
      this.proofreaderAPIError.set((e as Error).message);
    }
  }

  ngOnDestroy() {
    this.writerApiService.destroy();
    this.rewriterApiService.destroy();
    this.proofreaderApiService.destroy();
  }
}
