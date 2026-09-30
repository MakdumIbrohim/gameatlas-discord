import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { getGiveaways } from '../../services/gamerpower';
import { buildGameEmbed, buildErrorEmbed } from '../formatters/gameEmbed';
import { logger } from '../../utils/logger';
import { GamerPowerError, TimeoutError } from '../../utils/errors';

export const data = new SlashCommandBuilder()
  .setName('freegames')
  .setDescription('Tampilkan game gratis yang sedang tersedia')
  .addStringOption((option) =>
    option
      .setName('platform')
      .setDescription('Filter berdasarkan platform (contoh: steam, epic-games-store, gog)')
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const platform = interaction.options.getString('platform') ?? undefined;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: '🔎 Sedang mencari game gratis...' });

    const giveaways = await getGiveaways(platform);
    const { embeds, components } = buildGameEmbed(
      giveaways,
      platform ? `🎮 Free Games — ${platform}` : '🎮 GameAtlas — Free Games',
    );

    await interaction.editReply({ content: null, embeds, components });

    logger.info('freegames command responded', {
      userId: interaction.user.id,
      platform,
      count: giveaways.length,
    });
  } catch (err) {
    logger.error('freegames command error', { error: String(err) });

    let message = 'Sumber data game sedang tidak dapat diakses.\nSilakan coba lagi nanti.';
    if (err instanceof TimeoutError) {
      message = 'Permintaan ke sumber data habis waktu.\nSilakan coba lagi beberapa saat.';
    } else if (err instanceof GamerPowerError) {
      message = 'Sumber data game sedang tidak dapat diakses.\nSilakan coba lagi nanti.';
    }

    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
