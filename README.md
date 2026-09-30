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

- **Runtime:** Node.js + TypeScript
- **Discord SDK:** discord.js v14
- **AI Orchestration:** Langflow (HTTP API)
- **Data Source:** GamerPower API (no key required)

---

## Prerequisites

- Node.js >= 18
- Instance Langflow yang berjalan (lokal atau cloud)
- Discord Bot Application (dari [Discord Developer Portal](https://discord.com/developers/applications))

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
DISCORD_GUILD_ID=      # (Opsional) Guild ID untuk dev; hapus untuk global commands

# Langflow
LANGFLOW_SERVER_URL=http://localhost:7860
LANGFLOW_API_KEY=      # API key dari instance Langflow
LANGFLOW_FLOW_ID=      # Flow ID dari flow yang sudah dibuat di Langflow

# GamerPower (default sudah tersedia)
GAMERPOWER_API_URL=https://www.gamerpower.com/api
```

### 3. Register slash commands ke Discord

```bash
npm run deploy-commands
```

Jika `DISCORD_GUILD_ID` diisi, command langsung aktif di server tersebut (cocok untuk development). Tanpa `DISCORD_GUILD_ID`, command didaftarkan secara global (butuh ~1 jam propagasi).

### 4. Jalankan bot

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

---

## Langflow Setup

GameAtlas menggunakan Langflow sebagai AI orchestration layer. Flow yang diperlukan:

```
Chat Input → Prompt Template → AI Agent → Game Search Tool (GamerPower) → Chat Output
```

Prompt template yang direkomendasikan:

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

Setelah flow dibuat, salin **Flow ID** ke `LANGFLOW_FLOW_ID` di `.env`.

---

## Running Tests

```bash
npm test
```

---

## Project Structure

```
src/
├── index.ts                     # Entry point
├── config.ts                    # Environment variable loader
├── discord/
│   ├── client.ts                # Discord client & command router
│   ├── deployCommands.ts        # Slash command registration script
│   ├── commands/
│   │   ├── freegames.ts         # /freegames command
│   │   ├── ask.ts               # /ask command
│   │   └── help.ts              # /help command
│   └── formatters/
│       └── gameEmbed.ts         # Discord Embed builder
├── services/
│   ├── langflow.ts              # Langflow HTTP API client
│   └── gamerpower.ts            # GamerPower API client
└── utils/
    ├── logger.ts                # Structured JSON logger
    └── errors.ts                # Custom error classes

tests/
├── langflow.test.ts
├── gamerpower.test.ts
└── formatter.test.ts
```

---

## Supported Platforms (GamerPower)

`steam` · `epic-games-store` · `gog` · `xbox` · `ps4` · `switch` · `android` · `ios` · `itchio` · `battlenet` · `origin` · `ubisoft`

---

## Attribution

Data giveaway disediakan oleh **[GamerPower](https://www.gamerpower.com)**. Sesuai persyaratan API mereka, attribution ke GamerPower dipertahankan di semua response.

---

## License

MIT
