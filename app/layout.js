import { Poppins } from 'next/font/google'
import '../styles/globals.css'

const poppins = Poppins({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

export const metadata = {
  title: 'DNS Control | Block or allow websites per device',
  description: 'Control DNS for your devices. Block or allow websites per device. Use our extension or download a setup file—manage everything from one dashboard.',
  keywords: 'DNS, DNS control, block websites, allow list, per device',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'DNS Control | Block or allow websites per device',
    description: 'Control DNS for your devices. Block or allow websites per device. Manage everything from one dashboard.',
    siteName: 'DNS Control',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.className} antialiased bg-slate-900`}>
        {children}
      </body>
    </html>
  )
}

