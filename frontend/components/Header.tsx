'use client'

import React from 'react'

export default function Header() {
  return (
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TokenLock</h1>
              <p className="text-white/70 text-sm">Secure Your Future</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium rounded-xl border border-white/20">
              🔗 Sepolia Testnet
            </span>
            <a 
              href="https://starknet.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ⚡ Powered by Starknet
            </a>
          </div>
        </div>
      </div>
    </header>
  )
} 