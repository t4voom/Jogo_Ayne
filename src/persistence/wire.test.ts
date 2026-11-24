import { describe, expect, it } from 'vitest';
import { sequentialIds } from '../core/ids';
import { FutureVersionError } from '../core/migrations';
import { createProfile } from '../core/profile';
import { createRoom } from '../core/rooms';
import { ROOM_SCHEMA_VERSION, serializeRoom } from '../core/save';
import LZString from 'lz-string';
import { WireError, decodeProfile, decodeRoom, encodeProfile, encodeRoom } from './wire';

describe('wire', () => {
  it('cômodo: ida e volta compactado em base64, com revisão do servidor', () => {
    const room = createRoom('quarto', sequentialIds(), 5);
    const data = encodeRoom(room);
    expect(data).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(decodeRoom(data, { roomId: 'quarto', revision: 9, updatedAt: 77 })).toEqual({
      ...room,
      revision: 9,
      updatedAt: 77,
    });
  });

  it('cômodo: recusa lixo, id trocado e versão futura', () => {
    const room = createRoom('quarto', sequentialIds(), 5);
    expect(() => decodeRoom('@@@', { roomId: 'quarto', revision: 1, updatedAt: 1 })).toThrow(
      WireError,
    );
    expect(() =>
      decodeRoom(encodeRoom(room), { roomId: 'trono', revision: 1, updatedAt: 1 }),
    ).toThrow(WireError);
    const future = LZString.compressToBase64(
      JSON.stringify({ ...serializeRoom(room), schemaVersion: ROOM_SCHEMA_VERSION + 1 }),
    );
    expect(() => decodeRoom(future, { roomId: 'quarto', revision: 1, updatedAt: 1 })).toThrow(
      FutureVersionError,
    );
  });

  it('perfil: espalha em colunas e volta igual', () => {
    const profile = { ...createProfile(3), tutorialDone: true, revision: 4 };
    const wire = encodeProfile(profile, 12.7);
    expect(wire.estrelinhas).toBe('12');
    expect(() => JSON.parse(wire.configuracoes) as unknown).not.toThrow();
    expect(decodeProfile(wire, { revision: 4, updatedAt: 3 })).toEqual(profile);
  });

  it('perfil: configurações ilegíveis', () => {
    const wire = encodeProfile(createProfile(1), 0);
    expect(() =>
      decodeProfile({ ...wire, configuracoes: 'x' }, { revision: 1, updatedAt: 1 }),
    ).toThrow(WireError);
    expect(() =>
      decodeProfile({ ...wire, configuracoes: '[1]' }, { revision: 1, updatedAt: 1 }),
    ).toThrow(WireError);
  });
});
