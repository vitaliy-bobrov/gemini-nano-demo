import { Pipe, PipeTransform } from '@angular/core';
import { parse } from 'tiny-markdown-parser';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return parse(value);
  }
}
