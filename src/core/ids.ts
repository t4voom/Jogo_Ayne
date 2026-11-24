/** Gerador de ids injetável (testes usam um determinístico). */
export type IdGenerator = () => string;

export const randomId: IdGenerator = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  }
  // Fallback (navegadores muito antigos): suficiente para ids locais.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

export function sequentialIds(prefix = 'id'): IdGenerator {
  let n = 0;
  return () => `${prefix}${++n}`;
}
