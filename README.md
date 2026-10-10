# GameAtlas Discord Bot

> Cross-Platform Free Game Discovery Bot for Discord

GameAtlas adalah Discord Bot berbasis AI yang membantu pengguna menemukan **game gratis dan giveaway game** dari berbagai platform digital dalam satu tempat — langsung dari Discord.

---

## Features

| Command | Deskripsi |
|---|---|
| `/freegames` | Tampilkan semua game gratis yang sedang tersedia |
| `/freegames platform:<nama>` | Filter berdasarkan platform dengan **autocomplete** + **pagination** ◀▶ |
| `/ask query:<pertanyaan>` | Tanya dalam bahasa natural, dijawab AI via Langflow |
| `/search query:<kata kunci>` | Cari game spesifik menggunakan Web Search |
| `/endingsoon [days:3]` | Giveaway yang hampir berakhir dalam N hari |
| `/config channel` | *(Admin)* Set channel untuk notifikasi harian |
| `/config notify` | *(Admin)* Aktifkan/nonaktifkan alert harian + atur jam WIB |
| `/config status` | *(Admin)* Lihat konfigurasi bot saat ini |
| `/help` | Tampilkan daftar command |

---

## Tech Stack

- **Runtime:** Node.js >= 18 + TypeScript
- **Discord SDK:** discord.js v14
- **AI Orchestration:** Langflow (HTTP API) — Gemini + Web Search + Structured Output
- **Data Source:** GamerPower API (no key required)
- **HTTP Client:** axios
- **Scheduler:** node-cron (daily alert)
- **Testing:** Jest + ts-jest

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Instance Langflow yang berjalan (lokal atau cloud)
- Discord Bot Application — lihat [Cara Mendapatkan Discord Credentials](#cara-mendapatkan-discord-credentials)

---

## Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd game-atlas-discord-bot
npm install
```

### 2. Konfigurasi environment variables

```bash
cp .env.example .env
```

Edit `.env` dan isi semua nilai:

```env
# Discord
DISCORD_TOKEN=         # Bot token dari Discord Developer Portal
DISCORD_CLIENT_ID=     # Application ID dari Discord Developer Portal
DISCORD_GUILD_ID=      # (Opsional) Guild ID untuk dev; kosongkan untuk global commands

# Langflow
LANGFLOW_SERVER_URL=http://localhost:7860
LANGFLOW_API_KEY=      # API key dari instance Langflow
LANGFLOW_FLOW_ID=      # Flow ID dari flow yang sudah dibuat di Langflow
LANGFLOW_TIMEOUT_MS=150000  # Timeout dalam ms (default 150 detik, naikan jika flow lambat)

# GamerPower (default sudah tersedia, tidak perlu diubah)
GAMERPOWER_API_URL=https://www.gamerpower.com/api
```

### 3. Undang bot ke server Discord

Generate invite link dengan mengganti `CLIENT_ID` dengan `DISCORD_CLIENT_ID` kamu:

```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot+applications.commands&permissions=277025508352
```

Buka link tersebut di browser, pilih server tujuan, lalu klik **Authorize**.

### 4. Register slash commands ke Discord

```bash
npm run deploy-commands
```

Output sukses:
```
{"level":"info","message":"Registered 6 commands to guild YOUR_GUILD_ID"}
```

Jika `DISCORD_GUILD_ID` diisi → command langsung aktif di server tersebut (cocok untuk development).
Jika `DISCORD_GUILD_ID` dikosongkan → command didaftarkan secara global (butuh ~1 jam propagasi).

> Jalankan `deploy-commands` ulang setiap kali ada penambahan/perubahan command.

### 5. Jalankan bot

**Development:**
```bash
npm run dev
```

**Production (build dulu):**
```bash
npm run build
npm start
```

**Production dengan Docker:**
```bash
docker compose up -d
```

Output sukses:
```
{"level":"info","message":"Logged in as GameAtlas#XXXX"}
{"level":"info","message":"Daily alert scheduler started"}
```

---

## Docker

### Prasyarat
- Docker >= 24
- Docker Compose >= 2

### Jalankan dengan Docker Compose

```bash
# Pastikan .env sudah diisi
cp .env.example .env
# edit .env ...

# Build dan jalankan
docker compose up -d

# Lihat logs
docker compose logs -f

# Stop
docker compose down
```

### Build manual (tanpa Compose)

```bash
# Build image
docker build -t gameatlas-bot .

# Jalankan container
docker run -d \
  --name gameatlas-bot \
  --restart unless-stopped \
  --env-file .env \
  gameatlas-bot
```

### Deploy commands di dalam Docker

```bash
docker run --rm --env-file .env gameatlas-bot \
  node -e "require('./dist/discord/deployCommands')"
```

Atau lebih mudah, jalankan deploy-commands **sebelum** build Docker:

```bash
npm run deploy-commands   # jalankan sekali dari lokal
docker compose up -d      # lalu deploy container
```

---

## Cara Mendapatkan Discord Credentials

### DISCORD_TOKEN & DISCORD_CLIENT_ID

1. Buka [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik **New Application** → beri nama → **Create**
3. Di halaman **General Information** → salin **Application ID** → itulah `DISCORD_CLIENT_ID`
4. Di sidebar kiri klik **Bot** → klik **Add Bot**
5. Klik **Reset Token** → salin token → itulah `DISCORD_TOKEN`

> ⚠️ Token hanya ditampilkan sekali. Jangan share ke siapapun dan jangan commit ke Git.

### DISCORD_GUILD_ID

1. Buka Discord → **Settings → Advanced** → aktifkan **Developer Mode**
2. Klik kanan nama server → **Copy Server ID** → itulah `DISCORD_GUILD_ID`

---

## Langflow Setup

GameAtlas menggunakan Langflow sebagai AI orchestration layer. Command `/ask`, `/search`, dan `/endingsoon` semuanya melewati Langflow. Command `/freegames` bekerja langsung ke GamerPower tanpa Langflow.

### Flow yang direkomendasikan

```
Chat Input
    ↓
Prompt Template
    ↓
AI Agent ──── API Request (GamerPower)
         ──── Web Search
         ──── Current Date
    ↓
Structured Output
    ↓
Chat Output
```

### Prompt template yang direkomendasikan

```
Kamu adalah GameAtlas, AI assistant untuk mencari game gratis dan giveaway game.

Pahami permintaan pengguna dan gunakan tool yang sesuai:
- API Request → untuk data giveaway dari GamerPower
- Web Search → untuk informasi tambahan (genre, system requirements, dll)
- Current Date → untuk menghitung sisa waktu giveaway

Prioritaskan informasi:
- nama game
- platform
- tipe giveaway
- tanggal berakhir
- nilai game jika tersedia
- link klaim
- genre (jika tersedia)
- reason (alasan AI memilih game ini)

Jangan mengarang data. Gunakan hanya data dari tool.

User request:
{input}
```

### Structured Output Schema

Bot mengharapkan output dalam format JSON dengan struktur berikut:

```json
{
  "results": [
    {
      "title": "Nama Game",
      "platform": "Steam",
      "type": "game",
      "description": "Deskripsi singkat",
      "worth": "$9.99",
      "end_date": "2026-10-15",
      "image_url": "https://...",
      "claim_url": "https://...",
      "genre": "RPG",
      "reason": "Alasan AI memilih game ini"
    }
  ]
}
```

Bot juga mendukung format: array langsung `[{...}]`, single object `{...}`, atau wrapper key `games`, `data`, `items`, `giveaways`.

### LANGFLOW_TIMEOUT_MS

Flow dengan Web Search + AI reasoning bisa memakan waktu 60–120 detik. Default timeout adalah **150 detik**. Sesuaikan di `.env` jika diperlukan.

---

## Available Scripts

| Script | Perintah | Keterangan |
|---|---|---|
| `dev` | `npm run dev` | Jalankan bot dengan ts-node (development) |
| `build` | `npm run build` | Compile TypeScript ke `dist/` |
| `start` | `npm start` | Jalankan dari hasil build (production) |
| `deploy-commands` | `npm run deploy-commands` | Daftarkan slash commands ke Discord |
| `test` | `npm test` | Jalankan semua unit tests |

---

## Running Tests

```bash
npm test
```

Output sukses:
```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
```

---

## Project Structure

```
src/
├── index.ts                          # Entry point — bot login, scheduler start
├── config.ts                         # Environment variable loader & validator
├── discord/
│   ├── client.ts                     # Discord client factory, command & autocomplete router
│   ├── deployCommands.ts             # Slash command registration script
│   ├── constants/
│   │   └── platforms.ts              # Daftar platform GamerPower (untuk autocomplete)
│   ├── commands/
│   │   ├── freegames.ts              # /freegames — GamerPower langsung, autocomplete, pagination
│   │   ├── ask.ts                    # /ask — natural language via Langflow AI Agent
│   │   ├── search.ts                 # /search — Web Search via Langflow
│   │   ├── endingsoon.ts             # /endingsoon — giveaway hampir berakhir
│   │   ├── config.ts                 # /config — admin setup channel & notifikasi
│   │   └── help.ts                   # /help — daftar command
│   └── formatters/
│       └── gameEmbed.ts              # Discord Embed builder (game list, structured, AI, error)
├── services/
│   ├── langflow.ts                   # Langflow HTTP API client + JSON parser
│   ├── gamerpower.ts                 # GamerPower API client
│   ├── guildConfig.ts                # In-memory guild config store (channel, notify settings)
│   └── scheduler.ts                  # node-cron daily alert scheduler
└── utils/
    ├── logger.ts                     # Structured JSON logger
    └── errors.ts                     # Custom error classes

tests/
├── langflow.test.ts                  # Unit tests — Langflow service + JSON parsing
├── gamerpower.test.ts                # Unit tests — GamerPower service
└── formatter.test.ts                 # Unit tests — Discord Embed formatter
```

---

## Daily Alert Setup

Untuk mengaktifkan notifikasi game gratis harian otomatis di server Discord kamu:

1. Pastikan bot sudah online
2. Di Discord, jalankan (butuh permission **Manage Server**):
   ```
   /config channel channel:#free-games
   /config notify enabled:true time:09:00
   ```
3. Setiap hari pukul 09:00 WIB, bot akan mengirim daftar game gratis terbaru ke channel tersebut
4. Cek status konfigurasi dengan `/config status`
5. Nonaktifkan dengan `/config notify enabled:false`

> **Catatan:** Konfigurasi disimpan **in-memory** dan akan reset saat bot restart. Untuk persistensi permanen, integrate dengan database seperti SQLite.

---

## Supported Platforms (GamerPower)

`steam` · `epic-games-store` · `gog` · `xbox` · `ps4` · `ps5` · `switch` · `android` · `ios` · `itchio` · `battlenet` · `origin` · `ubisoft`

---

## Error Handling

| Kondisi | Pesan ke User |
|---|---|
| Langflow tidak tersedia | "Maaf, GameAtlas sedang tidak dapat memproses permintaan." |
| GamerPower API gagal | "Sumber data game sedang tidak dapat diakses." |
| Timeout (> 150 detik) | "Permintaan habis waktu. Coba lagi beberapa saat." |
| Tidak ada hasil | "Belum menemukan giveaway yang sesuai." |
| Langflow JSON tidak dikenali | Fallback ke plain text embed |

---

## Attribution

Data giveaway disediakan oleh **[GamerPower](https://www.gamerpower.com)**. Sesuai persyaratan API mereka, attribution ke GamerPower dipertahankan di semua response Discord.

---

## Changelog

### v1.1.0
- Tambah command `/search` — cari game via Web Search Langflow
- Tambah command `/endingsoon` — giveaway hampir berakhir
- Tambah command `/config` — admin setup channel & notifikasi harian
- Autocomplete platform di `/freegames` dan `/search`
- Pagination ◀▶ di `/freegames` untuk hasil lebih dari 5
- Daily alert scheduler dengan `node-cron`
- Upgrade Discord Embed: gambar per game, tanggal friendly, field `reason` dari AI
- Timeout Langflow dinaikkan ke 150 detik (configurable via `LANGFLOW_TIMEOUT_MS`)
- Handle semua format JSON output Langflow (plain, array, `results`, `games`, `data`, dll)
- Strip markdown code block dari response Langflow sebelum parsing

### v1.0.0
- Initial release
- `/freegames` command dengan filter platform
- `/ask` command dengan integrasi Langflow AI Agent
- `/help` command
- GamerPower API integration
- Discord Embed formatting dengan claim buttons
- Structured JSON logging
- Unit tests (22 tests passing)
- Error handling untuk Langflow, GamerPower, dan timeout

---

## License

MIT
