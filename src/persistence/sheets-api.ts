import { z } from 'zod';
import type { ProfileWire } from './wire';

/**
 * Cliente do backend no Google Apps Script.
 *
 * Detalhe importante de CORS: o POST vai com `Content-Type: text/plain` e o
 * corpo é JSON em texto — é uma "requisição simples", sem preflight OPTIONS
 * (que o Apps Script não sabe responder).
 */

export type ApiErrorCode =
  | 'unauthorized'
  | 'locked'
  | 'not_configured'
  | 'conflict'
  | 'busy'
  | 'bad_request'
  | 'too_large'
  | 'server_error'
  | 'network'
  | 'http'
  | 'invalid_response';

const RETRYABLE: readonly ApiErrorCode[] = [
  'network',
  'http',
  'busy',
  'server_error',
  'invalid_response',
  'locked',
];

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly retryAfter?: number,
    readonly data?: unknown,
  ) {
    super(message);
  }

  get retryable(): boolean {
    return RETRYABLE.includes(this.code);
  }
}

/** Envia o corpo e devolve o texto da resposta (lança em falha de rede). */
export type Transport = (body: string, options: { keepalive: boolean }) => Promise<string>;

const KEEPALIVE_LIMIT = 60_000;

export function fetchTransport(url: string, timeoutMs = 25_000): Transport {
  return async (body, { keepalive }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
        cache: 'no-store',
        credentials: 'omit',
        keepalive: keepalive && body.length < KEEPALIVE_LIMIT,
        signal: controller.signal,
      });
    } catch (error) {
      throw new ApiError('network', 'Sem conexão com a planilha', undefined, String(error));
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new ApiError('http', `A planilha respondeu ${res.status}`);
    return res.text();
  };
}

// ------------------------------------------------------------ respostas

const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryAfter: z.number().optional(),
});

const EnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: ErrorSchema.optional(),
  serverTime: z.number().optional(),
});

export const RemoteRoomSchema = z.object({
  roomId: z.string(),
  data: z.string(),
  updatedAt: z.number(),
  revision: z.number().int().min(0),
  deviceId: z.string(),
});
export type RemoteRoom = z.infer<typeof RemoteRoomSchema>;

export const RemoteProfileSchema = z.object({
  estrelinhas: z.string(),
  desbloqueios: z.string(),
  missoes: z.string(),
  conquistas: z.string(),
  configuracoes: z.string(),
  updatedAt: z.number(),
  revision: z.number().int().min(0),
});
export type RemoteProfile = z.infer<typeof RemoteProfileSchema>;

export const RemotePhotoSchema = z.object({
  photoId: z.string(),
  roomId: z.string(),
  createdAt: z.number(),
  thumbnail: z.string(),
});
export type RemotePhoto = z.infer<typeof RemotePhotoSchema>;

const LoadSchema = z.object({
  profile: RemoteProfileSchema.nullable(),
  rooms: z.array(RemoteRoomSchema),
  album: z.array(RemotePhotoSchema),
});
export type LoadResult = z.infer<typeof LoadSchema>;

const SavedSchema = z.object({ revision: z.number().int(), updatedAt: z.number() });
const ConflictRoomSchema = z.object({ room: RemoteRoomSchema });
const ConflictProfileSchema = z.object({ profile: RemoteProfileSchema });

const KNOWN_CODES = new Set<string>([
  'unauthorized',
  'locked',
  'not_configured',
  'conflict',
  'busy',
  'bad_request',
  'too_large',
  'server_error',
]);

export interface Credentials {
  readonly pin: string;
  readonly deviceId: string;
}

export class SheetsApi {
  constructor(
    private readonly transport: Transport,
    private readonly credentials: () => Credentials | null,
    readonly profileId = 'ayne',
  ) {}

  private async call<T>(
    action: string,
    payload: Record<string, unknown>,
    schema: z.ZodType<T>,
    keepalive = false,
  ): Promise<T> {
    const creds = this.credentials();
    if (!creds) throw new ApiError('unauthorized', 'Código do castelo não informado');
    const body = JSON.stringify({
      action,
      pin: creds.pin,
      deviceId: creds.deviceId,
      payload: { profileId: this.profileId, ...payload },
    });
    const text = await this.transport(body, { keepalive });
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      // O Apps Script devolve uma página HTML quando a URL/publicação está errada.
      throw new ApiError(
        'invalid_response',
        'A planilha não respondeu em JSON (confira a URL publicada)',
      );
    }
    const env = EnvelopeSchema.safeParse(raw);
    if (!env.success)
      throw new ApiError('invalid_response', 'Resposta da planilha em formato inesperado');
    if (!env.data.ok) {
      const err = env.data.error;
      const code = err && KNOWN_CODES.has(err.code) ? (err.code as ApiErrorCode) : 'server_error';
      throw new ApiError(code, err?.message ?? 'Erro desconhecido', err?.retryAfter, env.data.data);
    }
    const data = schema.safeParse(env.data.data);
    if (!data.success)
      throw new ApiError('invalid_response', `Resposta de "${action}" em formato inesperado`);
    return data.data;
  }

  load(): Promise<LoadResult> {
    return this.call('load', {}, LoadSchema);
  }

  saveRoom(
    room: { roomId: string; data: string; updatedAt: number; baseRevision: number },
    keepalive = false,
  ): Promise<{ revision: number; updatedAt: number }> {
    return this.call('saveRoom', room, SavedSchema, keepalive);
  }

  saveProfile(
    profile: ProfileWire & { updatedAt: number; baseRevision: number },
    keepalive = false,
  ): Promise<{ revision: number; updatedAt: number }> {
    return this.call('saveProfile', { ...profile }, SavedSchema, keepalive);
  }

  savePhoto(photo: RemotePhoto): Promise<{ photoId: string }> {
    return this.call('savePhoto', { ...photo }, z.object({ photoId: z.string() }));
  }

  deletePhoto(photoId: string): Promise<{ photoId: string }> {
    return this.call('deletePhoto', { photoId }, z.object({ photoId: z.string() }));
  }
}

/** Extrai a versão do servidor de um erro de conflito de cômodo. */
export function conflictRoom(error: ApiError): RemoteRoom | null {
  const parsed = ConflictRoomSchema.safeParse(error.data);
  return parsed.success ? parsed.data.room : null;
}

export function conflictProfile(error: ApiError): RemoteProfile | null {
  const parsed = ConflictProfileSchema.safeParse(error.data);
  return parsed.success ? parsed.data.profile : null;
}
