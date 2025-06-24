use starknet::ContractAddress;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address, start_cheat_block_timestamp, stop_cheat_block_timestamp};
use core::num::traits::Zero;

use testcairocoder::{ITokenLockDispatcher, ITokenLockDispatcherTrait};

// Mock ERC20 contract for testing
#[starknet::interface]
trait IMockERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
}

#[starknet::contract]
mod MockERC20 {
    use starknet::ContractAddress;
    use starknet::storage::*;
    use starknet::get_caller_address;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
    }

    #[abi(embed_v0)]
    impl MockERC20Impl of super::IMockERC20<ContractState> {
        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            let caller_balance = self.balances.read(caller);
            assert(caller_balance >= amount, 'Insufficient balance');
            
            self.balances.write(caller, caller_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.write(recipient, recipient_balance + amount);
            true
        }

        fn transfer_from(ref self: ContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            let allowance = self.allowances.read((sender, caller));
            let sender_balance = self.balances.read(sender);
            
            assert(allowance >= amount, 'Insufficient allowance');
            assert(sender_balance >= amount, 'Insufficient balance');
            
            self.allowances.write((sender, caller), allowance - amount);
            self.balances.write(sender, sender_balance - amount);
            let recipient_balance = self.balances.read(recipient);
            self.balances.write(recipient, recipient_balance + amount);
            true
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            self.allowances.write((caller, spender), amount);
            true
        }

        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            let current_balance = self.balances.read(to);
            self.balances.write(to, current_balance + amount);
        }
    }
}

// Helper functions
fn deploy_token_lock_contract(owner: ContractAddress) -> ContractAddress {
    let contract = declare("TokenLock").unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    contract_address
}

fn deploy_mock_erc20() -> ContractAddress {
    let contract = declare("MockERC20").unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@array![]).unwrap();
    contract_address
}

fn create_test_addresses() -> (ContractAddress, ContractAddress, ContractAddress, ContractAddress) {
    let owner = starknet::contract_address_const::<'owner'>();
    let user = starknet::contract_address_const::<'user'>();
    let beneficiary = starknet::contract_address_const::<'beneficiary'>();
    let other_user = starknet::contract_address_const::<'other_user'>();
    (owner, user, beneficiary, other_user)
}

// Basic functionality tests
#[test]
fn test_contract_deployment() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Test that contract is deployed and owner is set correctly  
    let contract_owner = dispatcher.get_owner();
    assert(contract_owner == owner, 'Owner should match');
    
    // Test that next lock ID starts at 1
    let next_lock_id = dispatcher.get_next_lock_id();
    assert(next_lock_id == 1, 'Next lock ID should be 1');
}

#[test]
fn test_ownership_transfer() {
    let (owner, _, _, _) = create_test_addresses();
    let new_owner = starknet::contract_address_const::<'new_owner'>();
    let contract_address = deploy_token_lock_contract(owner);
    
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Transfer ownership
    start_cheat_caller_address(contract_address, owner);
    dispatcher.transfer_ownership(new_owner);
    stop_cheat_caller_address(contract_address);
    
    // Verify new owner
    let current_owner = dispatcher.get_owner();
    assert(current_owner == new_owner, 'New owner should match');
}

#[test]
fn test_get_lock_info_empty() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Try to get info for non-existent lock
    let (token, beneficiary, amount, unlock_time, is_unlocked) = dispatcher.get_lock_info(1);
    
    // Should return default values for non-existent lock
    assert(token.is_zero(), 'Token should be zero');
    assert(beneficiary.is_zero(), 'Beneficiary should be zero');
    assert(amount == 0, 'Amount should be zero');
    assert(unlock_time == 0, 'Unlock time should be zero');
    assert(!is_unlocked, 'Should not be unlocked');
}

#[test]
fn test_get_user_locks_empty() {
    let (owner, _, beneficiary, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Get locks for user with no locks
    let user_locks = dispatcher.get_user_locks(beneficiary);
    assert(user_locks.len() == 0, 'Should have no locks');
}

#[test]
fn test_get_total_locked_zero() {
    let (owner, _, _, _) = create_test_addresses();
    let token_address = starknet::contract_address_const::<'token'>();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Get total locked for token with no locks
    let total_locked = dispatcher.get_total_locked(token_address);
    assert(total_locked == 0, 'Total locked should be zero');
}

#[test]
fn test_is_unlockable_non_existent() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Check if non-existent lock is unlockable
    let is_unlockable = dispatcher.is_unlockable(1);
    assert(!is_unlockable, 'Non-existent lock not unlock');
}

#[test]
fn test_multiple_ownership_transfers() {
    let (owner, _, _, _) = create_test_addresses();
    let new_owner1 = starknet::contract_address_const::<'new_owner1'>();
    let new_owner2 = starknet::contract_address_const::<'new_owner2'>();
    let contract_address = deploy_token_lock_contract(owner);
    
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // First transfer
    start_cheat_caller_address(contract_address, owner);
    dispatcher.transfer_ownership(new_owner1);
    stop_cheat_caller_address(contract_address);
    
    let current_owner = dispatcher.get_owner();
    assert(current_owner == new_owner1, 'First transfer failed');
    
    // Second transfer from new owner
    start_cheat_caller_address(contract_address, new_owner1);
    dispatcher.transfer_ownership(new_owner2);
    stop_cheat_caller_address(contract_address);
    
    let final_owner = dispatcher.get_owner();
    assert(final_owner == new_owner2, 'Second transfer failed');
}

#[test]
fn test_lock_id_incrementation() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Check initial next lock ID
    let initial_id = dispatcher.get_next_lock_id();
    assert(initial_id == 1, 'Initial ID should be 1');
    
    // After deployment, next lock ID should still be 1
    // (only increments after actual locks are created)
    let same_id = dispatcher.get_next_lock_id();
    assert(same_id == 1, 'ID should remain 1');
}

// Error case tests that should panic
#[test]
#[should_panic(expected: ('Only owner can transfer',))]
fn test_ownership_transfer_non_owner_fails() {
    let (owner, _, _, other_user) = create_test_addresses();
    let new_owner = starknet::contract_address_const::<'new_owner'>();
    let token_lock_address = deploy_token_lock_contract(owner);
    
    let token_lock = ITokenLockDispatcher { contract_address: token_lock_address };
    
    // Try to transfer ownership as non-owner (should fail)
    start_cheat_caller_address(token_lock_address, other_user);
    token_lock.transfer_ownership(new_owner);
    stop_cheat_caller_address(token_lock_address);
}

#[test]
#[should_panic(expected: ('Only owner can withdraw',))]
fn test_emergency_withdraw_non_owner_fails() {
    let (owner, _, _, other_user) = create_test_addresses();
    let token_lock_address = deploy_token_lock_contract(owner);
    let mock_token_address = starknet::contract_address_const::<'token'>();
    
    let token_lock = ITokenLockDispatcher { contract_address: token_lock_address };
    
    // Try emergency withdraw as non-owner (should fail)
    start_cheat_caller_address(token_lock_address, other_user);
    token_lock.emergency_withdraw(mock_token_address, 1000);
    stop_cheat_caller_address(token_lock_address);
}

#[test]
#[should_panic(expected: ('Amount must be greater than 0',))]
fn test_lock_zero_amount_fails() {
    let (owner, user, beneficiary, _) = create_test_addresses();
    let token_lock_address = deploy_token_lock_contract(owner);
    let mock_token_address = starknet::contract_address_const::<'token'>();
    
    let token_lock = ITokenLockDispatcher { contract_address: token_lock_address };
    
    let current_time = 1000_u64;
    let unlock_time = current_time + 3600;
    
    start_cheat_block_timestamp(token_lock_address, current_time);
    start_cheat_caller_address(token_lock_address, user);
    token_lock.lock_tokens(mock_token_address, beneficiary, 0, unlock_time);
    stop_cheat_caller_address(token_lock_address);
    stop_cheat_block_timestamp(token_lock_address);
}

#[test]
#[should_panic(expected: ('Unlock time must be in future',))]
fn test_lock_past_time_fails() {
    let (owner, user, beneficiary, _) = create_test_addresses();
    let token_lock_address = deploy_token_lock_contract(owner);
    let mock_token_address = starknet::contract_address_const::<'token'>();
    
    let token_lock = ITokenLockDispatcher { contract_address: token_lock_address };
    
    let current_time = 3700_u64;
    let past_time = current_time - 3600;
    
    start_cheat_block_timestamp(token_lock_address, current_time);
    start_cheat_caller_address(token_lock_address, user);
    token_lock.lock_tokens(mock_token_address, beneficiary, 1000, past_time);
    stop_cheat_caller_address(token_lock_address);
    stop_cheat_block_timestamp(token_lock_address);
}

#[test]
#[should_panic(expected: ('Lock does not exist',))]
fn test_unlock_non_existent_lock_fails() {
    let (owner, _, beneficiary, _) = create_test_addresses();
    let token_lock_address = deploy_token_lock_contract(owner);
    
    let token_lock = ITokenLockDispatcher { contract_address: token_lock_address };
    
    // Try to unlock non-existent lock
    start_cheat_caller_address(token_lock_address, beneficiary);
    token_lock.unlock_tokens(999);
    stop_cheat_caller_address(token_lock_address);
}

// Additional validation tests
#[test]
fn test_address_validation() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Verify owner is not zero address
    let contract_owner = dispatcher.get_owner();
    assert(!contract_owner.is_zero(), 'Owner should not be zero');
    
    // Verify contract address is not zero
    assert(!contract_address.is_zero(), 'Contract addr not zero');
}

#[test]
fn test_state_consistency() {
    let (owner, _, _, _) = create_test_addresses();
    let contract_address = deploy_token_lock_contract(owner);
    let dispatcher = ITokenLockDispatcher { contract_address };
    
    // Test multiple calls return consistent results
    let owner1 = dispatcher.get_owner();
    let owner2 = dispatcher.get_owner();
    assert(owner1 == owner2, 'Owner should be consistent');
    
    let id1 = dispatcher.get_next_lock_id();
    let id2 = dispatcher.get_next_lock_id();
    assert(id1 == id2, 'Next ID should be consistent');
}
