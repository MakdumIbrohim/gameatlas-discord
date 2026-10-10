export const PLATFORMS = [
  { name: 'Steam', value: 'steam' },
  { name: 'Epic Games Store', value: 'epic-games-store' },
  { name: 'GOG', value: 'gog' },
  { name: 'Xbox', value: 'xbox' },
  { name: 'PlayStation 4', value: 'ps4' },
  { name: 'PlayStation 5', value: 'ps5' },
  { name: 'Nintendo Switch', value: 'switch' },
  { name: 'Android', value: 'android' },
  { name: 'iOS', value: 'ios' },
  { name: 'itch.io', value: 'itchio' },
  { name: 'Battle.net', value: 'battlenet' },
  { name: 'Origin / EA App', value: 'origin' },
  { name: 'Ubisoft Connect', value: 'ubisoft' },
] as const;

export type PlatformValue = (typeof PLATFORMS)[number]['value'];
