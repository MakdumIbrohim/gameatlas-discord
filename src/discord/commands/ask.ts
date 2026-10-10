import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { sendMessageToLangflow } from "../../services/langflow";
import {
  buildAiResponseEmbed,
  buildErrorEmbed,
  buildStructuredGameEmbed,
} from "../formatters/gameEmbed";
import { ANIMATED_EMOJIS } from "../constants/emojis";
import { logger } from "../../utils/logger";
import { LangflowError, TimeoutError } from "../../utils/errors";

export const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription(
    "Tanya rekomendasi atau info game gratisan ke AI kita!",
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
        `${ANIMATED_EMOJIS.SEARCH} Otw nyariin game gratisnya, bentar yaa... (bisa makan waktu sampe 2 menit)`,
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
      "Duh, GameAtlas lagi ngelag nih pas proses request lu.\nCoba lagi bentar ya!";
    if (err instanceof TimeoutError) {
      message = "Waduh koneksinya timeout nih kelamaan nunggu.\nCoba lagi bentar ya!";
    } else if (err instanceof LangflowError) {
      message =
        "Duh, GameAtlas lagi ngelag nih pas proses request lu.\nCoba lagi bentar ya!";
    }

    await interaction.editReply({
      content: null,
      embeds: [buildErrorEmbed(message)],
    });
  }
}
