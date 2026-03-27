# PledgeRun

Trustless crowdfunding on **Stellar** — escrow logic in a **Soroban** contract, optional **web UI** in `frontend/`.

Submitted for the **Stellar Philippines UniTour — University of East Caloocan** bootcamp via [Rise In](https://www.risein.com/programs/stellar-philippines-unitour-university-of-east-caloocan).

**Student:** Troy Lauren T. Lazaro · BSIT 2nd Year (BSIT2-1N) · Telegram: [@Itsniched](https://t.me/Itsniched)

---

## Problem & solution

**Problem:** Centralized crowdfunding platforms charge high fees, can freeze funds, and rarely give strong guarantees when campaigns fail.

**Solution:** **PledgeRun** uses a Soroban smart contract to enforce campaign rules on-chain: pledges accrue toward a goal and deadline; after the deadline, the contract supports **release** (goal met) or **refund** (goal not met) — no platform sitting in the middle.

Full one-pager: [PROJECT_BRIEF.md](./PROJECT_BRIEF.md).

---

## Repo layout

```
├── contract/
│   ├── src/lib.rs      ← PledgeRun Soroban contract
│   ├── src/test.rs     ← 3 unit tests
│   └── Cargo.toml
├── web/                ← React + Vite + Tailwind + shadcn/ui (main UI)
├── frontend/           ← legacy single-file HTML (see legacy-index.html)
└── PROJECT_BRIEF.md
```

---

## Contract API (MVP)

| Function | Role |
|----------|------|
| `init` | One-time campaign: creator, goal (stroops), deadline (unix time) |
| `pledge` | Backer pledges an amount (tracked on-chain) |
| `release` | After deadline if goal met — finalize |
| `refund` | After deadline if goal not met — finalize |
| `get_campaign` | Read campaign state |
| `get_pledge` | Read a backer’s pledged amount |

---

## Prerequisites

- Rust ([rustup](https://rustup.rs/))
- `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli): `cargo install --locked stellar-cli`
- [Freighter](https://www.freighter.app/) (for the frontend, testnet)

---

## Test

```bash
cd contract
cargo test
```

Expect **3** tests passing.

---

## Build (WASM)

```bash
cd contract
stellar contract build
```

Output: `contract/target/wasm32v1-none/release/pledge_run.wasm`

---

## Deploy (testnet)

```bash
stellar keys generate student --network testnet
stellar keys fund student --network testnet

cd contract
stellar contract deploy \
  --wasm target/wasm32v1-none/release/pledge_run.wasm \
  --source-account student \
  --network testnet
```

Copy the **Contract ID** (`C…`), then set `CONTRACT_ID` in `frontend/index.html` (replace `YOUR_CONTRACT_ID_HERE`).

---

## Frontend (React + shadcn/ui)

From the **repo root**:

```bash
cd web && npm install
npm run dev
```

Or from root (after `cd web && npm install` once): `npm run dev` — Vite serves at **http://127.0.0.1:5173** with HMR.

1. Copy `web/.env.example` to `web/.env` and set `VITE_CONTRACT_ID` to your deployed contract.
2. Use **Freighter** on **Testnet**.

**Production build:** `npm run build:web` → static files in `web/dist/`.

**Legacy:** `frontend/legacy-index.html` (plain HTML + ESM) — run `npm run dev:legacy` from root if needed.

**Design tooling:** For systematic UI/UX guidance you can use [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (`uipro init --ai cursor` installs skills for Cursor).

**CSP / embedded browser:** Fonts are bundled via `@fontsource` (no Google Fonts CDN). If you still see `Content-Security-Policy: default-src 'none'` errors, the **Cursor Simple Browser** (or similar) is blocking network requests — open **http://127.0.0.1:5173** in Chrome or Edge instead. The DevTools `.well-known/...` message is harmless.

---

## Links

- [Stellar Docs](https://developers.stellar.org)
- [Soroban SDK](https://docs.rs/soroban-sdk)
- [Stellar Expert (testnet)](https://stellar.expert/explorer/testnet)

---

## License

MIT
