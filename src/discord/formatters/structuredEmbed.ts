import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { LangflowGameResult } from '../../services/langflow';
import { GIF_ICONS } from '../constants/gifs';
import { ANIMATED_EMOJIS } from '../constants/emojis';
import { GAMERPOWER_URL, formatTypeLabel, formatEndDateFriendly } from './helpers';
import { buildEmptyEmbed } from './statusEmbed';

export interface StructuredEmbedResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export function buildSingleGameEmbed(
  game: LangflowGameResult,
  index: number,
  total: number,
): EmbedBuilder {
  const claimUrl = game.claim_url ?? game.open_giveaway_url;

  const lines: string[] = [
    `${ANIMATED_EMOJIS.LAPTOP} **Platform:** ${game.platform}`,
    `${formatTypeLabel(game.type)}`,
    game.worth && game.worth !== 'N/A' && game.worth !== 'null'
      ? `${ANIMATED_EMOJIS.COIN} **Harga asli:** ${game.worth}`
      : '',
    formatEndDateFriendly(game.end_date),
  ];

  const desc =
    game.description && game.description !== game.title
      ? game.description.slice(0, 150) +
        (game.description.length > 150 ? '...' : '')
      : null;
  if (desc) lines.push(`\n${ANIMATED_EMOJIS.STATIONARY} ${desc}`);

  if (game.reason) {
    lines.push(`\n${ANIMATED_EMOJIS.LIGHTBULB} *${game.reason}*`);
  }

  const embed = new EmbedBuilder()
    .setTitle(game.title)
    .setDescription(lines.filter(Boolean).join('\n'))
    .setColor(0x2ecc71)
    .setFooter({
      text: `${index + 1} of ${total} • Source: GamerPower (${GAMERPOWER_URL})`,
    })
    .setTimestamp();

  if (game.image_url && game.image_url !== 'null') {
    embed.setImage(game.image_url);
  }

  if (claimUrl) {
    embed.setURL(claimUrl);
  }

  return embed;
}

export function buildStructuredGameEmbed(
  games: LangflowGameResult[],
): StructuredEmbedResult {
  if (games.length === 0) {
    return {
      embeds: [
        buildEmptyEmbed(
          'Belum menemukan giveaway yang cocok nih!\nCoba ganti platform atau kata kunci lain ya.',
        ),
      ],
      components: [],
    };
  }

  const slice = games.slice(0, 5);

  const header = new EmbedBuilder()
    .setTitle('🎮 GameAtlas — Free Games')
    .setDescription(
      `Nemu **${games.length}** giveaway aktif nih! Ini ${slice.length} yang paling recommended:`,
    )
    .setThumbnail(GIF_ICONS.GAME)
    .setColor(0x3498db);

  const gameEmbeds = slice.map((game, i) =>
    buildSingleGameEmbed(game, i, slice.length),
  );

  const buttons = slice
    .map((game) => {
      const claimUrl = game.claim_url ?? game.open_giveaway_url;
      if (!claimUrl) return null;
      return new ButtonBuilder()
        .setLabel(game.title.slice(0, 40))
        .setURL(claimUrl)
        .setStyle(ButtonStyle.Link);
    })
    .filter((b): b is ButtonBuilder => b !== null)
    .slice(0, 5);

  const components: ActionRowBuilder<ButtonBuilder>[] =
    buttons.length > 0
      ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
      : [];

  return { embeds: [header, ...gameEmbeds], components };
}
