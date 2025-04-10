"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useContext } from "react"
import { Web3Context } from "@/contexts/Web3Context"
import { Proposal } from "@/lib/types"

export default function Home() {
  const { getProposals, getProposalById } = useContext(Web3Context);
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const proposalIds = await getProposals();
        
        // Get the details of all proposals
        const proposalPromises = proposalIds.map(id => getProposalById(id));
        const proposals = await Promise.all(proposalPromises);
        
        // Filter out null values and only active proposals, then take the latest 3
        const activeProposals = proposals
          .filter((p): p is Proposal => p !== null && p.status === 'Active')
          .sort((a, b) => b.id - a.id)
          .slice(0, 3);
        
        setActiveProposals(activeProposals);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [getProposals, getProposalById]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {/* Hero Section */}
        <div className="relative py-20 w-full bg-gradient-to-b from-dao-neonPurple/10 to-transparent rounded-2xl overflow-hidden">
          <div className="relative container mx-auto h-full flex flex-col justify-center items-center px-4 z-10 py-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-syne font-bold text-center mb-6">
              <div>Decentralized</div>
              <div>Governance</div>
              <div className="gradient-text">Unleashed</div>
            </h1>
            
            <p className="text-dao-lightPurple font-syne text-center max-w-2xl mb-10 text-lg">
              Participate in transparent decision-making on the blockchain. Create, vote, and
              execute proposals with full transparency and security.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/proposals">
                <button className="glassmorphism text-white font-syne font-medium py-3 px-6 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2 hover-glow">
                  Browse Proposals
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Proposals Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-syne font-bold text-white">Active Proposals</h2>
            <Link href="/proposals" className="text-dao-lightBlue hover:text-dao-lightPurple flex items-center gap-2 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 py-20 text-center text-dao-lightPurple">
                <div className="animate-spin h-8 w-8 border-4 border-dao-neonPurple border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading proposals...
              </div>
            ) : activeProposals.length === 0 ? (
              <div className="col-span-3 py-20 text-center text-dao-lightPurple">
                No active proposals found. <Link href="/create-proposal" className="text-dao-lightBlue hover:underline">Create one</Link>
              </div>
            ) : (
              activeProposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="proposal-card p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-dao-lightPurple">ID: {proposal.id}</div>
                      <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-600/20 text-green-400">
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-dao-lightPurple mb-1">For</div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-full h-2 bg-dao-darkPurple/50 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-dao-neonPurple rounded-full" 
                          style={{ 
                            width: `${proposal.votesFor + proposal.votesAgainst > 0 
                              ? (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst) * 100) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-white">
                        {proposal.votesFor + proposal.votesAgainst > 0 
                          ? Math.round(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-dao-lightPurple mb-1">Time remaining:</div>
                    <div className="text-dao-lightBlue font-mono">{proposal.timeRemaining}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
