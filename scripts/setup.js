import { readFileSync, existsSync } from 'fs';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables if .env exists
if (existsSync('.env')) {
    dotenvConfig();
}

function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    console.log(`📦 Node.js version: ${nodeVersion}`);
    
    if (majorVersion < 18) {
        console.log('⚠️  Warning: Node.js 18 or higher is recommended');
        return false;
    } else {
        console.log('✅ Node.js version is compatible');
        return true;
    }
}

function checkScarb() {
    try {
        const { execSync } = require('child_process');
        const scarbVersion = execSync('scarb --version', { encoding: 'utf-8' }).trim();
        console.log(`🔨 Scarb version: ${scarbVersion}`);
        console.log('✅ Scarb is installed');
        return true;
    } catch (error) {
        console.log('❌ Scarb not found. Please install Scarb: https://docs.swmansion.com/scarb/download.html');
        return false;
    }
}

function checkContractFiles() {
    const sierraPath = './target/dev/testcairocoder_TokenLock.contract_class.json';
    const casmPath = './target/dev/testcairocoder_TokenLock.compiled_contract_class.json';
    
    console.log('🔍 Checking contract compilation artifacts...');
    
    if (existsSync(sierraPath) && existsSync(casmPath)) {
        console.log('✅ Contract files found');
        return true;
    } else {
        console.log('❌ Contract files not found');
        console.log('💡 Run: scarb build');
        return false;
    }
}

function checkEnvironmentFile() {
    console.log('📄 Checking environment configuration...');
    
    if (!existsSync('.env')) {
        console.log('⚠️  .env file not found');
        console.log('💡 Create .env file from env.example:');
        console.log('   cp env.example .env');
        return false;
    }
    
    console.log('✅ .env file found');
    return true;
}

function validateEnvironmentVars() {
    console.log('🔧 Validating environment variables...');
    
    const required = [
        'STARKNET_NETWORK',
        'ACCOUNT_ADDRESS', 
        'PRIVATE_KEY',
        'OWNER_ADDRESS'
    ];
    
    const missing = [];
    const present = [];
    
    for (const key of required) {
        if (process.env[key]) {
            present.push(key);
        } else {
            missing.push(key);
        }
    }
    
    if (present.length > 0) {
        console.log('✅ Found environment variables:');
        present.forEach(key => {
            const value = process.env[key];
            const displayValue = key.includes('PRIVATE_KEY') 
                ? value.substring(0, 6) + '...' 
                : value;
            console.log(`   ${key}=${displayValue}`);
        });
    }
    
    if (missing.length > 0) {
        console.log('❌ Missing required environment variables:');
        missing.forEach(key => console.log(`   ${key}`));
        return false;
    }
    
    return true;
}

function checkPackageJson() {
    console.log('📦 Checking package.json...');
    
    try {
        const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
        console.log('✅ package.json found');
        
        if (pkg.dependencies && pkg.dependencies.starknet) {
            console.log(`✅ starknet.js dependency: ${pkg.dependencies.starknet}`);
        } else {
            console.log('❌ starknet.js dependency not found');
            console.log('💡 Run: npm install');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('❌ package.json not found or invalid');
        return false;
    }
}

function displayNetworkInfo() {
    const network = process.env.STARKNET_NETWORK || 'sepolia';
    console.log(`🌐 Target network: ${network}`);
    
    const rpcUrls = {
        sepolia: process.env.SEPOLIA_RPC_URL || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
        mainnet: process.env.MAINNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
        devnet: process.env.DEVNET_RPC_URL || 'http://localhost:5050/rpc'
    };
    
    console.log(`🔗 RPC URL: ${rpcUrls[network]}`);
}

function displayNextSteps(allChecksPass) {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 NEXT STEPS');
    console.log('='.repeat(50));
    
    if (!allChecksPass) {
        console.log('❌ Please fix the issues above before proceeding');
        return;
    }
    
    console.log('✅ Your environment is ready! You can now:');
    console.log();
    console.log('1. 🚀 Deploy the contract:');
    console.log('   npm run deploy');
    console.log();
    console.log('2. 📋 Or declare first, then deploy:');
    console.log('   npm run declare');
    console.log('   npm run deploy-only');
    console.log();
    console.log('3. 🔗 Interact with deployed contract:');
    console.log('   npm run interact <CONTRACT_ADDRESS>');
    console.log();
    console.log('📚 For more information, see README.md');
}

function main() {
    console.log('🔧 TokenLock Deployment Setup Check');
    console.log('='.repeat(40));
    
    const checks = [
        checkNodeVersion(),
        checkScarb(),
        checkPackageJson(),
        checkContractFiles(),
        checkEnvironmentFile(),
        validateEnvironmentVars()
    ];
    
    const allChecksPass = checks.every(check => check);
    
    console.log('\n📊 SYSTEM STATUS');
    console.log('='.repeat(40));
    
    if (process.env.STARKNET_NETWORK) {
        displayNetworkInfo();
    }
    
    console.log(`✅ Passed: ${checks.filter(Boolean).length}/${checks.length} checks`);
    
    displayNextSteps(allChecksPass);
    
    if (!allChecksPass) {
        process.exit(1);
    }
}

main(); 