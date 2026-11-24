import type { CatalogItem } from '../catalog/types';
import type { RoomId } from '../core/model';
import type { Profile } from '../core/profile';
import { roomInfo } from '../core/rooms';
import { spend } from './stars';

export function isRoomUnlocked(profile: Profile, roomId: RoomId): boolean {
  return roomInfo(roomId).starter || profile.unlocked.includes(roomId);
}

export function isItemUnlocked(profile: Profile, item: CatalogItem): boolean {
  return item.cost === 0 || profile.unlocked.includes(item.id);
}

function unlock(profile: Profile, deviceId: string, id: string, cost: number): Profile | null {
  if (profile.unlocked.includes(id)) return profile;
  const paid = spend(profile, deviceId, cost);
  if (!paid) return null;
  return { ...paid, unlocked: [...paid.unlocked, id].sort() };
}

export function unlockRoom(profile: Profile, deviceId: string, roomId: RoomId): Profile | null {
  if (isRoomUnlocked(profile, roomId)) return profile;
  return unlock(profile, deviceId, roomId, roomInfo(roomId).cost);
}

export function unlockItem(profile: Profile, deviceId: string, item: CatalogItem): Profile | null {
  if (isItemUnlocked(profile, item)) return profile;
  return unlock(profile, deviceId, item.id, item.cost);
}

/** Liberar de graça (prêmio surpresa do presente diário). */
export function grantItem(profile: Profile, itemId: string): Profile {
  if (profile.unlocked.includes(itemId)) return profile;
  return { ...profile, unlocked: [...profile.unlocked, itemId].sort() };
}
