'use client'

import React, { useState, useEffect } from 'react'
import { useStarknet } from '@/components/providers/StarknetProvider'
import { TOKENLOCK_CONTRACT_ADDRESS, TOKENLOCK_ABI } from '@/lib/contract'
import { getTokenSymbol } from '@/lib/utils'
import { Contract, RpcProvider, num } from 'starknet'
import toast from 'react-hot-toast'

interface Lock {
  id: string
  token: string
  tokenSymbol: string
  beneficiary: string
  amount: bigint
  unlockTime: number
  isUnlocked: boolean
}

// Simple in-memory storage for locks created in current session
// In production, this would be replaced with proper backend/indexing
let sessionLocks: Lock[] = []

// Function to add a lock to session storage (called from LockTokens component)
export const addSessionLock = (lock: Omit<Lock, 'id'> & { id?: string }) => {
  const newLock: Lock = {
    ...lock,
    id: lock.id || Date.now().toString(), // Use timestamp as simple ID
  }
  sessionLocks.push(newLock)
  
  // Trigger a custom event to notify ViewLocks component
  window.dispatchEvent(new CustomEvent('sessionLocksUpdated'))
}

export default function ViewLocks() {
  const { account, isConnected } = useStarknet()
  const [locks, setLocks] = useState<Lock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const formatAmount = (amount: string | bigint, decimals: number = 18): string => {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount
    const divisor = BigInt(10 ** decimals)
    const wholePart = amountBigInt / divisor
    const fractionalPart = amountBigInt % divisor
    
    if (fractionalPart === 0n) {
      return wholePart.toString()
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmed = fractionalStr.replace(/0+$/, '')
    
    if (trimmed === '') {
      return wholePart.toString()
    }
    
    return `${wholePart}.${trimmed}`
  }

  const formatTimeLeft = (unlockTime: number): string => {
    const now = Math.floor(Date.now() / 1000)
    
    if (unlockTime <= now) {
      return "Unlockable now"
    }
    
    const secondsLeft = unlockTime - now
    const days = Math.floor(secondsLeft / 86400)
    const hours = Math.floor((secondsLeft % 86400) / 3600)
    const minutes = Math.floor((secondsLeft % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const isUnlockable = (unlockTime: number): boolean => {
    return unlockTime <= Math.floor(Date.now() / 1000)
  }

  // Fetch user's locks using Contract class like in the workshop
  const fetchUserLocks = async () => {
    if (!isConnected || !account) {
      setLocks([])
      setIsInitialLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log('Fetching locks for user:', account.address)
      
      // Use RPC provider like in the workshop
      const provider = new RpcProvider({
        nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"
      })
      
      // Create contract instance with provider (not account)
      const contract = new Contract(TOKENLOCK_ABI, TOKENLOCK_CONTRACT_ADDRESS, provider)
      
      console.log('Calling get_user_locks...')
      // Use the contract method directly like in the workshop
      const lockIds = await contract.get_user_locks(account.address)
      console.log('Raw lockIds response:', lockIds)
      
      if (!lockIds || lockIds.length === 0) {
        console.log('No locks found for user')
        setLocks([])
        return
      }
      
      console.log('Processed lock IDs:', lockIds)
      
      // Fetch details for each lock
      const lockPromises = lockIds.map(async (lockId: bigint) => {
        try {
          console.log(`Fetching info for lock ${lockId}...`)
          
          // Use contract method directly
          const lockInfo = await contract.get_lock_info(lockId)
          console.log(`Lock ${lockId} raw info:`, lockInfo)
          
          // lockInfo is returned as an object with numeric keys, not an array
          // {0: token, 1: beneficiary, 2: amount, 3: unlock_time, 4: is_unlocked}
          const tokenBigInt = lockInfo[0]
          const beneficiaryBigInt = lockInfo[1]
          const amount = lockInfo[2]
          const unlockTime = lockInfo[3]
          const isUnlocked = lockInfo[4]
          
          // Convert BigInt addresses to hex strings
          const token = num.toHex(tokenBigInt)
          const beneficiary = num.toHex(beneficiaryBigInt)
          
          console.log(`Lock ${lockId} converted addresses:`, {
            tokenBigInt: tokenBigInt.toString(),
            tokenHex: token,
            beneficiaryBigInt: beneficiaryBigInt.toString(),
            beneficiaryHex: beneficiary
          })
          
          return {
            id: lockId.toString(),
            token: token,
            tokenSymbol: getTokenSymbol(token),
            beneficiary: beneficiary,
            amount: amount as bigint,
            unlockTime: Number(unlockTime),
            isUnlocked: isUnlocked as boolean
          }
        } catch (error) {
          console.error(`Error fetching lock ${lockId}:`, error)
          return null
        }
      })
      
      const lockDetails = await Promise.all(lockPromises)
      const validLocks = lockDetails.filter((lock): lock is Lock => lock !== null)
      
      console.log('Successfully fetched locks:', validLocks)
      setLocks(validLocks)
      
    } catch (error) {
      console.error('Error fetching user locks:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // If the main contract calls fail, fall back to session locks
      console.log('Falling back to session locks due to contract call error')
      const userSessionLocks = sessionLocks.filter(lock => 
        lock.beneficiary.toLowerCase() === account.address.toLowerCase()
      )
      setLocks(userSessionLocks)
      
      if (userSessionLocks.length === 0) {
        toast.error('Unable to fetch locks from contract. Only showing locks created in this session.')
      }
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }

  // Load locks on component mount and when account changes
  useEffect(() => {
    fetchUserLocks()
    
    // Listen for new locks being added
    const handleSessionLocksUpdate = () => {
      fetchUserLocks()
    }
    
    window.addEventListener('sessionLocksUpdated', handleSessionLocksUpdate)
    
    return () => {
      window.removeEventListener('sessionLocksUpdated', handleSessionLocksUpdate)
    }
  }, [isConnected, account?.address])

  const handleUnlock = async (lockId: string) => {
    if (!isConnected || !account) {
      toast.error('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    try {
      console.log('Unlocking lock:', lockId)
      toast('Unlocking tokens...', { icon: '🔓' })
      
      const contract = new Contract(TOKENLOCK_ABI, TOKENLOCK_CONTRACT_ADDRESS, account)
      
      // Call the unlock_tokens function
      const { transaction_hash } = await contract.unlock_tokens(BigInt(lockId))
      
      toast.success('Transaction submitted! Waiting for confirmation...')
      console.log('Unlock transaction hash:', transaction_hash)
      
      // Wait for transaction confirmation
      await account.waitForTransaction(transaction_hash)
      
      toast.success('Tokens unlocked successfully!')
      
      // Refresh the locks to reflect the change
      await fetchUserLocks()
      
    } catch (error: any) {
      console.error('Error unlocking tokens:', error)
      
      let errorMessage = 'Error unlocking tokens!'
      if (error?.message) {
        if (error.message.includes('Not authorized')) {
          errorMessage = 'You are not authorized to unlock this lock.'
        } else if (error.message.includes('not yet unlockable')) {
          errorMessage = 'Tokens are not yet unlockable. Please wait until the unlock time.'
        } else if (error.message.includes('already unlocked')) {
          errorMessage = 'Tokens have already been unlocked.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    console.log('Refreshing locks...')
    toast('Refreshing locks...', { icon: '🔄' })
    await fetchUserLocks()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          🔍 Your Token Locks
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Monitor your locked tokens and unlock them when the time comes. Your financial discipline in action.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
        >
          <svg 
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Locks</span>
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Wallet Not Connected</h3>
          <p className="text-gray-600 text-lg">
            Please connect your wallet to view your token locks.
          </p>
        </div>
      ) : isInitialLoading ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Your Locks</h3>
          <p className="text-gray-600 text-lg">
            Fetching your token locks from the blockchain...
          </p>
        </div>
      ) : locks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Locks Found</h3>
          <p className="text-gray-600 text-lg mb-4">
            You haven't created any token locks yet. Start protecting your savings today!
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Create your first lock in the "Lock Tokens" tab and it will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {locks.map((lock) => (
            <div key={lock.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {lock.tokenSymbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Lock #{lock.id}</h3>
                      <p className="text-sm text-gray-600">{lock.tokenSymbol} Token</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(lock.amount)}</p>
                    <p className="text-sm text-gray-600">{lock.tokenSymbol}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Beneficiary</p>
                    <p className="font-mono text-gray-900">{formatAddress(lock.beneficiary)}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Unlock Time</p>
                    <p className="text-gray-900 font-medium">{formatDateTime(lock.unlockTime)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                    {lock.isUnlocked ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        Unlocked
                      </span>
                    ) : isUnlockable(lock.unlockTime) ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                        Ready to Unlock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        Locked ({formatTimeLeft(lock.unlockTime)})
                      </span>
                    )}
                  </div>

                  {!lock.isUnlocked && isUnlockable(lock.unlockTime) && (
                    <button
                      onClick={() => handleUnlock(lock.id)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          <span>Unlock</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 