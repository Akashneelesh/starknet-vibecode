#!/bin/bash

# TokenLock Frontend Setup Script
echo "🚀 Setting up TokenLock Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."

# Install dependencies
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOL
# Starknet Network Configuration
NEXT_PUBLIC_STARKNET_NETWORK=sepolia

# Contract Address
NEXT_PUBLIC_CONTRACT_ADDRESS=0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec
EOL
    echo "✅ Created .env.local file"
fi

echo ""
echo "🎉 Frontend setup complete!"
echo ""
echo "To start the development server:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📚 Features available:"
echo "  • Connect Starknet wallets (Braavos, Argent X)"
echo "  • Lock tokens with custom unlock times"
echo "  • View and manage your token locks"
echo "  • Unlock tokens when the time comes"
echo ""
echo "🔗 Contract Address: 0x04389148c3d1468245f22e8a6ef61f59a025820341a4b26216f8ae8643d9b7ec"
echo "🌐 Network: Starknet Sepolia Testnet" 