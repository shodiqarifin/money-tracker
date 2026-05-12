# Money Tracker

Aplikasi pencatat keuangan pribadi berbasis web yang dibangun dengan Nuxt 4.



## **Screenshot**

| Login | Daftar |
|---|---|
| ![Login](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/login.png) | ![Daftar](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/daftar.png) |

| Dashboard | Transaksi |
|---|---|
| ![Dashboard](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/dashboard.png) | ![Transaksi](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/transaksi.png) |

| Tambah Transaksi | Kategori |
|---|---|
| ![Tambah Transaksi](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/tambah-transaksi.png) | ![Kategori](https://raw.githubusercontent.com/shodiqarifin/money-tracker/master/public/screenshot/kategori.png) |

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com) + Vue 3
- **Auth**: [Better Auth](https://better-auth.com)
- **Database**: SQLite via [Drizzle ORM](https://orm.drizzle.team) + [@libsql/client](https://github.com/tursodatabase/libsql-client-ts)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Utilities**: VueUse, nanoid

## Fitur

- Register & login (email + password)
- Manajemen kategori pemasukan & pengeluaran
- Pencatatan transaksi (tambah, edit, hapus)
- Dashboard ringkasan keuangan (total pemasukan, pengeluaran, saldo)

## Struktur Database

```
users, sessions, accounts, verifications  ← dikelola Better Auth
wallets    ← wallet per user
categories ← kategori income/expense per wallet
transactions ← transaksi per wallet + kategori
```

## Setup

Install dependencies:

```bash
npm install
```

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

Isi `.env`:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=file:./data/db.sqlite
```

Jalankan migrasi database:

```bash
npm run db:push
```

## Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Database Scripts

| Command | Keterangan |
|---|---|
| `npm run db:generate` | Generate file migrasi dari schema |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run db:push` | Push schema langsung ke DB (dev) |
| `npm run db:studio` | Buka Drizzle Studio (GUI) |

## Build Production

```bash
npm run build
npm run preview
```

## Struktur Project

```
├── app/
│   ├── composables/     # useAuthClient, useTransaction
│   ├── layouts/         # default layout
│   ├── middleware/      # auth guard
│   ├── pages/           # index, login, signup, dashboard, transactions, categories
│   └── types/           # TypeScript types
├── lib/
│   ├── auth.ts          # Better Auth server config
│   └── auth-client.ts   # Better Auth client config
├── server/
│   ├── api/
│   │   ├── auth/        # Better Auth handler
│   │   ├── categories/  # CRUD kategori
│   │   ├── dashboard/   # summary endpoint
│   │   └── transactions/ # CRUD transaksi
│   ├── database/
│   │   └── schema.ts    # Drizzle schema
│   ├── middleware/       # auth middleware server-side
│   └── utils/           # db instance, wallet utils
└── drizzle.config.ts
```
