import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { GIF_ICONS } from "../constants/gifs";
import { ANIMATED_EMOJIS } from "../constants/emojis";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Biar nggak bingung, cek cara pakai GameAtlas di sini!");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("🎮 GameAtlas — Command List")
    .setDescription(
      "Bot andalan buat hunting game gratisan & giveaway dari Steam, Epic Games, GOG, PlayStation, Xbox, dll.\n" +
        "Tinggal ketik slash (`/`) terus pilih command di bawah ini yak:\n",
    )
    .setThumbnail(GIF_ICONS.GAME)
    .setColor(0x3498db)
    .addFields(
      {
        name: `${ANIMATED_EMOJIS.CONTROLLER} Hunting Game Gratisan`,
        value: [
          "• **`/freegames`** — Spill semua game gratis yang lagi aktif sekarang.",
          "   ↳ *Bisa pilih opsi `platform` buat filter (Steam, Epic, dll).*",
          "• **`/endingsoon`** — Cek giveaway yang bentar lagi expired biar nggak FOMO.",
          "   ↳ *Bisa atur opsi `days` (default: 3 hari ke depan).*",
        ].join("\n"),
      },
      {
        name: `${ANIMATED_EMOJIS.SEARCH} Tanya AI & Cari Game`,
        value: [
          "• **`/ask <query>`** — Curhat atau tanya rekomendasi game gratis ke AI.",
          "   ↳ *Contoh: `/ask query:Ada game RPG gratis di Steam?`*",
          "• **`/search <query>`** — Cari game spesifik pake Web Search.",
          "   ↳ *Contoh: `/search query:Hollow Knight platform:steam`*",
        ].join("\n"),
      },
      {
        name: `${ANIMATED_EMOJIS.GEAR} Setting Server (Khusus Admin)`,
        value: [
          "• **`/config channel`** — Atur channel buat drop notif gratisan tiap hari.",
          "• **`/config notify`** — Nyalain/matiin auto-alert harian (bisa set jam `time:09:00`).",
          "• **`/config status`** — Intip status settingan bot di server ini.",
        ].join("\n"),
      },
    )
    .setFooter({ text: "GameAtlas • Powered by GamerPower & Langflow" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
