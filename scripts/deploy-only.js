import { Account, Contract, RpcProvider, CallData } from 'starknet';
import { readFileSync } from 'fs';
import { config, checkContractFiles, displayConfig } from './config.js';

class ContractDeployer {
    constructor() {
        this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        this.account = new Account(this.provider, config.accountAddress, config.privateKey);
        this.contractSierra = JSON.parse(readFileSync(config.sierraPath, 'utf8'));
    }

    async deployContract(classHash) {
        console.log('🚀 Deploying TokenLock contract...');
        console.log(`📋 Using Class Hash: ${classHash}`);
        
        // Constructor parameters for TokenLock
        const constructorCalldata = CallData.compile({
            owner: config.ownerAddress,
        });

        console.log(`👑 Owner Address: ${config.ownerAddress}`);
        console.log(`🧂 Salt: ${config.salt}`);

        const deployResponse = await this.account.deployContract({
            classHash: classHash,
            constructorCalldata: constructorCalldata,
            salt: config.salt,
        });

        console.log('✅ Contract deployed successfully!');
        console.log('📍 Contract Address:', deployResponse.contract_address);
        console.log('🔗 Transaction Hash:', deployResponse.transaction_hash);
        
        // Wait for transaction to be accepted
        console.log('⏳ Waiting for deployment confirmation...');
        await this.provider.waitForTransaction(deployResponse.transaction_hash);
        console.log('✅ Deploy transaction confirmed!');
        
        return deployResponse.contract_address;
    }

    async verifyDeployment(contractAddress) {
        console.log('🔍 Verifying deployment...');
        
        const tokenLockContract = new Contract(
            this.contractSierra.abi,
            contractAddress,
            this.provider
        );

        try {
            const owner = await tokenLockContract.get_owner();
            const nextLockId = await tokenLockContract.get_next_lock_id();
            
            console.log('✅ Deployment verified!');
            console.log('👑 Contract Owner:', owner);
            console.log('🔢 Next Lock ID:', nextLockId);
            
            // Verify owner matches expected
            if (owner.toString() === config.ownerAddress.toString()) {
                console.log('✅ Owner verification passed');
            } else {
                console.log('⚠️  Owner mismatch detected');
                console.log(`   Expected: ${config.ownerAddress}`);
                console.log(`   Actual: ${owner}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Deployment verification failed:', error);
            return false;
        }
    }

    async checkContractClassExists(classHash) {
        console.log('🔍 Verifying class hash exists on network...');
        
        try {
            await this.provider.getClass(classHash);
            console.log('✅ Class hash verified on network');
            return true;
        } catch (error) {
            console.error('❌ Class hash not found on network:', classHash);
            console.log('💡 You may need to declare the contract first:');
            console.log('   npm run declare');
            return false;
        }
    }

    getExplorerUrl(contractAddress) {
        const explorers = {
            sepolia: `https://sepolia.voyager.online/contract/${contractAddress}`,
            mainnet: `https://voyager.online/contract/${contractAddress}`,
            devnet: `http://localhost:4000/contract/${contractAddress}`,
        };
        return explorers[config.network] || 'N/A';
    }

    displaySummary(classHash, contractAddress) {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 DEPLOYMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`🌐 Network: ${config.network}`);
        console.log(`📋 Class Hash: ${classHash}`);
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log(`👑 Owner: ${config.ownerAddress}`);
        console.log(`🔗 Explorer: ${this.getExplorerUrl(contractAddress)}`);
        console.log('='.repeat(60));
        console.log('\n🎯 Next steps:');
        console.log('• Test your contract functions');
        console.log('• Lock some tokens using lock_tokens()');
        console.log('• Monitor events on the explorer');
    }
}

async function main() {
    try {
        console.log('🚀 Starting TokenLock contract deployment...');
        displayConfig();

        // Check if contract files exist
        if (!checkContractFiles()) {
            process.exit(1);
        }

        // Get class hash from environment or prompt user
        const classHash = config.classHash;
        if (!classHash) {
            console.error('❌ CLASS_HASH not provided');
            console.log('💡 You can:');
            console.log('  1. Add CLASS_HASH to your .env file');
            console.log('  2. Run: CLASS_HASH=0x123... npm run deploy-only');
            console.log('  3. Declare first: npm run declare');
            process.exit(1);
        }

        const deployer = new ContractDeployer();
        
        // Verify class hash exists
        const classExists = await deployer.checkContractClassExists(classHash);
        if (!classExists) {
            process.exit(1);
        }
        
        // Deploy contract
        const contractAddress = await deployer.deployContract(classHash);
        
        // Verify deployment
        await deployer.verifyDeployment(contractAddress);
        
        // Show summary
        deployer.displaySummary(classHash, contractAddress);
        
        console.log('\n🎉 Deployment completed successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

main(); 