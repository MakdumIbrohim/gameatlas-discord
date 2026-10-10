import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Giveaway } from '../../services/gamerpower';
import { GIF_ICONS } from '../constants/gifs';
import { ANIMATED_EMOJIS } from '../constants/emojis';
import {
  GAMERPOWER_URL,
  MAX_GAMES_PER_EMBED,
  formatTypeLabel,
  formatEndDate,
} from './helpers';

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
      .setDescription(
        'Belum menemukan giveaway yang cocok nih!\nCoba cek platform atau keyword lain ya.',
      )
      .setColor(0xe74c3c)
      .setThumbnail(GIF_ICONS.EMPTY)
      .setFooter({ text: 'Powered by GamerPower • gameratlas.gg' })
      .setTimestamp();

    return { embeds: [embed], components: [] };
  }

  const slice = giveaways.slice(0, MAX_GAMES_PER_EMBED);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x2ecc71)
    .setThumbnail(GIF_ICONS.GAME)
    .setFooter({
      text: `Source: GamerPower (${GAMERPOWER_URL}) • Menampilkan ${slice.length} dari ${giveaways.length} game`,
    })
    .setTimestamp();

  slice.forEach((game, index) => {
    const num = index + 1;
    const endInfo = formatEndDate(game.end_date);
    const worth =
      game.worth && game.worth !== 'N/A' && game.worth !== 'null'
        ? ` • ${ANIMATED_EMOJIS.COIN} **${game.worth}**`
        : '';
    const claimLink = game.open_giveaway_url
      ? `[Klaim di sini](${game.open_giveaway_url})`
      : '';

    embed.addFields({
      name: `${num}. ${game.title}`,
      value:
        [
          `> ${ANIMATED_EMOJIS.LAPTOP} **Platform:** \`${game.platforms}\``,
          `> ${ANIMATED_EMOJIS.PRESENT} **Tipe:** ${formatTypeLabel(game.type)}`,
          `> ${ANIMATED_EMOJIS.CALENDAR} **Gratis sampe:** ${endInfo}${worth}`,
          claimLink
            ? `> ${ANIMATED_EMOJIS.LINK} **Direct Link:** ${claimLink}`
            : '',
        ]
          .filter(Boolean)
          .join('\n') + '\n\u200b',
    });
  });

  const claimButtons = slice
    .map((game, i) => {
      if (!game.open_giveaway_url) return null;
      return new ButtonBuilder()
        .setLabel(`#${i + 1} Klaim: ${game.title.slice(0, 20)}`)
        .setURL(game.open_giveaway_url)
        .setStyle(ButtonStyle.Link);
    })
    .filter((b): b is ButtonBuilder => b !== null);

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  if (claimButtons.length > 0) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        claimButtons.slice(0, 5),
      ),
    );
  }

  return { embeds: [embed], components: rows };
}
