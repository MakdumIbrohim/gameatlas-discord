import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Tampilkan daftar command GameAtlas');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('🎮 GameAtlas — Help')
    .setDescription('Bot untuk menemukan game gratis dan giveaway dari berbagai platform.')
    .addFields(
      {
        name: '`/freegames`',
        value: 'Tampilkan semua game gratis yang sedang tersedia.',
      },
      {
        name: '`/freegames platform:<nama>`',
        value:
          'Filter game gratis berdasarkan platform.\n' +
          'Contoh platform: `steam`, `epic-games-store`, `gog`, `xbox`, `ps4`, `switch`, `android`, `ios`, `itchio`',
      },
      {
        name: '`/ask query:<pertanyaan>`',
        value:
          'Tanyakan dalam bahasa natural.\n' +
          'Contoh: `/ask query:Ada game RPG gratis di Steam?`',
      },
      {
        name: '`/help`',
        value: 'Tampilkan halaman bantuan ini.',
      },
    )
    .setColor(0x3498db)
    .setFooter({ text: 'Powered by GamerPower & Langflow' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
