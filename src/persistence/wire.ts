import LZString from 'lz-string';
import type { Room, RoomId } from '../core/model';
import type { Profile } from '../core/profile';
import { parseProfile, parseRoom, serializeProfile, serializeRoom } from '../core/save';

/**
 * Formato "de fio" entre o jogo e a planilha.
 *  - Cômodo: JSON versionado → lz-string → base64 (texto seguro para célula).
 *  - Perfil: espalhado nas colunas da aba `profile` (estrelinhas, desbloqueios,
 *    missões, conquistas, configurações), com o resto + schemaVersion em
 *    `configuracoes`.
 */

export function encodeRoom(room: Room): string {
  return LZString.compressToBase64(JSON.stringify(serializeRoom(room)));
}

export class WireError extends Error {
  override readonly name = 'WireError';
}

/** Decodifica um cômodo remoto aplicando a revisão/data do servidor. */
export function decodeRoom(
  data: string,
  meta: { roomId: string; revision: number; updatedAt: number },
): Room {
  const json = LZString.decompressFromBase64(data);
  if (!json) throw new WireError(`Cômodo ${meta.roomId}: dados compactados ilegíveis`);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (error) {
    throw new WireError(`Cômodo ${meta.roomId}: JSON inválido`, { cause: error });
  }
  const room = parseRoom(raw);
  if (room.id !== (meta.roomId as RoomId)) {
    throw new WireError(`Cômodo ${meta.roomId}: id não confere (${room.id})`);
  }
  return { ...room, revision: meta.revision, updatedAt: meta.updatedAt };
}

export interface ProfileWire {
  readonly estrelinhas: string;
  readonly desbloqueios: string;
  readonly missoes: string;
  readonly conquistas: string;
  readonly configuracoes: string;
}

/** Campos do perfil que ganham coluna própria na planilha (legível para o Gustavo). */
const COLUMNS = {
  desbloqueios: 'unlocked',
  missoes: 'missions',
  conquistas: 'achievements',
} as const;
type Column = keyof typeof COLUMNS;

/**
 * Espalha o perfil nas colunas. O que não tem coluna (configurações, livro das
 * estrelinhas, schemaVersion…) vai em `configuracoes`, junto com a lista
 * `_cols` dos campos que foram para colunas — assim qualquer versão do perfil
 * ida-e-volta sem perder nada.
 */
export function encodeProfile(profile: Profile, starBalance: number): ProfileWire {
  const all: Record<string, unknown> = { ...serializeProfile(profile) };
  const cols: Record<Column, string> = { desbloqueios: '[]', missoes: '{}', conquistas: '{}' };
  const moved: string[] = [];
  for (const [col, key] of Object.entries(COLUMNS) as [Column, string][]) {
    if (key in all) {
      cols[col] = JSON.stringify(all[key]);
      moved.push(key);
    }
  }
  const skip = new Set<string>(['revision', 'updatedAt', ...moved]);
  const rest = Object.fromEntries(Object.entries(all).filter(([k]) => !skip.has(k)));
  return {
    estrelinhas: String(Math.max(0, Math.floor(starBalance))),
    ...cols,
    configuracoes: JSON.stringify({ ...rest, _cols: moved }),
  };
}

export function decodeProfile(
  wire: ProfileWire,
  meta: { revision: number; updatedAt: number },
): Profile {
  const json = (text: string, what: string): unknown => {
    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      throw new WireError(`Perfil: ${what} ilegível`, { cause: error });
    }
  };
  const config = json(wire.configuracoes, 'configurações');
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new WireError('Perfil: configurações não são um objeto');
  }
  const { _cols: moved, ...rest } = config as Record<string, unknown>;
  const raw: Record<string, unknown> = {
    ...rest,
    revision: meta.revision,
    updatedAt: meta.updatedAt,
  };
  const movedKeys = Array.isArray(moved) ? (moved as unknown[]) : [];
  for (const [col, key] of Object.entries(COLUMNS) as [Column, string][]) {
    if (movedKeys.includes(key)) raw[key] = json(wire[col], col);
  }
  return parseProfile(raw);
}
