import type { HapticKind } from '../input/stage-gestures';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [10, 40, 14],
};

/**
 * Vibração leve onde houver suporte.
 *  - Android/Chrome: `navigator.vibrate`.
 *  - iPhone: não existe API de vibração no Safari. No iOS 18+, alternar um
 *    `<input type="checkbox" switch>` dispara um "tique" háptico do sistema;
 *    usamos isso como melhor esforço (só funciona dentro de um toque).
 */
export class Haptics {
  private iosSwitch: HTMLLabelElement | null = null;

  constructor(private readonly enabled: () => boolean) {}

  play(kind: HapticKind): void {
    if (!this.enabled()) return;
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(PATTERNS[kind]);
      } catch {
        // Alguns navegadores lançam fora de um gesto do usuário: ignorar é seguro.
      }
      return;
    }
    this.iosTick();
  }

  private iosTick(): void {
    if (!this.iosSwitch) {
      const label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.cssText =
        'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;
      label.append(input);
      document.body.append(label);
      this.iosSwitch = label;
    }
    this.iosSwitch.click();
  }
}
