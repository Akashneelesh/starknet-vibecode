import { Account, Contract, RpcProvider, CallData } from 'starknet';
import { readFileSync } from 'fs';
import { config, displayConfig } from './config.js';

class TokenLockInteractor {
    constructor(contractAddress) {
        this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        this.account = new Account(this.provider, config.accountAddress, config.privateKey);
        this.contractSierra = JSON.parse(readFileSync(config.sierraPath, 'utf8'));
        this.contract = new Contract(this.contractSierra.abi, contractAddress, this.provider);
        this.contractWithSigner = new Contract(this.contractSierra.abi, contractAddress, this.account);
        this.contractAddress = contractAddress;
    }

    async getContractInfo() {
        console.log('📋 Getting contract information...');
        
        try {
            const owner = await this.contract.get_owner();
            const nextLockId = await this.contract.get_next_lock_id();
            
            console.log('✅ Contract Info:');
            console.log(`   📍 Address: ${this.contractAddress}`);
            console.log(`   👑 Owner: ${owner}`);
            console.log(`   🔢 Next Lock ID: ${nextLockId}`);
            
            return { owner, nextLockId };
        } catch (error) {
            console.error('❌ Failed to get contract info:', error);
            throw error;
        }
    }

    async getLockInfo(lockId) {
        console.log(`🔍 Getting lock info for ID: ${lockId}`);
        
        try {
            const lockInfo = await this.contract.get_lock_info(lockId);
            const [token, beneficiary, amount, unlockTime, isUnlocked] = lockInfo;
            
            console.log('✅ Lock Info:');
            console.log(`   🪙 Token: ${token}`);
            console.log(`   👤 Beneficiary: ${beneficiary}`);
            console.log(`   💰 Amount: ${amount}`);
            console.log(`   ⏰ Unlock Time: ${unlockTime}`);
            console.log(`   🔓 Is Unlocked: ${isUnlocked}`);
            
            return { token, beneficiary, amount, unlockTime, isUnlocked };
        } catch (error) {
            console.error('❌ Failed to get lock info:', error);
            throw error;
        }
    }

    async getUserLocks(userAddress) {
        console.log(`📋 Getting locks for user: ${userAddress}`);
        
        try {
            const lockIds = await this.contract.get_user_locks(userAddress);
            
            console.log('✅ User Locks:');
            console.log(`   🔢 Number of locks: ${lockIds.length}`);
            console.log(`   🆔 Lock IDs: ${lockIds.join(', ')}`);
            
            return lockIds;
        } catch (error) {
            console.error('❌ Failed to get user locks:', error);
            throw error;
        }
    }

    async getTotalLocked(tokenAddress) {
        console.log(`💰 Getting total locked for token: ${tokenAddress}`);
        
        try {
            const totalLocked = await this.contract.get_total_locked(tokenAddress);
            
            console.log('✅ Total Locked:');
            console.log(`   💰 Amount: ${totalLocked}`);
            
            return totalLocked;
        } catch (error) {
            console.error('❌ Failed to get total locked:', error);
            throw error;
        }
    }

    async isUnlockable(lockId) {
        console.log(`🔓 Checking if lock ${lockId} is unlockable...`);
        
        try {
            const unlockable = await this.contract.is_unlockable(lockId);
            
            console.log('✅ Unlockable Status:');
            console.log(`   🔓 Can Unlock: ${unlockable}`);
            
            return unlockable;
        } catch (error) {
            console.error('❌ Failed to check unlockable status:', error);
            throw error;
        }
    }

    async lockTokens(tokenAddress, beneficiary, amount, unlockTime) {
        console.log('🔒 Creating token lock...');
        console.log(`   🪙 Token: ${tokenAddress}`);
        console.log(`   👤 Beneficiary: ${beneficiary}`);
        console.log(`   💰 Amount: ${amount}`);
        console.log(`   ⏰ Unlock Time: ${unlockTime}`);
        
        try {
            const calldata = CallData.compile({
                token: tokenAddress,
                beneficiary: beneficiary,
                amount: amount,
                unlock_time: unlockTime,
            });

            const { transaction_hash } = await this.contractWithSigner.lock_tokens(
                tokenAddress,
                beneficiary,
                amount,
                unlockTime
            );

            console.log('✅ Lock tokens transaction sent!');
            console.log(`   🔗 Transaction Hash: ${transaction_hash}`);
            
            // Wait for transaction confirmation
            console.log('⏳ Waiting for confirmation...');
            await this.provider.waitForTransaction(transaction_hash);
            console.log('✅ Transaction confirmed!');

            return transaction_hash;
        } catch (error) {
            console.error('❌ Failed to lock tokens:', error);
            throw error;
        }
    }

    async unlockTokens(lockId) {
        console.log(`🔓 Unlocking tokens for lock ID: ${lockId}`);
        
        try {
            const { transaction_hash } = await this.contractWithSigner.unlock_tokens(lockId);

            console.log('✅ Unlock tokens transaction sent!');
            console.log(`   🔗 Transaction Hash: ${transaction_hash}`);
            
            // Wait for transaction confirmation
            console.log('⏳ Waiting for confirmation...');
            await this.provider.waitForTransaction(transaction_hash);
            console.log('✅ Transaction confirmed!');

            return transaction_hash;
        } catch (error) {
            console.error('❌ Failed to unlock tokens:', error);
            throw error;
        }
    }

    async transferOwnership(newOwner) {
        console.log(`👑 Transferring ownership to: ${newOwner}`);
        
        try {
            const { transaction_hash } = await this.contractWithSigner.transfer_ownership(newOwner);

            console.log('✅ Transfer ownership transaction sent!');
            console.log(`   🔗 Transaction Hash: ${transaction_hash}`);
            
            // Wait for transaction confirmation
            console.log('⏳ Waiting for confirmation...');
            await this.provider.waitForTransaction(transaction_hash);
            console.log('✅ Transaction confirmed!');

            return transaction_hash;
        } catch (error) {
            console.error('❌ Failed to transfer ownership:', error);
            throw error;
        }
    }
}

async function main() {
    try {
        console.log('🔗 TokenLock Contract Interaction Tool');
        displayConfig();

        // Get contract address from command line arguments
        const contractAddress = process.argv[2];
        if (!contractAddress) {
            console.error('❌ Contract address not provided');
            console.log('💡 Usage: node scripts/interact.js <CONTRACT_ADDRESS>');
            console.log('   Example: node scripts/interact.js 0x123...');
            process.exit(1);
        }

        console.log(`📍 Contract Address: ${contractAddress}`);
        
        const interactor = new TokenLockInteractor(contractAddress);
        
        // Get basic contract information
        await interactor.getContractInfo();
        
        console.log('\n💡 Available operations:');
        console.log('• getContractInfo() - Get basic contract info');
        console.log('• getLockInfo(lockId) - Get information about a specific lock');
        console.log('• getUserLocks(userAddress) - Get all locks for a user');
        console.log('• getTotalLocked(tokenAddress) - Get total locked amount for a token');
        console.log('• isUnlockable(lockId) - Check if a lock can be unlocked');
        console.log('• lockTokens(token, beneficiary, amount, unlockTime) - Create a new lock');
        console.log('• unlockTokens(lockId) - Unlock tokens from a lock');
        console.log('• transferOwnership(newOwner) - Transfer contract ownership');
        
        console.log('\n🎯 To perform specific operations, modify this script or create new ones!');
        
    } catch (error) {
        console.error('❌ Interaction failed:', error);
        process.exit(1);
    }
}

main(); 