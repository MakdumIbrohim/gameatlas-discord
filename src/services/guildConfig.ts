// Simple in-memory config store per guild.
// For a persistent solution, replace with a database (SQLite, etc.)

export interface GuildConfig {
  notifyChannelId?: string;
  notifyTime?: string; // cron format HH:MM, e.g. "09:00"
  notifyEnabled: boolean;
}

const store = new Map<string, GuildConfig>();

export function getGuildConfig(guildId: string): GuildConfig {
  return store.get(guildId) ?? { notifyEnabled: false };
}

export function setGuildConfig(
  guildId: string,
  partial: Partial<GuildConfig>,
): GuildConfig {
  const current = getGuildConfig(guildId);
  const updated: GuildConfig = { ...current, ...partial };
  store.set(guildId, updated);
  return updated;
}

export function getAllConfiguredGuilds(): Array<{
  guildId: string;
  config: GuildConfig;
}> {
  return Array.from(store.entries())
    .filter(([, cfg]) => cfg.notifyEnabled && cfg.notifyChannelId)
    .map(([guildId, config]) => ({ guildId, config }));
}
