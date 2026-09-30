import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Giveaway } from '../../services/gamerpower';

const GAMERPOWER_URL = 'https://www.gamerpower.com';
const MAX_GAMES_PER_EMBED = 5;

function formatEndDate(endDate: string): string {
  if (!endDate || endDate === 'N/A') return 'Unknown';
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Ending soon';
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1 ? '1 day' : `${diffDays} days`;
}

export interface GameEmbedResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export function buildGameEmbed(
  giveaways: Giveaway[],
  title = '🎮 GameAtlas — Free Games',
): GameEmbedResult {
  if (giveaways.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription('Belum menemukan giveaway yang sesuai.\nCoba platform atau kata kunci lain.')
      .setColor(0xe74c3c)
      .setFooter({ text: 'Powered by GamerPower • gameratlas.gg' })
      .setTimestamp();

    return { embeds: [embed], components: [] };
  }

  const slice = giveaways.slice(0, MAX_GAMES_PER_EMBED);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x2ecc71)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL}) • Showing ${slice.length} of ${giveaways.length}` })
    .setTimestamp();

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  slice.forEach((game, index) => {
    const num = index + 1;
    const endInfo = formatEndDate(game.end_date);
    const worth = game.worth && game.worth !== 'N/A' ? ` • Worth: ${game.worth}` : '';
    embed.addFields({
      name: `${num}. ${game.title}`,
      value: [
        `🖥️ **Platform:** ${game.platforms}`,
        `🎁 **Type:** ${game.type}`,
        `⏳ **Free until:** ${endInfo}${worth}`,
      ].join('\n'),
    });

    if (game.open_giveaway_url) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`Claim: ${game.title.slice(0, 40)}`)
          .setURL(game.open_giveaway_url)
          .setStyle(ButtonStyle.Link),
      );
      rows.push(row);
    }
  });

  return { embeds: [embed], components: rows.slice(0, 5) };
}

export function buildAiResponseEmbed(aiText: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 GameAtlas')
    .setDescription(aiText.slice(0, 4096))
    .setColor(0x3498db)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL})` })
    .setTimestamp();
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚠️ GameAtlas')
    .setDescription(message)
    .setColor(0xe74c3c)
    .setTimestamp();
}
