import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Giveaway } from "../../services/gamerpower";
import { LangflowGameResult } from "../../services/langflow";
import { GIF_ICONS } from "../constants/gifs";
import { ANIMATED_EMOJIS } from "../constants/emojis";

const GAMERPOWER_URL = "https://www.gamerpower.com";
const MAX_GAMES_PER_EMBED = 5;

function formatEndDate(endDate: string): string {
  if (!endDate || endDate === "N/A" || endDate === "null")
    return `${ANIMATED_EMOJIS.INFINITY} Santai, masih aktif`;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return endDate;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return `${ANIMATED_EMOJIS.WARNING} Udah mau abis!`;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  return diffDays === 1
    ? `Besok kelar! (${dateStr})`
    : `${diffDays} hari lagi (${dateStr})`;
}

const TYPE_LABEL: Record<string, string> = {
  game: `${ANIMATED_EMOJIS.CONTROLLER} Full Game`,
  loot: `${ANIMATED_EMOJIS.PRESENT} In-Game Loot / DLC`,
  beta: `${ANIMATED_EMOJIS.POTION} Beta Access`,
  dlc: `${ANIMATED_EMOJIS.PRESENT} DLC`,
  early_access: `${ANIMATED_EMOJIS.ROCKET} Early Access`,
  "early access": `${ANIMATED_EMOJIS.ROCKET} Early Access`,
};

function formatTypeLabel(type: string): string {
  if (!type) return `${ANIMATED_EMOJIS.CONTROLLER} Game`;
  return (
    TYPE_LABEL[type.toLowerCase().trim()] ??
    `${ANIMATED_EMOJIS.PRESENT} ${type}`
  );
}

export interface GameEmbedResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export function buildGameEmbed(
  giveaways: Giveaway[],
  title = "🎮 GameAtlas — Free Games",
): GameEmbedResult {
  if (giveaways.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        "Belum menemukan giveaway yang cocok nih!\nCoba cek platform atau keyword lain ya.",
      )
      .setColor(0xe74c3c)
      .setThumbnail(GIF_ICONS.EMPTY)
      .setFooter({ text: "Powered by GamerPower • gameratlas.gg" })
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
      game.worth && game.worth !== "N/A" && game.worth !== "null"
        ? ` • ${ANIMATED_EMOJIS.COIN} **${game.worth}**`
        : "";
    const claimLink = game.open_giveaway_url
      ? `[Klaim di sini](${game.open_giveaway_url})`
      : "";

    embed.addFields({
      name: `${num}. ${game.title}`,
      value:
        [
          `> ${ANIMATED_EMOJIS.LAPTOP} **Platform:** \`${game.platforms}\``,
          `> ${ANIMATED_EMOJIS.PRESENT} **Tipe:** ${formatTypeLabel(game.type)}`,
          `> ${ANIMATED_EMOJIS.CALENDAR} **Gratis sampe:** ${endInfo}${worth}`,
          claimLink
            ? `> ${ANIMATED_EMOJIS.LINK} **Direct Link:** ${claimLink}`
            : "",
        ]
          .filter(Boolean)
          .join("\n") + "\n\u200b",
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

export interface StructuredEmbedResult {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

function formatEndDateFriendly(endDate?: string): string {
  if (!endDate || endDate === "N/A" || endDate === "null")
    return `${ANIMATED_EMOJIS.INFINITY} Santai, masih aktif`;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return `${ANIMATED_EMOJIS.CALENDAR} ${endDate}`;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return `${ANIMATED_EMOJIS.WARNING} Udah mau abis!`;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (diffDays === 1)
    return `${ANIMATED_EMOJIS.CALENDAR} Besok kelar! (${dateStr})`;
  return `${ANIMATED_EMOJIS.CALENDAR} ${diffDays} hari lagi (${dateStr})`;
}

function buildSingleGameEmbed(
  game: LangflowGameResult,
  index: number,
  total: number,
): EmbedBuilder {
  const claimUrl = game.claim_url ?? game.open_giveaway_url;

  const lines: string[] = [
    `${ANIMATED_EMOJIS.LAPTOP} **Platform:** ${game.platform}`,
    `${formatTypeLabel(game.type)}`,
    game.worth && game.worth !== "N/A" && game.worth !== "null"
      ? `${ANIMATED_EMOJIS.COIN} **Harga asli:** ${game.worth}`
      : "",
    formatEndDateFriendly(game.end_date),
  ];

  // Deskripsi — skip kalau sama persis dengan judul
  const desc =
    game.description && game.description !== game.title
      ? game.description.slice(0, 150) +
        (game.description.length > 150 ? "..." : "")
      : null;
  if (desc) lines.push(`\n${ANIMATED_EMOJIS.STATIONARY} ${desc}`);

  // Alasan dari AI
  if (game.reason)
    lines.push(`\n${ANIMATED_EMOJIS.LIGHTBULB} *${game.reason}*`);

  const embed = new EmbedBuilder()
    .setTitle(game.title)
    .setDescription(lines.filter(Boolean).join("\n"))
    .setColor(0x2ecc71)
    .setFooter({
      text: `${index + 1} of ${total} • Source: GamerPower (${GAMERPOWER_URL})`,
    })
    .setTimestamp();

  // Thumbnail cover art per game
  if (game.image_url && game.image_url !== "null") {
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
          "Belum menemukan giveaway yang cocok nih!\nCoba ganti platform atau kata kunci lain ya.",
        ),
      ],
      components: [],
    };
  }

  const slice = games.slice(0, 5);

  // Header embed ringkas
  const header = new EmbedBuilder()
    .setTitle("🎮 GameAtlas — Free Games")
    .setDescription(
      `Nemu **${games.length}** giveaway aktif nih! Ini ${slice.length} yang paling recommended:`,
    )
    .setThumbnail(GIF_ICONS.GAME)
    .setColor(0x3498db);

  // Satu embed per game agar thumbnail tampil
  const gameEmbeds = slice.map((game, i) =>
    buildSingleGameEmbed(game, i, slice.length),
  );

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

  const components: ActionRowBuilder<ButtonBuilder>[] =
    buttons.length > 0
      ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
      : [];

  return { embeds: [header, ...gameEmbeds], components };
}

export function buildAiResponseEmbed(aiText: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎮 GameAtlas")
    .setDescription(aiText.slice(0, 4096))
    .setColor(0x3498db)
    .setThumbnail(GIF_ICONS.AI)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL})` })
    .setTimestamp();
}

export function buildEmptyEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🔎 GameAtlas")
    .setDescription(message)
    .setColor(0xf39c12)
    .setThumbnail(GIF_ICONS.EMPTY)
    .setTimestamp();
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("⚠️ GameAtlas")
    .setDescription(message)
    .setColor(0xe74c3c)
    .setThumbnail(GIF_ICONS.ERROR)
    .setTimestamp();
}
