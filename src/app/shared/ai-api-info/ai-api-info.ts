import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExternalLinkComponent } from '../external-link/external-link';

export interface Link { link: string; name: string; }

@Component({
  selector: 'gmd-ai-api-info',
  templateUrl: './ai-api-info.html',
  styleUrl: './ai-api-info.scss',
  imports: [
    ExternalLinkComponent,
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatExpansionModule,
    MatListModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AIAPIInfoComponent {
  readonly name = input.required<string>();
  readonly availability = input.required<AiApiAvailability | 'checking'>();
  readonly downloadProgress = input.required<number | null>();
  readonly error = input.required<string | null>();
  readonly docsLinks = input.required<Link[]>();
  readonly chromeInternalLinks = input.required<Link[]>();
  readonly download = output();

  protected readonly statusText = computed(() => {
    return `Status: ${this.availability()}`;
  });

  protected readonly downloadProgressValue = computed(() => {
    if (this.availability() === 'available') {
      return 100
    }
    return this.downloadProgress();
  });

  protected downloadModel(event: Event) {
    event.preventDefault();
    this.download.emit();
  }
}
