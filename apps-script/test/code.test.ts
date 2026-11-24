import { describe, expect, it } from 'vitest';
import { createFakeAppsScript, post, type FakeEnv } from './fake-apps-script';

interface Res {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; retryAfter?: number };
  serverTime: number;
}

const PIN = '271828';

function call(
  env: FakeEnv,
  action: string,
  payload: Record<string, unknown> = {},
  opts: { pin?: string; deviceId?: string } = {},
): Res {
  return post(env, {
    action,
    pin: opts.pin ?? PIN,
    deviceId: opts.deviceId ?? 'tablet01',
    payload: { profileId: 'ayne', ...payload },
  }) as Res;
}

function room(
  env: FakeEnv,
  roomId: string,
  data: string,
  baseRevision: number,
  updatedAt = 10,
  deviceId = 'tablet01',
): Res {
  return call(env, 'saveRoom', { roomId, data, baseRevision, updatedAt }, { deviceId });
}

describe('Code.gs — setup e ping', () => {
  it('setup cria as abas com cabeçalhos e avisa sobre o PIN', () => {
    const env = createFakeAppsScript();
    env.gs.setup();
    expect([...env.spreadsheet.sheets.keys()].sort()).toEqual(['album', 'log', 'profile', 'saves']);
    expect(env.spreadsheet.getSheetByName('saves')!.data[0]).toEqual([
      'profileId',
      'roomId',
      'chunkIndex',
      'chunkTotal',
      'data',
      'updatedAt',
      'revision',
      'deviceId',
    ]);
    expect(env.logs.at(-1)).toContain('PIN');
  });

  it('ping responde e diz se o PIN está configurado', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const res = JSON.parse(env.gs.doGet({ parameter: { action: 'ping' } }).getContent()) as Res;
    expect(res).toMatchObject({ ok: true, data: { version: 1, configured: true } });
    expect(typeof res.serverTime).toBe('number');
  });

  it('GET sem ação é recusado', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const res = JSON.parse(env.gs.doGet({ parameter: {} }).getContent()) as Res;
    expect(res.ok).toBe(false);
  });
});

describe('Code.gs — PIN', () => {
  it('sem PIN configurado, avisa claramente', () => {
    const env = createFakeAppsScript();
    expect(call(env, 'load').error?.code).toBe('not_configured');
  });

  it('PIN errado é recusado com tentativas restantes', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const res = call(env, 'load', {}, { pin: '0000' });
    expect(res.error?.code).toBe('unauthorized');
    expect(res.error?.message).toContain('Restam 4');
  });

  it('bloqueia o aparelho após 5 erros e libera depois de 15 min', () => {
    const env = createFakeAppsScript({ pin: PIN });
    for (let i = 0; i < 5; i++) call(env, 'load', {}, { pin: 'x' });
    const locked = call(env, 'load');
    expect(locked.error?.code).toBe('locked');
    expect(locked.error?.retryAfter).toBeGreaterThan(800);
    env.clock.now += 16 * 60 * 1000;
    expect(call(env, 'load').ok).toBe(true);
  });

  it('bloqueio global não tranca aparelhos conhecidos', () => {
    const env = createFakeAppsScript({ pin: PIN });
    expect(call(env, 'load', {}, { deviceId: 'celular' }).ok).toBe(true); // vira conhecido
    for (let i = 0; i < 30; i++) call(env, 'load', {}, { pin: 'x', deviceId: `atk${i}` });
    expect(call(env, 'load', {}, { deviceId: 'novo' }).error?.code).toBe('locked');
    expect(call(env, 'load', {}, { deviceId: 'celular' }).ok).toBe(true);
  });

  it('valida o formato do pedido', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const bad = (body: unknown) =>
      JSON.parse(
        env.gs
          .doPost({
            postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) },
          })
          .getContent(),
      ) as Res;
    expect(bad('não é json').error?.code).toBe('bad_request');
    expect(
      bad({ action: 'load', pin: PIN, deviceId: 'a b', payload: { profileId: 'ayne' } }).error
        ?.code,
    ).toBe('bad_request');
    expect(bad({ action: 'load', pin: PIN, deviceId: 'ok', payload: {} }).error?.code).toBe(
      'bad_request',
    );
    expect(
      bad({ action: 'xyz', pin: PIN, deviceId: 'ok', payload: { profileId: 'ayne' } }).error?.code,
    ).toBe('bad_request');
    expect(bad('x'.repeat(1_600_000)).error?.code).toBe('bad_request');
    expect(JSON.parse(env.gs.doPost({}).getContent())).toMatchObject({ ok: false });
  });
});

describe('Code.gs — cômodos', () => {
  it('grava, lê e incrementa a revisão', () => {
    const env = createFakeAppsScript({ pin: PIN });
    expect(room(env, 'quarto', 'QUJD', 0).data).toMatchObject({ revision: 1 });
    expect(room(env, 'quarto', 'REVG', 1, 20).data).toMatchObject({ revision: 2 });
    const loaded = call(env, 'load').data as {
      rooms: { roomId: string; data: string; revision: number; updatedAt: number }[];
    };
    expect(loaded.rooms).toEqual([
      { roomId: 'quarto', data: 'REVG', revision: 2, updatedAt: 20, deviceId: 'tablet01' },
    ]);
  });

  it('conflito: revisão antiga recebe a versão do servidor', () => {
    const env = createFakeAppsScript({ pin: PIN });
    room(env, 'quarto', 'AAAA', 0, 10, 'celular');
    const res = room(env, 'quarto', 'BBBB', 0, 11, 'tablet01');
    expect(res.error?.code).toBe('conflict');
    expect(res.data).toMatchObject({ room: { data: 'AAAA', revision: 1, deviceId: 'celular' } });
    // Depois de ver a versão do servidor, o cliente pode sobrescrever conscientemente.
    expect(room(env, 'quarto', 'BBBB', 1, 12).data).toMatchObject({ revision: 2 });
  });

  it('divide em pedaços de até 45 mil caracteres e remonta igual', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const big = 'Q'.repeat(100_000) + 'Zm9v';
    expect(room(env, 'baile', big, 0).ok).toBe(true);
    const rows = env.spreadsheet.getSheetByName('saves')!.dataRows();
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r[2])).toEqual(['0', '1', '2']);
    const loaded = call(env, 'load').data as { rooms: { data: string }[] };
    expect(loaded.rooms[0]!.data).toBe(big);
    // Regravar menor remove os pedaços sobrando.
    expect(room(env, 'baile', 'AAAA', 1).ok).toBe(true);
    expect(env.spreadsheet.getSheetByName('saves')!.dataRows()).toHaveLength(1);
  });

  it('cômodo com pedaço faltando não é entregue pela metade', () => {
    const env = createFakeAppsScript({ pin: PIN });
    room(env, 'baile', 'Q'.repeat(100_000), 0);
    const sheet = env.spreadsheet.getSheetByName('saves')!;
    sheet.data.splice(2, 1); // apaga o pedaço 1
    const loaded = call(env, 'load').data as { rooms: unknown[] };
    expect(loaded.rooms).toEqual([]);
    expect(
      env.spreadsheet
        .getSheetByName('log')!
        .dataRows()
        .some((r) => String(r[4]).includes('pedaços')),
    ).toBe(true);
  });

  it('mantém cômodos e perfis separados', () => {
    const env = createFakeAppsScript({ pin: PIN });
    room(env, 'quarto', 'AAAA', 0);
    room(env, 'trono', 'BBBB', 0);
    call(env, 'saveRoom', {
      profileId: 'outra',
      roomId: 'quarto',
      data: 'CCCC',
      baseRevision: 0,
      updatedAt: 1,
    });
    const loaded = call(env, 'load').data as { rooms: { roomId: string }[] };
    expect(loaded.rooms.map((r) => r.roomId).sort()).toEqual(['quarto', 'trono']);
  });

  it('recusa dados inválidos (nunca grava fórmula ou lixo)', () => {
    const env = createFakeAppsScript({ pin: PIN });
    expect(room(env, 'quarto', '=IMPORTXML("x")', 0).error?.code).toBe('bad_request');
    expect(room(env, '../x', 'AAAA', 0).error?.code).toBe('bad_request');
    expect(
      call(env, 'saveRoom', { roomId: 'quarto', data: 'AAAA', baseRevision: -1, updatedAt: 1 })
        .error?.code,
    ).toBe('bad_request');
  });

  it('servidor ocupado devolve "busy" para o cliente tentar de novo', () => {
    const env = createFakeAppsScript({ pin: PIN });
    env.lockBusy = true;
    expect(room(env, 'quarto', 'AAAA', 0).error).toMatchObject({ code: 'busy', retryAfter: 5 });
  });

  it('lê e escreve em lote (poucas operações por gravação)', () => {
    const env = createFakeAppsScript({ pin: PIN });
    env.gs.setup();
    const sheet = env.spreadsheet.getSheetByName('saves')!;
    room(env, 'quarto', 'Q'.repeat(100_000), 0);
    room(env, 'trono', 'AAAA', 0);
    sheet.reads = 0;
    sheet.writes = 0;
    room(env, 'quarto', 'R'.repeat(100_000), 1);
    expect(sheet.reads).toBe(1); // um getValues
    expect(sheet.writes).toBe(1); // um setValues
  });
});

describe('Code.gs — perfil e álbum', () => {
  const profile = {
    estrelinhas: '12',
    desbloqueios: '["banheiro"]',
    missoes: '{}',
    conquistas: '{}',
    configuracoes: '{"music":true}',
  };

  it('grava o perfil com revisão e detecta conflito', () => {
    const env = createFakeAppsScript({ pin: PIN });
    expect(
      call(env, 'saveProfile', { ...profile, baseRevision: 0, updatedAt: 5 }).data,
    ).toMatchObject({ revision: 1 });
    const conflict = call(env, 'saveProfile', {
      ...profile,
      estrelinhas: '3',
      baseRevision: 0,
      updatedAt: 6,
    });
    expect(conflict.error?.code).toBe('conflict');
    expect(conflict.data).toMatchObject({ profile: { estrelinhas: '12', revision: 1 } });
    const loaded = call(env, 'load').data as { profile: Record<string, unknown> };
    expect(loaded.profile).toMatchObject({ ...profile, revision: 1, updatedAt: 5 });
  });

  it('valida o perfil', () => {
    const env = createFakeAppsScript({ pin: PIN });
    expect(
      call(env, 'saveProfile', { ...profile, missoes: 'nada', baseRevision: 0, updatedAt: 1 }).error
        ?.code,
    ).toBe('bad_request');
    expect(
      call(env, 'saveProfile', { ...profile, estrelinhas: '-1', baseRevision: 0, updatedAt: 1 })
        .error?.code,
    ).toBe('bad_request');
  });

  it('álbum: grava miniatura em pedaços, é idempotente e apaga', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const thumb = `data:image/jpeg;base64,${'A'.repeat(60_000)}`;
    const photo = { photoId: 'foto1', roomId: 'quarto', createdAt: 99, thumbnail: thumb };
    expect(call(env, 'savePhoto', photo).ok).toBe(true);
    expect(call(env, 'savePhoto', photo).ok).toBe(true);
    expect(env.spreadsheet.getSheetByName('album')!.dataRows()).toHaveLength(2);
    const loaded = call(env, 'load').data as { album: { photoId: string; thumbnail: string }[] };
    expect(loaded.album).toEqual([
      { photoId: 'foto1', roomId: 'quarto', createdAt: 99, thumbnail: thumb },
    ]);
    expect(call(env, 'savePhoto', { ...photo, thumbnail: 'javascript:alert(1)' }).error?.code).toBe(
      'bad_request',
    );
    expect(call(env, 'deletePhoto', { photoId: 'foto1' }).ok).toBe(true);
    expect((call(env, 'load').data as { album: unknown[] }).album).toEqual([]);
  });
});

describe('Code.gs — log', () => {
  it('registra gravações e erros e não cresce para sempre', () => {
    const env = createFakeAppsScript({ pin: PIN });
    room(env, 'quarto', 'AAAA', 0);
    call(env, 'load', {}, { pin: 'errado' });
    const log = env.spreadsheet.getSheetByName('log')!;
    const rows = log.dataRows();
    expect(rows[0]).toMatchObject(['2023-11-14T22:13:20.000Z', 'saveRoom', 'tablet01', 'ok', '']);
    expect(rows[1]?.[3]).toBe('unauthorized');
    for (let i = 0; i < 2600; i++) log.data.push(['t', 'x', 'd', 'ok', '']);
    room(env, 'quarto', 'BBBB', 1);
    expect(log.getLastRow()).toBeLessThanOrEqual(2501);
  });
});
