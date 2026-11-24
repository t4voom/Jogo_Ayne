import type { Progression } from '../app/progression';
import type { AudioEngine } from '../audio/engine';
import { confetti } from '../fx/confetti';
import type { Haptics } from './haptics';
import { openLetter } from './letter';
import type { Router } from './router';
import { confirmSheet } from './sheet';
import type { Toaster } from './toast';

/** Transforma eventos de progressão em toasts, confete e vibração. */
export function installRewardFeedback(deps: {
  progression: Progression;
  toast: Toaster;
  haptics: Haptics;
  router: Router;
  sound: AudioEngine;
}): () => void {
  const { progression, toast, haptics, router, sound } = deps;
  return progression.on((e) => {
    switch (e.type) {
      case 'mission-done':
        haptics.play('success');
        sound.play('sparkle');
        toast.show(`Missão cumprida: ${e.title}! 🏆`, {
          tone: 'love',
          icon: 'trophy',
          duration: 5000,
          action: {
            label: 'Pegar ⭐',
            run: () => {
              void router.go({ name: 'achievements' });
            },
          },
        });
        break;
      case 'achievement':
        haptics.play('success');
        sound.play('bell');
        confetti({ count: 45 });
        toast.show(`Nova medalha: ${e.title}! +10 ⭐`, {
          tone: 'love',
          icon: 'trophy',
          duration: 4500,
        });
        break;
      case 'love':
        toast.show(e.message, { tone: 'love', icon: 'heart' });
        break;
      case 'letter-ready':
        window.setTimeout(() => {
          void confirmSheet({
            title: 'Todas as conquistas! 👑',
            message:
              'Você completou o castelo inteiro de conquistas… e chegou uma carta para você 💌',
            confirm: 'Abrir a carta',
            cancel: 'Depois',
          }).then((open) => {
            if (open) openLetter(() => progression.markLetterSeen());
          });
        }, 1200);
        break;
      case 'stars':
        break;
    }
  });
}
