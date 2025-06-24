import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string | undefined): string {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: bigint | undefined, decimals: number = 18): string {
  if (!amount) return "0";
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.replace(/0+$/, '');
  
  if (trimmed === '') {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmed}`;
}

export function parseAmount(amount: string, decimals: number = 18): bigint {
  if (!amount || amount === '0') return 0n;
  
  const [wholePart = '0', fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  
  return BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(paddedFractional || '0');
}

export function formatTimeLeft(unlockTime: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const unlockTimestamp = Number(unlockTime);
  
  if (unlockTimestamp <= now) {
    return "Unlockable now";
  }
  
  const secondsLeft = unlockTimestamp - now;
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatDateTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

export function getTokenSymbol(tokenAddress: string): string {
  const tokens: Record<string, string> = {
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7": "ETH",
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d": "STRK",
    "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8": "USDC"
  };
  
  return tokens[tokenAddress] || formatAddress(tokenAddress);
}

// ERC20 utility functions - simplified ABI with only approve function
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' }
    ],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'external'
  }
] as const

export function uint256ToBigInt(uint256: { low: bigint | string | number, high: bigint | string | number }): bigint {
  const low = BigInt(uint256.low || 0)
  const high = BigInt(uint256.high || 0)
  const result = low + (high << 128n)
  
  console.log('uint256ToBigInt conversion:', {
    input: uint256,
    low: low.toString(),
    high: high.toString(),
    result: result.toString()
  })
  
  return result
}

export function bigIntToUint256(value: bigint): { low: bigint, high: bigint } {
  return {
    low: value & ((1n << 128n) - 1n),
    high: value >> 128n
  }
} 