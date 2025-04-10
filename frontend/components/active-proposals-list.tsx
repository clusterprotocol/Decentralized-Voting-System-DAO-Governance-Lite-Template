"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { proposals } from "@/lib/data"

interface ActiveProposalsListProps {
  limit?: number
}

export default function ActiveProposalsList({ limit }: ActiveProposalsListProps) {
  const activeProposals = proposals.filter((p) => p.status === "Active").slice(0, limit || proposals.length)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeProposals.map((proposal) => (
        <Link
          key={proposal.id}
          href={`/proposals/${proposal.id}`}
          className="bg-[#131a29] hover:bg-[#1a2133] border border-[#1a1f2e] rounded-lg p-4 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-gray-400">ID: {proposal.id}</div>
              <h3 className="font-bold">{proposal.title}</h3>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-600/20 text-green-400">Active</span>
          </div>

          <div className="flex items-center font-syne text-sm text-gray-400">
            <Clock size={14} className="mr-1" />
            <span>Time Remaining</span>
          </div>
          <div className="text-sm">{proposal.timeRemaining}</div>
        </Link>
      ))}
    </div>
  )
}
