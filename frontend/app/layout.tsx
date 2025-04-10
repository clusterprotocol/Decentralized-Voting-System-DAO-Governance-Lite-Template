import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk, Syne } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import Footer from "@/components/footer"
import { Web3Provider } from "@/contexts/Web3Context"
import { SidebarProvider } from "@/contexts/SidebarContext"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const syne = Syne({
  subsets: ["latin"],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "DAOGovLite - Decentralized Governance",
  description: "A decentralized governance platform for transparent and secure decision-making on the blockchain.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${inter.variable} ${spaceGrotesk.variable} font-syne bg-dao-deepBlue text-white`}>
        <Web3Provider>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col">
              <div className="flex flex-1">
                <Sidebar />
                <div id="main-content" className="flex-1 ml-16 flex flex-col transition-all duration-300 ease-in-out">
                  <main className="flex-grow">
                    {children}
                  </main>
                </div>
              </div>
              <Footer />
            </div>
          </SidebarProvider>
        </Web3Provider>
      </body>
    </html>
  )
}