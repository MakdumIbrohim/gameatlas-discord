import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { sendMessageToLangflow } from '../../services/langflow';
import { buildStructuredGameEmbed, buildErrorEmbed } from '../formatters/gameEmbed';
import { logger } from '../../utils/logger';
import { LangflowError, TimeoutError } from '../../utils/errors';

export const data = new SlashCommandBuilder()
  .setName('endingsoon')
  .setDescription('Tampilkan giveaway game yang hampir berakhir')
  .addIntegerOption((option) =>
    option
      .setName('days')
      .setDescription('Berakhir dalam berapa hari ke depan? (default: 3)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(14),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const days = interaction.options.getInteger('days') ?? 3;
  const sessionId = `discord-${interaction.channelId}-${interaction.user.id}`;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: `⏳ Mencari giveaway yang berakhir dalam ${days} hari... (bisa memakan waktu hingga 2 menit)` });

    const query = `Cari semua giveaway game aktif yang akan berakhir dalam ${days} hari ke depan. Gunakan Current Date untuk menghitung tanggal. Urutkan dari yang paling dekat berakhir. Prioritaskan game dengan nilai tertinggi jika ada yang berakhir di waktu yang sama.`;

    const result = await sendMessageToLangflow(query, sessionId);

    if (result.kind === 'structured') {
      const { embeds, components } = buildStructuredGameEmbed(result.games);
      await interaction.editReply({ content: null, embeds, components });
    } else {
      // Plain text fallback
      const { embeds } = buildStructuredGameEmbed([]);
      await interaction.editReply({ content: null, embeds });
    }

    logger.info('endingsoon command responded', { userId: interaction.user.id, days });
  } catch (err) {
    logger.error('endingsoon command error', { error: String(err) });

    let message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.';
    if (err instanceof TimeoutError) message = 'Permintaan habis waktu.\nCoba lagi beberapa saat.';
    else if (err instanceof LangflowError) message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.';

    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
