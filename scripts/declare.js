import { Account, RpcProvider, hash } from 'starknet';
import { readFileSync } from 'fs';
import { config, checkContractFiles, displayConfig } from './config.js';

class ContractDeclarer {
    constructor() {
        this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        this.account = new Account(this.provider, config.accountAddress, config.privateKey);
        this.contractSierra = JSON.parse(readFileSync(config.sierraPath, 'utf8'));
        this.contractCasm = JSON.parse(readFileSync(config.casmPath, 'utf8'));
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
            console.log('⏳ Waiting for transaction confirmation...');
            await this.provider.waitForTransaction(declareResponse.transaction_hash);
            console.log('✅ Declaration confirmed!');
            
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

    async checkContractStatus(classHash) {
        console.log('🔍 Checking contract class status...');
        
        try {
            const classInfo = await this.provider.getClass(classHash);
            console.log('✅ Contract class found on network');
            return true;
        } catch (error) {
            console.log('❌ Contract class not found on network');
            return false;
        }
    }

    displaySummary(classHash) {
        console.log('\n' + '='.repeat(50));
        console.log('📋 DECLARATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`🌐 Network: ${config.network}`);
        console.log(`📋 Class Hash: ${classHash}`);
        console.log(`🔗 RPC URL: ${config.rpcUrl}`);
        console.log('='.repeat(50));
        console.log('\n💡 You can now deploy this contract using:');
        console.log(`   CLASS_HASH=${classHash} npm run deploy-only`);
        console.log('\n📝 Or add this to your .env file:');
        console.log(`   CLASS_HASH=${classHash}`);
    }
}

async function main() {
    try {
        console.log('🚀 Starting TokenLock contract declaration...');
        displayConfig();

        // Check if contract files exist
        if (!checkContractFiles()) {
            process.exit(1);
        }

        const declarer = new ContractDeclarer();
        
        // Declare the contract
        const classHash = await declarer.declareContract();
        
        // Verify the declaration
        await declarer.checkContractStatus(classHash);
        
        // Show summary
        declarer.displaySummary(classHash);
        
        console.log('\n🎉 Declaration completed successfully!');
        
    } catch (error) {
        console.error('❌ Declaration failed:', error);
        process.exit(1);
    }
}

main(); 