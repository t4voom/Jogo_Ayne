/**
 * O Castelo da Aynebrenda — backend no Google Apps Script.
 *
 * Cole este arquivo inteiro no editor do Apps Script vinculado à planilha,
 * rode `setup()` uma vez, defina a propriedade de script PIN e publique como
 * App da Web (Executar como: eu · Quem tem acesso: qualquer pessoa).
 * Passo a passo completo em apps-script/README.md.
 *
 * Contrato (um único endpoint):
 *   GET  ?action=ping                         → saúde do serviço
 *   POST { action, pin, deviceId, payload }   → load | saveRoom | saveProfile | savePhoto | deletePhoto
 *   Resposta sempre: { ok, data?, error?: { code, message, retryAfter? }, serverTime }
 *
 * O cliente envia POST com Content-Type text/plain (requisição simples, sem
 * preflight de CORS); o corpo é JSON em texto.
 */

// ------------------------------------------------------------- configuração

var API_VERSION = 1;
var MAX_CELL = 45000; // limite do Sheets é 50.000 caracteres por célula
var MAX_BODY = 1500000; // ~1,5 MB por requisição
var MAX_CHUNKS = 40;
var LOCK_WAIT_MS = 20000;
var LOG_MAX_ROWS = 2000;
var LOG_TRIM_ROWS = 500;

// Proteção do PIN (CacheService)
var PIN_MAX_FAILS_PER_DEVICE = 5;
var PIN_DEVICE_LOCK_SECONDS = 15 * 60;
var PIN_MAX_FAILS_GLOBAL = 30;
var PIN_GLOBAL_WINDOW_SECONDS = 60 * 60;
var PIN_GLOBAL_LOCK_SECONDS = 30 * 60;
var MAX_KNOWN_DEVICES = 20;

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
  log: {
    name: 'log',
    headers: ['timestamp', 'acao', 'deviceId', 'resultado', 'erro'],
  },
};

var ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
var BASE64_RE = /^[A-Za-z0-9+/=]+$/;
var THUMB_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

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
  var pin = PropertiesService.getScriptProperties().getProperty('PIN');
  Logger.log(
    pin
      ? 'Tudo pronto! O PIN já está definido nas propriedades do script.'
      : 'Abas criadas. Agora defina a propriedade de script "PIN" (Configurações do projeto → Propriedades do script).',
  );
}

// -------------------------------------------------------------- endpoints

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'ping') {
    return respond(ok({ version: API_VERSION, configured: Boolean(getPin()) }));
  }
  return respond(fail('bad_request', 'Use POST, ou GET ?action=ping.'));
}

function doPost(e) {
  var req;
  try {
    req = parseRequest(e);
  } catch (err) {
    return respond(fail('bad_request', messageOf(err)));
  }

  var auth = checkPin(req.pin, req.deviceId);
  if (!auth.ok) {
    logEvent(req.action, req.deviceId, auth.error.code, auth.error.message);
    return respond(auth);
  }

  try {
    var result;
    switch (req.action) {
      case 'load':
        result = load(req.payload);
        break;
      case 'saveRoom':
        result = withLock(function () {
          return saveRoom(req.payload, req.deviceId);
        });
        break;
      case 'saveProfile':
        result = withLock(function () {
          return saveProfile(req.payload);
        });
        break;
      case 'savePhoto':
        result = withLock(function () {
          return savePhoto(req.payload);
        });
        break;
      case 'deletePhoto':
        result = withLock(function () {
          return deletePhoto(req.payload);
        });
        break;
      default:
        result = fail('bad_request', 'Ação desconhecida: ' + req.action);
    }
    if (req.action !== 'load' || !result.ok) {
      logEvent(
        req.action,
        req.deviceId,
        result.ok ? 'ok' : result.error.code,
        result.ok ? '' : result.error.message,
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
  if (typeof body.pin !== 'string' || body.pin.length === 0 || body.pin.length > 64) {
    throw new Error('Campo "pin" ausente.');
  }
  if (typeof body.deviceId !== 'string' || !ID_RE.test(body.deviceId)) {
    throw new Error('Campo "deviceId" inválido.');
  }
  var payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
  if (typeof payload.profileId !== 'string' || !ID_RE.test(payload.profileId)) {
    throw new Error('Campo "payload.profileId" inválido.');
  }
  return { action: body.action, pin: body.pin, deviceId: body.deviceId, payload: payload };
}

// ------------------------------------------------------------------- PIN

function getPin() {
  return PropertiesService.getScriptProperties().getProperty('PIN');
}

/**
 * Confere o PIN com limite de tentativas:
 *  - por aparelho: 5 erros → bloqueio de 15 min
 *  - global: 30 erros/hora → bloqueio de 30 min para aparelhos desconhecidos
 * Aparelhos que já acertaram o PIN antes continuam funcionando no bloqueio
 * global (um ataque não tranca a Ayne para fora do castelo).
 */
function checkPin(pin, deviceId) {
  var expected = getPin();
  if (!expected) {
    return fail('not_configured', 'O PIN ainda não foi definido nas propriedades do script.');
  }
  var cache = CacheService.getScriptCache();
  var now = Date.now();
  var deviceLockKey = 'pinlock:' + deviceId;
  var lockedUntil = Number(cache.get(deviceLockKey) || 0);
  if (lockedUntil > now) {
    return fail(
      'locked',
      'Muitas tentativas. Tente de novo mais tarde.',
      Math.ceil((lockedUntil - now) / 1000),
    );
  }
  var known = isKnownDevice(deviceId);
  var globalUntil = Number(cache.get('pinlock:global') || 0);
  if (!known && globalUntil > now) {
    return fail(
      'locked',
      'Muitas tentativas. Tente de novo mais tarde.',
      Math.ceil((globalUntil - now) / 1000),
    );
  }

  if (safeEquals(String(pin), String(expected))) {
    cache.remove('pinfail:' + deviceId);
    if (!known) rememberDevice(deviceId);
    return { ok: true };
  }

  var fails = Number(cache.get('pinfail:' + deviceId) || 0) + 1;
  cache.put('pinfail:' + deviceId, String(fails), PIN_DEVICE_LOCK_SECONDS);
  if (fails >= PIN_MAX_FAILS_PER_DEVICE) {
    cache.put(deviceLockKey, String(now + PIN_DEVICE_LOCK_SECONDS * 1000), PIN_DEVICE_LOCK_SECONDS);
    cache.remove('pinfail:' + deviceId);
  }
  var globalFails = Number(cache.get('pinfail:global') || 0) + 1;
  cache.put('pinfail:global', String(globalFails), PIN_GLOBAL_WINDOW_SECONDS);
  if (globalFails >= PIN_MAX_FAILS_GLOBAL) {
    cache.put(
      'pinlock:global',
      String(now + PIN_GLOBAL_LOCK_SECONDS * 1000),
      PIN_GLOBAL_LOCK_SECONDS,
    );
    cache.remove('pinfail:global');
  }
  var left = Math.max(0, PIN_MAX_FAILS_PER_DEVICE - fails);
  return fail(
    'unauthorized',
    'Código do castelo incorreto.' + (left > 0 ? ' Restam ' + left + ' tentativas.' : ''),
  );
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
