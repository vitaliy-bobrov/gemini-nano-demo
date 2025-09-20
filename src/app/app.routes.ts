import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'genimi-nano-translator-demo',
    pathMatch: 'full',
  },
  {
    path: 'genimi-nano-translator-demo',
    loadComponent: () =>
      import(
        './gemini-nano-translator-demo/gemini-nano-translator-demo'
      ).then((m) => m.GeminiNanoTranslatorDemoComponent),
  },
];
