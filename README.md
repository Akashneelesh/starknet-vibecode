# TokenLock Contract Deployment

This repository contains a TokenLock smart contract written in Cairo for Starknet, along with comprehensive deployment and interaction scripts using starknet.js.

## 📋 Overview

The TokenLock contract allows users to lock ERC20 tokens for specific durations, manage multiple locks, and unlock tokens after the lock period expires. It includes features like:

- **Token Locking**: Lock ERC20 tokens with customizable unlock times
- **Multi-lock Support**: Multiple locks per user and token
- **Owner Controls**: Emergency withdrawal and ownership transfer
- **Event Tracking**: Comprehensive event emissions for all operations

## 🛠 Prerequisites

- Node.js (v18+ recommended)
- Scarb (Cairo package manager)
- Starknet account with funds for deployment
- Basic understanding of Starknet and Cairo

## 📦 Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Compile the Cairo contract:
```bash
scarb build
```

3. Create your environment configuration:
```bash
cp env.example .env
```

4. Configure your `.env` file with your credentials:
```env
# Network Configuration
STARKNET_NETWORK=sepolia

# RPC URLs  
SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
DEVNET_RPC_URL=http://localhost:5050/rpc

# Account Configuration
ACCOUNT_ADDRESS=0x123...
PRIVATE_KEY=0x456...

# Contract Configuration
OWNER_ADDRESS=0x789...
SALT=0x0
```

## 🚀 Deployment

### Option 1: Full Deployment (Declare + Deploy)
```bash
npm run deploy
```

This command will:
1. Declare the contract on the network
2. Deploy an instance of the contract
3. Verify the deployment
4. Display a comprehensive summary

### Option 2: Step-by-Step Deployment

#### 1. Declare Only
```bash
npm run declare
```

#### 2. Deploy with Existing Class Hash
```bash
# Add CLASS_HASH to your .env file, then:
npm run deploy-only

# Or provide it inline:
CLASS_HASH=0x123... npm run deploy-only
```

## 🔗 Contract Interaction

After deployment, you can interact with your contract:

```bash
node scripts/interact.js <CONTRACT_ADDRESS>
```

### Available Interactions

The interaction script provides methods for:

- **`getContractInfo()`** - Get basic contract information
- **`getLockInfo(lockId)`** - Get details about a specific lock
- **`getUserLocks(userAddress)`** - Get all locks for a user
- **`getTotalLocked(tokenAddress)`** - Get total locked amount for a token
- **`isUnlockable(lockId)`** - Check if a lock can be unlocked
- **`lockTokens(token, beneficiary, amount, unlockTime)`** - Create a new lock
- **`unlockTokens(lockId)`** - Unlock tokens from a lock
- **`transferOwnership(newOwner)`** - Transfer contract ownership

### Example Usage

```javascript
// Get contract information
await interactor.getContractInfo();

// Check lock details
await interactor.getLockInfo(1);

// Lock tokens (example)
await interactor.lockTokens(
    "0x123...", // token address
    "0x456...", // beneficiary
    "1000000000000000000", // amount (1 token with 18 decimals)
    Math.floor(Date.now() / 1000) + 86400 // unlock in 24 hours
);
```

## 📁 Script Structure

```
├── deploy.js              # Main deployment script (declare + deploy)
├── scripts/
│   ├── config.js          # Configuration management
│   ├── declare.js         # Contract declaration only
│   ├── deploy-only.js     # Deployment with existing class hash
│   └── interact.js        # Contract interaction utilities
├── package.json           # Dependencies and scripts
└── env.example           # Environment variables template
```

## 🌐 Network Support

The deployment scripts support multiple networks:

- **Sepolia Testnet** (default)
- **Mainnet** 
- **Local Devnet**

Switch networks by changing `STARKNET_NETWORK` in your `.env` file.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STARKNET_NETWORK` | Target network (sepolia/mainnet/devnet) | Yes |
| `ACCOUNT_ADDRESS` | Your Starknet account address | Yes |
| `PRIVATE_KEY` | Your account private key | Yes |
| `OWNER_ADDRESS` | Initial contract owner address | Yes |
| `CLASS_HASH` | Pre-declared class hash (optional) | No |
| `SALT` | Deployment salt for deterministic addresses | No |

### Network RPC URLs

Default RPC URLs are provided, but you can customize them:

```env
SEPOLIA_RPC_URL=https://your-custom-rpc.com
MAINNET_RPC_URL=https://your-mainnet-rpc.com
DEVNET_RPC_URL=http://localhost:5050/rpc
```

## 📊 Deployment Output

After successful deployment, you'll see:

```
============================================================
📊 DEPLOYMENT SUMMARY
============================================================
🌐 Network: sepolia
📋 Class Hash: 0x123...
📍 Contract Address: 0x456...
👑 Owner: 0x789...
🔗 Explorer: https://sepolia.voyager.online/contract/0x456...
============================================================
```

## 🛡 Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Owner Address**: Ensure the owner address is secure and accessible
3. **Network**: Double-check you're deploying to the correct network
4. **Gas Fees**: Ensure sufficient account balance for deployment

## 🧪 Testing

The repository includes comprehensive tests. Run them with:

```bash
scarb test
```

## 📝 Smart Contract Features

### Constructor Parameters
- `owner`: Address that will own the contract and have emergency powers

### Main Functions
- `lock_tokens()`: Lock ERC20 tokens with unlock time
- `unlock_tokens()`: Unlock tokens after lock period
- `get_lock_info()`: Retrieve lock details
- `get_user_locks()`: Get all locks for a user
- `emergency_withdraw()`: Owner-only emergency function

### Events
- `TokensLocked`: Emitted when tokens are locked
- `TokensUnlocked`: Emitted when tokens are unlocked
- `EmergencyWithdraw`: Emitted during emergency withdrawals
- `OwnershipTransferred`: Emitted when ownership changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **"Contract files not found"**
   ```bash
   scarb build
   ```

2. **"Missing required environment variables"**
   - Check your `.env` file configuration
   - Ensure all required variables are set

3. **"Class hash not found on network"**
   - Run `npm run declare` first
   - Or check if the class hash in your `.env` is correct

4. **"Insufficient account balance"**
   - Ensure your account has enough STRK for gas fees
   - For testnets, use a faucet to get test tokens

### Getting Help

- Check the [Starknet documentation](https://docs.starknet.io/)
- Review [starknet.js documentation](https://www.starknetjs.com/)
- Open an issue in this repository

---

Built with ❤️ for the Starknet ecosystem 