import { Account, Contract, RpcProvider, hash, CallData, stark } from 'starknet';
import { readFileSync } from 'fs';
import { config } from './scripts/config.js';

class TokenLockDeployer {
    constructor() {
        this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        this.account = new Account(this.provider, config.accountAddress, config.privateKey);
        this.contractSierra = JSON.parse(readFileSync('./target/dev/testcairocoder_TokenLock.contract_class.json', 'utf8'));
        this.contractCasm = JSON.parse(readFileSync('./target/dev/testcairocoder_TokenLock.compiled_contract_class.json', 'utf8'));
    }

    async declareContract() {
        console.log('🔍 Declaring TokenLock contract...');
        
        try {
            const declareResponse = await this.account.declare({
                contract: this.contractSierra,
                casm: this.contractCasm,
            });

            console.log('✅ Contract declared successfully!');
            console.log('📋 Class Hash:', declareResponse.class_hash);
            console.log('🔗 Transaction Hash:', declareResponse.transaction_hash);
            
            // Wait for transaction to be accepted
            await this.provider.waitForTransaction(declareResponse.transaction_hash);
            console.log('✅ Declare transaction confirmed!');
            
            return declareResponse.class_hash;
        } catch (error) {
            if (error.message.includes('is already declared')) {
                console.log('⚠️  Contract already declared, computing class hash...');
                const classHash = hash.computeCompiledClassHash(this.contractCasm);
                console.log('📋 Computed Class Hash:', classHash);
                return classHash;
            }
            throw error;
        }
    }

    async deployContract(classHash) {
        console.log('🚀 Deploying TokenLock contract...');
        
        // Constructor parameters for TokenLock
        const constructorCalldata = CallData.compile({
            owner: config.ownerAddress,
        });

        const deployResponse = await this.account.deployContract({
            classHash: classHash,
            constructorCalldata: constructorCalldata,
            salt: config.salt,
        });

        console.log('✅ Contract deployed successfully!');
        console.log('📍 Contract Address:', deployResponse.contract_address);
        console.log('🔗 Transaction Hash:', deployResponse.transaction_hash);
        
        // Wait for transaction to be accepted
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
            
            return true;
        } catch (error) {
            console.error('❌ Deployment verification failed:', error);
            return false;
        }
    }

    async deploymentSummary(classHash, contractAddress) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEPLOYMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`🌐 Network: ${config.network}`);
        console.log(`📋 Class Hash: ${classHash}`);
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log(`👑 Owner: ${config.ownerAddress}`);
        console.log(`🔗 Explorer: ${this.getExplorerUrl(contractAddress)}`);
        console.log('='.repeat(60));
    }

    getExplorerUrl(contractAddress) {
        const explorers = {
            sepolia: `https://sepolia.voyager.online/contract/${contractAddress}`,
            mainnet: `https://voyager.online/contract/${contractAddress}`,
            devnet: `http://localhost:4000/contract/${contractAddress}`,
        };
        return explorers[config.network] || 'N/A';
    }
}

async function main() {
    try {
        console.log('🚀 Starting TokenLock deployment process...');
        console.log(`🌐 Network: ${config.network}`);
        console.log(`📱 Account: ${config.accountAddress}`);
        console.log(`👑 Owner: ${config.ownerAddress}`);
        console.log();

        const deployer = new TokenLockDeployer();
        
        // Step 1: Declare contract
        const classHash = await deployer.declareContract();
        
        // Step 2: Deploy contract
        const contractAddress = await deployer.deployContract(classHash);
        
        // Step 3: Verify deployment
        await deployer.verifyDeployment(contractAddress);
        
        // Step 4: Show summary
        await deployer.deploymentSummary(classHash, contractAddress);
        
        console.log('🎉 Deployment completed successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

main(); 