import type { ArtRegistry } from '../art/registry';
import type { CatalogItem } from '../catalog/types';
import type { Room } from '../core/model';
import { composeRoomSvg } from './compose';

const W = 1080;
const H = 1280;
const PAD = 40;
const IMG = W - PAD * 2;

export interface CapturedPhoto {
  readonly image: Blob;
  readonly thumbnail: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Não foi possível carregar o desenho do cômodo (${src.slice(0, 30)}…)`));
    };
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.4, cy + r * 0.1, cx - r * 1.1, cy - r * 1.25, cx, cy - r * 0.5);
  ctx.bezierCurveTo(cx + r * 1.1, cy - r * 1.25, cx + r * 1.4, cy + r * 0.1, cx, cy + r * 0.9);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Foto do cômodo com moldura de princesa: o palco é composto como um SVG
 * (idêntico ao que se vê), desenhado num canvas e exportado em PNG.
 */
export async function capturePhoto(
  room: Room,
  roomName: string,
  art: ArtRegistry,
  getItem: (id: string) => CatalogItem | undefined,
  when: Date,
): Promise<CapturedPhoto> {
  const svg = composeRoomSvg(room, art, getItem, { standalone: true, still: true })
    // Tamanho explícito: o WebKit não usa só o viewBox para o tamanho da imagem.
    .replace(
      '<svg xmlns="http://www.w3.org/2000/svg"',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${IMG}" height="${IMG}"`,
    );
  let img: HTMLImageElement;
  let blobUrl: string | null = null;
  try {
    img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  } catch {
    // Alguns WebKits recusam data URLs grandes: tenta com Blob URL.
    blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img = await loadImage(blobUrl);
  }
  try {
    await document.fonts.load('700 64px "Dancing Script"');
    await document.fonts.load('800 30px "Nunito"');
  } catch {
    // Sem a fonte, o canvas usa a reserva; a foto sai do mesmo jeito.
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  // fundo da moldura
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#ffe6f1');
  bg.addColorStop(0.5, '#fbd5e5');
  bg.addColorStop(1, '#e6d8fb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    heart(ctx, (i * 137) % W, (i * 251) % H, 6 + (i % 4) * 2, 'rgba(255,255,255,0.45)');
  }

  // borda dourada
  const gold = ctx.createLinearGradient(0, PAD - 16, 0, PAD + IMG + 16);
  gold.addColorStop(0, '#fff1c2');
  gold.addColorStop(0.5, '#f6d27a');
  gold.addColorStop(1, '#dfa544');
  roundRect(ctx, PAD - 16, PAD - 16, IMG + 32, IMG + 32, 36);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.save();
  roundRect(ctx, PAD, PAD, IMG, IMG, 24);
  ctx.clip();
  ctx.drawImage(img, PAD, PAD, IMG, IMG);
  ctx.restore();
  roundRect(ctx, PAD, PAD, IMG, IMG, 24);
  ctx.strokeStyle = 'rgba(196,138,44,0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();
  for (const [x, y] of [
    [PAD - 4, PAD - 4],
    [PAD + IMG + 4, PAD - 4],
    [PAD - 4, PAD + IMG + 4],
    [PAD + IMG + 4, PAD + IMG + 4],
  ] as const) {
    heart(ctx, x, y, 22, '#f391bf');
    heart(ctx, x, y - 2, 10, '#ffe6f1');
  }

  // legenda
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c2407c';
  ctx.font = '700 64px "Dancing Script", cursive';
  ctx.fillText('O Castelo da Aynebrenda', W / 2, PAD + IMG + 100);
  ctx.fillStyle = '#74406a';
  ctx.font = '800 30px "Nunito", sans-serif';
  const date = when.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  ctx.fillText(`${roomName} · ${date}`, W / 2, PAD + IMG + 150);

  if (blobUrl) URL.revokeObjectURL(blobUrl);
  const image = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('O navegador não gerou o PNG da foto'));
      }, 'image/png');
    } catch (error) {
      reject(new Error('O navegador bloqueou a exportação da foto', { cause: error }));
    }
  });

  const thumb = document.createElement('canvas');
  thumb.width = 300;
  thumb.height = Math.round((300 * H) / W);
  const tctx = thumb.getContext('2d');
  if (!tctx) throw new Error('Canvas indisponível');
  tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return { image, thumbnail: thumb.toDataURL('image/jpeg', 0.78) };
}
