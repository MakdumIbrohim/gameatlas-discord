import { ANIMATED_EMOJIS } from '../constants/emojis';

export const GAMERPOWER_URL = 'https://www.gamerpower.com';
export const MAX_GAMES_PER_EMBED = 5;

export const TYPE_LABEL: Record<string, string> = {
  game: `${ANIMATED_EMOJIS.CONTROLLER} Full Game`,
  loot: `${ANIMATED_EMOJIS.PRESENT} In-Game Loot / DLC`,
  beta: `${ANIMATED_EMOJIS.POTION} Beta Access`,
  dlc: `${ANIMATED_EMOJIS.PRESENT} DLC`,
  early_access: `${ANIMATED_EMOJIS.ROCKET} Early Access`,
  'early access': `${ANIMATED_EMOJIS.ROCKET} Early Access`,
};

export function formatTypeLabel(type: string): string {
  if (!type) return `${ANIMATED_EMOJIS.CONTROLLER} Game`;
  return TYPE_LABEL[type.toLowerCase().trim()] ?? `${ANIMATED_EMOJIS.PRESENT} ${type}`;
}

export function formatEndDate(endDate: string): string {
  if (!endDate || endDate === 'N/A' || endDate === 'null') {
    return `${ANIMATED_EMOJIS.INFINITY} Santai, masih aktif`;
  }
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return endDate;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return `${ANIMATED_EMOJIS.WARNING} Udah mau abis!`;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = end.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  return diffDays === 1
    ? `Besok kelar! (${dateStr})`
    : `${diffDays} hari lagi (${dateStr})`;
}

export function formatEndDateFriendly(endDate?: string): string {
  if (!endDate || endDate === 'N/A' || endDate === 'null') {
    return `${ANIMATED_EMOJIS.INFINITY} Santai, masih aktif`;
  }
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return `${ANIMATED_EMOJIS.CALENDAR} ${endDate}`;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return `${ANIMATED_EMOJIS.WARNING} Udah mau abis!`;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = end.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (diffDays === 1) {
    return `${ANIMATED_EMOJIS.CALENDAR} Besok kelar! (${dateStr})`;
  }
  return `${ANIMATED_EMOJIS.CALENDAR} ${diffDays} hari lagi (${dateStr})`;
}
