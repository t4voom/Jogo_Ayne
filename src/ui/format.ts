const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "agora há pouco", "há 5 minutos", "há 2 horas", "ontem", "12/03". */
export function relativeTime(time: number, now = Date.now()): string {
  const diff = Math.max(0, now - time);
  if (diff < MINUTE) return 'agora há pouco';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `há ${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  if (diff < 2 * DAY) return 'ontem';
  return new Date(time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function dateTime(time: number): string {
  return new Date(time).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
