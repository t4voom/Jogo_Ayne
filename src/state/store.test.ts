import { describe, expect, it, vi } from 'vitest';
import { sequentialIds } from '../core/ids';
import { LogHub } from '../core/log';
import type { PlacedItem, Room } from '../core/model';
import { createProfile } from '../core/profile';
import { createRoom } from '../core/rooms';
import { GameActions } from './actions';
import { addItemCommand } from './commands';
import { Store, type StoreEvent } from './store';

function setup(historyLimit = 50) {
  let clock = 1000;
  const now = () => ++clock;
  const ids = sequentialIds('u');
  const quarto: Room = { ...createRoom('quarto', ids, 0), items: [] };
  const fachada = createRoom('fachada', ids, 0);
  const hub = new LogHub();
  const store = new Store(
    { rooms: { quarto, fachada }, profile: createProfile(0), selection: null },
    { now, historyLimit, logger: hub.logger('test') },
  );
  const actions = new GameActions(store, sequentialIds('n'));
  const events: StoreEvent[] = [];
  store.subscribe((e) => events.push(e));
  const room = () => store.getRoom('quarto')!;
  return { store, actions, events, room, hub };
}

const cama: Omit<PlacedItem, 'uid'> = {
  itemId: 'cama-dossel',
  x: 50,
  y: 60,
  w: 30,
  rot: 0,
  flip: false,
  color: 'rosa',
  locked: false,
};

describe('Store + Commands', () => {
  it('adiciona, desfaz e refaz', () => {
    const { store, actions, room } = setup();
    const item = actions.add('quarto', cama)!;
    expect(room().items).toHaveLength(1);
    expect(store.canUndo('quarto')).toBe(true);

    expect(store.undo('quarto')).toBe(true);
    expect(room().items).toHaveLength(0);
    expect(store.canRedo('quarto')).toBe(true);

    expect(store.redo('quarto')).toBe(true);
    expect(room().items[0]).toEqual(item);
  });

  it('marca updatedAt a cada mudança da jogadora', () => {
    const { actions, room } = setup();
    const before = room().updatedAt;
    actions.add('quarto', cama);
    expect(room().updatedAt).toBeGreaterThan(before);
  });

  it('nova ação apaga o refazer', () => {
    const { store, actions } = setup();
    actions.add('quarto', cama);
    store.undo('quarto');
    actions.add('quarto', { ...cama, x: 10 });
    expect(store.canRedo('quarto')).toBe(false);
  });

  it('gesto vira um passo só de desfazer com o "antes" do início', () => {
    const { store, actions, room } = setup();
    const item = actions.add('quarto', cama)!;
    actions.commitGesture('quarto', item.uid, { x: 50, y: 60 }, { x: 20, y: 30 });
    expect(room().items[0]).toMatchObject({ x: 20, y: 30 });
    store.undo('quarto');
    expect(room().items[0]).toMatchObject({ x: 50, y: 60 });
  });

  it('limita o histórico (50 por padrão)', () => {
    const { store, actions } = setup(3);
    const item = actions.add('quarto', cama)!;
    for (let i = 1; i <= 5; i++) actions.transform('quarto', item.uid, { x: i * 10 });
    let undos = 0;
    while (store.undo('quarto')) undos++;
    expect(undos).toBe(3);
  });

  it('histórico é por cômodo', () => {
    const { store, actions } = setup();
    actions.add('quarto', cama);
    expect(store.canUndo('fachada')).toBe(false);
    expect(store.undo('fachada')).toBe(false);
  });

  it('command sem efeito não entra no histórico', () => {
    const { store, actions } = setup();
    const item = actions.add('quarto', cama)!;
    expect(actions.transform('quarto', item.uid, { x: 50 })).toBe(false);
    store.undo('quarto');
    expect(store.canUndo('quarto')).toBe(false);
  });

  it('remove e desfaz devolvendo à mesma profundidade', () => {
    const { store, actions, room } = setup();
    const a = actions.add('quarto', { ...cama, itemId: 'a' })!;
    const b = actions.add('quarto', { ...cama, itemId: 'b' })!;
    const c = actions.add('quarto', { ...cama, itemId: 'c' })!;
    actions.remove('quarto', b.uid);
    expect(room().items.map((i) => i.uid)).toEqual([a.uid, c.uid]);
    store.undo('quarto');
    expect(room().items.map((i) => i.uid)).toEqual([a.uid, b.uid, c.uid]);
  });

  it('frente/trás e desfazer', () => {
    const { store, actions, room } = setup();
    const a = actions.add('quarto', cama)!;
    const b = actions.add('quarto', cama)!;
    const c = actions.add('quarto', cama)!;
    expect(actions.reorder('quarto', a.uid, 'front')).toBe(true);
    expect(room().items.map((i) => i.uid)).toEqual([b.uid, c.uid, a.uid]);
    expect(actions.reorder('quarto', a.uid, 'front')).toBe(false);
    expect(actions.reorder('quarto', a.uid, -1)).toBe(true);
    expect(room().items.map((i) => i.uid)).toEqual([b.uid, a.uid, c.uid]);
    store.undo('quarto');
    store.undo('quarto');
    expect(room().items.map((i) => i.uid)).toEqual([a.uid, b.uid, c.uid]);
    expect(actions.reorder('quarto', c.uid, 'back')).toBe(true);
    expect(room().items[0]?.uid).toBe(c.uid);
  });

  it('duplica com deslocamento, logo acima do original e destravado', () => {
    const { actions, room } = setup();
    const a = actions.add('quarto', { ...cama, x: 98, locked: true })!;
    actions.add('quarto', cama);
    const copy = actions.duplicate('quarto', a.uid)!;
    expect(copy.uid).not.toBe(a.uid);
    expect(copy).toMatchObject({ x: 94, y: 64, locked: false, itemId: 'cama-dossel' });
    expect(room().items[1]?.uid).toBe(copy.uid);
  });

  it('aumenta/diminui respeitando limites', () => {
    const { actions, room } = setup();
    const a = actions.add('quarto', { ...cama, w: 90 })!;
    actions.scale('quarto', a.uid, 1);
    actions.scale('quarto', a.uid, 1);
    expect(room().items[0]?.w).toBe(100);
    for (let i = 0; i < 40; i++) actions.scale('quarto', a.uid, -1);
    expect(room().items[0]?.w).toBe(3);
  });

  it('item travado não se mexe, mas pode destravar', () => {
    const { actions, room } = setup();
    const a = actions.add('quarto', cama)!;
    actions.toggleLock('quarto', a.uid);
    expect(actions.transform('quarto', a.uid, { x: 10 })).toBe(false);
    expect(actions.commitGesture('quarto', a.uid, { x: 50 }, { x: 10 })).toBe(false);
    expect(actions.flip('quarto', a.uid)).toBe(false);
    expect(actions.toggleLock('quarto', a.uid)).toBe(true);
    expect(actions.flip('quarto', a.uid)).toBe(true);
    expect(room().items[0]?.flip).toBe(true);
  });

  it('troca cor e normaliza rotação', () => {
    const { actions, room } = setup();
    const a = actions.add('quarto', cama)!;
    actions.setColor('quarto', a.uid, 'menta');
    actions.transform('quarto', a.uid, { rot: 370 });
    expect(room().items[0]).toMatchObject({ color: 'menta', rot: 10 });
  });

  it('pinta parede e chão; desfazer volta a pintura', () => {
    const { store, actions, room } = setup();
    const original = room().decor;
    expect(actions.paint('quarto', { wallColor: 'menta', wallPattern: 'coracoes' })).toBe(true);
    expect(room().decor).toMatchObject({ wallColor: 'menta', wallPattern: 'coracoes' });
    expect(actions.paint('quarto', { wallColor: 'menta' })).toBe(false);
    store.undo('quarto');
    expect(room().decor).toEqual(original);
  });

  it('dia/noite', () => {
    const { store, actions, room } = setup();
    expect(actions.setAmbience('quarto', 'noite')).toBe(true);
    expect(actions.setAmbience('quarto', 'noite')).toBe(false);
    expect(room().ambience).toBe('noite');
    store.undo('quarto');
    expect(room().ambience).toBe('dia');
  });

  it('limpar cômodo mantém travados e desfaz de uma vez', () => {
    const { store, actions, room } = setup();
    const a = actions.add('quarto', cama)!;
    actions.add('quarto', cama);
    actions.add('quarto', cama);
    actions.toggleLock('quarto', a.uid);
    actions.clearRoom('quarto');
    expect(room().items.map((i) => i.uid)).toEqual([a.uid]);
    store.undo('quarto');
    expect(room().items).toHaveLength(3);
  });

  it('replaceRoom zera o desfazer e limpa seleção inválida', () => {
    const { store, actions, events } = setup();
    const a = actions.add('quarto', cama)!;
    store.select({ roomId: 'quarto', uid: a.uid });
    const remote: Room = { ...store.getRoom('quarto')!, items: [], revision: 7 };
    store.replaceRoom(remote, 'remote');
    expect(store.canUndo('quarto')).toBe(false);
    expect(store.getState().selection).toBeNull();
    expect(events.some((e) => e.type === 'room' && e.source === 'remote')).toBe(true);
  });

  it('desfazer pula commands cujo alvo sumiu', () => {
    const { store, actions, room } = setup();
    const a = actions.add('quarto', cama)!;
    actions.transform('quarto', a.uid, { x: 10 });
    // Simula um command antigo apontando para um item inexistente no histórico.
    store.execute(addItemCommand('quarto', { ...a, uid: 'fantasma' }));
    store.replaceRoom(
      { ...room(), items: room().items.filter((i) => i.uid !== 'fantasma') },
      'restore',
    );
    expect(store.canUndo('quarto')).toBe(false);
  });

  it('remover item selecionado limpa a seleção', () => {
    const { store, actions } = setup();
    const a = actions.add('quarto', cama)!;
    store.select({ roomId: 'quarto', uid: a.uid });
    actions.remove('quarto', a.uid);
    expect(store.getState().selection).toBeNull();
  });

  it('isola listeners com erro', () => {
    const { store, actions, hub } = setup();
    const ok = vi.fn();
    store.subscribe(() => {
      throw new Error('ops');
    });
    store.subscribe(ok);
    actions.add('quarto', cama);
    expect(ok).toHaveBeenCalled();
    expect(hub.recent().some((e) => e.level === 'error')).toBe(true);
  });

  it('updateProfile carimba updatedAt só para mudanças da jogadora', () => {
    const { store } = setup();
    store.updateProfile((p) => ({ ...p, tutorialDone: true }));
    expect(store.getState().profile.updatedAt).toBeGreaterThan(0);
    const t = store.getState().profile.updatedAt;
    store.updateProfile((p) => ({ ...p, revision: 3 }), 'remote');
    expect(store.getState().profile).toMatchObject({ updatedAt: t, revision: 3 });
    store.updateProfile((p) => p);
  });

  it('setRoomRevision não mexe no updatedAt', () => {
    const { store, room } = setup();
    const t = room().updatedAt;
    store.setRoomRevision('quarto', 4);
    expect(room()).toMatchObject({ revision: 4, updatedAt: t });
  });
});

describe('paint em cômodo externo', () => {
  it('ignora chaves que não existem no tipo de cômodo', () => {
    const { store, actions } = setup();
    expect(actions.paint('fachada', { wallColor: 'menta' })).toBe(false);
    expect(actions.paint('fachada', { castleColor: 'lilas', ground: 'pedras' })).toBe(true);
    expect(store.getRoom('fachada')!.decor).toMatchObject({
      kind: 'exterior',
      castleColor: 'lilas',
      ground: 'pedras',
    });
  });
});
