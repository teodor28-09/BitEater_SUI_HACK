module clicker::clicker {
    use sui::ed25519; 
    use sui::bcs;
    
    use sui::coin;
    use sui::coin::Coin; 
    use sui::balance::{Self, Balance}; 
    use sui::sui::SUI;

    const EInvalidSignature: u64 = 0;
    const EInsufficientFunds: u64 = 1;

    const ADMIN_PUBLIC_KEY: vector<u8> = x"f9d16542615067f64bc58bc5c6e055760ab67a8fae35cc4b652ce09f57278282";

    
    public struct GameBank has key {
        id: UID,
        vault: Balance<SUI>
    }

    // 1. INIT: Create the Bank automatically when you publish
    fun init(ctx: &mut TxContext) {
        let bank = GameBank {
            id: object::new(ctx),
            vault: balance::zero() // Start empty
        };
        sui::transfer::share_object(bank);
    }


    // ------------------------------------------------------------------------------------------
    // VAULT LOGIC 
    // ------------------------------------------------------------------------------------------

    public fun deposit(bank: &mut GameBank, input_coin: Coin<SUI>, _ctx: &mut TxContext) {
        let cash = coin::into_balance(input_coin);
        balance::join(&mut bank.vault, cash);
    }

    public fun claim_reward(
        bank: &mut GameBank,      
        amount_mist: u64,         // Amount in MIST (1 SUI = 1,000,000,000 MIST)
        signature: vector<u8>, 
        ctx: &mut TxContext
    ) {
        // A. CHECK BALANCE
        assert!(balance::value(&bank.vault) >= amount_mist, EInsufficientFunds);

        // B. VERIFY SIGNATURE
        let sender_addr = tx_context::sender(ctx);
        let mut msg_bytes = bcs::to_bytes(&sender_addr);
        let amount_bytes = bcs::to_bytes(&amount_mist);
        vector::append(&mut msg_bytes, amount_bytes);               

        let admin_key = ADMIN_PUBLIC_KEY;
        let is_valid = ed25519::ed25519_verify(&signature, &admin_key, &msg_bytes);
        assert!(is_valid, EInvalidSignature);

        // Take cash from the vault
        let reward_coin: Coin<SUI> = coin::take(&mut bank.vault, amount_mist, ctx);
        
        // Send it to the user
        sui::transfer::public_transfer(reward_coin, sender_addr);
    }
}

