import { Account, RpcProvider, hash, Contract, CallData } from 'starknet';
import { readFileSync } from 'fs';
import { config, checkContractFiles, displayConfig } from './config.js';

class ContractDeclarer {
    constructor() {
        this.provider = new RpcProvider({ 
            nodeUrl: config.rpcUrl,
            timeout: 30000 // 30 second timeout
        });
        this.account = new Account(this.provider, config.accountAddress, config.privateKey);
        this.contractSierra = JSON.parse(readFileSync(config.sierraPath, 'utf8'));
        this.contractCasm = JSON.parse(readFileSync(config.casmPath, 'utf8'));
    }

    async declareContract() {
        console.log('🔍 Declaring TokenLock contract...');
        
        // First, compute what the class hash should be for current code
        const computedClassHash = hash.computeCompiledClassHash(this.contractCasm);

        
        try {
            const declareResponse = await this.account.declare({
                contract: this.contractSierra,
                casm: this.contractCasm,
            });

            console.log('✅ Contract declared successfully!');
            console.log('📋 Class Hash:', declareResponse.class_hash);
            console.log('🔗 Transaction Hash:', declareResponse.transaction_hash);
            
            // Wait for transaction to be accepted
            console.log('⏳ Waiting for transaction confirmation...');
            await this.provider.waitForTransaction(declareResponse.transaction_hash);
            console.log('✅ Declaration confirmed!');
            
            return declareResponse.class_hash;
        } catch (error) {
            return this.handleDeclarationError(error, computedClassHash);
        }
    }

    async handleDeclarationError(error, computedClassHash) {
        if (error.message.includes('is already declared')) {
            console.log('⚠️  Contract already declared - extracting class hash...');
            
            // Extract class hash from error message
            const errorMessage = error.message;
            let hashMatch = errorMessage.match(/Class with hash (0x[0-9a-fA-F]{63,66}) is already declared/);
            if (!hashMatch) {
                // Fallback: look for any long hex string
                hashMatch = errorMessage.match(/0x[0-9a-fA-F]{60,66}/);
            }
            
            if (hashMatch) {
                const networkClassHash = hashMatch[1] || hashMatch[0];
                console.log('📋 Extracted Class Hash:', networkClassHash);
                return networkClassHash;
            } else {
                console.log('📋 Could not extract class hash, using computed hash:', computedClassHash);
                return computedClassHash;
            }
        }
        
        // For any other error, just log and throw
        console.log('❌ Declaration error:', error.message);
        throw error;
    }



    async deployContract(classHash) {
        console.log('\n🚀 Deploying TokenLock contract...');
        console.log(`📋 Using Class Hash: ${classHash}`);
        
        // Generate a random salt for new deployment
        const randomSalt = '0x' + Math.floor(Math.random() * 2**64).toString(16).padStart(16, '0');
        
        // Constructor parameters for TokenLock
        const constructorCalldata = CallData.compile({
            owner: config.ownerAddress,
        });

        console.log(`👑 Owner Address: ${config.ownerAddress}`);
        console.log(`🧂 Salt: ${randomSalt} (randomly generated for new deployment)`);

        try {
            const deployResponse = await this.account.deployContract({
                classHash: classHash,
                constructorCalldata: constructorCalldata,
                salt: randomSalt,
            });

            console.log('✅ Contract deployed successfully!');
            console.log('📍 Contract Address:', deployResponse.contract_address);
            console.log('🔗 Transaction Hash:', deployResponse.transaction_hash);
            
            // Wait for transaction to be accepted
            console.log('⏳ Waiting for deployment confirmation...');
            await this.provider.waitForTransaction(deployResponse.transaction_hash);
            console.log('✅ Deploy transaction confirmed!');
            
            return deployResponse.contract_address;
        } catch (error) {
            if (error.message.includes('contract already deployed at address')) {
                // Extract contract address from error message
                const addressMatch = error.message.match(/address (0x[0-9a-fA-F]{64})/);
                if (addressMatch) {
                    const existingAddress = addressMatch[1];
                    console.log('⚠️  Contract already deployed!');
                    console.log('📍 Existing Contract Address:', existingAddress);
                    return existingAddress;
                }
            }
            throw error;
        }
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
          

            
            return true;
        } catch (error) {
            console.error('❌ Deployment verification failed:', error);
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
        console.log('🚀 DECLARATION & DEPLOYMENT SUMMARY');
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

    displayClassHashMismatchInfo(networkHash, computedHash) {
        console.log('\n' + '🔍 CLASS HASH ANALYSIS'.padStart(40));
        console.log('─'.repeat(60));
        console.log(`Network Hash:  ${networkHash}`);
        console.log(`Computed Hash: ${computedHash}`);
        console.log(`Match: ${networkHash === computedHash ? '✅ YES' : '❌ NO'}`);
        
        if (networkHash !== computedHash) {
            console.log('\n📝 RECOMMENDATIONS:');
            console.log('• Use the network hash for deployment (safer)');
            console.log('• Or update your local contract to match network version');
            console.log('• The network version is already tested and verified');
        }
        console.log('─'.repeat(60));
    }
}

async function main() {
    try {
        console.log('🚀 Starting TokenLock contract declaration and deployment...');
        displayConfig();

        // Check if contract files exist
        if (!checkContractFiles()) {
            process.exit(1);
        }

        const declarer = new ContractDeclarer();
        
        // Declare the contract (with improved error handling)
        const classHash = await declarer.declareContract();
        
        // Deploy the contract immediately after declaration
        const contractAddress = await declarer.deployContract(classHash);
        
        // Verify deployment
        await declarer.verifyDeployment(contractAddress);
        
        // Show summary
        declarer.displaySummary(classHash, contractAddress);
        
        console.log('\n🎉 Declaration and deployment completed successfully!');
        
    } catch (error) {
        console.error('❌ Declaration or deployment failed:', error.message);
        
        if (error.message.includes('fetch failed')) {
            console.log('\n🌐 Network connectivity issue detected.');
            console.log('💡 Try again with a different RPC endpoint or check your internet connection.');
        }
        
        process.exit(1);
    }
}

main(); 