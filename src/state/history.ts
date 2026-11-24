import type { Command } from './commands';

/** Pilhas de desfazer/refazer de UM cômodo, com limite. */
export class History {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  constructor(private readonly limit: number) {}

  push(cmd: Command): void {
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  popUndo(): Command | undefined {
    const cmd = this.undoStack.pop();
    if (cmd) this.redoStack.push(cmd);
    return cmd;
  }

  popRedo(): Command | undefined {
    const cmd = this.redoStack.pop();
    if (cmd) this.undoStack.push(cmd);
    return cmd;
  }

  /** Desfaz o último pop (quando o command virou no-op). */
  dropLastRedo(): void {
    this.redoStack.pop();
  }

  dropLastUndo(): void {
    this.undoStack.pop();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get size(): number {
    return this.undoStack.length;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
