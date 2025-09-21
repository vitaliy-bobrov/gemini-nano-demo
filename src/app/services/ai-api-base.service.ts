import { signal } from "@angular/core";

/**
 * Base service for AI API interactions.
 * This class can be extended by specific AI API services.
 */
export abstract class AiApiBaseService {
  protected readonly availabilityStatus = signal<AiApiAvailability | 'checking'>('checking');
  protected readonly downloadProgressState = signal<number | null>(null);
  protected readonly modelTotalSizeState = signal<number | null>(null);

  public readonly downloadProgress = this.downloadProgressState.asReadonly();
  public readonly availability = this.availabilityStatus.asReadonly();
  public readonly modelTotalSize = this.modelTotalSizeState.asReadonly();

  constructor() {
    this.checkAvailability();
  }

  /** Checks is user activation was performed */
  protected isUserActivated(): boolean {
    return navigator?.userActivation?.isActive ?? false;
  }

  /** Checks for built-in AI API availability */
  async checkAvailability(): Promise<void> { }
}
