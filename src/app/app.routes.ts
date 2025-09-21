import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'gemini-nano-translator-demo',
    pathMatch: 'full',
  },
  {
    path: 'gemini-nano-translator-demo',
    loadComponent: () =>
      import(
        './gemini-nano-translator-demo/gemini-nano-translator-demo'
      ).then((m) => m.GeminiNanoTranslatorDemoComponent),
  },
  {
    path: 'gemini-nano-summarizer-demo',
    loadComponent: () =>
      import(
        './gemini-nano-summarizer-demo/gemini-nano-summarizer-demo'
      ).then((m) => m.GeminiNanoSummarizerDemoComponent),
  },
  {
    path: 'gemini-nano-writer-demo',
    loadComponent: () =>
      import(
        './gemini-nano-writer-demo/gemini-nano-writer-demo'
      ).then((m) => m.GeminiNanoWriterDemoComponent),
  },
];
