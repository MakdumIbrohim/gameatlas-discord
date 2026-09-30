import {
  Client,
  Collection,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  Interaction,
} from "discord.js";
import { logger } from "../utils/logger";
import * as freegamesCommand from "./commands/freegames";
import * as askCommand from "./commands/ask";
import * as helpCommand from "./commands/help";

export interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [freegamesCommand, askCommand, helpCommand];

export function buildCommandCollection(): Collection<string, Command> {
  const collection = new Collection<string, Command>();
  for (const cmd of commands) {
    collection.set(cmd.data.name, cmd);
  }
  return collection;
}

export function createClient(): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const commandCollection = buildCommandCollection();

  client.once("ready", (c) => {
    logger.info(`Logged in as ${c.user.tag}`);
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandCollection.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error("Unhandled command error", {
        command: interaction.commandName,
        error: String(err),
      });

      const errorMsg =
        "⚠️ Terjadi kesalahan tak terduga. Coba lagi beberapa saat.";
      if (interaction.deferred || interaction.replied) {
        await interaction
          .editReply({ content: errorMsg })
          .catch(() => undefined);
      } else {
        await interaction
          .reply({ content: errorMsg, ephemeral: true })
          .catch(() => undefined);
      }
    }
  });

  return client;
}

export { commands };
