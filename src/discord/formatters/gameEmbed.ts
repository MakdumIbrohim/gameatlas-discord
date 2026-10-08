import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Giveaway } from '../../services/gamerpower';
import { LangflowGameResult } from '../../services/langflow';

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

export interface StructuredEmbedResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export function buildStructuredGameEmbed(games: LangflowGameResult[]): StructuredEmbedResult {
  if (games.length === 0) {
    return {
      embeds: [buildErrorEmbed('Belum menemukan giveaway yang sesuai.\nCoba platform atau kata kunci lain.')],
      components: [],
    };
  }

  const slice = games.slice(0, 5);
  const embed = new EmbedBuilder()
    .setTitle('🎮 GameAtlas — Free Games')
    .setColor(0x2ecc71)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL}) • Showing ${slice.length} of ${games.length}` })
    .setTimestamp();

  // Tampilkan thumbnail dari game pertama
  const firstImage = slice[0]?.image_url;
  if (firstImage) {
    embed.setThumbnail(firstImage);
  }

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  slice.forEach((game, index) => {
    const num = index + 1;
    const endDate = game.end_date && game.end_date !== 'N/A' ? game.end_date : 'Masih aktif';
    const worth = game.worth && game.worth !== 'N/A' ? ` • Worth: ${game.worth}` : '';
    const genre = game.genre ? `\n🏷️ **Genre:** ${game.genre}` : '';
    const sysReq = game.system_requirements ? `\n💻 **System Req:** ${game.system_requirements.slice(0, 100)}` : '';
    const desc = game.description ? `\n📝 ${game.description.slice(0, 120)}${game.description.length > 120 ? '...' : ''}` : '';

    embed.addFields({
      name: `${num}. ${game.title}`,
      value: [
        `🖥️ **Platform:** ${game.platform}`,
        `🎁 **Type:** ${game.type}`,
        `⏳ **Free until:** ${endDate}${worth}`,
        genre,
        sysReq,
        desc,
      ].filter(Boolean).join('\n'),
    });

    const claimUrl = game.claim_url ?? game.open_giveaway_url;
    if (claimUrl) {
      rows.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel(`Claim: ${game.title.slice(0, 40)}`)
            .setURL(claimUrl)
            .setStyle(ButtonStyle.Link),
        ),
      );
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
