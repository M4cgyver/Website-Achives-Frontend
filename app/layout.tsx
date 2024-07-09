import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import styles from "@/libs/styles/archiversite.module.css";
import Link from 'next/link';
import { fontToshibaTxL1 } from '@/libs/fonts';

import websiteIcon from "@/public/favicon.ico"

import winStyles from "@/libs/styles/windows.archives.module.css"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://archives.m4cgyver.net'),

  alternates: {
      canonical: '/',
      languages: {
          'en-US': '/en-US',
      },
  },

  openGraph: {
      images: websiteIcon.src,
      locale: 'en-US',
      type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${fontToshibaTxL1.variable}`}>
        <span className={styles.background} />

        <ul className={`${styles.navigation} ${fontToshibaTxL1.className}`}>
          <li className={winStyles.button}><Link href="/">Home</Link></li>
          <li> <span className={winStyles.button}>Websites</span>
            <ul>
              <li><Link href="/warcs/search">Search Archives</Link></li>
              <li><Link href="/warcs/offline">Offline Viewer</Link></li>
            </ul>
          </li>
        </ul>

        {children}
      </body>
    </html>
  )
}
