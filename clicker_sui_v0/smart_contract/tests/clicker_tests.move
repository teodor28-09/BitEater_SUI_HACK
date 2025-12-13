
#[test_only]
module clicker::clicker_tests {

    use sui::coin;
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui::bcs;
    use sui::test_scenario::{Self as test};
    use clicker::clicker;
    use std::vector;
    use bridge::bridge_env::scenario;


    const ENotImplemented: u64 = 0;
    const EEmptyVault: u64 = 1;

    const TEST_ADMIN_PUB_KEY: vector<u8> = x"f9d16542615067f64bc58bc5c6e055760ab67a8fae35cc4b652ce09f57278282";
    const TEST_ADMIN_PRIV_KEY: vector<u8> = "";
    const PUBLISHER: address = @0xBAAD;
    const USER: address = @0xCC;

    fun create_sui_coin(amount: u64, ctx: &mut TxContext): Coin<SUI> {
            coin::mint_for_testing<SUI>(amount, ctx)
        }
    
    fun build_claim_message(sender: address, amount_mist: u64): vector<u8> {
        let mut msg_bytes = bcs::to_bytes(&sender);
        let amount_bytes = bcs::to_bytes(&amount_mist);
        vector::append(&mut msg_bytes, amount_bytes);
        msg_bytes
    }

    // --- 1. TEST DEPOZIT ---
    #[test]
    fun test_deposit() {
        let mut scenario = test::begin(PUBLISHER);
        
        // Pasul 1: Inițializare bancă
        scenario.next_tx(PUBLISHER);
        clicker::init(scenario.ctx());
        
        // Pasul 2: Depozit de către proprietar de vault
        let deposit_amount = 1000000; // 1 SUI
        scenario.next_tx(PUBLISHER);
        {   
            let bank = test::shared_obj_mut<clicker::GameBank>(scenario.ctx());
            let coin_to_deposit = create_sui_coin(deposit_amount, scenario.ctx());
            
            clicker::deposit(bank, coin_to_deposit, scenario.ctx());
            // test::update_shared_object(bank);
        };
        
        // Verificare: Vault-ul ar trebui să aibă suma depusă
        scenario.next_tx(PUBLISHER);
        {
            let bank = test::shared_obj<clicker::GameBank>(scenario.ctx());
            let vault_balance = clicker::balance::value(&bank.vault);
            assert!(vault_balance == deposit_amount, EEmptyVault);
        };

        scenario.next_tx(USER);
        {
            // Pasul 3: Utilizatorul încearcă să revendice o recompensă
            let bank = test::shared_obj_mut<clicker::GameBank>(scenario.ctx());
            let claim_amount = 500000; // 0.5 SUI
            let sender_addr = USER;
            let msg_bytes = build_claim_message(sender_addr, claim_amount);
            let signature = sui::ed25519::ed25519_sign(&msg_bytes, &TEST_ADMIN_PRIV_KEY);

            clicker::claim_reward(bank, claim_amount, signature, scenario.ctx());
        };


        test::end(scenario);
    }

    
    // #[test]
    // fun test_clicker() {
    //     // pass
    // }

    // #[test, expected_failure(abort_code = ::clicker::clicker_tests::ENotImplemented)]
    // fun test_clicker_fail() {
    //     abort ENotImplemented
    // }
}