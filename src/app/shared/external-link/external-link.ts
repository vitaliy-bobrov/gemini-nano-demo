import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'gmd-external-link',
  templateUrl: './external-link.html',
  styleUrl: './external-link.scss',
  imports: [MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalLinkComponent {
  readonly link = input.required<string>();
}
