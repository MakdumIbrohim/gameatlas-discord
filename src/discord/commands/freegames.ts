import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from 'discord.js';
import { getGiveaways, Giveaway } from '../../services/gamerpower';
import { buildGameEmbed, buildErrorEmbed } from '../formatters/gameEmbed';
import { logger } from '../../utils/logger';
import { GamerPowerError, TimeoutError } from '../../utils/errors';
import { PLATFORMS } from '../constants/platforms';
import { ANIMATED_EMOJIS } from '../constants/emojis';

const PAGE_SIZE = 5;

export const data = new SlashCommandBuilder()
  .setName('freegames')
  .setDescription('Cek game gratis yang lagi available sekarang')
  .addStringOption((option) =>
    option
      .setName('platform')
      .setDescription('Mau filter platform tertentu? Pilih di sini (Steam, Epic, GOG, dll)')
      .setRequired(false)
      .setAutocomplete(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const filtered = PLATFORMS.filter(
    (p) => p.name.toLowerCase().includes(focused) || p.value.includes(focused),
  ).slice(0, 25);
  await interaction.respond(filtered);
}

function buildPaginationRow(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('page_info')
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

function getPage(giveaways: Giveaway[], page: number) {
  const totalPages = Math.ceil(giveaways.length / PAGE_SIZE);
  const slice = giveaways.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return { slice, totalPages };
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const platform = interaction.options.getString('platform') ?? undefined;

  await interaction.deferReply();

  try {
    await interaction.editReply({ content: `${ANIMATED_EMOJIS.SEARCH} Sedang mencari game gratis...` });

    const giveaways = await getGiveaways(platform);

    if (giveaways.length === 0) {
      await interaction.editReply({
        content: null,
        embeds: [buildErrorEmbed('Belum menemukan giveaway yang sesuai.\nCoba platform atau kata kunci lain.')],
      });
      return;
    }

    let page = 0;
    const { slice, totalPages } = getPage(giveaways, page);
    const title = platform
      ? `🎮 Free Games — ${PLATFORMS.find((p) => p.value === platform)?.name ?? platform}`
      : '🎮 GameAtlas — Free Games';

    const { embeds, components: claimComponents } = buildGameEmbed(slice, title);

    const paginationRow = buildPaginationRow(page, totalPages);
    const components = totalPages > 1 ? [...claimComponents, paginationRow] : claimComponents;

    const message = await interaction.editReply({ content: null, embeds, components });

    logger.info('freegames command responded', { userId: interaction.user.id, platform, count: giveaways.length });

    if (totalPages <= 1) return;

    // Pagination collector — aktif 5 menit
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (btn) => btn.user.id === interaction.user.id,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async (btn) => {
      if (btn.customId === 'prev') page = Math.max(0, page - 1);
      if (btn.customId === 'next') page = Math.min(totalPages - 1, page + 1);

      const { slice: newSlice } = getPage(giveaways, page);
      const { embeds: newEmbeds, components: newClaims } = buildGameEmbed(newSlice, title);
      const newPagination = buildPaginationRow(page, totalPages);

      await btn.update({
        embeds: newEmbeds,
        components: [...newClaims, newPagination],
      });
    });

    collector.on('end', async () => {
      // Disable pagination buttons saat expired
      const { slice: lastSlice } = getPage(giveaways, page);
      const { embeds: lastEmbeds, components: lastClaims } = buildGameEmbed(lastSlice, title);
      const disabledRow = buildPaginationRow(page, totalPages);
      disabledRow.components.forEach((b) => b.setDisabled(true));
      await interaction.editReply({ embeds: lastEmbeds, components: [...lastClaims, disabledRow] }).catch(() => undefined);
    });
  } catch (err) {
    logger.error('freegames command error', { error: String(err) });
    let message = 'Sumber data game sedang tidak dapat diakses.\nSilakan coba lagi nanti.';
    if (err instanceof TimeoutError) message = 'Permintaan ke sumber data habis waktu.\nSilakan coba lagi beberapa saat.';
    else if (err instanceof GamerPowerError) message = 'Sumber data game sedang tidak dapat diakses.\nSilakan coba lagi nanti.';
    await interaction.editReply({ content: null, embeds: [buildErrorEmbed(message)] });
  }
}
