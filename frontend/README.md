# TokenLock Frontend DApp

A modern, responsive frontend for the TokenLock smart contract built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Wallet Integration**: Support for Braavos and Argent X wallets
- **Token Locking**: Intuitive interface for locking tokens with custom unlock times
- **Lock Management**: View and manage all your token locks
- **Real-time Updates**: Live status updates and countdown timers
- **Multi-token Support**: Support for ETH, STRK, USDC, and custom tokens
- **Transaction Feedback**: Clear transaction status and error handling

## 📦 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Starknet React** - Starknet wallet integration
- **React Hot Toast** - Beautiful toast notifications
- **Lucide React** - Modern icon library

## 🛠 Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and Tailwind directives
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── providers/         # Context providers
│   │   └── StarknetProvider.tsx
│   ├── Header.tsx         # Header component
│   ├── WalletConnection.tsx # Wallet connection component
│   ├── LockTokens.tsx     # Token locking form
│   └── ViewLocks.tsx      # Lock management interface
├── lib/                   # Utilities and configurations
│   ├── contract.ts        # Contract ABI and configuration
│   └── utils.ts           # Utility functions
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Contract Configuration

The contract address and ABI are configured in `lib/contract.ts`:

```typescript
export const TOKENLOCK_CONTRACT_ADDRESS = "0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec";
```

### Supported Networks

Currently configured for Starknet Sepolia testnet. You can modify the network configuration in `components/providers/StarknetProvider.tsx`.

### Token Addresses

Common token addresses are pre-configured in `lib/contract.ts`:
- **ETH**: `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7`
- **STRK**: `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`
- **USDC**: `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`

## 🎯 Usage

### Connecting Your Wallet

1. Click on the wallet connection component
2. Select your preferred wallet (Braavos or Argent X)
3. Approve the connection request in your wallet

### Locking Tokens

1. Navigate to the "Lock Tokens" tab
2. Select the token you want to lock
3. Enter the beneficiary address (who can unlock the tokens)
4. Specify the amount to lock
5. Set the unlock date and time
6. Review the summary and submit the transaction

### Managing Locks

1. Navigate to the "View Locks" tab
2. View all your active and completed locks
3. Unlock tokens when the unlock time has passed
4. Use the refresh button to update lock statuses

## 🔐 Security Features

- **Time-based Locking**: Tokens cannot be unlocked before the specified time
- **Beneficiary Control**: Only the specified beneficiary can unlock tokens
- **Immutable Locks**: Lock parameters cannot be changed after creation
- **Owner Controls**: Contract owner has emergency withdrawal capabilities

## 🎨 Customization

### Styling

The app uses Tailwind CSS for styling. You can customize the color scheme and design tokens in `tailwind.config.js`.

### Components

All components are modular and can be easily customized or replaced. Key components:

- `WalletConnection.tsx` - Handles wallet connection UI
- `LockTokens.tsx` - Token locking form and logic
- `ViewLocks.tsx` - Lock management interface
- `Header.tsx` - Application header

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Deploy to Vercel

The app is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables if needed
3. Deploy automatically on every push

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
```

## 📞 Contract Interaction

The frontend interacts with the TokenLock contract deployed on Starknet Sepolia:

**Contract Address**: `0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec`

### Main Functions

- `lock_tokens(token, beneficiary, amount, unlock_time)` - Lock tokens
- `unlock_tokens(lock_id)` - Unlock tokens when time has passed
- `get_lock_info(lock_id)` - Get information about a specific lock
- `get_user_locks(beneficiary)` - Get all locks for a user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Ensure your wallet is connected to Starknet Sepolia
3. Verify you have sufficient funds for transactions
4. Check that the contract address is correct

For technical support, please open an issue on the GitHub repository. 