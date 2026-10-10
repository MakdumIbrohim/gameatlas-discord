import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig';
import { GIF_ICONS } from '../constants/gifs';
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
    await interaction.reply({ content: '⚠️ Command ini cuma bisa dipake di dalem server ya bro.', ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'channel') {
    const channel = interaction.options.getChannel('channel', true);
    if (!(channel instanceof TextChannel)) {
      await interaction.reply({ content: '⚠️ Pilih text channel yang bener dong.', ephemeral: true });
      return;
    }
    setGuildConfig(interaction.guildId, { notifyChannelId: channel.id });

    const embed = new EmbedBuilder()
      .setTitle('✅ Channel Alert Udah Diset!')
      .setDescription(`Notif game gratis harian bakal dikirim ke <#${channel.id}>.\n\nJangan lupa aktifin pake \`/config notify enabled:true\` ya!`)
      .setColor(0x2ecc71)
      .setThumbnail(GIF_ICONS.CONFIG)
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
        await interaction.reply({ content: '⚠️ Format jam salah nih. Pake format HH:MM ya, contoh: `09:00`', ephemeral: true });
        return;
      }
      notifyTime = timeInput;
    }

    const cfg = getGuildConfig(interaction.guildId);
    if (enabled && !cfg.notifyChannelId) {
      await interaction.reply({
        content: '⚠️ Atur channel dulu pake `/config channel` baru bisa nyalain notif ya!',
        ephemeral: true,
      });
      return;
    }

    setGuildConfig(interaction.guildId, { notifyEnabled: enabled, notifyTime });

    const embed = new EmbedBuilder()
      .setTitle(enabled ? '🔔 Alert Harian Aktif!' : '🔕 Alert Harian Dimatiin!')
      .setDescription(
        enabled
          ? `Notif game gratisan bakal drop tiap hari jam **${notifyTime} WIB** di <#${cfg.notifyChannelId}>. Siap-siap klaim!`
          : 'Auto-alert harian udah dinonaktifkan.',
      )
      .setColor(enabled ? 0x2ecc71 : 0xe74c3c)
      .setThumbnail(enabled ? GIF_ICONS.ALERT : GIF_ICONS.CONFIG)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    logger.info('config notify updated', { guildId: interaction.guildId, enabled, notifyTime });
  }

  if (sub === 'status') {
    const cfg = getGuildConfig(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Settingan GameAtlas Server Ini')
      .addFields(
        {
          name: '📢 Channel Alert',
          value: cfg.notifyChannelId ? `<#${cfg.notifyChannelId}>` : 'Belum diset nih',
          inline: true,
        },
        {
          name: '🔔 Alert Harian',
          value: cfg.notifyEnabled ? `✅ Aktif — tiap ${cfg.notifyTime ?? '09:00'} WIB` : '❌ Mati',
          inline: true,
        },
      )
      .setColor(0x3498db)
      .setThumbnail(GIF_ICONS.CONFIG)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
