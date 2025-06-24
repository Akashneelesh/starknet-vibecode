// TokenLock Contract Configuration
export const TOKENLOCK_CONTRACT_ADDRESS = "0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec";

// Simplified ABI for the TokenLock contract - extracted from the interface
export const TOKENLOCK_ABI = [
  {
    type: "interface",
    name: "ITokenLock",
    items: [
      {
        type: "function",
        name: "lock_tokens",
        inputs: [
          { name: "token", type: "core::starknet::contract_address::ContractAddress" },
          { name: "beneficiary", type: "core::starknet::contract_address::ContractAddress" },
          { name: "amount", type: "core::integer::u256" },
          { name: "unlock_time", type: "core::integer::u64" }
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "unlock_tokens",
        inputs: [{ name: "lock_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "get_lock_info",
        inputs: [{ name: "lock_id", type: "core::integer::u256" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
          { type: "core::starknet::contract_address::ContractAddress" },
          { type: "core::integer::u256" },
          { type: "core::integer::u64" },
          { type: "core::bool" }
        ],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_user_locks",
        inputs: [{ name: "beneficiary", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::array::Array::<core::integer::u256>" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_total_locked",
        inputs: [{ name: "token", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "is_unlockable",
        inputs: [{ name: "lock_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "emergency_withdraw",
        inputs: [
          { name: "token", type: "core::starknet::contract_address::ContractAddress" },
          { name: "amount", type: "core::integer::u256" }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "transfer_ownership",
        inputs: [{ name: "new_owner", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "get_owner",
        inputs: [],
        outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_next_lock_id",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }]
  },
  {
    type: "event",
    name: "TokensLocked",
    keys: [],
    data: [
      { name: "lock_id", type: "core::integer::u256" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "beneficiary", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
      { name: "unlock_time", type: "core::integer::u64" }
    ]
  },
  {
    type: "event",
    name: "TokensUnlocked",
    keys: [],
    data: [
      { name: "lock_id", type: "core::integer::u256" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "beneficiary", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" }
    ]
  }
] as const;

// Common token addresses on Sepolia for testing
export const COMMON_TOKENS = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  USDC: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
};

export type LockInfo = {
  token: string;
  beneficiary: string;
  amount: bigint;
  unlockTime: bigint;
  isUnlocked: boolean;
}; 