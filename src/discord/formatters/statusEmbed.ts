import { EmbedBuilder } from 'discord.js';
import { GIF_ICONS } from '../constants/gifs';
import { GAMERPOWER_URL } from './helpers';

export function buildAiResponseEmbed(aiText: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 GameAtlas')
    .setDescription(aiText.slice(0, 4096))
    .setColor(0x3498db)
    .setThumbnail(GIF_ICONS.AI)
    .setFooter({ text: `Source: GamerPower (${GAMERPOWER_URL})` })
    .setTimestamp();
}

export function buildEmptyEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🔎 GameAtlas')
    .setDescription(message)
    .setColor(0xf39c12)
    .setThumbnail(GIF_ICONS.EMPTY)
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
