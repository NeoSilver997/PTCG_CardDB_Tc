import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProvider from '../components/ClientProvider'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PTCG Card Search',
  description: 'Search and explore Pokemon Trading Card Game cards by abilities and effects',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProvider>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
        </ClientProvider>
      </body>
    </html>
  )
}