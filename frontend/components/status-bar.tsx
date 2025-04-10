"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StatusBar() {
  // Mock wallet data
  const walletAddress = "0x775F...16b5"
  const tokenBalance = "500,000"

  return (
    <div className="border-t border-[#1a1f2e] p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
      <div className="text-sm">
        <div className="text-gray-400">Status</div>
        <div className="font-mono">{walletAddress}</div>
        <div className="text-blue-400">{tokenBalance} Governance Tokens</div>
      </div>

      <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
        Disconnect <LogOut size={14} className="ml-2" />
      </Button>
    </div>
  )
}
