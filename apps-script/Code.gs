/**
 * O Castelo da Aynebrenda — backend no Google Apps Script.
 *
 * Cole este arquivo inteiro no editor do Apps Script vinculado à planilha,
 * rode `setup()` uma vez, defina a propriedade de script PIN (o código de
 * convite para criar contas) e publique como App da Web (Executar como: eu ·
 * Quem tem acesso: qualquer pessoa). Passo a passo em apps-script/README.md.
 *
 * Contrato (um único endpoint):
 *   GET  (qualquer)                               → saúde do serviço
 *   POST { action, deviceId, payload }            → signup | login
 *   POST { action, deviceId, token, payload }     → load | saveRoom | saveProfile | savePhoto
 *                                                   | deletePhoto | changePassword
 *   Resposta sempre: { ok, data?, error?: { code, message, retryAfter? }, serverTime }
 *
 * Cada conta tem o próprio castelo: o perfil dos dados vem do token de
 * sessão, nunca do pedido. O cliente envia POST com Content-Type text/plain
 * (requisição simples, sem preflight de CORS); o corpo é JSON em texto.
 */

// ------------------------------------------------------------- configuração

var API_VERSION = 2;
var MAX_CELL = 45000; // limite do Sheets é 50.000 caracteres por célula
var MAX_BODY = 1500000; // ~1,5 MB por requisição
var MAX_CHUNKS = 40;
var LOCK_WAIT_MS = 20000;
var LOG_MAX_ROWS = 2000;
var LOG_TRIM_ROWS = 500;

// Proteção contra chutes de senha e de convite (CacheService)
var AUTH_MAX_FAILS_PER_DEVICE = 5;
var AUTH_DEVICE_LOCK_SECONDS = 15 * 60;
var AUTH_MAX_FAILS_GLOBAL = 30;
var AUTH_GLOBAL_WINDOW_SECONDS = 60 * 60;
var AUTH_GLOBAL_LOCK_SECONDS = 30 * 60;
var MAX_KNOWN_DEVICES = 20;

// Contas
var MAX_ACCOUNTS = 50;
var HASH_ROUNDS = 300;
var ACCOUNT_CACHE_SECONDS = 10 * 60;
/** O castelo salvo antes das contas existirem tinha este perfil. */
var LEGACY_ACCOUNT_ID = 'ayne';
var SESSION_EXPIRED = 'Sua sessão terminou. Entre de novo com seu usuário e senha.';

var SHEETS = {
  saves: {
    name: 'saves',
    headers: [
      'profileId',
      'roomId',
      'chunkIndex',
      'chunkTotal',
      'data',
      'updatedAt',
      'revision',
      'deviceId',
    ],
  },
  profile: {
    name: 'profile',
    headers: [
      'profileId',
      'estrelinhas',
      'desbloqueios',
      'missoes',
      'conquistas',
      'configuracoes',
      'updatedAt',
      'revision',
    ],
  },
  album: {
    name: 'album',
    headers: [
      'profileId',
      'photoId',
      'roomId',
      'createdAt',
      'thumbnail',
      'chunkIndex',
      'chunkTotal',
    ],
  },
  contas: {
    name: 'contas',
    headers: [
      'accountId',
      'usuario',
      'nome',
      'sal',
      'senha',
      'criadaEm',
      'versaoSessao',
      'redefinirSenha',
    ],
  },
  log: {
    name: 'log',
    headers: ['timestamp', 'acao', 'deviceId', 'resultado', 'erro'],
  },
};

var ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
var BASE64_RE = /^[A-Za-z0-9+/=]+$/;
var THUMB_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
var USER_RE = /^[a-z0-9._-]{3,20}$/;
var TOKEN_RE = /^([A-Za-z0-9_-]{1,64})\.(\d{1,9})\.(\d{1,15})\.([A-Za-z0-9_=-]{20,100})$/;

// ------------------------------------------------------------------ setup

/**
 * Cria (ou completa) as abas com cabeçalhos. Pode rodar quantas vezes quiser:
 * nunca apaga dados.
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (key) {
    var def = SHEETS[key];
    var sheet = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
    var header = sheet.getRange(1, 1, 1, def.headers.length);
    header.setValues([def.headers]);
    header.setFontWeight('bold');
    header.setBackground('#fde6f1');
    sheet.setFrozenRows(1);
    // Texto puro: o Sheets não tenta interpretar os dados.
    sheet.getRange(1, 1, sheet.getMaxRows(), def.headers.length).setNumberFormat('@');
  });
  Logger.log(
    getInvite()
      ? 'Tudo pronto! O código de convite (propriedade PIN) já está definido.'
      : 'Abas criadas. Agora defina a propriedade de script "PIN" — é o código de convite para criar contas (Configurações do projeto → Propriedades do script).',
  );
}

// -------------------------------------------------------------- endpoints

/** Saúde do serviço: abrir a URL no navegador mostra se está tudo certo. */
function doGet() {
  return respond(ok({ version: API_VERSION, configured: Boolean(getInvite()) }));
}

function doPost(e) {
  var req;
  try {
    req = parseRequest(e);
  } catch (err) {
    return respond(fail('bad_request', messageOf(err)));
  }
  if (req.legacy) {
    return respond(
      fail(
        'upgrade_required',
        'O jogo foi atualizado: feche e abra de novo para entrar com a sua conta.',
      ),
    );
  }

  try {
    if (req.action === 'signup' || req.action === 'login') {
      var res =
        req.action === 'signup'
          ? signup(req.payload, req.deviceId)
          : login(req.payload, req.deviceId);
      var who = normalizeUser(req.payload.usuario || '');
      logEvent(req.action, req.deviceId, res.ok ? 'ok' : res.error.code, who);
      return respond(res);
    }

    var auth = authenticate(req.token);
    if (!auth.ok) {
      logEvent(req.action, req.deviceId, auth.error.code, auth.error.message);
      return respond(auth);
    }
    var account = auth.account;
    // Cada conta só enxerga os próprios dados: o perfil vem do token, nunca do pedido.
    var payload = req.payload;
    payload.profileId = account.accountId;

    var result;
    switch (req.action) {
      case 'load':
        result = load(payload);
        break;
      case 'saveRoom':
        result = withLock(function () {
          return saveRoom(payload, req.deviceId);
        });
        break;
      case 'saveProfile':
        result = withLock(function () {
          return saveProfile(payload);
        });
        break;
      case 'savePhoto':
        result = withLock(function () {
          return savePhoto(payload);
        });
        break;
      case 'deletePhoto':
        result = withLock(function () {
          return deletePhoto(payload);
        });
        break;
      case 'changePassword':
        result = changePassword(payload, account, req.deviceId);
        break;
      default:
        result = fail('bad_request', 'Ação desconhecida: ' + req.action);
    }
    if (req.action !== 'load' || !result.ok) {
      logEvent(
        req.action,
        req.deviceId,
        result.ok ? 'ok' : result.error.code,
        (result.ok ? '' : result.error.message + ' ') + '[' + account.usuario + ']',
      );
    }
    return respond(result);
  } catch (err) {
    logEvent(req.action, req.deviceId, 'erro', messageOf(err));
    return respond(fail('server_error', 'Erro no servidor: ' + messageOf(err)));
  }
}

// ---------------------------------------------------------------- pedidos

function parseRequest(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') {
    throw new Error('Corpo da requisição vazio.');
  }
  var text = e.postData.contents;
  if (text.length > MAX_BODY) throw new Error('Requisição grande demais.');
  var body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('Corpo não é JSON válido.');
  }
  if (!body || typeof body !== 'object') throw new Error('Corpo inválido.');
  if (typeof body.action !== 'string') throw new Error('Campo "action" ausente.');
  if (typeof body.deviceId !== 'string' || !ID_RE.test(body.deviceId)) {
    throw new Error('Campo "deviceId" inválido.');
  }
  var payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
  var token = typeof body.token === 'string' ? body.token : '';
  return {
    action: body.action,
    deviceId: body.deviceId,
    token: token,
    payload: payload,
    // Versão antiga do jogo (antes das contas) ainda mandando o PIN.
    legacy: !token && typeof body.pin === 'string',
  };
}

// ------------------------------------------------------ convite e chutes

/** O código de convite é a propriedade de script PIN. */
function getInvite() {
  return PropertiesService.getScriptProperties().getProperty('PIN');
}

/**
 * Segredo do servidor (gerado sozinho, nunca sai da planilha): assina os
 * tokens de sessão e "tempera" o hash das senhas. Só é criado com a trava
 * (dentro do cadastro), para dois pedidos simultâneos não criarem dois.
 */
function getSecret(create) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SEGREDO');
  if (!secret && create) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SEGREDO', secret);
  }
  return secret;
}

/**
 * Limite de tentativas de senha e de convite:
 *  - por aparelho: 5 erros → bloqueio de 15 min
 *  - global: 30 erros/hora → bloqueio de 30 min para aparelhos desconhecidos
 * Aparelhos que já entraram antes continuam funcionando no bloqueio global
 * (um ataque não tranca a Ayne para fora do castelo).
 */
function authLocked(deviceId) {
  var cache = CacheService.getScriptCache();
  var now = Date.now();
  var lockedUntil = Number(cache.get('authlock:' + deviceId) || 0);
  if (lockedUntil > now) {
    return fail(
      'locked',
      'Muitas tentativas. Tente de novo mais tarde.',
      Math.ceil((lockedUntil - now) / 1000),
    );
  }
  var globalUntil = Number(cache.get('authlock:global') || 0);
  if (globalUntil > now && !isKnownDevice(deviceId)) {
    return fail(
      'locked',
      'Muitas tentativas. Tente de novo mais tarde.',
      Math.ceil((globalUntil - now) / 1000),
    );
  }
  return null;
}

/** Registra um erro e devolve quantas tentativas restam neste aparelho. */
function authFailed(deviceId) {
  var cache = CacheService.getScriptCache();
  var now = Date.now();
  var fails = Number(cache.get('authfail:' + deviceId) || 0) + 1;
  cache.put('authfail:' + deviceId, String(fails), AUTH_DEVICE_LOCK_SECONDS);
  if (fails >= AUTH_MAX_FAILS_PER_DEVICE) {
    cache.put(
      'authlock:' + deviceId,
      String(now + AUTH_DEVICE_LOCK_SECONDS * 1000),
      AUTH_DEVICE_LOCK_SECONDS,
    );
    cache.remove('authfail:' + deviceId);
  }
  var globalFails = Number(cache.get('authfail:global') || 0) + 1;
  cache.put('authfail:global', String(globalFails), AUTH_GLOBAL_WINDOW_SECONDS);
  if (globalFails >= AUTH_MAX_FAILS_GLOBAL) {
    cache.put(
      'authlock:global',
      String(now + AUTH_GLOBAL_LOCK_SECONDS * 1000),
      AUTH_GLOBAL_LOCK_SECONDS,
    );
    cache.remove('authfail:global');
  }
  return Math.max(0, AUTH_MAX_FAILS_PER_DEVICE - fails);
}

function authSucceeded(deviceId) {
  CacheService.getScriptCache().remove('authfail:' + deviceId);
  if (!isKnownDevice(deviceId)) rememberDevice(deviceId);
}

function attemptsLeft(left) {
  return left > 0 ? ' Restam ' + left + ' tentativas.' : '';
}

/** Comparação em tempo constante (não revela quantos caracteres acertou). */
function safeEquals(a, b) {
  var diff = a.length ^ b.length;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function knownDevices() {
  var raw = PropertiesService.getScriptProperties().getProperty('KNOWN_DEVICES');
  try {
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function isKnownDevice(deviceId) {
  return knownDevices().indexOf(deviceId) !== -1;
}

function rememberDevice(deviceId) {
  var list = knownDevices().filter(function (d) {
    return d !== deviceId;
  });
  list.push(deviceId);
  while (list.length > MAX_KNOWN_DEVICES) list.shift();
  PropertiesService.getScriptProperties().setProperty('KNOWN_DEVICES', JSON.stringify(list));
}

// ---------------------------------------------------------------- contas

/** "Ayne", " AYNÉ " → "ayne": o nome de usuário não diferencia maiúsculas nem acentos. */
function normalizeUser(name) {
  return String(name).trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function readAccounts() {
  var table = readTable(SHEETS.contas);
  var list = table.rows.map(function (r) {
    return {
      accountId: String(r[0]),
      usuario: String(r[1]),
      nome: String(r[2]),
      sal: String(r[3]),
      senha: String(r[4]),
      criadaEm: Number(r[5]),
      versaoSessao: Number(r[6]) || 1,
      redefinirSenha: String(r[7] === undefined || r[7] === null ? '' : r[7]),
    };
  });
  return { table: table, list: list };
}

function accountRow(a) {
  return [
    a.accountId,
    a.usuario,
    a.nome,
    a.sal,
    a.senha,
    a.criadaEm,
    a.versaoSessao,
    a.redefinirSenha,
  ];
}

/** Regrava uma conta (com a trava já pega). */
function writeAccount(accounts, account) {
  var rows = accounts.list.map(function (a) {
    return accountRow(a.accountId === account.accountId ? account : a);
  });
  writeTable(SHEETS.contas, accounts.table, rows);
  cacheAccount(account);
}

function findBy(list, field, value) {
  for (var i = 0; i < list.length; i++) if (list[i][field] === value) return list[i];
  return null;
}

/** Hash da senha: HMAC-SHA256 com sal e o segredo do servidor, repetido várias vezes. */
function hashPassword(password, salt, secret) {
  var h = salt + ':' + password;
  for (var i = 0; i < HASH_ROUNDS; i++) {
    h = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(h, secret, Utilities.Charset.UTF_8),
    );
  }
  return h;
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 64;
}

function signup(payload, deviceId) {
  var invite = getInvite();
  if (!invite) {
    return fail(
      'not_configured',
      'O código de convite ainda não foi definido (propriedade PIN do script).',
    );
  }
  var locked = authLocked(deviceId);
  if (locked) return locked;

  var nome = String(payload.usuario || '').trim();
  var usuario = normalizeUser(nome);
  if (!USER_RE.test(usuario) || nome.length > 20) {
    return fail(
      'bad_request',
      'O nome de usuário precisa ter de 3 a 20 letras ou números, sem espaços.',
    );
  }
  if (!validPassword(payload.senha)) {
    return fail('bad_request', 'A senha precisa ter de 6 a 64 caracteres.');
  }
  if (typeof payload.convite !== 'string' || !safeEquals(payload.convite.trim(), String(invite))) {
    return fail(
      'unauthorized',
      'Código de convite incorreto.' + attemptsLeft(authFailed(deviceId)),
    );
  }

  return withLock(function () {
    var secret = getSecret(true);
    var accounts = readAccounts();
    if (findBy(accounts.list, 'usuario', usuario)) {
      return fail('taken', 'Esse nome de usuário já existe. Escolha outro.');
    }
    if (accounts.list.length >= MAX_ACCOUNTS) {
      return fail('bad_request', 'O castelo já tem contas demais.');
    }
    // O castelo salvo antes das contas existirem fica com a conta da Ayne.
    var takeLegacy =
      payload.legado === true && !findBy(accounts.list, 'accountId', LEGACY_ACCOUNT_ID);
    var account = {
      accountId: takeLegacy ? LEGACY_ACCOUNT_ID : 'c' + Utilities.getUuid().replace(/-/g, ''),
      usuario: usuario,
      nome: nome,
      sal: Utilities.getUuid(),
      senha: '',
      criadaEm: Date.now(),
      versaoSessao: 1,
      redefinirSenha: '',
    };
    account.senha = hashPassword(payload.senha, account.sal, secret);
    var rows = accounts.table.rows.slice();
    rows.push(accountRow(account));
    writeTable(SHEETS.contas, accounts.table, rows);
    cacheAccount(account);
    authSucceeded(deviceId);
    return ok(sessionOf(account, secret));
  });
}

function login(payload, deviceId) {
  var locked = authLocked(deviceId);
  if (locked) return locked;
  var usuario = normalizeUser(payload.usuario || '');
  var senha = typeof payload.senha === 'string' ? payload.senha.slice(0, 64) : '';
  var secret = getSecret(false);
  var account = secret ? findBy(readAccounts().list, 'usuario', usuario) : null;

  if (secret && account) {
    if (account.redefinirSenha && safeEquals(senha, account.redefinirSenha)) {
      // Senha provisória escrita pelo Gustavo na aba "contas": vira a senha.
      return withLock(function () {
        var accounts = readAccounts();
        var fresh = findBy(accounts.list, 'accountId', account.accountId);
        if (!fresh) return fail('unauthorized', 'Usuário ou senha incorretos.');
        fresh.sal = Utilities.getUuid();
        fresh.senha = hashPassword(senha, fresh.sal, secret);
        fresh.redefinirSenha = '';
        fresh.versaoSessao += 1;
        writeAccount(accounts, fresh);
        authSucceeded(deviceId);
        return ok(sessionOf(fresh, secret));
      });
    }
    if (safeEquals(hashPassword(senha, account.sal, secret), account.senha)) {
      authSucceeded(deviceId);
      return ok(sessionOf(account, secret));
    }
  } else if (secret) {
    // Mesmo trabalho de quando o usuário existe: não revela quem tem conta.
    hashPassword(senha, 'sal', secret);
  }
  return fail('unauthorized', 'Usuário ou senha incorretos.' + attemptsLeft(authFailed(deviceId)));
}

function changePassword(payload, account, deviceId) {
  var locked = authLocked(deviceId);
  if (locked) return locked;
  if (!validPassword(payload.novaSenha)) {
    return fail('bad_request', 'A senha nova precisa ter de 6 a 64 caracteres.');
  }
  var secret = getSecret(false);
  return withLock(function () {
    var accounts = readAccounts();
    var fresh = findBy(accounts.list, 'accountId', account.accountId);
    if (!fresh || !secret) return fail('unauthorized', SESSION_EXPIRED);
    var current = typeof payload.senhaAtual === 'string' ? payload.senhaAtual : '';
    if (!safeEquals(hashPassword(current, fresh.sal, secret), fresh.senha)) {
      return fail(
        'wrong_password',
        'A senha atual não confere.' + attemptsLeft(authFailed(deviceId)),
      );
    }
    fresh.sal = Utilities.getUuid();
    fresh.senha = hashPassword(payload.novaSenha, fresh.sal, secret);
    fresh.redefinirSenha = '';
    // Os outros aparelhos precisam entrar de novo com a senha nova.
    fresh.versaoSessao += 1;
    writeAccount(accounts, fresh);
    return ok(sessionOf(fresh, secret));
  });
}

// --------------------------------------------------------------- sessão

/**
 * Token de sessão: "conta.versão.emitidoEm.assinatura". Não expira (a Ayne
 * não precisa entrar toda hora); trocar a senha muda a versão e derruba os
 * tokens antigos.
 */
function sessionOf(account, secret) {
  var body = account.accountId + '.' + account.versaoSessao + '.' + Date.now();
  return {
    accountId: account.accountId,
    usuario: account.usuario,
    nome: account.nome,
    token: body + '.' + signToken(body, secret),
  };
}

function signToken(body, secret) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature('sessao:' + body, secret, Utilities.Charset.UTF_8),
  );
}

function authenticate(token) {
  var m = TOKEN_RE.exec(token || '');
  var secret = getSecret(false);
  if (!m || !secret) return fail('unauthorized', SESSION_EXPIRED);
  var body = m[1] + '.' + m[2] + '.' + m[3];
  if (!safeEquals(m[4], signToken(body, secret))) return fail('unauthorized', SESSION_EXPIRED);
  var account = cachedAccount(m[1]);
  if (!account || account.versaoSessao !== Number(m[2])) {
    return fail('unauthorized', SESSION_EXPIRED);
  }
  return { ok: true, account: account };
}

/** Resumo da conta no cache (evita ler a aba "contas" a cada gravação). */
function cacheAccount(account) {
  CacheService.getScriptCache().put(
    'conta:' + account.accountId,
    JSON.stringify({
      accountId: account.accountId,
      usuario: account.usuario,
      nome: account.nome,
      versaoSessao: account.versaoSessao,
    }),
    ACCOUNT_CACHE_SECONDS,
  );
}

function cachedAccount(accountId) {
  var raw = CacheService.getScriptCache().get('conta:' + accountId);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // cache estragado: lê da planilha
    }
  }
  var account = findBy(readAccounts().list, 'accountId', accountId);
  if (account) cacheAccount(account);
  return account;
}

// ------------------------------------------------------------------ ações

/** Lê perfil + todos os cômodos (remontando os pedaços) + álbum. */
function load(payload) {
  var profileId = payload.profileId;

  var profile = null;
  var profileTable = readTable(SHEETS.profile);
  for (var i = 0; i < profileTable.rows.length; i++) {
    var p = profileTable.rows[i];
    if (String(p[0]) === profileId) {
      profile = {
        estrelinhas: String(p[1]),
        desbloqueios: String(p[2]),
        missoes: String(p[3]),
        conquistas: String(p[4]),
        configuracoes: String(p[5]),
        updatedAt: Number(p[6]),
        revision: Number(p[7]),
      };
      break;
    }
  }

  var roomGroups = {};
  readTable(SHEETS.saves).rows.forEach(function (r) {
    if (String(r[0]) !== profileId) return;
    var roomId = String(r[1]);
    (roomGroups[roomId] = roomGroups[roomId] || []).push(r);
  });
  var rooms = [];
  Object.keys(roomGroups).forEach(function (roomId) {
    var rows = roomGroups[roomId];
    var data = joinChunks(rows, 2, 3, 4);
    if (data === null) {
      logEvent('load', '', 'erro', 'Cômodo ' + roomId + ' com pedaços faltando');
      return;
    }
    var first = rows[0];
    rooms.push({
      roomId: roomId,
      data: data,
      updatedAt: Number(first[5]),
      revision: Number(first[6]),
      deviceId: String(first[7]),
    });
  });

  var photoGroups = {};
  readTable(SHEETS.album).rows.forEach(function (r) {
    if (String(r[0]) !== profileId) return;
    var photoId = String(r[1]);
    (photoGroups[photoId] = photoGroups[photoId] || []).push(r);
  });
  var album = [];
  Object.keys(photoGroups).forEach(function (photoId) {
    var rows = photoGroups[photoId];
    var thumb = joinChunks(rows, 5, 6, 4);
    if (thumb === null) return;
    album.push({
      photoId: photoId,
      roomId: String(rows[0][2]),
      createdAt: Number(rows[0][3]),
      thumbnail: thumb,
    });
  });

  return ok({ profile: profile, rooms: rooms, album: album });
}

/** Grava um cômodo com controle de concorrência otimista por revisão. */
function saveRoom(payload, deviceId) {
  var roomId = payload.roomId;
  if (typeof roomId !== 'string' || !ID_RE.test(roomId))
    return fail('bad_request', 'roomId inválido.');
  if (
    typeof payload.data !== 'string' ||
    payload.data.length === 0 ||
    !BASE64_RE.test(payload.data)
  ) {
    return fail('bad_request', 'Dados do cômodo inválidos.');
  }
  var baseRevision = Number(payload.baseRevision);
  var updatedAt = Number(payload.updatedAt);
  if (!isFinite(baseRevision) || baseRevision < 0 || !isFinite(updatedAt)) {
    return fail('bad_request', 'baseRevision/updatedAt inválidos.');
  }
  var chunks = splitChunks(payload.data);
  if (chunks.length > MAX_CHUNKS) return fail('too_large', 'Cômodo grande demais para salvar.');

  var table = readTable(SHEETS.saves);
  var current = null;
  var kept = [];
  var currentRows = [];
  table.rows.forEach(function (r) {
    if (String(r[0]) === payload.profileId && String(r[1]) === roomId) currentRows.push(r);
    else kept.push(r);
  });
  if (currentRows.length > 0) {
    current = {
      roomId: roomId,
      data: joinChunks(currentRows, 2, 3, 4),
      updatedAt: Number(currentRows[0][5]),
      revision: Number(currentRows[0][6]),
      deviceId: String(currentRows[0][7]),
    };
  }
  if (current && current.revision > baseRevision) {
    return fail(
      'conflict',
      'O outro aparelho salvou uma versão mais nova deste cômodo.',
      undefined,
      {
        room: current,
      },
    );
  }

  var revision = (current ? current.revision : 0) + 1;
  chunks.forEach(function (chunk, index) {
    kept.push([
      payload.profileId,
      roomId,
      index,
      chunks.length,
      chunk,
      updatedAt,
      revision,
      deviceId,
    ]);
  });
  writeTable(SHEETS.saves, table, kept);
  return ok({ roomId: roomId, revision: revision, updatedAt: updatedAt });
}

/** Grava progresso/configurações (uma linha por perfil). */
function saveProfile(payload) {
  var fields = ['estrelinhas', 'desbloqueios', 'missoes', 'conquistas', 'configuracoes'];
  for (var i = 0; i < fields.length; i++) {
    var v = payload[fields[i]];
    if (typeof v !== 'string' || v.length > MAX_CELL)
      return fail('bad_request', 'Campo ' + fields[i] + ' inválido.');
    if (fields[i] !== 'estrelinhas' && !isJsonText(v))
      return fail('bad_request', 'Campo ' + fields[i] + ' não é JSON.');
  }
  if (!/^\d{1,9}$/.test(payload.estrelinhas)) return fail('bad_request', 'Estrelinhas inválidas.');
  var baseRevision = Number(payload.baseRevision);
  var updatedAt = Number(payload.updatedAt);
  if (!isFinite(baseRevision) || baseRevision < 0 || !isFinite(updatedAt)) {
    return fail('bad_request', 'baseRevision/updatedAt inválidos.');
  }

  var table = readTable(SHEETS.profile);
  var index = -1;
  for (var r = 0; r < table.rows.length; r++) {
    if (String(table.rows[r][0]) === payload.profileId) {
      index = r;
      break;
    }
  }
  var current = index >= 0 ? table.rows[index] : null;
  if (current && Number(current[7]) > baseRevision) {
    return fail('conflict', 'O outro aparelho salvou um progresso mais novo.', undefined, {
      profile: {
        estrelinhas: String(current[1]),
        desbloqueios: String(current[2]),
        missoes: String(current[3]),
        conquistas: String(current[4]),
        configuracoes: String(current[5]),
        updatedAt: Number(current[6]),
        revision: Number(current[7]),
      },
    });
  }
  var revision = (current ? Number(current[7]) : 0) + 1;
  var row = [
    payload.profileId,
    payload.estrelinhas,
    payload.desbloqueios,
    payload.missoes,
    payload.conquistas,
    payload.configuracoes,
    updatedAt,
    revision,
  ];
  var rows = table.rows.slice();
  if (index >= 0) rows[index] = row;
  else rows.push(row);
  writeTable(SHEETS.profile, table, rows);
  return ok({ revision: revision, updatedAt: updatedAt });
}

/** Grava a miniatura de uma foto (idempotente por photoId). */
function savePhoto(payload) {
  if (typeof payload.photoId !== 'string' || !ID_RE.test(payload.photoId))
    return fail('bad_request', 'photoId inválido.');
  if (typeof payload.roomId !== 'string' || !ID_RE.test(payload.roomId))
    return fail('bad_request', 'roomId inválido.');
  if (typeof payload.thumbnail !== 'string' || !THUMB_RE.test(payload.thumbnail)) {
    return fail('bad_request', 'Miniatura inválida.');
  }
  var createdAt = Number(payload.createdAt);
  if (!isFinite(createdAt)) return fail('bad_request', 'createdAt inválido.');
  var chunks = splitChunks(payload.thumbnail);
  if (chunks.length > MAX_CHUNKS) return fail('too_large', 'Miniatura grande demais.');

  var table = readTable(SHEETS.album);
  var rows = table.rows.filter(function (r) {
    return !(String(r[0]) === payload.profileId && String(r[1]) === payload.photoId);
  });
  chunks.forEach(function (chunk, index) {
    rows.push([
      payload.profileId,
      payload.photoId,
      payload.roomId,
      createdAt,
      chunk,
      index,
      chunks.length,
    ]);
  });
  writeTable(SHEETS.album, table, rows);
  return ok({ photoId: payload.photoId });
}

function deletePhoto(payload) {
  if (typeof payload.photoId !== 'string' || !ID_RE.test(payload.photoId))
    return fail('bad_request', 'photoId inválido.');
  var table = readTable(SHEETS.album);
  var rows = table.rows.filter(function (r) {
    return !(String(r[0]) === payload.profileId && String(r[1]) === payload.photoId);
  });
  if (rows.length !== table.rows.length) writeTable(SHEETS.album, table, rows);
  return ok({ photoId: payload.photoId });
}

// -------------------------------------------------------------- pedaços

/** Divide um texto em pedaços que cabem numa célula. */
function splitChunks(text) {
  var out = [];
  for (var i = 0; i < text.length; i += MAX_CELL) out.push(text.slice(i, i + MAX_CELL));
  return out.length > 0 ? out : [''];
}

/**
 * Remonta pedaços (ordenando por índice). Devolve null se faltar algum ou se
 * os totais não baterem — nunca entrega um save pela metade.
 */
function joinChunks(rows, indexCol, totalCol, dataCol) {
  if (rows.length === 0) return null;
  var total = Number(rows[0][totalCol]);
  if (!(total >= 1) || rows.length !== total) return null;
  var sorted = rows.slice().sort(function (a, b) {
    return Number(a[indexCol]) - Number(b[indexCol]);
  });
  for (var i = 0; i < sorted.length; i++) {
    if (Number(sorted[i][indexCol]) !== i || Number(sorted[i][totalCol]) !== total) return null;
  }
  return sorted
    .map(function (r) {
      return String(r[dataCol]);
    })
    .join('');
}

// ------------------------------------------------- planilha em lote

function sheetOf(def) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(def.name);
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(def.name);
  }
  return sheet;
}

/** Lê a aba inteira de uma vez (getValues). */
function readTable(def) {
  var sheet = sheetOf(def);
  var lastRow = sheet.getLastRow();
  var width = def.headers.length;
  var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, width).getValues() : [];
  return { sheet: sheet, def: def, rows: rows, previousCount: rows.length };
}

/** Reescreve as linhas de dados de uma vez (setValues) e limpa as sobras. */
function writeTable(def, table, rows) {
  var sheet = table.sheet;
  var width = def.headers.length;
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, width).setValues(rows);
  if (table.previousCount > rows.length) {
    sheet.getRange(2 + rows.length, 1, table.previousCount - rows.length, width).clearContent();
  }
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch {
    return fail('busy', 'Servidor ocupado; tente de novo em instantes.', 5);
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------- log

function logEvent(action, deviceId, result, error) {
  try {
    var sheet = sheetOf(SHEETS.log);
    sheet.appendRow([
      new Date().toISOString(),
      String(action || ''),
      String(deviceId || ''),
      String(result || ''),
      String(error || '').slice(0, 500),
    ]);
    var last = sheet.getLastRow();
    if (last > LOG_MAX_ROWS + LOG_TRIM_ROWS) sheet.deleteRows(2, LOG_TRIM_ROWS);
  } catch (err) {
    Logger.log('Falha ao registrar log: ' + messageOf(err));
  }
}

// ----------------------------------------------------------- respostas

function ok(data) {
  return { ok: true, data: data };
}

function fail(code, message, retryAfter, data) {
  var error = { code: code, message: message };
  if (retryAfter !== undefined) error.retryAfter = retryAfter;
  var out = { ok: false, error: error };
  if (data !== undefined) out.data = data;
  return out;
}

function respond(result) {
  result.serverTime = Date.now();
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function isJsonText(text) {
  try {
    var v = JSON.parse(text);
    return v !== null && typeof v === 'object';
  } catch {
    return false;
  }
}

function messageOf(err) {
  return err && err.message ? String(err.message) : String(err);
}
