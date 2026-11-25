import { describe, expect, it } from 'vitest';
import { createFakeAppsScript, post, type FakeEnv } from './fake-apps-script';

interface Res {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; retryAfter?: number };
  serverTime: number;
}

const PIN = '271828';

/** Token da conta "padrão" de cada servidor de teste. */
const tokens = new WeakMap<FakeEnv, string>();

function raw(env: FakeEnv, body: unknown): Res {
  return post(env, body) as Res;
}

function signup(
  env: FakeEnv,
  usuario = 'Ayne',
  senha = 'segredo123',
  opts: { convite?: string; deviceId?: string; legado?: boolean } = {},
): Res {
  return raw(env, {
    action: 'signup',
    deviceId: opts.deviceId ?? 'tablet01',
    payload: { usuario, senha, convite: opts.convite ?? PIN, legado: opts.legado ?? false },
  });
}

function login(env: FakeEnv, usuario: string, senha: string, deviceId = 'tablet01'): Res {
  return raw(env, { action: 'login', deviceId, payload: { usuario, senha } });
}

function tokenOf(res: Res): string {
  const token = res.data?.token;
  if (typeof token !== 'string') throw new Error(`sem token: ${JSON.stringify(res)}`);
  return token;
}

/** Servidor com PIN e uma conta já criada (o caso comum dos testes de dados). */
function castle(): FakeEnv {
  const env = createFakeAppsScript({ pin: PIN });
  tokens.set(env, tokenOf(signup(env)));
  return env;
}

function call(
  env: FakeEnv,
  action: string,
  payload: Record<string, unknown> = {},
  opts: { token?: string; deviceId?: string } = {},
): Res {
  return raw(env, {
    action,
    token: opts.token ?? tokens.get(env),
    deviceId: opts.deviceId ?? 'tablet01',
    payload,
  });
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
  it('setup cria as abas com cabeçalhos e avisa sobre o convite', () => {
    const env = createFakeAppsScript();
    env.gs.setup();
    expect([...env.spreadsheet.sheets.keys()].sort()).toEqual([
      'album',
      'contas',
      'log',
      'profile',
      'saves',
    ]);
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
    expect(env.spreadsheet.getSheetByName('contas')!.data[0]).toContain('redefinirSenha');
    expect(env.logs.at(-1)).toContain('PIN');
  });

  it('qualquer GET responde a saúde do serviço', () => {
    const env = createFakeAppsScript({ pin: PIN });
    for (const parameter of [{ action: 'ping' }, {}]) {
      const res = JSON.parse(env.gs.doGet({ parameter }).getContent()) as Res;
      expect(res).toMatchObject({ ok: true, data: { version: 2, configured: true } });
      expect(typeof res.serverTime).toBe('number');
    }
  });

  it('valida o formato do pedido', () => {
    const env = castle();
    const bad = (body: unknown) =>
      JSON.parse(
        env.gs
          .doPost({
            postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) },
          })
          .getContent(),
      ) as Res;
    expect(bad('não é json').error?.code).toBe('bad_request');
    expect(bad({ action: 'load', token: tokens.get(env), deviceId: 'a b' }).error?.code).toBe(
      'bad_request',
    );
    expect(call(env, 'xyz').error?.code).toBe('bad_request');
    expect(bad('x'.repeat(1_600_000)).error?.code).toBe('bad_request');
    expect(JSON.parse(env.gs.doPost({}).getContent())).toMatchObject({ ok: false });
  });

  it('versão antiga do jogo (com PIN) recebe aviso para atualizar', () => {
    const env = castle();
    const res = raw(env, {
      action: 'load',
      pin: PIN,
      deviceId: 'tablet01',
      payload: { profileId: 'ayne' },
    });
    expect(res.error?.code).toBe('upgrade_required');
  });
});

describe('Code.gs — contas', () => {
  it('sem código de convite configurado, avisa claramente', () => {
    const env = createFakeAppsScript();
    expect(signup(env).error?.code).toBe('not_configured');
  });

  it('cria a conta com o convite e entra com usuário e senha', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const created = signup(env, 'Ayné', 'segredo123');
    expect(created.data).toMatchObject({ usuario: 'ayne', nome: 'Ayné' });
    expect(created.data?.accountId).toMatch(/^c[0-9a-f]{32}$/);
    const logged = login(env, '  AYNE ', 'segredo123', 'celular');
    expect(logged.data).toMatchObject({ accountId: created.data?.accountId, nome: 'Ayné' });
    expect(call(env, 'load', {}, { token: tokenOf(logged) }).ok).toBe(true);
  });

  it('a senha nunca fica em texto puro na planilha', () => {
    const env = createFakeAppsScript({ pin: PIN });
    signup(env, 'ayne', 'minhaSenhaSecreta');
    const row = env.spreadsheet.getSheetByName('contas')!.dataRows()[0]!.map(String);
    expect(row.join('|')).not.toContain('minhaSenhaSecreta');
    expect(env.properties.get('SEGREDO')).toBeTruthy();
  });

  it('convite errado é recusado com tentativas restantes', () => {
    const env = createFakeAppsScript({ pin: PIN });
    const res = signup(env, 'ayne', 'segredo123', { convite: '0000' });
    expect(res.error?.code).toBe('unauthorized');
    expect(res.error?.message).toContain('Restam 4');
    expect(env.spreadsheet.getSheetByName('contas')?.dataRows() ?? []).toEqual([]);
  });

  it('valida nome de usuário, senha e nomes repetidos', () => {
    const env = castle();
    expect(signup(env, 'a', 'segredo123').error?.code).toBe('bad_request');
    expect(signup(env, 'ayne brenda', 'segredo123').error?.code).toBe('bad_request');
    expect(signup(env, 'gustavo', '123').error?.code).toBe('bad_request');
    expect(signup(env, 'AYNE', 'outrasenha').error?.code).toBe('taken');
    expect(signup(env, 'gustavo', 'outrasenha').ok).toBe(true);
  });

  it('senha errada e usuário inexistente dão a mesma resposta', () => {
    const env = castle();
    const wrong = login(env, 'ayne', 'errada99');
    const unknown = login(env, 'ninguem', 'errada99', 'celular');
    expect(wrong.error?.code).toBe('unauthorized');
    expect(unknown.error?.code).toBe('unauthorized');
    expect(wrong.error?.message.split('.')[0]).toBe(unknown.error?.message.split('.')[0]);
  });

  it('bloqueia o aparelho após 5 erros e libera depois de 15 min', () => {
    const env = castle();
    for (let i = 0; i < 5; i++) login(env, 'ayne', 'errada99', 'celular');
    const locked = login(env, 'ayne', 'segredo123', 'celular');
    expect(locked.error?.code).toBe('locked');
    expect(locked.error?.retryAfter).toBeGreaterThan(800);
    env.clock.now += 16 * 60 * 1000;
    expect(login(env, 'ayne', 'segredo123', 'celular').ok).toBe(true);
  });

  it('bloqueio global não tranca aparelhos que já entraram', () => {
    const env = castle(); // tablet01 já entrou
    for (let i = 0; i < 30; i++) login(env, 'ayne', 'x', `atk${i}`);
    expect(login(env, 'ayne', 'segredo123', 'novo').error?.code).toBe('locked');
    expect(login(env, 'ayne', 'segredo123', 'tablet01').ok).toBe(true);
  });

  it('cada conta só vê o próprio castelo', () => {
    const env = castle();
    const outra = tokenOf(signup(env, 'gustavo', 'outrasenha'));
    room(env, 'quarto', 'AAAA', 0);
    call(
      env,
      'saveRoom',
      { roomId: 'quarto', data: 'BBBB', baseRevision: 0, updatedAt: 1 },
      {
        token: outra,
      },
    );
    // Mesmo pedindo o perfil de outra pessoa, vale o perfil do token.
    const mine = call(env, 'load', { profileId: 'qualquer' }).data as {
      rooms: { data: string }[];
    };
    const theirs = call(env, 'load', {}, { token: outra }).data as { rooms: { data: string }[] };
    expect(mine.rooms.map((r) => r.data)).toEqual(['AAAA']);
    expect(theirs.rooms.map((r) => r.data)).toEqual(['BBBB']);
  });

  it('token adulterado ou inventado é recusado', () => {
    const env = castle();
    const token = tokens.get(env)!;
    const [id, versao, quando, assinatura] = token.split('.');
    expect(
      call(env, 'load', {}, { token: `${id}.${versao}.${quando}.${'A'.repeat(43)}=` }).error?.code,
    ).toBe('unauthorized');
    expect(
      call(env, 'load', {}, { token: `outra.${versao}.${quando}.${assinatura}` }).error?.code,
    ).toBe('unauthorized');
    expect(call(env, 'load', {}, { token: '' }).error?.code).toBe('unauthorized');
  });

  it('o castelo de antes das contas fica com a conta da Ayne', () => {
    const env = createFakeAppsScript({ pin: PIN });
    env.gs.setup();
    env.spreadsheet
      .getSheetByName('saves')!
      .data.push(['ayne', 'quarto', '0', '1', 'QUJD', '5', '3', 'tablet01']);
    const ayne = signup(env, 'ayne', 'segredo123', { legado: true });
    expect(ayne.data?.accountId).toBe('ayne');
    const loaded = call(env, 'load', {}, { token: tokenOf(ayne) }).data as {
      rooms: { data: string; revision: number }[];
    };
    expect(loaded.rooms).toMatchObject([{ data: 'QUJD', revision: 3 }]);
    // Só uma conta herda o castelo antigo.
    const segunda = signup(env, 'aynebrenda', 'segredo123', { legado: true });
    expect(segunda.data?.accountId).not.toBe('ayne');
  });

  it('trocar a senha derruba as sessões antigas', () => {
    const env = castle();
    const celular = tokenOf(login(env, 'ayne', 'segredo123', 'celular'));
    expect(
      call(env, 'changePassword', { senhaAtual: 'errada', novaSenha: 'novinha99' }).error?.code,
    ).toBe('wrong_password');
    const res = call(env, 'changePassword', { senhaAtual: 'segredo123', novaSenha: 'novinha99' });
    expect(res.ok).toBe(true);
    expect(call(env, 'load', {}, { token: tokenOf(res) }).ok).toBe(true);
    expect(call(env, 'load', {}, { token: celular }).error?.code).toBe('unauthorized');
    expect(login(env, 'ayne', 'segredo123').error?.code).toBe('unauthorized');
    expect(login(env, 'ayne', 'novinha99', 'celular').ok).toBe(true);
  });

  it('senha provisória escrita na planilha vira a senha nova', () => {
    const env = castle();
    const antigo = tokens.get(env)!;
    const contas = env.spreadsheet.getSheetByName('contas')!;
    contas.data[1]![7] = 'provisoria1'; // Gustavo escreve na coluna redefinirSenha
    const res = login(env, 'ayne', 'provisoria1', 'celular');
    expect(res.ok).toBe(true);
    expect(contas.data[1]![7]).toBe('');
    expect(call(env, 'load', {}, { token: antigo }).error?.code).toBe('unauthorized');
    expect(login(env, 'ayne', 'provisoria1').ok).toBe(true);
    expect(login(env, 'ayne', 'segredo123').error?.code).toBe('unauthorized');
  });
});

describe('Code.gs — cômodos', () => {
  it('grava, lê e incrementa a revisão', () => {
    const env = castle();
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
    const env = castle();
    room(env, 'quarto', 'AAAA', 0, 10, 'celular');
    const res = room(env, 'quarto', 'BBBB', 0, 11, 'tablet01');
    expect(res.error?.code).toBe('conflict');
    expect(res.data).toMatchObject({ room: { data: 'AAAA', revision: 1, deviceId: 'celular' } });
    // Depois de ver a versão do servidor, o cliente pode sobrescrever conscientemente.
    expect(room(env, 'quarto', 'BBBB', 1, 12).data).toMatchObject({ revision: 2 });
  });

  it('divide em pedaços de até 45 mil caracteres e remonta igual', () => {
    const env = castle();
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
    const env = castle();
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

  it('recusa dados inválidos (nunca grava fórmula ou lixo)', () => {
    const env = castle();
    expect(room(env, 'quarto', '=IMPORTXML("x")', 0).error?.code).toBe('bad_request');
    expect(room(env, '../x', 'AAAA', 0).error?.code).toBe('bad_request');
    expect(
      call(env, 'saveRoom', { roomId: 'quarto', data: 'AAAA', baseRevision: -1, updatedAt: 1 })
        .error?.code,
    ).toBe('bad_request');
  });

  it('servidor ocupado devolve "busy" para o cliente tentar de novo', () => {
    const env = castle();
    env.lockBusy = true;
    expect(room(env, 'quarto', 'AAAA', 0).error).toMatchObject({ code: 'busy', retryAfter: 5 });
  });

  it('lê e escreve em lote (poucas operações por gravação)', () => {
    const env = castle();
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
    const env = castle();
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
    const env = castle();
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
    const env = castle();
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
    const env = castle();
    room(env, 'quarto', 'AAAA', 0);
    login(env, 'ayne', 'senhaErrada');
    const log = env.spreadsheet.getSheetByName('log')!;
    const rows = log.dataRows();
    expect(rows[0]).toMatchObject(['2023-11-14T22:13:20.000Z', 'signup', 'tablet01', 'ok', 'ayne']);
    expect(rows[1]).toMatchObject([expect.any(String), 'saveRoom', 'tablet01', 'ok', '[ayne]']);
    expect(rows[2]).toMatchObject([
      expect.any(String),
      'login',
      'tablet01',
      'unauthorized',
      'ayne',
    ]);
    // Senha nunca vai para o log.
    expect(rows.flat().join('|')).not.toContain('senhaErrada');
    for (let i = 0; i < 2600; i++) log.data.push(['t', 'x', 'd', 'ok', '']);
    room(env, 'quarto', 'BBBB', 1);
    expect(log.getLastRow()).toBeLessThanOrEqual(2501);
  });
});
