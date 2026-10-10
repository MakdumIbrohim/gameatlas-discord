import * as nodeCron from 'node-cron';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { getGiveaways } from './gamerpower';
import { buildGameEmbed } from '../discord/formatters/gameEmbed';
import { getAllConfiguredGuilds } from './guildConfig';
import { logger } from '../utils/logger';

async function sendDailyAlert(client: Client, guildId: string, channelId: string): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!(channel instanceof TextChannel)) return;

    const giveaways = await getGiveaways();
    if (giveaways.length === 0) {
      logger.info('Daily alert: no active giveaways', { guildId });
      return;
    }

    // Header pesan
    const header = new EmbedBuilder()
      .setTitle('🎮 GameAtlas — Daily Free Games Alert!')
      .setDescription(`Selamat pagi! 🌅 Hari ini ada **${giveaways.length}** game gratis aktif. Berikut yang paling baru:`)
      .setColor(0xf39c12)
      .setTimestamp();

    const { embeds: gameEmbeds, components } = buildGameEmbed(giveaways.slice(0, 5), '');

    await channel.send({ embeds: [header, ...gameEmbeds.slice(1)], components });
    logger.info('Daily alert sent', { guildId, channelId, count: giveaways.length });
  } catch (err) {
    logger.error('Daily alert failed', { guildId, channelId, error: String(err) });
  }
}

const scheduledTasks = new Map<string, nodeCron.ScheduledTask>();

export function startDailyAlertScheduler(client: Client): void {
  // Check every minute whether any guild's notify time has been reached.
  // Use setImmediate to yield back to the event loop before doing any work,
  // which prevents the node-cron "missed execution" warning caused by
  // blocking IO (e.g. Langflow/GamerPower requests) in the same process.
  nodeCron.schedule('* * * * *', () => {
    setImmediate(async () => {
      const guilds = getAllConfiguredGuilds();
      if (guilds.length === 0) return;

      const now = new Date();
      // Use WIB (UTC+7)
      const wibHour = String((now.getUTCHours() + 7) % 24).padStart(2, '0');
      const wibMin = String(now.getUTCMinutes()).padStart(2, '0');
      const currentTime = `${wibHour}:${wibMin}`;

      for (const { guildId, config } of guilds) {
        const targetTime = config.notifyTime ?? '09:00';
        if (currentTime === targetTime && config.notifyChannelId) {
          logger.info('Triggering daily alert', { guildId, targetTime });
          await sendDailyAlert(client, guildId, config.notifyChannelId);
        }
      }
    });
  });

  logger.info('Daily alert scheduler started');
}

export function stopAllScheduledTasks(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.clear();
}
