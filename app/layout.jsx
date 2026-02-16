import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata = {
  title: 'DigBrowser - Chrome-OS Music Explorer',
  description: 'Music digging and syncing in a Chrome-style interface',
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
