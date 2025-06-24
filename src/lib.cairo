use starknet::ContractAddress;

/// Interface representing the TokenLock contract.
/// This interface allows users to lock ERC20 tokens for specific durations,
/// manage multiple locks, and unlock tokens after the lock period expires.
#[starknet::interface]
pub trait ITokenLock<TContractState> {
    /// Lock tokens for a specific beneficiary with an unlock time
    fn lock_tokens(
        ref self: TContractState,
        token: ContractAddress,
        beneficiary: ContractAddress,
        amount: u256,
        unlock_time: u64
    ) -> u256;
    
    /// Unlock and withdraw available tokens for the caller
    fn unlock_tokens(ref self: TContractState, lock_id: u256) -> bool;
    
    /// Get lock information by lock ID
    fn get_lock_info(self: @TContractState, lock_id: u256) -> (ContractAddress, ContractAddress, u256, u64, bool);
    
    /// Get all lock IDs for a specific beneficiary
    fn get_user_locks(self: @TContractState, beneficiary: ContractAddress) -> Array<u256>;
    
    /// Get total locked amount for a token
    fn get_total_locked(self: @TContractState, token: ContractAddress) -> u256;
    
    /// Check if tokens are unlockable for a specific lock
    fn is_unlockable(self: @TContractState, lock_id: u256) -> bool;
    
    /// Emergency withdraw function (only owner)
    fn emergency_withdraw(ref self: TContractState, token: ContractAddress, amount: u256);
    
    /// Transfer ownership (only current owner)
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
    
    /// Get contract owner
    fn get_owner(self: @TContractState) -> ContractAddress;
    
    /// Get next lock ID
    fn get_next_lock_id(self: @TContractState) -> u256;
}

/// ERC20 interface for token interactions
#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
}

/// Token Lock Contract implementation
#[starknet::contract]
pub mod TokenLock {
    use starknet::ContractAddress;
    use starknet::storage::*;
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp};
    use core::num::traits::Zero;
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    /// Struct representing a token lock
    #[derive(Drop, Copy, Serde, starknet::Store)]
    pub struct Lock {
        pub token: ContractAddress,
        pub beneficiary: ContractAddress,
        pub amount: u256,
        pub unlock_time: u64,
        pub is_unlocked: bool,
    }

    #[storage]
    pub struct Storage {
        owner: ContractAddress,
        next_lock_id: u256,
        locks: Map<u256, Lock>,
        user_locks: Map<ContractAddress, Vec<u256>>,
        total_locked: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TokensLocked: TokensLocked,
        TokensUnlocked: TokensUnlocked,
        EmergencyWithdraw: EmergencyWithdraw,
        OwnershipTransferred: OwnershipTransferred,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensLocked {
        pub lock_id: u256,
        pub token: ContractAddress,
        pub beneficiary: ContractAddress,
        pub amount: u256,
        pub unlock_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensUnlocked {
        pub lock_id: u256,
        pub token: ContractAddress,
        pub beneficiary: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyWithdraw {
        pub token: ContractAddress,
        pub amount: u256,
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipTransferred {
        pub previous_owner: ContractAddress,
        pub new_owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.next_lock_id.write(1);
    }

    #[abi(embed_v0)]
    pub impl TokenLockImpl of super::ITokenLock<ContractState> {
        /// Lock tokens for a specific beneficiary with an unlock time
        fn lock_tokens(
            ref self: ContractState,
            token: ContractAddress,
            beneficiary: ContractAddress,
            amount: u256,
            unlock_time: u64
        ) -> u256 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let contract_address = get_contract_address();
            
            // Validate inputs
            assert(amount > 0, 'Amount must be greater than 0');
            assert(unlock_time > current_time, 'Unlock time must be in future');
            assert(!beneficiary.is_zero(), 'Invalid beneficiary address');
            assert(!token.is_zero(), 'Invalid token address');
            
            // Transfer tokens from caller to contract
            let token_contract = IERC20Dispatcher { contract_address: token };
            let success = token_contract.transfer_from(caller, contract_address, amount);
            assert(success, 'Token transfer failed');
            
            // Create lock
            let lock_id = self.next_lock_id.read();
            let new_lock = Lock {
                token,
                beneficiary,
                amount,
                unlock_time,
                is_unlocked: false,
            };
            
            // Store lock information
            self.locks.write(lock_id, new_lock);
            self.user_locks.entry(beneficiary).push(lock_id);
            
            // Update total locked amount for the token
            let current_total = self.total_locked.read(token);
            self.total_locked.write(token, current_total + amount);
            
            // Update next lock ID
            self.next_lock_id.write(lock_id + 1);
            
            // Emit event
            self.emit(Event::TokensLocked(TokensLocked {
                lock_id,
                token,
                beneficiary,
                amount,
                unlock_time,
            }));
            
            lock_id
        }
        
        /// Unlock and withdraw available tokens for the caller
        fn unlock_tokens(ref self: ContractState, lock_id: u256) -> bool {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            // Get lock information
            let mut lock = self.locks.read(lock_id);
            
            // Validate lock exists and caller is beneficiary
            assert(!lock.beneficiary.is_zero(), 'Lock does not exist');
            assert(lock.beneficiary == caller, 'Not authorized');
            assert(!lock.is_unlocked, 'Tokens already unlocked');
            assert(current_time >= lock.unlock_time, 'Tokens not yet unlockable');
            
            // Transfer tokens to beneficiary
            let token_contract = IERC20Dispatcher { contract_address: lock.token };
            let success = token_contract.transfer(lock.beneficiary, lock.amount);
            assert(success, 'Token transfer failed');
            
            // Mark as unlocked
            lock.is_unlocked = true;
            self.locks.write(lock_id, lock);
            
            // Update total locked amount
            let current_total = self.total_locked.read(lock.token);
            self.total_locked.write(lock.token, current_total - lock.amount);
            
            // Emit event
            self.emit(Event::TokensUnlocked(TokensUnlocked {
                lock_id,
                token: lock.token,
                beneficiary: lock.beneficiary,
                amount: lock.amount,
            }));
            
            true
        }
        
        /// Get lock information by lock ID
        fn get_lock_info(self: @ContractState, lock_id: u256) -> (ContractAddress, ContractAddress, u256, u64, bool) {
            let lock = self.locks.read(lock_id);
            (lock.token, lock.beneficiary, lock.amount, lock.unlock_time, lock.is_unlocked)
        }
        
        /// Get all lock IDs for a specific beneficiary
        fn get_user_locks(self: @ContractState, beneficiary: ContractAddress) -> Array<u256> {
            let mut lock_ids = array![];
            let user_locks_vec = self.user_locks.entry(beneficiary);
            
            for i in 0..user_locks_vec.len() {
                lock_ids.append(user_locks_vec.at(i).read());
            };
            
            lock_ids
        }
        
        /// Get total locked amount for a token
        fn get_total_locked(self: @ContractState, token: ContractAddress) -> u256 {
            self.total_locked.read(token)
        }
        
        /// Check if tokens are unlockable for a specific lock
        fn is_unlockable(self: @ContractState, lock_id: u256) -> bool {
            let lock = self.locks.read(lock_id);
            let current_time = get_block_timestamp();
            
            !lock.beneficiary.is_zero() 
            && !lock.is_unlocked 
            && current_time >= lock.unlock_time
        }
        
        /// Emergency withdraw function (only owner)
        fn emergency_withdraw(ref self: ContractState, token: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            
            assert(caller == owner, 'Only owner can withdraw');
            assert(amount > 0, 'Amount must be greater than 0');
            
            let token_contract = IERC20Dispatcher { contract_address: token };
            let success = token_contract.transfer(owner, amount);
            assert(success, 'Token transfer failed');
            
            self.emit(Event::EmergencyWithdraw(EmergencyWithdraw {
                token,
                amount,
                owner,
            }));
        }
        
        /// Transfer ownership (only current owner)
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            let caller = get_caller_address();
            let current_owner = self.owner.read();
            
            assert(caller == current_owner, 'Only owner can transfer');
            assert(!new_owner.is_zero(), 'Invalid new owner address');
            
            self.owner.write(new_owner);
            
            self.emit(Event::OwnershipTransferred(OwnershipTransferred {
                previous_owner: current_owner,
                new_owner,
            }));
        }
        
        /// Get contract owner
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
        
        /// Get next lock ID
        fn get_next_lock_id(self: @ContractState) -> u256 {
            self.next_lock_id.read()
        }
    }
}
