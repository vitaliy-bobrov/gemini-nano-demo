import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PromptAPIService } from '../services/prompt-api.service';
import { AIAPIInfoComponent } from '../shared/ai-api-info/ai-api-info';
import { APIInfo } from '../shared/api-info';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { rawLogInputExamples } from './data';

interface BugReportInfo {
  errorMessage: string;
  fileName: string;
  lineNumber: number;
}

@Component({
  selector: 'gemini-nano-prompt-demo',
  templateUrl: './gemini-nano-prompt-demo.html',
  styleUrl: './gemini-nano-prompt-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AIAPIInfoComponent,
    FormsModule,
    JsonPipe,
    MarkdownPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
})
export class GeminiNanoPromptDemoComponent {
  private readonly promptAPIService = inject(PromptAPIService);
  protected readonly promptAPIError = signal<string | null>(null);

  protected readonly rawLogInputExamples = rawLogInputExamples;
  protected rawLogInput = signal('');
  protected extractedJsonOutput = signal<string | BugReportInfo | null>(null);
  protected bugReportOutput = signal<string | null>(null);
  protected isExtracting = signal(false);
  protected isGeneratingReport = signal(false);
  protected extractionError = signal<string | null>(null);
  protected reportGenerationError = signal<string | null>(null);

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

  protected async extractInfoFromLog() {
    this.extractedJsonOutput.set(null);
    this.bugReportOutput.set(null);
    this.extractionError.set(null);
    this.isExtracting.set(true);

    const prompt = 'Extract the key information (error message, file name, '
      + 'line number) from the following log: '
      + this.rawLogInput()
      + '/n'
      + 'Use the following JSON schema to format the output.'
      + '"explanation" field should provide human readable explanation of the '
      + 'error.'
      + '"possibleSolution" field should provide a very short description of '
      + 'a possible solution to fix the error.'
      + '"programmingLanguage" field should specify the possible programming '
      + 'language of the code snippet.';
    const schema = {
      "type": "object",
      "properties": {
        "errorMessage": { "type": "string" },
        "fileName": { "type": "string" },
        "lineNumber": { "type": "string" },
        "programmingLanguage": { "type": "string" },
        "explanation": { "type": "string" },
        "possibleSolution": { "type": "string" }
      },
      "required": ["errorMessage", "fileName", "lineNumber"]
    };
    const options = {
      ...PromptAPIService.DefaultOptions,
      responseConstraint: schema,
    };

    this.extractedJsonOutput.set('');

    try {
      const stream = await this.promptAPIService.promptStreaming(prompt, options);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          let result: BugReportInfo | null = null;

          try {
            result = JSON.parse(this.extractedJsonOutput() as string) as BugReportInfo
          } catch (e) {
            // For whatever reason it sometimes returns markdown wrapped JSON.
            result = this.parseJsonFromMarkdown<BugReportInfo>(this.extractedJsonOutput() as string);
          }

          this.extractedJsonOutput.set(result ?? null);
          break;
        }
        this.extractedJsonOutput.update((current) => (current ?? '') + value);
      }

    } catch (error: unknown) {
      this.extractionError.set(
        error ? (error as Error).message : 'Unknown error occurred during extraction',
      );
    } finally {
      this.isExtracting.set(false);
    }
  }

  protected async generateBugReport() {
    this.bugReportOutput.set(null);
    this.reportGenerationError.set(null);
    this.isGeneratingReport.set(true);

    const extractedData = this.extractedJsonOutput();
    if (!extractedData) {
      this.reportGenerationError.set('No extracted data available to generate a report.');
      this.isGeneratingReport.set(false);
      return;
    }

    const prompt = 'Based on this structured data, write a concise bug report '
      + 'including a suggested title, a summary of the error, potential '
      + 'reproduction steps, guess on a possible module or part of tech stack (backend/frontend), '
      + 'and brief info about any possible fix solution or debug steps.'
      + `Here is the data: ${JSON.stringify(extractedData, null, 2)}`;

    try {
      const stream = await this.promptAPIService.promptStreaming(prompt);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        this.bugReportOutput.update((current) => (current ?? '') + value);
      }
    } catch (error: unknown) {
      this.reportGenerationError.set(
        error ? (error as Error).message : 'Unknown error occurred during report generation',
      );
    } finally {
      this.isGeneratingReport.set(false);
    }
  }

  protected onExampleSelected(example: string) {
    this.bugReportOutput.set(null);
    this.extractedJsonOutput.set(null);
    this.rawLogInput.set(example);
  }

  /**
 * Extracts and parses a JSON object from a markdown code block.
 *
 * This function looks for a string formatted as ```json\n{...}\n```,
 * extracts the content between the fences, and parses it.
 *
 * @param markdown The string containing the markdown ```json block.
 * @returns The parsed object of type T, or null if no valid JSON block is found or if parsing fails.
 */
  private parseJsonFromMarkdown<T>(markdown: string): T | null {
    const regex = /```json\n([\s\S]*?)\n```/;
    const match = markdown.match(regex);
    if (match && match[1]) {
      const jsonString = match[1];
      try {
        return JSON.parse(jsonString) as T;
      } catch (error) {
        console.error("Error parsing JSON from markdown:", error);
        return null;
      }
    }
    return null;
  }
}
