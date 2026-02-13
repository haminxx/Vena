import './globals.css'

export const metadata = {
  title: 'DigBrowser - Chrome-OS Music Explorer',
  description: 'Music digging and syncing in a Chrome-style interface',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
