import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { sendMessageToLangflow } from '../../services/langflow';
import { buildAiResponseEmbed, buildErrorEmbed } from '../formatters/gameEmbed';
import { logger } from '../../utils/logger';
import { LangflowError, TimeoutError } from '../../utils/errors';

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Tanyakan tentang game gratis dalam bahasa natural')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('Pertanyaan kamu (contoh: Ada game RPG gratis di Steam?)')
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString('query', true);
  const sessionId = `discord-${interaction.channelId}-${interaction.user.id}`;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: '🔎 Sedang mencari game gratis...' });

    const aiResponse = await sendMessageToLangflow(query, sessionId);
    const embed = buildAiResponseEmbed(aiResponse);

    await interaction.editReply({ content: null, embeds: [embed] });

    logger.info('ask command responded', {
      userId: interaction.user.id,
      sessionId,
    });
  } catch (err) {
    logger.error('ask command error', { error: String(err) });

    let message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.';
    if (err instanceof TimeoutError) {
      message = 'Permintaan habis waktu.\nCoba lagi beberapa saat.';
    } else if (err instanceof LangflowError) {
      message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.';
    }

    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
