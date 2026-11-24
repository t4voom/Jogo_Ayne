import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeAppsScript, type FakeEnv } from '../../apps-script/test/fake-apps-script';
import { sequentialIds } from '../../src/core/ids';
import { LogHub } from '../../src/core/log';
import type { PlacedItem, Room, RoomId } from '../../src/core/model';
import { createProfile, type Profile } from '../../src/core/profile';
import { createRoom } from '../../src/core/rooms';
import { ApiError, SheetsApi, type Transport } from '../../src/persistence/sheets-api';
import {
  SyncEngine,
  backoffDelay,
  type OutboxEntry,
  type OutboxStore,
  type SyncHost,
  type SyncSnapshot,
} from '../../src/persistence/sync-engine';

const PIN = '314159';

class MemoryOutbox implements OutboxStore {
  readonly map = new Map<string, OutboxEntry>();
  list() {
    return Promise.resolve([...this.map.values()]);
  }
  put(e: OutboxEntry) {
    this.map.set(e.key, e);
    return Promise.resolve();
  }
  remove(key: string) {
    this.map.delete(key);
    return Promise.resolve();
  }
}

/** Um "aparelho": estado em memória + motor de sync falando com o servidor falso. */
class Device implements SyncHost {
  rooms = new Map<RoomId, Room>();
  profile: Profile = createProfile(0);
  backups: { kind: string; key: string; data: unknown }[] = [];
  applied: { kind: string; id: string; reason: string }[] = [];
  future = 0;
  online = true;
  failNext: ('network' | 'http')[] = [];
  pin = PIN;
  readonly outboxStore = new MemoryOutbox();
  readonly engine: SyncEngine;
  readonly statuses: SyncSnapshot[] = [];
  readonly ids: () => string;
  calls = 0;

  constructor(
    readonly name: string,
    env: FakeEnv,
    readonly clock: { now: number },
  ) {
    this.ids = sequentialIds(name);
    const transport: Transport = async (body) => {
      this.calls++;
      await Promise.resolve();
      const fail = this.failNext.shift();
      if (!this.online || fail === 'network') throw new ApiError('network', 'offline');
      if (fail === 'http') throw new ApiError('http', 'A planilha respondeu 500');
      return env.gs.doPost({ postData: { contents: body } }).getContent();
    };
    const api = new SheetsApi(transport, () => ({ pin: this.pin, deviceId: name }));
    this.engine = new SyncEngine(api, this, this.outboxStore, {
      now: () => clock.now,
      random: () => 0.5,
      logger: new LogHub().logger(name),
      isOnline: () => this.online,
    });
    this.engine.subscribe((s) => this.statuses.push(s));
  }

  // SyncHost
  getRoom(id: RoomId) {
    return this.rooms.get(id);
  }
  applyRemoteRoom(room: Room) {
    this.rooms.set(room.id, room);
  }
  setRoomRevision(id: RoomId, revision: number) {
    const r = this.rooms.get(id);
    if (r) this.rooms.set(id, { ...r, revision });
  }
  getProfile() {
    return this.profile;
  }
  applyRemoteProfile(p: Profile) {
    this.profile = p;
  }
  starBalance() {
    return 0;
  }
  backup(kind: 'room' | 'profile', key: string, data: unknown) {
    this.backups.push({ kind, key, data });
    return Promise.resolve();
  }
  remoteApplied(kind: 'room' | 'profile', id: string, reason: 'newer' | 'conflict') {
    this.applied.push({ kind, id, reason });
  }
  futureVersion() {
    this.future++;
  }

  /** Simula a jogadora mexendo num cômodo. */
  edit(id: RoomId, items: number): Room {
    this.clock.now += 1000;
    const base = this.rooms.get(id) ?? createRoom(id, this.ids, this.clock.now);
    const extra: PlacedItem[] = Array.from({ length: items }, (_, i) => ({
      uid: `${this.name}-${this.clock.now}-${i}`,
      itemId: 'gatinho',
      x: 10 + i,
      y: 50,
      w: 10,
      rot: 0,
      flip: false,
      color: 'rosa',
      locked: false,
    }));
    const room = { ...base, items: [...base.items, ...extra], updatedAt: this.clock.now };
    this.rooms.set(id, room);
    this.engine.markRoomDirty(id);
    return room;
  }
}

let env: FakeEnv;
let clock: { now: number };

beforeEach(() => {
  vi.useFakeTimers();
  env = createFakeAppsScript({ pin: PIN });
  clock = { now: 1_000_000 };
});
afterEach(() => {
  vi.useRealTimers();
});

const settle = () => vi.advanceTimersByTimeAsync(3_500);

describe('SyncEngine', () => {
  it('envia após o debounce de 3 s, uma vez por cômodo, e marca a revisão', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.edit('quarto', 1);
    a.edit('quarto', 1);
    a.edit('quarto', 1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(a.calls).toBe(1); // só o load do start
    await settle();
    expect(a.calls).toBe(2); // um único saveRoom com o último estado
    expect(a.rooms.get('quarto')?.revision).toBe(1);
    expect(a.outboxStore.map.size).toBe(0);
    expect(a.engine.state.status).toBe('synced');
  });

  it('o outro aparelho recebe ao abrir', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.edit('quarto', 2);
    await settle();
    const b = new Device('celular', env, clock);
    await b.engine.start();
    expect(b.rooms.get('quarto')?.items).toHaveLength(4);
    expect(b.rooms.get('quarto')?.revision).toBe(1);
  });

  it('remoto mais novo atualiza a tela com aviso', async () => {
    const a = new Device('tablet', env, clock);
    const b = new Device('celular', env, clock);
    await a.engine.start();
    await b.engine.start();
    a.edit('trono', 1);
    await settle();
    await b.engine.pull();
    a.edit('trono', 1);
    await settle();
    await b.engine.pull();
    expect(b.rooms.get('trono')?.items).toHaveLength(a.rooms.get('trono')!.items.length);
    expect(b.applied).toContainEqual({ kind: 'room', id: 'trono', reason: 'newer' });
  });

  it('offline: guarda na fila, mostra nuvem cinza e envia quando volta', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.online = false;
    a.edit('quarto', 1);
    await settle();
    expect(a.engine.state.status).toBe('offline');
    expect(a.outboxStore.map.get('room:quarto')?.attempts).toBe(1);
    a.online = true;
    await a.engine.retryNow();
    expect(a.engine.state.status).toBe('synced');
    expect(env.spreadsheet.getSheetByName('saves')!.dataRows()).toHaveLength(1);
  });

  it('a fila sobrevive a reiniciar o app', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.online = false;
    a.edit('closet', 1);
    await settle();
    // "Reabre" o app com a mesma fila e o mesmo estado.
    const again = new Device('tablet', env, clock);
    again.rooms = a.rooms;
    for (const [k, v] of a.outboxStore.map) again.outboxStore.map.set(k, v);
    await again.engine.start();
    expect(again.outboxStore.map.size).toBe(0);
    expect(again.rooms.get('closet')?.revision).toBe(1);
  });

  it('retry com backoff exponencial em erro do servidor', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.failNext = ['http', 'http'];
    a.edit('quarto', 1);
    await settle(); // 1ª falha → espera ~2 s
    expect(a.outboxStore.map.get('room:quarto')?.attempts).toBe(1);
    clock.now += backoffDelay(1, () => 0.5);
    await vi.advanceTimersByTimeAsync(3_100); // 2ª falha → espera ~4 s
    expect(a.outboxStore.map.get('room:quarto')?.attempts).toBe(2);
    clock.now += backoffDelay(2, () => 0.5);
    await vi.advanceTimersByTimeAsync(4_100);
    expect(a.outboxStore.map.size).toBe(0);
    expect(a.engine.state.status).toBe('synced');
  });

  it('backoff cresce e tem teto', () => {
    expect(backoffDelay(1, () => 0.5)).toBe(2_000);
    expect(backoffDelay(3, () => 0.5)).toBe(8_000);
    expect(backoffDelay(30, () => 0.5)).toBe(300_000);
    expect(backoffDelay(2, () => 0)).toBe(3_200);
  });

  it('conflito real: fica o mais recente e o outro vira versão anterior', async () => {
    const a = new Device('tablet', env, clock);
    const b = new Device('celular', env, clock);
    await a.engine.start();
    a.edit('quarto', 1);
    await settle();
    await b.engine.start();
    // Os dois mexem offline no mesmo cômodo; o celular por último.
    a.online = false;
    b.online = false;
    a.edit('quarto', 1);
    b.edit('quarto', 3);
    await settle();
    a.online = true;
    await a.engine.retryNow(); // tablet sobe primeiro (rev 2)
    b.online = true;
    await b.engine.retryNow(); // celular recebe conflito, mas é mais novo → vence
    await b.engine.flushNow();
    expect(b.backups.map((x) => x.kind)).toEqual(['room']);
    const server = new Device('olheiro', env, clock);
    await server.engine.start();
    expect(server.rooms.get('quarto')?.items).toHaveLength(b.rooms.get('quarto')!.items.length);
    expect(server.rooms.get('quarto')?.revision).toBe(3);
    // O tablet, sem pendências, recebe a versão vencedora com aviso.
    await a.engine.pull();
    expect(a.rooms.get('quarto')?.items).toHaveLength(b.rooms.get('quarto')!.items.length);
    expect(a.applied.at(-1)).toMatchObject({ id: 'quarto', reason: 'newer' });
  });

  it('conflito em que o outro aparelho é mais novo: aplica o remoto e guarda o local', async () => {
    const a = new Device('tablet', env, clock);
    const b = new Device('celular', env, clock);
    await a.engine.start();
    await b.engine.start();
    b.online = false;
    b.edit('quarto', 1); // mais antigo
    a.edit('quarto', 2); // mais novo
    await settle();
    b.online = true;
    await b.engine.retryNow();
    expect(b.rooms.get('quarto')?.items).toHaveLength(a.rooms.get('quarto')!.items.length);
    expect(b.backups).toHaveLength(1);
    expect(b.applied).toContainEqual({ kind: 'room', id: 'quarto', reason: 'conflict' });
    expect(b.outboxStore.map.size).toBe(0);
  });

  it('cômodo enorme passa em pedaços pela planilha e volta igual', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    const rnd = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const items: PlacedItem[] = Array.from({ length: 480 }, () => ({
      uid: (rnd() + rnd()).slice(0, 60),
      itemId: (rnd() + rnd()).slice(0, 60),
      x: Math.random() * 100,
      y: 50,
      w: 10,
      rot: 0,
      flip: false,
      color: 'rosa',
      locked: false,
    }));
    a.rooms.set('baile', { ...createRoom('baile', a.ids, 1), items, updatedAt: 5 });
    a.engine.markRoomDirty('baile');
    await settle();
    expect(env.spreadsheet.getSheetByName('saves')!.dataRows().length).toBeGreaterThan(1);
    const b = new Device('celular', env, clock);
    await b.engine.start();
    expect(b.rooms.get('baile')?.items).toEqual(items);
  });

  it('PIN errado: pede o código e não insiste; com o código certo sincroniza', async () => {
    const a = new Device('tablet', env, clock);
    a.pin = 'errado';
    await a.engine.start();
    expect(a.engine.state.status).toBe('needs-pin');
    a.edit('quarto', 1);
    await settle();
    expect(a.calls).toBe(1);
    a.pin = PIN;
    await a.engine.credentialsChanged();
    expect(a.engine.state.status).toBe('synced');
    expect(a.rooms.get('quarto')?.revision).toBe(1);
  });

  it('mudança durante o envio continua pendente', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.edit('quarto', 1);
    const flushing = a.engine.flushNow();
    a.edit('quarto', 1); // chega enquanto o envio está no ar
    await flushing;
    expect(a.outboxStore.map.has('room:quarto')).toBe(true);
    await settle();
    expect(a.outboxStore.map.size).toBe(0);
    const b = new Device('celular', env, clock);
    await b.engine.start();
    expect(b.rooms.get('quarto')?.items).toHaveLength(a.rooms.get('quarto')!.items.length);
  });

  it('perfil: sobe, desce e mescla sem perder o tutorial', async () => {
    const a = new Device('tablet', env, clock);
    const b = new Device('celular', env, clock);
    await a.engine.start();
    a.profile = { ...a.profile, tutorialDone: true, updatedAt: 10 };
    a.engine.markProfileDirty();
    await settle();
    expect(a.profile.revision).toBe(1);
    b.profile = { ...b.profile, settings: { ...b.profile.settings, music: false }, updatedAt: 20 };
    b.engine.markProfileDirty();
    await b.engine.start();
    await settle();
    expect(b.profile).toMatchObject({ tutorialDone: true, settings: { music: false } });
    await a.engine.pull();
    expect(a.profile).toMatchObject({
      tutorialDone: true,
      settings: { music: false },
      revision: 2,
    });
  });

  it('sem URL configurada o motor fica desativado', async () => {
    const host = new Device('x', env, clock);
    const engine = new SyncEngine(null, host, new MemoryOutbox());
    await engine.start();
    engine.markRoomDirty('quarto');
    expect(engine.state.status).toBe('disabled');
    expect(engine.enabled).toBe(false);
  });

  it('cômodo de versão futura não é aplicado e avisa', async () => {
    const a = new Device('tablet', env, clock);
    await a.engine.start();
    a.edit('quarto', 1);
    await settle();
    const rows = env.spreadsheet.getSheetByName('saves')!;
    const LZ = (await import('lz-string')).default;
    const raw = JSON.parse(LZ.decompressFromBase64(String(rows.data[1]![4]))) as Record<
      string,
      unknown
    >;
    rows.data[1]![4] = LZ.compressToBase64(JSON.stringify({ ...raw, schemaVersion: 99 }));
    rows.data[1]![6] = '5';
    const b = new Device('celular', env, clock);
    await b.engine.start();
    expect(b.future).toBe(1);
    expect(b.rooms.has('quarto')).toBe(false);
  });
});
