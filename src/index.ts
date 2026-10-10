import { config } from './config';
import { createClient } from './discord/client';
import { startDailyAlertScheduler } from './services/scheduler';
import { logger } from './utils/logger';

const client = createClient();

client.once('clientReady', () => {
  startDailyAlertScheduler(client);
});

client.login(config.discord.token).catch((err) => {
  logger.error('Failed to log in to Discord', { error: String(err) });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: String(err) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
