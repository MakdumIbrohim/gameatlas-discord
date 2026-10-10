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
          'Filter game gratis berdasarkan platform dengan **autocomplete**.\n' +
          'Ketik nama platform → pilih dari suggestion yang muncul.\n' +
          'Mendukung pagination ◀ ▶ jika hasil lebih dari 5.',
      },
      {
        name: '`/ask query:<pertanyaan>`',
        value:
          'Tanyakan dalam bahasa natural via AI.\n' +
          'Contoh: `/ask query:Ada game RPG gratis di Steam?`',
      },
      {
        name: '`/search query:<kata kunci>`',
        value:
          'Cari game spesifik menggunakan Web Search.\n' +
          'Contoh: `/search query:Hollow Knight` atau `/search query:game horror platform:steam`',
      },
      {
        name: '`/endingsoon`',
        value:
          'Tampilkan giveaway yang hampir berakhir.\n' +
          'Opsi: `/endingsoon days:3` — berakhir dalam 3 hari.',
      },
      {
        name: '`/config channel`',
        value: '*(Admin)* Set channel untuk notifikasi game gratis harian.',
      },
      {
        name: '`/config notify enabled:true`',
        value: '*(Admin)* Aktifkan/nonaktifkan notifikasi harian. Opsi: `time:09:00` untuk atur jam (WIB).',
      },
      {
        name: '`/config status`',
        value: '*(Admin)* Lihat konfigurasi bot saat ini.',
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
