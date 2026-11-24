import { describe, expect, it, vi } from 'vitest';
import { LogHub, describeError } from './log';

describe('describeError', () => {
  it('descreve Error com causa', () => {
    const err = new Error('falhou', { cause: new TypeError('rede') });
    expect(describeError(err)).toBe('Error: falhou (causa: TypeError: rede)');
  });

  it('descreve valores não-Error sem lançar', () => {
    expect(describeError('texto')).toBe('texto');
    expect(describeError({ a: 1 })).toBe('{"a":1}');
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    expect(describeError(circular)).toBe('[object Object]');
    expect(describeError(undefined)).toBe('undefined');
  });
});

describe('LogHub', () => {
  it('guarda entradas num buffer circular', () => {
    const hub = new LogHub(3, 'debug', () => 42);
    const log = hub.logger('teste');
    for (let i = 0; i < 5; i++) log.info(`m${i}`);
    expect(hub.recent().map((e) => e.message)).toEqual(['m2', 'm3', 'm4']);
    expect(hub.recent()[0]).toMatchObject({ time: 42, level: 'info', scope: 'teste' });
  });

  it('respeita o nível mínimo', () => {
    const hub = new LogHub(10, 'warn');
    const log = hub.logger('x');
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d', new Error('e'));
    expect(hub.recent().map((e) => e.level)).toEqual(['warn', 'error']);
    expect(hub.recent()[1]?.detail).toContain('Error: e');
  });

  it('entrega para sinks e isola sinks com defeito', () => {
    const hub = new LogHub();
    const good = vi.fn();
    hub.addSink(() => {
      throw new Error('sink quebrado');
    });
    const remove = hub.addSink(good);
    hub.logger('a').child('b').warn('oi', { x: 1 });
    expect(good).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'a:b', message: 'oi', detail: '{"x":1}' }),
    );
    remove();
    hub.logger('a').warn('de novo');
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('trunca detalhes enormes', () => {
    const hub = new LogHub();
    hub.logger('a').info('grande', 'x'.repeat(5000));
    expect(hub.recent()[0]?.detail?.length).toBeLessThanOrEqual(2001);
  });
});
