'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { connect, disconnect } from 'starknetkit'
import { AccountInterface } from 'starknet'

interface StarknetContextType {
  account: AccountInterface | null
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const StarknetContext = createContext<StarknetContextType | undefined>(undefined)

export function StarknetProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInterface | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = async () => {
    try {
      const { wallet } = await connect({
        webWalletUrl: "https://web.argent.xyz",
        argentMobileOptions: {
          dappName: "TokenLock DApp",
          url: window.location.hostname,
        },
      })

      if (wallet && wallet.isConnected) {
        setAccount(wallet.account)
        setAddress(wallet.selectedAddress)
        setIsConnected(true)
        console.log('Wallet connected:', wallet.selectedAddress)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setAccount(null)
      setAddress(null)
      setIsConnected(false)
      console.log('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  useEffect(() => {
    // Check if already connected on mount
    const checkConnection = async () => {
      try {
        const { wallet } = await connect({ 
          modalMode: "neverAsk",
          webWalletUrl: "https://web.argent.xyz" 
        })
        
        if (wallet && wallet.isConnected) {
          setAccount(wallet.account)
          setAddress(wallet.selectedAddress)
          setIsConnected(true)
        }
      } catch (error) {
        // User not connected, which is fine
      }
    }

    checkConnection()
  }, [])

  const value: StarknetContextType = {
    account,
    address,
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
  }

  return (
    <StarknetContext.Provider value={value}>
      {children}
    </StarknetContext.Provider>
  )
}

export function useStarknet() {
  const context = useContext(StarknetContext)
  if (context === undefined) {
    throw new Error('useStarknet must be used within a StarknetProvider')
  }
  return context
} 