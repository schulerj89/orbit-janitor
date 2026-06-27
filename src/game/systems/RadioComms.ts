export type RadioSpeaker = 'DISPATCH' | 'AUTOPILOT' | 'CLEANUP OPS';

export interface RadioMessage {
  speaker: RadioSpeaker;
  text: string;
  id?: string;
  displaySeconds?: number;
}

export interface RadioCommsSnapshot {
  isVisible: boolean;
  speaker: RadioSpeaker | '';
  text: string;
  timeRemaining: number;
}

const DEFAULT_DISPLAY_SECONDS = 4.1;
const MIN_DISPLAY_SECONDS = 3;
const MAX_DISPLAY_SECONDS = 5;

export class RadioComms {
  private readonly queue: RadioMessage[] = [];
  private readonly seenIds = new Set<string>();
  private activeMessage: RadioMessage | null = null;
  private timeRemaining = 0;

  queueMessage(message: RadioMessage): void {
    if (message.id && this.hasSeenOrQueued(message.id)) {
      return;
    }

    if (message.id) {
      this.seenIds.add(message.id);
    }

    this.queue.push(message);
  }

  update(delta: number): void {
    if (!this.activeMessage) {
      this.showNextMessage();
      return;
    }

    this.timeRemaining = Math.max(0, this.timeRemaining - delta);

    if (this.timeRemaining <= 0) {
      this.activeMessage = null;
      this.showNextMessage();
    }
  }

  skipCurrent(): void {
    if (!this.activeMessage) {
      return;
    }

    this.activeMessage = null;
    this.timeRemaining = 0;
    this.showNextMessage();
  }

  clear(): void {
    this.queue.length = 0;
    this.activeMessage = null;
    this.timeRemaining = 0;
  }

  getSnapshot(): RadioCommsSnapshot {
    return {
      isVisible: this.activeMessage !== null,
      speaker: this.activeMessage?.speaker ?? '',
      text: this.activeMessage?.text ?? '',
      timeRemaining: this.timeRemaining
    };
  }

  private showNextMessage(): void {
    const nextMessage = this.queue.shift();

    if (!nextMessage) {
      return;
    }

    this.activeMessage = nextMessage;
    this.timeRemaining = clampDisplaySeconds(
      nextMessage.displaySeconds ?? DEFAULT_DISPLAY_SECONDS
    );
  }

  private hasSeenOrQueued(id: string): boolean {
    return (
      this.seenIds.has(id) ||
      this.activeMessage?.id === id ||
      this.queue.some((message) => message.id === id)
    );
  }
}

function clampDisplaySeconds(value: number): number {
  return Math.max(MIN_DISPLAY_SECONDS, Math.min(MAX_DISPLAY_SECONDS, value));
}
