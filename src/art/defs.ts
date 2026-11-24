/**
 * Gradientes compartilhados por toda a arte (referenciados como url(#k-…)).
 * Inseridos UMA vez no documento e também embutidos em cada foto exportada.
 */
export const SHARED_DEFS = `
<radialGradient id="k-shadow" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#7a3a62" stop-opacity=".30"/>
  <stop offset=".6" stop-color="#7a3a62" stop-opacity=".14"/>
  <stop offset="1" stop-color="#7a3a62" stop-opacity="0"/>
</radialGradient>
<linearGradient id="k-gold" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fff1c2"/>
  <stop offset=".45" stop-color="#f6d27a"/>
  <stop offset="1" stop-color="#dfa544"/>
</linearGradient>
<linearGradient id="k-gold-h" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#e3ad48"/>
  <stop offset=".5" stop-color="#fff1c2"/>
  <stop offset="1" stop-color="#e3ad48"/>
</linearGradient>
<radialGradient id="k-pearl" cx=".35" cy=".3" r=".75">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".6" stop-color="#fde8f2"/>
  <stop offset="1" stop-color="#efbfd6"/>
</radialGradient>
<linearGradient id="k-glass" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".35" stop-color="#e6f4ff"/>
  <stop offset=".7" stop-color="#cfe6f8"/>
  <stop offset="1" stop-color="#f4e8ff"/>
</linearGradient>
<linearGradient id="k-sky-window" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#a9d8f6"/>
  <stop offset=".7" stop-color="#dff1ff"/>
  <stop offset="1" stop-color="#fff2f8"/>
</linearGradient>
<linearGradient id="k-water" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#d9f2ff"/>
  <stop offset="1" stop-color="#8fcdf0"/>
</linearGradient>
<radialGradient id="k-flame" cx=".5" cy=".7" r=".6">
  <stop offset="0" stop-color="#ffffff"/>
  <stop offset=".35" stop-color="#fff3b0"/>
  <stop offset=".8" stop-color="#ffb347"/>
  <stop offset="1" stop-color="#ff8f6b"/>
</radialGradient>
<radialGradient id="k-glow" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#fff6c9" stop-opacity=".95"/>
  <stop offset=".45" stop-color="#ffe7a1" stop-opacity=".45"/>
  <stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
</radialGradient>
<linearGradient id="k-shine" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ffffff" stop-opacity=".85"/>
  <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
`;

let installed = false;

/** Insere os defs compartilhados no documento (idempotente). */
export function installSharedDefs(doc: Document = document): void {
  if (installed || doc.getElementById('k-defs')) return;
  const holder = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.setAttribute('id', 'k-defs');
  holder.setAttribute('aria-hidden', 'true');
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.style.position = 'absolute';
  holder.innerHTML = `<defs>${SHARED_DEFS}</defs>`;
  doc.body.prepend(holder);
  installed = true;
}
