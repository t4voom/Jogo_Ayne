/**
 * Simulação fiel (o suficiente) dos serviços do Google Apps Script usados pelo
 * Code.gs, para rodar o backend de verdade dentro dos testes (Node + vm).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

type Cell = string | number;

class FakeRange {
  constructor(
    private readonly sheet: FakeSheet,
    private readonly row: number,
    private readonly col: number,
    private readonly rows: number,
    private readonly cols: number,
  ) {}

  getValues(): Cell[][] {
    this.sheet.reads++;
    const out: Cell[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const src = this.sheet.data[this.row - 1 + r] ?? [];
      const line: Cell[] = [];
      for (let c = 0; c < this.cols; c++) line.push(src[this.col - 1 + c] ?? '');
      out.push(line);
    }
    return out;
  }

  setValues(values: Cell[][]): this {
    this.sheet.writes++;
    if (values.length !== this.rows || values.some((v) => v.length !== this.cols)) {
      throw new Error(
        `setValues: dimensões erradas (${values.length}x${values[0]?.length ?? 0} vs ${this.rows}x${this.cols})`,
      );
    }
    for (let r = 0; r < this.rows; r++) {
      const target = (this.sheet.data[this.row - 1 + r] ??= []);
      for (let c = 0; c < this.cols; c++) {
        const v = values[r]?.[c] ?? '';
        if (typeof v === 'string' && v.length > 50000)
          throw new Error('Célula com mais de 50.000 caracteres');
        // O Sheets devolve texto para colunas em formato texto ("@").
        target[this.col - 1 + c] = typeof v === 'number' ? String(v) : v;
      }
    }
    return this;
  }

  clearContent(): this {
    this.sheet.writes++;
    for (let r = 0; r < this.rows; r++) {
      const target = this.sheet.data[this.row - 1 + r];
      if (!target) continue;
      for (let c = 0; c < this.cols; c++) target[this.col - 1 + c] = '';
    }
    return this;
  }

  setNumberFormat(): this {
    return this;
  }
  setFontWeight(): this {
    return this;
  }
  setBackground(): this {
    return this;
  }
}

export class FakeSheet {
  data: Cell[][] = [];
  reads = 0;
  writes = 0;
  constructor(readonly name: string) {}

  getRange(row: number, col: number, rows = 1, cols = 1): FakeRange {
    return new FakeRange(this, row, col, rows, cols);
  }

  getLastRow(): number {
    for (let r = this.data.length - 1; r >= 0; r--) {
      if (this.data[r]?.some((v) => v !== '')) return r + 1;
    }
    return 0;
  }

  getMaxRows(): number {
    return Math.max(1000, this.data.length);
  }

  appendRow(values: Cell[]): void {
    this.writes++;
    this.data.splice(this.getLastRow(), 0, values.map(String));
  }

  deleteRows(start: number, count: number): void {
    this.data.splice(start - 1, count);
  }

  setFrozenRows(): void {
    /* visual */
  }

  /** Linhas de dados (sem cabeçalho, sem vazias). */
  dataRows(): Cell[][] {
    return this.data.slice(1, this.getLastRow());
  }
}

export class FakeSpreadsheet {
  readonly sheets = new Map<string, FakeSheet>();
  getSheetByName(name: string): FakeSheet | null {
    return this.sheets.get(name) ?? null;
  }
  insertSheet(name: string): FakeSheet {
    const s = new FakeSheet(name);
    this.sheets.set(name, s);
    return s;
  }
}

export interface FakeEnv {
  readonly spreadsheet: FakeSpreadsheet;
  readonly properties: Map<string, string>;
  readonly cache: Map<string, { value: string; until: number }>;
  readonly logs: string[];
  clock: { now: number };
  lockBusy: boolean;
  /** Funções globais do Code.gs. */
  readonly gs: {
    doPost(e: unknown): { getContent(): string };
    doGet(e: unknown): { getContent(): string };
    setup(): void;
    splitChunks(text: string): string[];
  };
}

const CODE = readFileSync(fileURLToPath(new URL('../Code.gs', import.meta.url)), 'utf8');

/** Cria um "servidor" novo com o Code.gs carregado. */
export function createFakeAppsScript(options: { pin?: string } = {}): FakeEnv {
  const spreadsheet = new FakeSpreadsheet();
  const properties = new Map<string, string>();
  if (options.pin !== undefined) properties.set('PIN', options.pin);
  const cache = new Map<string, { value: string; until: number }>();
  const logs: string[] = [];
  const clock = { now: 1_700_000_000_000 };
  const env = { lockBusy: false };

  const DateShim = class extends Date {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(clock.now);
      else super(...(args as [string]));
    }
    static override now(): number {
      return clock.now;
    }
  };

  const context = vm.createContext({
    Date: DateShim,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Error,
    isFinite,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => properties.get(k) ?? null,
        setProperty: (k: string, v: string) => {
          properties.set(k, v);
        },
        deleteProperty: (k: string) => {
          properties.delete(k);
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => {
          const e = cache.get(k);
          if (!e || e.until <= clock.now) return null;
          return e.value;
        },
        put: (k: string, v: string, ttl = 600) => {
          cache.set(k, { value: v, until: clock.now + ttl * 1000 });
        },
        remove: (k: string) => {
          cache.delete(k);
        },
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          if (env.lockBusy) throw new Error('Lock timeout');
        },
        releaseLock: () => {
          /* ok */
        },
      }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text: string) => {
        const out = {
          getContent: () => text,
          setMimeType: () => out,
        };
        return out;
      },
    },
    Logger: {
      log: (m: string) => {
        logs.push(m);
      },
    },
  });
  vm.runInContext(CODE, context, { filename: 'Code.gs' });

  return {
    spreadsheet,
    properties,
    cache,
    logs,
    clock,
    get lockBusy() {
      return env.lockBusy;
    },
    set lockBusy(v: boolean) {
      env.lockBusy = v;
    },
    gs: context as unknown as FakeEnv['gs'],
  };
}

/** Faz um POST como o cliente faria (corpo JSON em texto). */
export function post(env: FakeEnv, body: unknown): unknown {
  const out = env.gs.doPost({ postData: { contents: JSON.stringify(body), type: 'text/plain' } });
  return JSON.parse(out.getContent()) as unknown;
}
