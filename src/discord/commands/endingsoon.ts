import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { sendMessageToLangflow } from '../../services/langflow';
import { buildStructuredGameEmbed, buildErrorEmbed } from '../formatters/gameEmbed';
import { ANIMATED_EMOJIS } from '../constants/emojis';
import { logger } from '../../utils/logger';
import { LangflowError, TimeoutError } from '../../utils/errors';

export const data = new SlashCommandBuilder()
  .setName('endingsoon')
  .setDescription('Cek giveaway yang bentar lagi hangus — jangan sampe kelewat!')
  .addIntegerOption((option) =>
    option
      .setName('days')
      .setDescription('Berapa hari ke depan nih? (default: 3, maks: 14)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(14),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const days = interaction.options.getInteger('days') ?? 3;
  const sessionId = `discord-${interaction.channelId}-${interaction.user.id}`;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: `${ANIMATED_EMOJIS.TIMERSAND} Lagi nyari giveaway yang mau hangus dalam ${days} hari... sabar yaa!` });

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

    let message = 'Duh, GameAtlas lagi ngelag nih pas proses request lu.\nCoba lagi bentar ya!';
    if (err instanceof TimeoutError) message = 'Waduh koneksinya timeout nih kelamaan nunggu.\nCoba lagi bentar ya!';
    else if (err instanceof LangflowError) message = 'Duh, GameAtlas lagi ngelag nih pas proses request lu.\nCoba lagi bentar ya!';

    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
