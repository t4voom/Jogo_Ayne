import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { sequentialIds } from '../core/ids';
import { LogHub } from '../core/log';
import { createProfile } from '../core/profile';
import { createRoom } from '../core/rooms';
import { ROOM_SCHEMA_VERSION, serializeRoom } from '../core/save';
import { LocalRepository, STORES } from './local-repository';

let repo: LocalRepository | undefined;
afterEach(() => {
  repo?.close();
  repo = undefined;
});

async function open(factory = new IDBFactory()) {
  const hub = new LogHub();
  repo = await LocalRepository.open(factory, { logger: hub.logger('t'), now: () => 99 });
  return { repo, hub, factory };
}

describe('LocalRepository', () => {
  it('salva e carrega cômodos', async () => {
    const { repo } = await open();
    const quarto = createRoom('quarto', sequentialIds(), 10);
    const fachada = createRoom('fachada', sequentialIds('f'), 20);
    await repo.saveRoom(quarto);
    await repo.saveRoom(fachada);
    const { rooms, quarantined } = await repo.loadRooms();
    expect(rooms).toHaveLength(2);
    expect(rooms.find((r) => r.id === 'quarto')).toEqual(quarto);
    expect(quarantined).toEqual([]);
  });

  it('persiste entre aberturas do banco', async () => {
    const factory = new IDBFactory();
    const first = await LocalRepository.open(factory);
    await first.saveRoom(createRoom('quarto', sequentialIds(), 1));
    first.close();
    const { repo } = await open(factory);
    expect((await repo.loadRooms()).rooms).toHaveLength(1);
  });

  it('manda cômodo corrompido para a quarentena sem apagar', async () => {
    const { repo, hub } = await open();
    const good = createRoom('fachada', sequentialIds(), 1);
    await repo.saveRoom(good);
    await repo.db.put(STORES.rooms, { id: 'quarto', schemaVersion: 1, items: 'quebrado' });
    const { rooms, quarantined } = await repo.loadRooms();
    expect(rooms.map((r) => r.id)).toEqual(['fachada']);
    expect(quarantined).toEqual(['quarto']);
    const backups = await repo.listBackups();
    expect(backups[0]).toMatchObject({ kind: 'room', key: 'quarto', reason: 'corrupt' });
    expect(hub.recent().some((e) => e.level === 'error')).toBe(true);
  });

  it('versão futura também vai para a quarentena com motivo próprio', async () => {
    const { repo } = await open();
    const room = serializeRoom(createRoom('quarto', sequentialIds(), 1));
    await repo.db.put(STORES.rooms, { ...room, schemaVersion: ROOM_SCHEMA_VERSION + 1 });
    await repo.loadRooms();
    expect((await repo.listBackups())[0]?.reason).toBe('future-version');
  });

  it('salva e carrega o perfil; perfil inválido vira null', async () => {
    const { repo } = await open();
    expect(await repo.loadProfile()).toBeNull();
    const p = createProfile(3);
    await repo.saveProfile(p);
    expect(await repo.loadProfile()).toEqual(p);
    await repo.db.put(STORES.profile, { lixo: true }, 'main');
    expect(await repo.loadProfile()).toBeNull();
  });

  it('meta valida com zod', async () => {
    const { repo } = await open();
    await repo.setMeta('deviceId', 'abc');
    expect(await repo.getMeta('deviceId', z.string())).toBe('abc');
    expect(await repo.getMeta('deviceId', z.number())).toBeUndefined();
    expect(await repo.getMeta('nada', z.string())).toBeUndefined();
    await repo.deleteMeta('deviceId');
    expect(await repo.getMeta('deviceId', z.string())).toBeUndefined();
  });

  it('poda backups antigos por chave', async () => {
    let t = 0;
    const factory = new IDBFactory();
    repo = await LocalRepository.open(factory, { now: () => ++t });
    for (let i = 0; i < 5; i++) {
      await repo.addBackup({ kind: 'room', key: 'quarto', reason: 'conflict', data: i });
    }
    await repo.addBackup({ kind: 'room', key: 'trono', reason: 'conflict', data: 'x' });
    await repo.pruneBackups(2);
    const left = await repo.listBackups();
    expect(left.filter((b) => b.key === 'quarto').map((b) => b.data)).toEqual([4, 3]);
    expect(left.filter((b) => b.key === 'trono')).toHaveLength(1);
  });
  it('guarda a foto como bytes e devolve um Blob igual', async () => {
    const { repo } = await open();
    const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
    await repo.savePhoto({
      id: 'p1',
      roomId: 'quarto',
      createdAt: 5,
      image: new Blob([bytes], { type: 'image/png' }),
      thumbnail: 'data:image/jpeg;base64,AAAA',
    });
    await repo.savePhoto({ id: 'p2', roomId: 'sala', createdAt: 9, image: null, thumbnail: 't' });
    const [newest, older] = await repo.listPhotos();
    expect(newest?.id).toBe('p2');
    expect(newest?.image).toBeNull();
    const back = (await repo.getPhoto('p1'))?.image;
    expect(back?.type).toBe('image/png');
    expect(new Uint8Array(await back!.arrayBuffer())).toEqual(bytes);
    expect(older?.id).toBe('p1');
  });
});
