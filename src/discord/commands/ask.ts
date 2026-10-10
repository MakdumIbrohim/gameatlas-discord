import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { sendMessageToLangflow } from "../../services/langflow";
import {
  buildAiResponseEmbed,
  buildErrorEmbed,
  buildStructuredGameEmbed,
} from "../formatters/gameEmbed";
import { logger } from "../../utils/logger";
import { LangflowError, TimeoutError } from "../../utils/errors";

export const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription(
    "Mau tanya soal game gratis? Ketik langsung apa yang mau dicari:D",
  )
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription(
        "Contoh: Ada game RPG gratis di Steam? atau Game horror gratis apa sekarang?",
      )
      .setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const query = interaction.options.getString("query", true);
  const sessionId = `discord-${interaction.channelId}-${interaction.user.id}`;

  await interaction.deferReply();

  try {
    await interaction.editReply({
      content:
        "🔎 Sedang mencari game gratis... (bisa memakan waktu hingga 2 menit)",
    });

    const result = await sendMessageToLangflow(query, sessionId);

    if (result.kind === "structured") {
      // Langflow mengembalikan Structured Output (JSON) → render sebagai game embed
      const { embeds, components } = buildStructuredGameEmbed(result.games);
      await interaction.editReply({ content: null, embeds, components });
    } else {
      // Langflow mengembalikan plain text → render sebagai AI response embed
      const embed = buildAiResponseEmbed(result.text);
      await interaction.editReply({ content: null, embeds: [embed] });
    }

    logger.info("ask command responded", {
      userId: interaction.user.id,
      sessionId,
      resultKind: result.kind,
    });
  } catch (err) {
    logger.error("ask command error", { error: String(err) });

    let message =
      "Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.";
    if (err instanceof TimeoutError) {
      message = "Permintaan habis waktu.\nCoba lagi beberapa saat.";
    } else if (err instanceof LangflowError) {
      message =
        "Maaf, GameAtlas sedang tidak dapat memproses permintaan.\nCoba lagi beberapa saat.";
    }

    await interaction.editReply({
      content: null,
      embeds: [buildErrorEmbed(message)],
    });
  }
}
