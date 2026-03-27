# Achievement Registry — Soroban Smart Contract

A **Soroban** smart contract built on the **Stellar** blockchain that stores and verifies student achievements on-chain.

Submitted for the **Stellar Philippines UniTour — University of East Caloocan** bootcamp via [Rise In](https://www.risein.com/programs/stellar-philippines-unitour-university-of-east-caloocan).

**Student:** Troy Lauren T. Lazaro · BSIT 2nd Year (BSIT2-1N) · Telegram: [@Itsniched](https://t.me/Itsniched)

---

## 📋 What It Does

The `AchievementRegistry` contract lets anyone register student achievements (e.g., bootcamp completions) as immutable on-chain records. An administrator can then verify each record, providing a trustless proof of completion without relying on any centralised database.

| Function | Description |
|---|---|
| `initialize(admin)` | Set up the registry with a designated admin |
| `register(student_name, course_name)` | Record a new achievement; returns its unique `id` |
| `verify(caller, id)` | Admin-only: mark an achievement as verified |
| `get(id)` | Fetch the full achievement record |
| `is_verified(id)` | Check if an achievement has been verified |
| `count()` | Return the total number of registered achievements |

---

## 🏗 Project Structure

```
stellar-achievement-registry/
├── src/
│   ├── lib.rs      ← contract logic
│   └── test.rs     ← 5 unit tests
├── Cargo.toml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/)
- WASM target: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli): `cargo install --locked stellar-cli --features opt`

### Run Tests

```bash
cargo test
```

Expected output: **5 tests pass**.

### Build

```bash
stellar contract build
```

### Deploy to Testnet

```bash
# Generate & fund a key (first time only)
stellar keys generate --global my-key --network testnet
stellar keys fund my-key --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_achievement_registry.wasm \
  --source my-key \
  --network testnet
```

Copy the **Contract ID** (`C…`) from the output and verify it at:

```
https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>
```

### Invoke on Testnet

```bash
# Initialise
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- initialize \
  --admin "my-admin-name"

# Register an achievement
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- register \
  --student_name "Alice" \
  --course_name "Stellar Smart Contract Bootcamp"
```

---

## 🔗 Resources

- [Stellar Docs](https://developers.stellar.org)
- [Soroban SDK](https://docs.rs/soroban-sdk)
- [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)
