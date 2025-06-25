# TokenLock Contract Deployment

This repository contains a TokenLock smart contract written in Cairo for Starknet, along with comprehensive deployment and interaction scripts using starknet.js, plus a modern Next.js frontend interface.

## 📋 Overview

The TokenLock contract allows users to lock ERC20 tokens for specific durations, manage multiple locks, and unlock tokens after the lock period expires. It includes features like:

- **Token Locking**: Lock ERC20 tokens with customizable unlock times
- **Multi-lock Support**: Multiple locks per user and token
- **Owner Controls**: Emergency withdrawal and ownership transfer
- **Event Tracking**: Comprehensive event emissions for all operations
- **Modern Frontend**: Professional Next.js web interface with wallet integration

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

## 🌐 Frontend Application

### 🎨 Frontend Features

The TokenLock frontend provides a beautiful, modern interface with:

- **Professional Dark Theme**: Sleek gradient design with glass morphism effects
- **Universal Wallet Support**: Connect with any Starknet wallet (ArgentX, Braavos, etc.)
- **Token Locking Interface**: Easy-to-use forms with preset duration buttons
- **Lock Management**: View and manage all your token locks
- **Real-time Data**: Live updates from the deployed contract
- **Responsive Design**: Works perfectly on desktop and mobile
- **Batch Transactions**: Approve and lock tokens in a single transaction

### 🏃‍♂️ Quick Frontend Setup

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Configure your contract address:**
```bash
# Edit frontend/lib/contract.ts
```

4. **Update the contract configuration:**
```typescript
// In frontend/lib/contract.ts, replace with YOUR deployed contract address:
export const TOKENLOCK_CONTRACT_ADDRESS = "0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec"
```

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser to:**
```
http://localhost:3000
```

### 📝 Frontend Configuration

#### Contract Address Setup

**⚠️ IMPORTANT: Replace the Contract Address**

After deploying your TokenLock contract, you **MUST** update the frontend configuration:

1. **Open:** `frontend/lib/contract.ts`
2. **Find:** Line 6 with `TOKENLOCK_CONTRACT_ADDRESS`
3. **Replace:** With your deployed contract address from the deployment output

```typescript
// frontend/lib/contract.ts
export const TOKENLOCK_CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"
```

#### Supported Networks

The frontend is configured for **Starknet Sepolia** by default. To change networks:

1. **Edit:** `frontend/lib/contract.ts`
2. **Update:** The RPC endpoint and chain configuration

```typescript
// For Mainnet:
const provider = new RpcProvider({
  nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7"
})
```

#### Token Addresses

The frontend includes preset token addresses for common tokens:

```typescript
// STRK Token (Starknet's native token)
"0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"

// ETH Token
"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

// USDC Token  
"0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
```

### 🎯 How to Use the Frontend

#### 1. **Connect Your Wallet**
- Click "Connect Wallet" in the top right
- Choose your preferred Starknet wallet
- Approve the connection request

#### 2. **Lock Tokens**
- Go to the "Lock Tokens" tab
- Select a token from the dropdown (STRK, ETH, USDC)
- Enter the amount you want to lock
- Choose a duration (preset buttons or custom date)
- Set the beneficiary address (or use "Use My Address")
- Click "Lock Tokens"
- Approve the transaction in your wallet

#### 3. **View Your Locks**
- Switch to the "View Locks" tab
- See all your active and expired locks
- View lock details, amounts, and unlock times
- Unlock tokens when they become available

### 🔧 Frontend Development

#### File Structure
```
frontend/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and themes
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page with tabs
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── LockTokens.tsx     # Token locking form
│   ├── ViewLocks.tsx      # Lock management interface
│   ├── WalletConnection.tsx # Wallet integration
│   └── providers/
│       └── StarknetProvider.tsx # Starknet context
├── lib/                   # Utilities and configuration
│   ├── contract.ts        # Contract configuration and ABIs
│   └── utils.ts           # Helper functions
├── package.json           # Dependencies and scripts
└── README.md             # Frontend-specific documentation
```

#### Key Dependencies
- **Next.js 14**: React framework with App Router
- **Starknet.js v6.16.0**: Starknet blockchain interaction
- **StarknetKit**: Universal wallet connection
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type safety and better development experience

#### Available Scripts
```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# TypeScript type checking
npm run type-check

# Linting
npm run lint
```

### 🌐 Deployment Options

#### Vercel (Recommended)
1. **Push to GitHub**
2. **Connect to Vercel**
3. **Auto-deploy on push**

#### Manual Build
```bash
cd frontend
npm run build
npm run start
```

#### Docker
```bash
# Build image
docker build -t tokenlock-frontend .

# Run container
docker run -p 3000:3000 tokenlock-frontend
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

## 📁 Project Structure

```
├── deploy.js              # Main deployment script (declare + deploy)
├── scripts/
│   ├── config.js          # Configuration management
│   ├── declare.js         # Contract declaration only
│   ├── deploy-only.js     # Deployment with existing class hash
│   └── interact.js        # Contract interaction utilities
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Contract configuration and utilities
│   └── package.json      # Frontend dependencies
├── src/                   # Cairo smart contract source
│   └── lib.cairo         # TokenLock contract implementation
├── tests/                 # Cairo contract tests
├── package.json           # Backend dependencies and scripts
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

## 🙏 Credits

Kudos to the **Kasar Labs team** 💪 for building the **Cairo AI Coder** - an incredible tool that made developing this Cairo smart contract and the whole dapp much easy ! 

---

Built with ❤️ for the Starknet ecosystem by Akash
