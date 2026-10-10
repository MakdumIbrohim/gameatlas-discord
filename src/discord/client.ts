import {
  AutocompleteInteraction,
  Client,
  Collection,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  Interaction,
} from 'discord.js';
import { logger } from '../utils/logger';
import * as freegamesCommand from './commands/freegames';
import * as askCommand from './commands/ask';
import * as helpCommand from './commands/help';
import * as endingsoonCommand from './commands/endingsoon';
import * as searchCommand from './commands/search';
import * as configCommand from './commands/config';

export interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const commands: Command[] = [
  freegamesCommand,
  askCommand,
  helpCommand,
  endingsoonCommand,
  searchCommand,
  configCommand,
];

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

  client.once('clientReady', (c) => {
    logger.info(`Logged in as ${c.user.tag}`);
  });

  client.on('interactionCreate', async (interaction: Interaction) => {
    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      const command = commandCollection.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          logger.error('Autocomplete error', { command: interaction.commandName, error: String(err) });
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commandCollection.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error('Unhandled command error', {
        command: interaction.commandName,
        error: String(err),
      });

      const errorMsg = '⚠️ Terjadi kesalahan tak terduga. Coba lagi beberapa saat.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMsg }).catch(() => undefined);
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => undefined);
      }
    }
  });

  return client;
}
