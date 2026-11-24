import { describe, expect, it } from 'vitest';
import { sequentialIds } from './ids';
import { FutureVersionError } from './migrations';
import { createProfile } from './profile';
import { ROOMS, createRoom, roomInfo } from './rooms';
import {
  ROOM_SCHEMA_VERSION,
  parseProfile,
  parseRoom,
  serializeProfile,
  serializeRoom,
} from './save';

describe('save de cômodos', () => {
  it('ida e volta preserva o cômodo', () => {
    const room = createRoom('quarto', sequentialIds('u'), 1000);
    const stored = serializeRoom(room);
    expect(stored.schemaVersion).toBe(ROOM_SCHEMA_VERSION);
    const json: unknown = JSON.parse(JSON.stringify(stored));
    expect(parseRoom(json)).toEqual(room);
  });

  it('todos os cômodos padrão são válidos', () => {
    for (const info of ROOMS) {
      const room = createRoom(info.id, sequentialIds(), 1);
      expect(() => parseRoom(serializeRoom(room))).not.toThrow();
    }
  });

  it('rejeita dados corrompidos', () => {
    const room = serializeRoom(createRoom('quarto', sequentialIds(), 1));
    expect(() => parseRoom({ ...room, items: 'nada' })).toThrow();
    expect(() => parseRoom({ ...room, id: 'porão' })).toThrow();
    expect(() =>
      parseRoom({ ...room, items: [{ ...room.items[0], x: Number.POSITIVE_INFINITY }] }),
    ).toThrow();
  });

  it('não aceita versão futura', () => {
    const room = serializeRoom(createRoom('quarto', sequentialIds(), 1));
    expect(() => parseRoom({ ...room, schemaVersion: ROOM_SCHEMA_VERSION + 1 })).toThrow(
      FutureVersionError,
    );
  });

  it('roomInfo falha para id desconhecido', () => {
    expect(() => roomInfo('porao' as never)).toThrow();
  });
});

describe('save do perfil', () => {
  it('ida e volta preserva o perfil', () => {
    const p = createProfile(5);
    expect(parseProfile(JSON.parse(JSON.stringify(serializeProfile(p))))).toEqual(p);
  });
});
