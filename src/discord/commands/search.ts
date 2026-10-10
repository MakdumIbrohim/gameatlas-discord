import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { sendMessageToLangflow } from '../../services/langflow';
import {
  buildStructuredGameEmbed,
  buildAiResponseEmbed,
  buildErrorEmbed,
} from '../formatters/gameEmbed';
import { logger } from '../../utils/logger';
import { LangflowError, TimeoutError } from '../../utils/errors';
import { PLATFORMS } from '../constants/platforms';
import { ANIMATED_EMOJIS } from '../constants/emojis';

const GENRE_SUGGESTIONS = [
  'RPG', 'Action', 'Strategy', 'Horror', 'Puzzle',
  'Adventure', 'Simulation', 'Sports', 'Shooter', 'Platformer',
];

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Cari game gratis berdasarkan judul, genre, atau kata kunci tertentu')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('Ketik nama game atau kata kunci, contoh: Hollow Knight atau game survival gratis')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('platform')
      .setDescription('Batasi hasil ke platform tertentu (opsional)')
      .setRequired(false)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName('genre')
      .setDescription('Batasi hasil ke genre tertentu, contoh: RPG, Horror (opsional)')
      .setRequired(false)
      .setAutocomplete(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name === 'platform') {
    const value = focused.value.toLowerCase();
    const filtered = PLATFORMS.filter(
      (p) => p.name.toLowerCase().includes(value) || p.value.includes(value),
    ).slice(0, 25);
    await interaction.respond(filtered);
  } else if (focused.name === 'genre') {
    const value = focused.value.toLowerCase();
    const filtered = GENRE_SUGGESTIONS.filter((g) =>
      g.toLowerCase().includes(value),
    )
      .map((g) => ({ name: g, value: g }))
      .slice(0, 25);
    await interaction.respond(filtered);
  }
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString('query', true);
  const platform = interaction.options.getString('platform');
  const genre = interaction.options.getString('genre');
  const sessionId = `discord-${interaction.channelId}-${interaction.user.id}`;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: `${ANIMATED_EMOJIS.SEARCH} Mencari "${query}"... (bisa memakan waktu hingga 2 menit)` });

    const parts = [`Cari game gratis dengan kata kunci: "${query}".`];
    if (platform) parts.push(`Filter platform: ${platform}.`);
    if (genre) parts.push(`Prioritaskan genre: ${genre}.`);
    parts.push('Gunakan Web Search jika diperlukan untuk melengkapi informasi. Tampilkan hasil yang paling relevan.');

    const result = await sendMessageToLangflow(parts.join(' '), sessionId);

    if (result.kind === 'structured' && result.games.length > 0) {
      const { embeds, components } = buildStructuredGameEmbed(result.games);
      await interaction.editReply({ content: null, embeds, components });
    } else if (result.kind === 'text') {
      const embed = buildAiResponseEmbed(result.text);
      await interaction.editReply({ content: null, embeds: [embed] });
    } else {
      await interaction.editReply({
        content: null,
        embeds: [buildErrorEmbed(`Tidak ditemukan hasil untuk "${query}".\nCoba kata kunci lain.`)],
      });
    }

    logger.info('search command responded', { userId: interaction.user.id, query, platform, genre });
  } catch (err) {
    logger.error('search command error', { error: String(err) });
    let message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.';
    if (err instanceof TimeoutError) message = 'Permintaan habis waktu.\nCoba lagi beberapa saat.';
    else if (err instanceof LangflowError) message = 'Maaf, GameAtlas sedang tidak dapat memproses permintaan.';
    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
