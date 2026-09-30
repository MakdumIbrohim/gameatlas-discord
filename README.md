# GameAtlas Discord Bot

> Cross-Platform Free Game Discovery Bot for Discord

GameAtlas adalah Discord Bot berbasis AI yang membantu pengguna menemukan **game gratis dan giveaway game** dari berbagai platform digital dalam satu tempat — langsung dari Discord.

---

## Features

- `/freegames` — tampilkan semua game gratis yang sedang tersedia
- `/freegames platform:steam` — filter berdasarkan platform
- `/ask query:...` — tanya dalam bahasa natural, dijawab oleh AI via Langflow
- `/help` — tampilkan daftar command

---

## Tech Stack

- **Runtime:** Node.js >= 18 + TypeScript
- **Discord SDK:** discord.js v14
- **AI Orchestration:** Langflow (HTTP API)
- **Data Source:** GamerPower API (no key required)
- **HTTP Client:** axios
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
{"level":"info","message":"Registered 3 commands to guild YOUR_GUILD_ID"}
```

Jika `DISCORD_GUILD_ID` diisi → command langsung aktif di server tersebut (cocok untuk development).
Jika `DISCORD_GUILD_ID` dikosongkan → command didaftarkan secara global (butuh ~1 jam propagasi).

> Jalankan `deploy-commands` ulang setiap kali ada perubahan pada slash command.

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

Output sukses:
```
{"level":"info","message":"Logged in as GameAtlas#XXXX"}
```

---

## Cara Mendapatkan Discord Credentials

### DISCORD_TOKEN & DISCORD_CLIENT_ID

1. Buka [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik **New Application** → beri nama → **Create**
3. Di halaman **General Information** → salin **Application ID** → itulah `DISCORD_CLIENT_ID`
4. Di sidebar kiri klik **Bot** → klik **Add Bot**
5. Klik **Reset Token** → salin token → itulah `DISCORD_TOKEN`

> ⚠️ Token hanya ditampilkan sekali. Jangan share ke siapapun.

### DISCORD_GUILD_ID

1. Buka Discord → **Settings → Advanced** → aktifkan **Developer Mode**
2. Klik kanan nama server → **Copy Server ID** → itulah `DISCORD_GUILD_ID`

---

## Langflow Setup

GameAtlas menggunakan Langflow sebagai AI orchestration layer untuk command `/ask`. Command `/freegames` bekerja langsung tanpa Langflow.

### Flow yang diperlukan

```
Chat Input → Prompt Template → AI Agent → Game Search Tool (GamerPower) → Chat Output
```

### Prompt template yang direkomendasikan

```
Kamu adalah GameAtlas, AI assistant untuk mencari game gratis dan giveaway game.

Pahami permintaan pengguna dan gunakan Game Search Tool untuk mendapatkan data terbaru.

Prioritaskan informasi:
- nama game
- platform
- tipe giveaway
- tanggal berakhir
- nilai game jika tersedia
- link klaim

Jangan mengarang data. Gunakan hanya data yang diberikan oleh tool.

User request:
{input}
```

### Game Search Tool

Tool memanggil GamerPower API:

```
GET https://www.gamerpower.com/api/giveaways?platform={platform}
```

Setelah flow dibuat di Langflow, salin **Flow ID** ke `LANGFLOW_FLOW_ID` di `.env`.

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
Tests:       19 passed, 19 total
```

---

## Project Structure

```
src/
├── index.ts                     # Entry point — bot login & process handlers
├── config.ts                    # Environment variable loader & validator
├── discord/
│   ├── client.ts                # Discord client factory & command router
│   ├── deployCommands.ts        # Slash command registration script
│   ├── commands/
│   │   ├── freegames.ts         # /freegames — ambil giveaway langsung dari GamerPower
│   │   ├── ask.ts               # /ask — kirim query ke Langflow AI Agent
│   │   └── help.ts              # /help — tampilkan daftar command
│   └── formatters/
│       └── gameEmbed.ts         # Discord Embed builder (game list, AI response, error)
├── services/
│   ├── langflow.ts              # sendMessageToLangflow() — Langflow HTTP API client
│   └── gamerpower.ts            # getGiveaways() — GamerPower API client
└── utils/
    ├── logger.ts                # Structured JSON logger
    └── errors.ts                # Custom error classes (LangflowError, GamerPowerError, TimeoutError)

tests/
├── langflow.test.ts             # Unit tests — Langflow service
├── gamerpower.test.ts           # Unit tests — GamerPower service
└── formatter.test.ts            # Unit tests — Discord Embed formatter
```

---

## Supported Platforms (GamerPower)

`steam` · `epic-games-store` · `gog` · `xbox` · `ps4` · `switch` · `android` · `ios` · `itchio` · `battlenet` · `origin` · `ubisoft`

---

## Error Handling

| Kondisi | Pesan ke User |
|---|---|
| Langflow tidak tersedia | "Maaf, GameAtlas sedang tidak dapat memproses permintaan." |
| GamerPower API gagal | "Sumber data game sedang tidak dapat diakses." |
| Timeout | "Permintaan habis waktu. Coba lagi beberapa saat." |
| Tidak ada hasil | "Belum menemukan giveaway yang sesuai." |

---

## Attribution

Data giveaway disediakan oleh **[GamerPower](https://www.gamerpower.com)**. Sesuai persyaratan API mereka, attribution ke GamerPower dipertahankan di semua response Discord.

---

## Changelog

### v1.0.0
- Initial release
- `/freegames` command dengan filter platform
- `/ask` command dengan integrasi Langflow AI Agent
- `/help` command
- GamerPower API integration
- Discord Embed formatting dengan claim buttons
- Structured JSON logging
- Unit tests (19 tests passing)
- Error handling untuk Langflow, GamerPower, dan timeout

---

## License

MIT
