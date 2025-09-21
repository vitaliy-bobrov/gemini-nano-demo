export type APIInfo = {
  readonly name: string;
  readonly availability: () => AiApiAvailability | 'checking';
  readonly downloadProgress: () => number | null;
  readonly error: () => string | null;
  readonly docsLinks: { link: string, name: string }[];
  readonly chromeInternalLinks: { link: string, name: string }[];
}
