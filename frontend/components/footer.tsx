"use client"

import Link from "next/link"
import { Github, Twitter, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/SidebarContext"

export default function Footer() {
  const { isExpanded } = useSidebar();
  
  return (
    <footer className="border-t border-dao-neonPurple/20 py-8 bg-dao-deepBlue transition-all duration-300">
      <div className={cn(
        "container mx-auto px-8 transition-all duration-300",
        isExpanded ? "ml-64" : "ml-16"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 font-syne">DAOGovLite</h3>
            <p className="text-dao-lightPurple font-syne mb-4">
              A decentralized governance platform for transparent and secure decision-making on the blockchain.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-dao-lightBlue hover:text-dao-lightPurple transition-colors">
                <Github size={20} />
              </Link>
              <Link href="#" className="text-dao-lightBlue hover:text-dao-lightPurple transition-colors">
                <Twitter size={20} />
              </Link>
              <Link href="#" className="text-dao-lightBlue hover:text-dao-lightPurple transition-colors">
                <MessageSquare size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium font-syne mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/proposals" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Proposals
                </Link>
              </li>
              <li>
                <Link href="/create-proposal" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Create Proposal
                </Link>
              </li>
              <li>
                <Link href="/execution" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Execution
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium font-syne mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Smart Contracts
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dao-neonPurple/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-dao-lightPurple font-syne mb-4 md:mb-0">© 2025 DAOGovLite. All rights reserved.</div>
          <div className="flex space-x-6">
            <Link href="#" className="text-sm text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-dao-lightPurple font-syne hover:text-dao-lightBlue transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
