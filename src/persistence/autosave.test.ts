import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sequentialIds } from '../core/ids';
import { LogHub } from '../core/log';
import type { Room } from '../core/model';
import { createProfile } from '../core/profile';
import { createRoom } from '../core/rooms';
import { Autosaver, type AutosaveStatus } from './autosave';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function setup(failTimes = 0) {
  const saved: Room[] = [];
  let failures = failTimes;
  const target = {
    saveRoom: vi.fn((room: Room) => {
      if (failures > 0) {
        failures--;
        return Promise.reject(new Error('disco cheio'));
      }
      saved.push(room);
      return Promise.resolve();
    }),
    saveProfile: vi.fn(() => Promise.resolve()),
  };
  const statuses: AutosaveStatus[] = [];
  const onRoomSaved = vi.fn();
  const saver = new Autosaver(target, {
    delayMs: 100,
    retryMs: 1000,
    logger: new LogHub().logger('t'),
    onStatus: (s) => statuses.push(s),
    onRoomSaved,
  });
  return { saver, target, saved, statuses, onRoomSaved };
}

const room = (n: number): Room => ({ ...createRoom('quarto', sequentialIds(), n), updatedAt: n });

describe('Autosaver', () => {
  it('agrupa rajadas e grava só o último estado', async () => {
    const { saver, saved, onRoomSaved } = setup();
    saver.room(room(1));
    saver.room(room(2));
    saver.room(room(3));
    await vi.advanceTimersByTimeAsync(150);
    expect(saved.map((r) => r.updatedAt)).toEqual([3]);
    expect(onRoomSaved).toHaveBeenCalledTimes(1);
  });

  it('flush grava imediatamente', async () => {
    const { saver, saved, target } = setup();
    saver.room(room(1));
    saver.profile(createProfile(1));
    await saver.flush();
    expect(saved).toHaveLength(1);
    expect(target.saveProfile).toHaveBeenCalledTimes(1);
    expect(saver.pending).toBe(false);
  });

  it('falha não perde: tenta de novo depois', async () => {
    const { saver, saved, statuses } = setup(1);
    saver.room(room(1));
    await vi.advanceTimersByTimeAsync(150);
    expect(saved).toHaveLength(0);
    expect(statuses).toContain('error');
    expect(saver.pending).toBe(true);
    await vi.advanceTimersByTimeAsync(1100);
    expect(saved).toHaveLength(1);
    expect(statuses.at(-1)).toBe('idle');
  });

  it('versão nova durante a falha vence a antiga', async () => {
    const { saver, saved } = setup(1);
    saver.room(room(1));
    await vi.advanceTimersByTimeAsync(150);
    saver.room(room(5));
    await vi.advanceTimersByTimeAsync(1200);
    expect(saved.map((r) => r.updatedAt)).toEqual([5]);
  });
});
