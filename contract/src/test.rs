//! Exactly three unit tests for PledgeRun (happy path, one failure case, state verification).
//! Uses `soroban_sdk::testutils` and [`Env::default()`] for a fresh ledger per scenario.

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};

/// Shared setup: deploy contract, two accounts, ledger time = 1000, campaign goal 100 XLM, deadline @ 2000.
fn setup() -> (Env, PledgeRunClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PledgeRun, ());
    let client = PledgeRunClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);

    // MVP: creator opens campaign — 100 XLM goal, deadline unix 2000 (after "now" 1000).
    client.init(&creator, &1_000_000_000_i128, &2_000_u64);

    (env, client, creator, backer)
}

// ---------------------------------------------------------------------------
// Test 1 — Happy path: MVP flow end-to-end (init → pledge → past deadline → release succeeds)
// ---------------------------------------------------------------------------

#[test]
fn test_happy_path_pledge_and_release() {
    let (env, client, _creator, backer) = setup();

    // Backer pledges the full goal (100 XLM in stroops).
    client.pledge(&backer, &1_000_000_000_i128);

    env.ledger().with_mut(|l| l.timestamp = 3_000);

    let released = client.release();
    assert_eq!(released, 1_000_000_000_i128);

    let campaign = client.get_campaign();
    assert!(campaign.finalized);
}

// ---------------------------------------------------------------------------
// Test 2 — Edge case: duplicate `init` (second initialization must fail)
// ---------------------------------------------------------------------------

#[test]
#[should_panic(expected = "campaign already exists")]
fn test_duplicate_init_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PledgeRun, ());
    let client = PledgeRunClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);

    client.init(&creator, &500_000_000_i128, &2_000_u64);
    // Second init — must panic (storage already has CAMPAIGN).
    client.init(&creator, &500_000_000_i128, &3_000_u64);
}

// ---------------------------------------------------------------------------
// Test 3 — State verification: storage matches after MVP `pledge` transaction
// ---------------------------------------------------------------------------

#[test]
fn test_state_after_pledge() {
    let (_env, client, _creator, backer) = setup();

    let pledge_amount = 250_000_000_i128;
    client.pledge(&backer, &pledge_amount);

    assert_eq!(client.get_pledge(&backer), pledge_amount);

    let campaign = client.get_campaign();
    assert_eq!(campaign.total, pledge_amount);
    assert!(!campaign.finalized);
    assert_eq!(campaign.goal, 1_000_000_000_i128);
}
