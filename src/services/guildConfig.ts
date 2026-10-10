import { getDb } from './database';

export interface GuildConfig {
  notifyChannelId?: string;
  notifyTime?: string;
  notifyEnabled: boolean;
}

interface GuildConfigRow {
  guild_id: string;
  notify_channel_id: string | null;
  notify_time: string;
  notify_enabled: number;
}

function rowToConfig(row: GuildConfigRow): GuildConfig {
  return {
    notifyChannelId: row.notify_channel_id ?? undefined,
    notifyTime: row.notify_time,
    notifyEnabled: row.notify_enabled === 1,
  };
}

export function getGuildConfig(guildId: string): GuildConfig {
  const db = getDb();
  const row = db
    .prepare<string, GuildConfigRow>(
      'SELECT * FROM guild_config WHERE guild_id = ?',
    )
    .get(guildId);
  return row ? rowToConfig(row) : { notifyEnabled: false };
}

export function setGuildConfig(
  guildId: string,
  partial: Partial<GuildConfig>,
): GuildConfig {
  const current = getGuildConfig(guildId);
  const updated: GuildConfig = { ...current, ...partial };

  getDb()
    .prepare(`
      INSERT INTO guild_config (guild_id, notify_channel_id, notify_time, notify_enabled, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(guild_id) DO UPDATE SET
        notify_channel_id = excluded.notify_channel_id,
        notify_time       = excluded.notify_time,
        notify_enabled    = excluded.notify_enabled,
        updated_at        = excluded.updated_at
    `)
    .run(
      guildId,
      updated.notifyChannelId ?? null,
      updated.notifyTime ?? '09:00',
      updated.notifyEnabled ? 1 : 0,
    );

  return updated;
}

export function getAllConfiguredGuilds(): Array<{
  guildId: string;
  config: GuildConfig;
}> {
  const rows = getDb()
    .prepare<[], GuildConfigRow>(
      'SELECT * FROM guild_config WHERE notify_enabled = 1 AND notify_channel_id IS NOT NULL',
    )
    .all();
  return rows.map((row) => ({ guildId: row.guild_id, config: rowToConfig(row) }));
}
