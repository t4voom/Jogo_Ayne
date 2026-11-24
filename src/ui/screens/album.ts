import { ROOM_IDS, type RoomId } from '../../core/model';
import { roomInfo } from '../../core/rooms';
import type { PhotoRecord } from '../../persistence/local-repository';
import type { GameContext } from '../context';
import { h, icon, iconButton } from '../dom';
import { dateTime } from '../format';
import type { Screen } from '../router';
import { confirmSheet, openSheet } from '../sheet';
import '../styles/album.css';

const roomName = (id: string): string =>
  (ROOM_IDS as readonly string[]).includes(id) ? roomInfo(id as RoomId).name : 'Castelo';

function fileName(p: PhotoRecord): string {
  const d = new Date(p.createdAt);
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `castelo-da-ayne-${p.roomId}-${stamp}.png`;
}

async function asBlob(p: PhotoRecord): Promise<Blob> {
  if (p.image) return p.image;
  const res = await fetch(p.thumbnail);
  return res.blob();
}

export function createAlbumScreen(ctx: GameContext): Screen {
  const grid = h('div', { class: 'album-grid' });
  const count = h('p', { class: 'album-count' });
  const urls: string[] = [];

  const openViewer = (p: PhotoRecord) => {
    const src = p.image ? URL.createObjectURL(p.image) : p.thumbnail;
    if (p.image) urls.push(src);
    openSheet(
      (close) => {
        const share = async () => {
          try {
            const blob = await asBlob(p);
            const file = new File([blob], fileName(p), { type: blob.type || 'image/png' });
            if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'O Castelo da Aynebrenda',
                text: `${roomName(p.roomId)} 👑`,
              });
            } else {
              download();
            }
          } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              ctx.toast.show('Não consegui compartilhar agora. Tente baixar 💕', { tone: 'warn' });
            }
          }
        };
        const download = () => {
          void asBlob(p).then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = h('a', { attrs: { href: url, download: fileName(p) } });
            document.body.append(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 2000);
          });
        };
        const remove = async () => {
          const ok = await confirmSheet({
            title: 'Apagar esta foto?',
            message: 'Ela sai do álbum neste aparelho e no outro.',
            confirm: 'Apagar',
            danger: true,
          });
          if (!ok) return;
          await ctx.photos.remove(p.id);
          ctx.cloud.engine.markPhotoDeleted(p.id);
          ctx.sound.play('whoosh');
          close();
        };
        return h(
          'div',
          { class: 'viewer' },
          h('img', { class: 'viewer-img', attrs: { src, alt: `Foto do ${roomName(p.roomId)}` } }),
          h('p', {
            class: 'viewer-caption',
            text: `${roomName(p.roomId)} · ${dateTime(p.createdAt)}`,
          }),
          p.image
            ? ''
            : h('p', {
                class: 'viewer-note',
                text: 'Foto tirada no outro aparelho (versão miniatura).',
              }),
          h(
            'div',
            { class: 'sheet-actions' },
            h(
              'button',
              {
                class: 'btn btn-primary',
                attrs: { type: 'button' },
                on: { click: () => void share() },
              },
              icon('share'),
              'Compartilhar',
            ),
            h(
              'button',
              { class: 'btn btn-secondary', attrs: { type: 'button' }, on: { click: download } },
              icon('download'),
              'Baixar',
            ),
            h(
              'button',
              {
                class: 'btn btn-ghost',
                attrs: { type: 'button' },
                on: { click: () => void remove() },
              },
              icon('trash'),
              'Apagar',
            ),
          ),
        );
      },
      { label: 'Foto', className: 'viewer-sheet' },
    );
  };

  const render = async () => {
    const photos = await ctx.photos.list();
    count.textContent = photos.length === 1 ? '1 lembrança' : `${photos.length} lembranças`;
    if (photos.length === 0) {
      grid.replaceChildren(
        h(
          'div',
          { class: 'album-empty' },
          h('span', { class: 'album-empty-icon' }, icon('camera')),
          h('p', { text: 'Nenhuma foto ainda.' }),
          h('p', {
            text: 'Dentro de um cômodo, toque na câmera 📷 para guardar uma lembrança do seu castelo!',
          }),
        ),
      );
      return;
    }
    grid.replaceChildren(
      ...photos.map((p, i) =>
        h(
          'button',
          {
            class: 'album-photo',
            style: { '--tilt': `${((i % 5) - 2) * 1.2}deg` },
            attrs: {
              type: 'button',
              'aria-label': `Ver foto do ${roomName(p.roomId)} de ${dateTime(p.createdAt)}`,
            },
            on: {
              click: () => {
                openViewer(p);
              },
            },
          },
          h('img', { attrs: { src: p.thumbnail, alt: '', loading: 'lazy' } }),
          h('span', { class: 'album-label', text: roomName(p.roomId) }),
        ),
      ),
    );
  };
  void render();
  const unsubscribe = ctx.photos.onChange(() => {
    void render();
  });

  const el = h(
    'div',
    { class: 'album-screen' },
    h(
      'header',
      { class: 'map-top' },
      iconButton('back', 'Voltar', () => {
        ctx.router.back({ name: 'map' });
      }),
      h('h1', { class: 'map-title title-display', text: 'Álbum de fotos' }),
      h('div', { class: 'map-top-actions' }, count),
    ),
    h('div', { class: 'album-scroll' }, grid),
  );
  return {
    el,
    destroy() {
      unsubscribe();
      for (const u of urls) URL.revokeObjectURL(u);
      el.remove();
    },
  };
}
