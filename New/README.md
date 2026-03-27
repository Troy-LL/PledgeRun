# PledgeRun 🚀

> Trustless crowdfunding on Stellar — the contract holds the money, not a company.

---

## Problem

Crowdfunding platforms like Kickstarter and GoFundMe take cuts, can freeze funds, and require users to trust a centralized company. Backers have no guarantee their money is safe if the goal isn't met.

## Solution

PledgeRun uses a Soroban smart contract on Stellar to hold pledge funds in escrow. If the goal is met before the deadline, funds are released to the creator. If not, every backer is automatically refunded — no middleman, no fees, no trust required.

---

## Stellar Features Used

- ✅ XLM transfers (pledges and refunds)
- ✅ Soroban smart contract (escrow + release/refund logic)

---

## Project Structure

```
pledgerun/
├── contract/
│   ├── src/
│   │   ├── lib.rs       ← smart contract logic
│   │   └── test.rs      ← 3 unit tests
│   └── Cargo.toml
├── client/
│   └── index.html       ← full-stack frontend
└── README.md
```

---

## Prerequisites

- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- WASM target: `rustup target add wasm32v1-none`
- Stellar CLI: `cargo install --locked stellar-cli --features opt`

---

## Build

```bash
cd contract
stellar contract build
```

---

## Test

```bash
cd contract
cargo test
```

Expected: **3 tests pass**.

---

## Deploy to Testnet

```bash
# Generate and fund a key (first time only)
stellar keys generate --global my-key --network testnet
stellar keys fund my-key --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/pledge_run.wasm \
  --source my-key \
  --network testnet
```

Copy the Contract ID (`C…`) from the output.

---

## Sample CLI Invocations

```bash
export CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Initialize campaign: goal = 100 XLM (1000000000 stroops), deadline = Unix timestamp
stellar contract invoke \
  --id $CONTRACT_ID --source my-key --network testnet \
  -- init \
  --creator GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --goal 1000000000 \
  --deadline 1800000000

# Pledge 10 XLM
stellar contract invoke \
  --id $CONTRACT_ID --source my-key --network testnet \
  -- pledge \
  --backer GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --amount 100000000

# Release funds (after deadline, if goal met)
stellar contract invoke \
  --id $CONTRACT_ID --source my-key --network testnet \
  -- release

# Refund all backers (after deadline, if goal NOT met)
stellar contract invoke \
  --id $CONTRACT_ID --source my-key --network testnet \
  -- refund
```

---

## Deployment

- **Contract ID:** `C...` *(paste after deploying)*
- **Transaction:** `https://stellar.expert/explorer/testnet/tx/...` *(paste after invoking)*

---

## License

MIT
