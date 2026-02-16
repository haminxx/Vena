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
    <div className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[400px] ${
      dark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <h1 className={`text-xl sm:text-2xl font-light mb-1 sm:mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>DigBrowser</h1>
      <p className={`text-xs sm:text-sm mb-6 sm:mb-12 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Choose an app to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-2xl w-full px-2 sm:px-0">
        {APP_CARDS.map((card) => {
          const Icon = card.icon
          const isPlaceholder = card.id === 'future'
          return (
            <button
              key={card.id}
              onClick={() => !isPlaceholder && onSelectCard(card.id)}
              disabled={isPlaceholder}
              className={`flex flex-col items-center p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all min-w-0 ${
                isPlaceholder
                  ? dark ? 'border-gray-600 bg-gray-800 cursor-not-allowed opacity-60' : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : dark ? 'border-gray-600 bg-gray-800 hover:border-blue-500 hover:shadow-md cursor-pointer' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl ${card.color} flex items-center justify-center mb-2 sm:mb-3 shrink-0`}>
                <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className={`text-sm sm:text-base font-medium truncate w-full ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{card.label}</span>
              <span className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-center line-clamp-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{card.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
