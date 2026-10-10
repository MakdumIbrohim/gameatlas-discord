import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig';
import { logger } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Pengaturan GameAtlas untuk server ini — khusus admin')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('channel')
      .setDescription('Pilih channel mana yang mau nerima notifikasi game gratis harian')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('Pilih channel-nya di sini')
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('notify')
      .setDescription('Nyalain atau matiin notifikasi game gratis harian')
      .addBooleanOption((opt) =>
        opt
          .setName('enabled')
          .setDescription('true untuk aktifkan, false untuk matikan')
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('time')
          .setDescription('Jam kirim notifikasi, format HH:MM zona WIB (default: 09:00)')
          .setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Cek pengaturan GameAtlas yang aktif sekarang'),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: '⚠️ Command ini hanya bisa digunakan di dalam server.', ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'channel') {
    const channel = interaction.options.getChannel('channel', true);
    if (!(channel instanceof TextChannel)) {
      await interaction.reply({ content: '⚠️ Pilih text channel yang valid.', ephemeral: true });
      return;
    }
    setGuildConfig(interaction.guildId, { notifyChannelId: channel.id });

    const embed = new EmbedBuilder()
      .setTitle('✅ Channel Notifikasi Diset')
      .setDescription(`Notifikasi game gratis harian akan dikirim ke <#${channel.id}>.\n\nAktifkan dengan \`/config notify enabled:true\`.`)
      .setColor(0x2ecc71)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    logger.info('config channel set', { guildId: interaction.guildId, channelId: channel.id });
  }

  if (sub === 'notify') {
    const enabled = interaction.options.getBoolean('enabled', true);
    const timeInput = interaction.options.getString('time');

    // Validate HH:MM format
    let notifyTime = '09:00';
    if (timeInput) {
      if (!/^\d{2}:\d{2}$/.test(timeInput)) {
        await interaction.reply({ content: '⚠️ Format waktu tidak valid. Gunakan HH:MM, contoh: `09:00`', ephemeral: true });
        return;
      }
      notifyTime = timeInput;
    }

    const cfg = getGuildConfig(interaction.guildId);
    if (enabled && !cfg.notifyChannelId) {
      await interaction.reply({
        content: '⚠️ Set channel dulu dengan `/config channel` sebelum mengaktifkan notifikasi.',
        ephemeral: true,
      });
      return;
    }

    setGuildConfig(interaction.guildId, { notifyEnabled: enabled, notifyTime });

    const embed = new EmbedBuilder()
      .setTitle(enabled ? '🔔 Notifikasi Diaktifkan' : '🔕 Notifikasi Dinonaktifkan')
      .setDescription(
        enabled
          ? `Notifikasi game gratis akan dikirim setiap hari pukul **${notifyTime} WIB** ke <#${cfg.notifyChannelId}>.`
          : 'Notifikasi harian telah dinonaktifkan.',
      )
      .setColor(enabled ? 0x2ecc71 : 0xe74c3c)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    logger.info('config notify updated', { guildId: interaction.guildId, enabled, notifyTime });
  }

  if (sub === 'status') {
    const cfg = getGuildConfig(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle('⚙️ GameAtlas Config')
      .addFields(
        {
          name: '📢 Channel Notifikasi',
          value: cfg.notifyChannelId ? `<#${cfg.notifyChannelId}>` : 'Belum diset',
          inline: true,
        },
        {
          name: '🔔 Notifikasi Harian',
          value: cfg.notifyEnabled ? `✅ Aktif — pukul ${cfg.notifyTime ?? '09:00'} WIB` : '❌ Nonaktif',
          inline: true,
        },
      )
      .setColor(0x3498db)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
