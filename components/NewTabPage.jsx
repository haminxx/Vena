'use client'

import { Network, Waves, Sparkles } from 'lucide-react'

const APP_CARDS = [
  {
    id: 'digging',
    label: 'Digging',
    description: 'Explore related tracks in a radial graph',
    icon: Network,
    color: 'bg-blue-500',
  },
  {
    id: 'syncing',
    label: 'Syncing',
    description: 'Audio visualizer and sync',
    icon: Waves,
    color: 'bg-purple-500',
  },
  {
    id: 'future',
    label: 'Future Feature',
    description: 'Coming soon',
    icon: Sparkles,
    color: 'bg-gray-400',
  },
]

export default function NewTabPage({ onSelectCard, dark = false }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 min-h-[400px] ${
      dark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <h1 className={`text-2xl font-light mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>DigBrowser</h1>
      <p className={`text-sm mb-12 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Choose an app to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        {APP_CARDS.map((card) => {
          const Icon = card.icon
          const isPlaceholder = card.id === 'future'
          return (
            <button
              key={card.id}
              onClick={() => !isPlaceholder && onSelectCard(card.id)}
              disabled={isPlaceholder}
              className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                isPlaceholder
                  ? dark ? 'border-gray-600 bg-gray-800 cursor-not-allowed opacity-60' : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : dark ? 'border-gray-600 bg-gray-800 hover:border-blue-500 hover:shadow-md cursor-pointer' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className={`font-medium ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{card.label}</span>
              <span className={`text-xs mt-1 text-center ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{card.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
