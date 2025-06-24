'use client'

import React, { useState } from 'react'
import { useStarknet } from '@/components/providers/StarknetProvider'
import { TOKENLOCK_CONTRACT_ADDRESS, TOKENLOCK_ABI } from '@/lib/contract'
import { ERC20_ABI, getTokenSymbol } from '@/lib/utils'
import { addSessionLock } from './ViewLocks'
import { Contract, cairo } from 'starknet'
import toast from 'react-hot-toast'

const COMMON_TOKENS = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  USDC: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
}

const PRESET_DURATIONS = [
  { label: '1 Week', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
]

export default function LockTokens() {
  const { account, isConnected } = useStarknet()
  const [formData, setFormData] = useState({
    token: '',
    beneficiary: '',
    amount: '',
    unlockDate: '',
    unlockTime: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const setPresetDuration = (days: number) => {
    const now = new Date()
    const unlockDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    setFormData(prev => ({
      ...prev,
      unlockDate: unlockDate.toISOString().split('T')[0],
      unlockTime: now.toTimeString().slice(0, 5)
    }))
  }

  const fillMyAddress = () => {
    if (account?.address) {
      setFormData(prev => ({
        ...prev,
        beneficiary: account.address
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Check wallet connection
      if (!isConnected || !account) {
        toast.error('Please connect your wallet first!')
        return
      }
      
      // Calculate unlock timestamp
      const unlockTimestamp = Math.floor(new Date(`${formData.unlockDate}T${formData.unlockTime}`).getTime() / 1000)
      
      // Use 18 decimals for all tokens (standard for STRK, ETH, etc.)
      const tokenDecimals = 18
      
      // Parse amount to wei (18 decimals)
      const parseAmount = (amount: string): bigint => {
        if (!amount || amount === '0') return 0n
        const [wholePart = '0', fractionalPart = ''] = amount.split('.')
        const paddedFractional = fractionalPart.padEnd(tokenDecimals, '0').slice(0, tokenDecimals)
        return BigInt(wholePart) * BigInt(10 ** tokenDecimals) + BigInt(paddedFractional || '0')
      }
      
      const amountBigInt = parseAmount(formData.amount)
      
      console.log('Preparing batched transaction (approve + lock):', {
        token: formData.token,
        beneficiary: formData.beneficiary,
        amount: amountBigInt.toString(),
        unlockTimestamp
      })
      
      // Create contract instances
      const tokenContract = new Contract(ERC20_ABI, formData.token, account)
      const lockContract = new Contract(TOKENLOCK_ABI, TOKENLOCK_CONTRACT_ADDRESS, account)
      
      toast('Executing approve + lock transaction...', { icon: '⚡' })
      
      // Batch both calls into a single transaction using account.execute
      const calls = [
        // First call: Approve tokens
        tokenContract.populate('approve', [TOKENLOCK_CONTRACT_ADDRESS, amountBigInt]),
        // Second call: Lock tokens  
        lockContract.populate('lock_tokens', [
          formData.token,
          formData.beneficiary, 
          amountBigInt,
          unlockTimestamp
        ])
      ]
      
      console.log('Batched calls:', calls)
      
      // Execute both calls in a single transaction
      const { transaction_hash } = await account.execute(calls)
      
      toast.success('Transaction submitted! Waiting for confirmation...')
      console.log('Transaction hash:', transaction_hash)
      
      // Wait for transaction confirmation
      await account.waitForTransaction(transaction_hash)
      
      toast.success('Tokens locked successfully!')
      
      // Add the lock to session storage for immediate display
      addSessionLock({
        token: formData.token,
        tokenSymbol: getTokenSymbol(formData.token),
        beneficiary: formData.beneficiary,
        amount: amountBigInt,
        unlockTime: unlockTimestamp,
        isUnlocked: false
      })
      
      // Reset form
      setFormData({
        token: '',
        beneficiary: '',
        amount: '',
        unlockDate: '',
        unlockTime: ''
      })
      
    } catch (error: any) {
      console.error('❌ Error in token locking process:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        stack: error?.stack
      })
      
      let errorMessage = 'Error locking tokens!'
      if (error?.message) {
        if (error.message.includes('u256_sub Overflow')) {
          errorMessage = 'Insufficient token balance or allowance. Please check your token balance.'
        } else if (error.message.includes('Unlock time must be in future')) {
          errorMessage = 'Unlock time must be in the future. Please select a later date/time.'
        } else if (error.message.includes('Invalid')) {
          errorMessage = 'Invalid input parameters. Please check your form data.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.token && formData.beneficiary && formData.amount && formData.unlockDate && formData.unlockTime

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          🔒 Lock Your Tokens
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Protect your savings from impulsive investments. Lock your tokens with time-based smart contracts and secure your financial future.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Token Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <label htmlFor="token" className="block text-lg font-semibold text-gray-900 mb-4">
            💰 Select Token to Lock
          </label>
          <select
            id="token"
            name="token"
            value={formData.token}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            required
          >
            <option value="">Choose your token</option>
            {Object.entries(COMMON_TOKENS).map(([symbol, address]) => (
              <option key={symbol} value={address}>
                {symbol} - {address.slice(0, 10)}...{address.slice(-8)}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">
            Select from popular tokens or enter a custom contract address
          </p>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <label htmlFor="amount" className="block text-lg font-semibold text-gray-900 mb-4">
            📊 Amount to Lock
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.0"
              step="0.000000000000000001"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg pr-20"
              required
            />
            <div className="absolute right-3 top-3 text-gray-500 font-medium">
              {formData.token && Object.entries(COMMON_TOKENS).find(([, addr]) => addr === formData.token)?.[0] || 'Tokens'}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Enter the amount of tokens you want to lock away from impulsive trades
          </p>
        </div>

        {/* Beneficiary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <label htmlFor="beneficiary" className="block text-lg font-semibold text-gray-900 mb-4">
            👤 Beneficiary Address
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="beneficiary"
              name="beneficiary"
              value={formData.beneficiary}
              onChange={handleInputChange}
              placeholder="0x..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              required
            />
            <button
              type="button"
              onClick={fillMyAddress}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              Use My Address
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            The address that will be able to unlock the tokens after the lock period
          </p>
        </div>

        {/* Lock Duration */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            ⏰ Lock Duration
          </label>
          
          {/* Preset Durations */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPresetDuration(preset.days)}
                className="bg-white hover:bg-orange-100 border border-orange-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200 text-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unlockDate" className="block text-sm font-medium text-gray-700 mb-2">
                Unlock Date
              </label>
              <input
                type="date"
                id="unlockDate"
                name="unlockDate"
                value={formData.unlockDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="unlockTime" className="block text-sm font-medium text-gray-700 mb-2">
                Unlock Time
              </label>
              <input
                type="time"
                id="unlockTime"
                name="unlockTime"
                value={formData.unlockTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {isFormValid && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
              📋 Lock Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token:</span>
                  <span className="font-semibold text-gray-900">
                    {Object.entries(COMMON_TOKENS).find(([, addr]) => addr === formData.token)?.[0] || 'Custom Token'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">{formData.amount}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Beneficiary:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.beneficiary.slice(0, 6)}...{formData.beneficiary.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unlock:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.unlockDate} at {formData.unlockTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed text-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
              <span>🔐 Locking Tokens...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🔒 Lock My Tokens</span>
            </div>
          )}
        </button>
        
        {!isFormValid && (
          <p className="text-center text-gray-500 text-sm">
            Fill in all fields to enable token locking
          </p>
        )}
      </form>
    </div>
  )
} 