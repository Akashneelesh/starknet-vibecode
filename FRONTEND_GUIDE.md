# 🔐 TokenLock DApp - Complete Guide

A comprehensive token locking solution built on Starknet with a modern React frontend. This project includes smart contracts, deployment scripts, and a beautiful user interface for managing time-locked tokens.

## 🌟 Project Overview

**TokenLock** is a decentralized application that allows users to lock ERC20 tokens for specific durations with the following features:

- **Time-Based Unlocking**: Lock tokens until a specific timestamp
- **Multi-Lock Support**: Create multiple locks per user and token
- **Beneficiary System**: Specify who can unlock the tokens
- **Owner Management**: Emergency controls and ownership transfer
- **Event Tracking**: Comprehensive logging of all operations

## 📁 Project Structure

```
testcairocoder/
├── src/                     # Cairo smart contracts
│   └── lib.cairo           # TokenLock contract implementation
├── tests/                   # Contract tests
│   └── test_contract.cairo
├── scripts/                 # Deployment scripts
│   ├── config.js           # Configuration management
│   ├── declare.js          # Contract declaration
│   ├── deploy-only.js      # Deployment with existing class hash
│   ├── interact.js         # Contract interaction utilities
│   └── setup.js            # Environment validation
├── frontend/                # React frontend application
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utilities and configurations
│   └── README.md           # Frontend documentation
├── deploy.js               # Main deployment script
├── package.json            # Node.js deployment dependencies
├── env.example             # Environment variables template
├── setup-frontend.sh       # Frontend setup script
├── Scarb.toml              # Cairo project configuration
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Smart Contract Deployment

First, compile and deploy the smart contract:

```bash
# Compile the contract
scarb build

# Copy environment variables
cp env.example .env
# Edit .env with your account details

# Install deployment dependencies
npm install

# Deploy the contract (declare + deploy)
npm run deploy
```

### 2. Frontend Setup

Set up and run the frontend application:

```bash
# Run the automated setup script
./setup-frontend.sh

# Or manually:
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Smart Contract Features

### Core Functions

- **`lock_tokens(token, beneficiary, amount, unlock_time)`**
  - Lock tokens for a specific beneficiary until unlock_time
  - Returns a unique lock ID
  - Emits `TokensLocked` event

- **`unlock_tokens(lock_id)`**
  - Unlock tokens when the time has passed
  - Only callable by the beneficiary
  - Emits `TokensUnlocked` event

- **`get_lock_info(lock_id)`**
  - Get complete information about a lock
  - Returns token, beneficiary, amount, unlock_time, and status

- **`get_user_locks(beneficiary)`**
  - Get all lock IDs for a specific beneficiary
  - Useful for displaying user's locks in UI

### Owner Functions

- **`emergency_withdraw(token, amount)`** - Emergency token withdrawal
- **`transfer_ownership(new_owner)`** - Transfer contract ownership

### View Functions

- **`get_total_locked(token)`** - Total amount locked for a token
- **`is_unlockable(lock_id)`** - Check if a lock can be unlocked
- **`get_owner()`** - Get contract owner address
- **`get_next_lock_id()`** - Get the next lock ID

## 🎨 Frontend Features

### 📱 Modern User Interface

- **Responsive Design**: Works on desktop and mobile devices
- **Beautiful Animations**: Smooth transitions and hover effects
- **Glass-morphism**: Modern UI with backdrop blur effects
- **Gradient Accents**: Eye-catching color gradients

### 🔌 Wallet Integration

- **Multi-Wallet Support**: Braavos and Argent X
- **Auto-Detection**: Automatic wallet detection and connection
- **Connection Status**: Clear connection status indicators

### 🔒 Token Locking Interface

- **Intuitive Form**: Easy-to-use token locking form
- **Token Selection**: Pre-configured common tokens (ETH, STRK, USDC)
- **Custom Tokens**: Support for any ERC20 token address
- **Date/Time Picker**: Precise unlock time selection
- **Transaction Preview**: Summary before submitting

### 📊 Lock Management

- **Lock Dashboard**: View all your token locks
- **Status Indicators**: Clear visual status for each lock
- **Countdown Timers**: Time remaining until unlock
- **One-Click Unlock**: Easy unlocking when time has passed
- **Real-time Updates**: Automatic status updates

## 🛠 Development Setup

### Prerequisites

- **Scarb**: Cairo package manager
- **Node.js**: Version 18 or higher
- **Starknet Wallet**: Braavos or Argent X
- **Testnet Funds**: Sepolia ETH for transactions

### Environment Configuration

1. **Backend Environment** (`.env`):
```env
STARKNET_NETWORK=sepolia
SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
ACCOUNT_ADDRESS=0x...
PRIVATE_KEY=0x...
OWNER_ADDRESS=0x...
```

2. **Frontend Environment** (`frontend/.env.local`):
```env
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Available Scripts

#### Smart Contract Scripts
```bash
npm run deploy        # Full deployment (declare + deploy)
npm run declare       # Declare contract only
npm run deploy-only   # Deploy with existing class hash
npm run interact      # Interact with deployed contract
npm run setup         # Validate environment
```

#### Frontend Scripts
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
```

## 🌐 Deployment Information

### Current Deployment

**Contract Address**: `0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec`
**Network**: Starknet Sepolia Testnet
**Status**: ✅ Active

### Supported Tokens (Sepolia)

- **ETH**: `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7`
- **STRK**: `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`
- **USDC**: `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`

## 📝 Usage Examples

### Locking Tokens via Frontend

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Navigate to Lock Tokens**: Click the "Lock Tokens" tab
3. **Fill Form**:
   - Select token (ETH, STRK, USDC, or custom)
   - Enter beneficiary address (who can unlock)
   - Specify amount to lock
   - Set unlock date and time
4. **Review and Submit**: Check the summary and confirm transaction

### Viewing and Managing Locks

1. **Go to View Locks**: Click the "View Locks" tab
2. **Review Locks**: See all your locks with status indicators
3. **Unlock Ready Tokens**: Click "Unlock Tokens" for expired locks
4. **Refresh Data**: Use the refresh button to update lock statuses

### Programmatic Interaction

```javascript
import { Contract } from 'starknet'

// Initialize contract
const contract = new Contract(abi, contractAddress, provider)

// Lock tokens
const lockId = await contract.lock_tokens(
  tokenAddress,
  beneficiaryAddress,
  amount,
  unlockTimestamp
)

// Check if unlockable
const canUnlock = await contract.is_unlockable(lockId)

// Unlock tokens
if (canUnlock) {
  await contract.unlock_tokens(lockId)
}
```

## 🔐 Security Considerations

### Smart Contract Security

- **Time Validation**: Unlock time must be in the future
- **Ownership Controls**: Only owner can perform emergency actions
- **Reentrancy Protection**: Safe external calls
- **Integer Overflow**: Using Cairo's safe arithmetic

### Frontend Security

- **Input Validation**: All user inputs are validated
- **Address Verification**: Starknet address format validation
- **Transaction Confirmation**: Clear transaction previews
- **Error Handling**: Comprehensive error messages

## 🚀 Production Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Environment**: Set `NEXT_PUBLIC_CONTRACT_ADDRESS`
3. **Deploy**: Automatic deployment on every push

### Contract Deployment (Mainnet)

1. **Update Configuration**: Change network to mainnet in `.env`
2. **Fund Account**: Ensure sufficient ETH for deployment
3. **Deploy**: Run `npm run deploy`
4. **Verify**: Test with small amounts first

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- **Code Style**: Follow existing patterns and conventions
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments
- **Security**: Consider security implications of changes

## 📞 Support & Resources

### Getting Help

- **Issues**: Create GitHub issues for bugs or questions
- **Discussions**: Use GitHub discussions for general questions
- **Documentation**: Refer to inline code documentation

### Useful Resources

- **Starknet Documentation**: [docs.starknet.io](https://docs.starknet.io)
- **Cairo Book**: [book.cairo-lang.org](https://book.cairo-lang.org)
- **Starknet React**: [starknet-react.com](https://starknet-react.com)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✨ Acknowledgments

- **Starknet Team**: For the amazing L2 platform
- **Cairo Community**: For the incredible development tools
- **OpenZeppelin**: For security best practices
- **Next.js Team**: For the fantastic React framework

---

**Made with ❤️ for the Starknet ecosystem** 