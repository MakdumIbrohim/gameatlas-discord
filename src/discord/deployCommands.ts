import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './client';
import { logger } from '../utils/logger';

dotenv.config();

const token = process.env['DISCORD_TOKEN'];
const clientId = process.env['DISCORD_CLIENT_ID'];
const guildId = process.env['DISCORD_GUILD_ID'];

if (!token || !clientId) {
  throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
}

const rest = new REST().setToken(token);
const commandJsonData = commands.map((cmd) => cmd.data.toJSON());

(async () => {
  try {
    logger.info('Registering slash commands...');

    if (guildId) {
      // Guild-scoped (instant, for development)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandJsonData,
      });
      logger.info(`Registered ${commandJsonData.length} commands to guild ${guildId}`);
    } else {
      // Global (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandJsonData,
      });
      logger.info(`Registered ${commandJsonData.length} commands globally`);
    }
  } catch (err) {
    logger.error('Failed to register commands', { error: String(err) });
    process.exit(1);
  }
})();
