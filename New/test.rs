#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger, Env};

    // Helper: deploy the contract and return (env, client, creator, backer)
    fn setup() -> (Env, PledgeRunClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PledgeRun);
        let client = PledgeRunClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let backer  = Address::generate(&env);

        // Set ledger timestamp to 1000 so deadline can be in the future.
        env.ledger().with_mut(|l| l.timestamp = 1_000);

        // goal = 100 XLM in stroops, deadline = timestamp 2000
        client.init(&creator, &1_000_000_000_i128, &2_000_u64);

        (env, client, creator, backer)
    }

    // -----------------------------------------------------------------------
    // Test 1 — Happy path: pledge succeeds and release returns total funds
    // -----------------------------------------------------------------------
    #[test]
    fn test_happy_path_pledge_and_release() {
        let (env, client, _creator, backer) = setup();

        // Backer pledges exactly the goal amount.
        client.pledge(&backer, &1_000_000_000_i128);

        // Move time past the deadline.
        env.ledger().with_mut(|l| l.timestamp = 3_000);

        // Release should succeed and return the total pledged.
        let released = client.release();
        assert_eq!(released, 1_000_000_000_i128, "released amount should equal total pledged");

        // Campaign should now be finalized.
        let campaign = client.get_campaign();
        assert!(campaign.finalized, "campaign should be marked finalized");
    }

    // -----------------------------------------------------------------------
    // Test 2 — Edge case: pledging after the deadline should panic
    // -----------------------------------------------------------------------
    #[test]
    #[should_panic(expected = "campaign deadline has passed")]
    fn test_pledge_after_deadline_rejected() {
        let (env, client, _creator, backer) = setup();

        // Move time past the deadline before pledging.
        env.ledger().with_mut(|l| l.timestamp = 3_000);

        // This should panic because the deadline has passed.
        client.pledge(&backer, &500_000_000_i128);
    }

    // -----------------------------------------------------------------------
    // Test 3 — State verification: pledge amounts are stored correctly
    // -----------------------------------------------------------------------
    #[test]
    fn test_state_after_pledge() {
        let (_env, client, _creator, backer) = setup();

        let pledge_amount = 250_000_000_i128; // 25 XLM
        client.pledge(&backer, &pledge_amount);

        // The backer's individual pledge should match.
        let stored = client.get_pledge(&backer);
        assert_eq!(stored, pledge_amount, "stored pledge should match amount sent");

        // The campaign total should also reflect the pledge.
        let campaign = client.get_campaign();
        assert_eq!(campaign.total, pledge_amount, "campaign total should equal pledge amount");
        assert!(!campaign.finalized, "campaign should not be finalized yet");
    }
}
