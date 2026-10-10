import * as nodeCron from 'node-cron';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { getGiveaways, Giveaway } from './gamerpower';
import { buildGameEmbed } from '../discord/formatters/gameEmbed';
import { getAllConfiguredGuilds } from './guildConfig';
import { GIF_ICONS } from '../discord/constants/gifs';
import { logger } from '../utils/logger';

async function sendDailyAlert(
  client: Client,
  guildId: string,
  channelId: string,
  giveaways: Giveaway[],
): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!(channel instanceof TextChannel)) return;

    if (giveaways.length === 0) {
      logger.info('Daily alert: no active giveaways', { guildId });
      return;
    }

    const header = new EmbedBuilder()
      .setTitle('🎮 GameAtlas — Drop Game Gratisan Hari Ini!')
      .setDescription(`Morning gamers! 🌅 Hari ini ada **${giveaways.length}** game gratisan aktif nih. Cek yang paling fresh buat diklaim:`)
      .setColor(0xf39c12)
      .setThumbnail(GIF_ICONS.ALERT)
      .setTimestamp();

    const { embeds: gameEmbeds, components } = buildGameEmbed(giveaways.slice(0, 5), '');

    await channel.send({ embeds: [header, ...gameEmbeds], components });
    logger.info('Daily alert sent', { guildId, channelId, count: giveaways.length });
  } catch (err) {
    logger.error('Daily alert failed', { guildId, channelId, error: String(err) });
  }
}

const scheduledTasks = new Map<string, nodeCron.ScheduledTask>();

export function startDailyAlertScheduler(client: Client): void {
  nodeCron.schedule('* * * * *', () => {
    setImmediate(async () => {
      const guilds = getAllConfiguredGuilds();
      if (guilds.length === 0) return;

      const now = new Date();
      const wibHour = String((now.getUTCHours() + 7) % 24).padStart(2, '0');
      const wibMin = String(now.getUTCMinutes()).padStart(2, '0');
      const currentTime = `${wibHour}:${wibMin}`;

      const dueGuilds = guilds.filter(
        ({ config }) => (config.notifyTime ?? '09:00') === currentTime && config.notifyChannelId,
      );
      if (dueGuilds.length === 0) return;

      const giveaways = await getGiveaways();
      await Promise.allSettled(
        dueGuilds.map(({ guildId, config }) => {
          logger.info('Triggering daily alert', { guildId, targetTime: currentTime });
          return sendDailyAlert(client, guildId, config.notifyChannelId!, giveaways);
        }),
      );
    });
  });

  logger.info('Daily alert scheduler started');
}

export function stopAllScheduledTasks(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.clear();
}
