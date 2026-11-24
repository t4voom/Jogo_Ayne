/**
 * Registro de eventos do jogo. Sem DOM: os "sinks" (console, IndexedDB, tela de
 * erro) são plugados pela borda da aplicação. Mantém um buffer circular com as
 * últimas entradas para o diagnóstico em Configurações.
 *
 * Regra do projeto: erros nunca são engolidos — ou são tratados e registrados
 * aqui, ou sobem até a captura global.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly time: number;
  readonly level: LogLevel;
  readonly scope: string;
  readonly message: string;
  readonly detail?: string;
}

export type LogSink = (entry: LogEntry) => void;

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: unknown): void;
  child(scope: string): Logger;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MAX_DETAIL = 2000;

/** Converte qualquer coisa lançada em texto legível, sem nunca lançar. */
export function describeError(value: unknown): string {
  if (value instanceof Error) {
    const cause = value.cause === undefined ? '' : ` (causa: ${describeError(value.cause)})`;
    return `${value.name}: ${value.message}${cause}`;
  }
  if (typeof value === 'string') return value;
  // JSON.stringify devolve undefined para estes, apesar da tipagem dizer string.
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    // Ex.: estruturas circulares.
    return Object.prototype.toString.call(value);
  }
}

function detailOf(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  let text: string;
  if (data instanceof Error) {
    text = data.stack ?? describeError(data);
  } else {
    text = describeError(data);
  }
  return text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL)}…` : text;
}

export class LogHub {
  private readonly buffer: LogEntry[] = [];
  private readonly sinks = new Set<LogSink>();

  constructor(
    private readonly capacity = 200,
    private minLevel: LogLevel = 'debug',
    private readonly now: () => number = Date.now,
  ) {}

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  addSink(sink: LogSink): () => void {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }

  recent(): readonly LogEntry[] {
    return [...this.buffer];
  }

  write(level: LogLevel, scope: string, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const detail = detailOf(data);
    const entry: LogEntry = {
      time: this.now(),
      level,
      scope,
      message,
      ...(detail === undefined ? {} : { detail }),
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.capacity) this.buffer.shift();
    for (const sink of this.sinks) {
      try {
        sink(entry);
      } catch {
        // Um sink com defeito não pode derrubar o jogo nem gerar recursão de log.
      }
    }
  }

  logger(scope: string): Logger {
    return {
      debug: (m, d) => this.write('debug', scope, m, d),
      info: (m, d) => this.write('info', scope, m, d),
      warn: (m, d) => this.write('warn', scope, m, d),
      error: (m, e) => this.write('error', scope, m, e),
      child: (sub) => this.logger(`${scope}:${sub}`),
    };
  }
}

/** Hub global do app. Testes criam o próprio LogHub. */
export const logHub = new LogHub();

export function createLogger(scope: string): Logger {
  return logHub.logger(scope);
}
