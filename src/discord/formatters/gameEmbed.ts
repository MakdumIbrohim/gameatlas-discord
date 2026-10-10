import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Giveaway } from '../../services/gamerpower';
import { LangflowGameResult } from '../../services/langflow';
import { GIF_ICONS } from '../constants/gifs';
import { ANIMATED_EMOJIS } from '../constants/emojis';

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
      .setThumbnail(GIF_ICONS.SEARCH)
      .setFooter({ text: 'Powered by GamerPower • gameratlas.gg' })
      .setTimestamp();

    return { embeds: [embed], components: [] };
  }

  const slice = giveaways.slice(0, MAX_GAMES_PER_EMBED);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x2ecc71)
    .setThumbnail(GIF_ICONS.GAME)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL}) • Showing ${slice.length} of ${giveaways.length}` })
    .setTimestamp();

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  slice.forEach((game, index) => {
    const num = index + 1;
    const endInfo = formatEndDate(game.end_date);
    const worth = game.worth && game.worth !== 'N/A' ? ` • ${ANIMATED_EMOJIS.COIN} ${game.worth}` : '';
    embed.addFields({
      name: `${num}. ${game.title}`,
      value: [
        `${ANIMATED_EMOJIS.LAPTOP} **Platform:** ${game.platforms}`,
        `${ANIMATED_EMOJIS.PRESENT} **Type:** ${game.type}`,
        `${ANIMATED_EMOJIS.CALENDAR} **Free until:** ${endInfo}${worth}`,
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

const TYPE_LABEL: Record<string, string> = {
  game: `${ANIMATED_EMOJIS.CONTROLLER} Full Game`,
  loot: `${ANIMATED_EMOJIS.PRESENT} In-Game Loot / DLC`,
  beta: '🧪 Beta Access',
  dlc: `${ANIMATED_EMOJIS.PRESENT} DLC`,
  early_access: '🚀 Early Access',
};

function formatTypeLabel(type: string): string {
  return TYPE_LABEL[type.toLowerCase()] ?? `${ANIMATED_EMOJIS.PRESENT} ${type}`;
}

function formatEndDateFriendly(endDate?: string): string {
  if (!endDate || endDate === 'N/A' || endDate === 'null') return '♾️ Masih aktif';
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return `${ANIMATED_EMOJIS.CALENDAR} ${endDate}`;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return '⚠️ Segera berakhir';
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  if (diffDays === 1) return `${ANIMATED_EMOJIS.CALENDAR} Berakhir besok (${dateStr})`;
  return `${ANIMATED_EMOJIS.CALENDAR} ${diffDays} hari lagi — ${dateStr}`;
}

function buildSingleGameEmbed(game: LangflowGameResult, index: number, total: number): EmbedBuilder {
  const claimUrl = game.claim_url ?? game.open_giveaway_url;

  const lines: string[] = [
    `${ANIMATED_EMOJIS.LAPTOP} **Platform:** ${game.platform}`,
    `${formatTypeLabel(game.type)}`,
    game.worth && game.worth !== 'N/A' && game.worth !== 'null'
      ? `${ANIMATED_EMOJIS.COIN} **Nilai:** ${game.worth}`
      : '',
    formatEndDateFriendly(game.end_date),
  ];

  // Deskripsi — skip kalau sama persis dengan judul
  const desc = game.description && game.description !== game.title
    ? game.description.slice(0, 150) + (game.description.length > 150 ? '...' : '')
    : null;
  if (desc) lines.push(`\n${ANIMATED_EMOJIS.STATIONARY} ${desc}`);

  // Alasan dari AI
  if (game.reason) lines.push(`\n${ANIMATED_EMOJIS.LIGHTBULB} *${game.reason}*`);

  const embed = new EmbedBuilder()
    .setTitle(game.title)
    .setDescription(lines.filter(Boolean).join('\n'))
    .setColor(0x2ecc71)
    .setFooter({ text: `${index + 1} of ${total} • Source: GamerPower (${GAMERPOWER_URL})` })
    .setTimestamp();

  // Thumbnail cover art per game
  if (game.image_url && game.image_url !== 'null') {
    embed.setImage(game.image_url);
  }

  if (claimUrl) {
    embed.setURL(claimUrl);
  }

  return embed;
}

export function buildStructuredGameEmbed(games: LangflowGameResult[]): StructuredEmbedResult {
  if (games.length === 0) {
    return {
      embeds: [buildErrorEmbed('Belum menemukan giveaway yang sesuai.\nCoba platform atau kata kunci lain.')],
      components: [],
    };
  }

  const slice = games.slice(0, 5);

  // Header embed ringkas
  const header = new EmbedBuilder()
    .setTitle('🎮 GameAtlas — Free Games')
    .setDescription(`Ditemukan **${games.length}** giveaway aktif. Menampilkan ${slice.length} teratas.`)
    .setThumbnail(GIF_ICONS.GAME)
    .setColor(0x3498db);

  // Satu embed per game agar thumbnail tampil
  const gameEmbeds = slice.map((game, i) => buildSingleGameEmbed(game, i, slice.length));

  // Satu row berisi semua claim button
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

  const components: ActionRowBuilder<ButtonBuilder>[] = buttons.length > 0
    ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
    : [];

  return { embeds: [header, ...gameEmbeds], components };
}

export function buildAiResponseEmbed(aiText: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 GameAtlas')
    .setDescription(aiText.slice(0, 4096))
    .setColor(0x3498db)
    .setThumbnail(GIF_ICONS.AI)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL})` })
    .setTimestamp();
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚠️ GameAtlas')
    .setDescription(message)
    .setColor(0xe74c3c)
    .setThumbnail(GIF_ICONS.ERROR)
    .setTimestamp();
}
