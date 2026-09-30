import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: process.env['DISCORD_GUILD_ID'],
  },
  langflow: {
    serverUrl: requireEnv('LANGFLOW_SERVER_URL'),
    apiKey: requireEnv('LANGFLOW_API_KEY'),
    flowId: requireEnv('LANGFLOW_FLOW_ID'),
    timeoutMs: 30_000,
  },
  gamerpower: {
    apiUrl: process.env['GAMERPOWER_API_URL'] ?? 'https://www.gamerpower.com/api',
  },
};
