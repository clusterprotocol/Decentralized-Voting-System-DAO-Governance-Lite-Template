"use client"

import { useState, useEffect, useContext } from "react"
import { Search } from "lucide-react"
import Link from "next/link"
import { Web3Context } from "@/contexts/Web3Context"
import { Proposal } from "@/lib/types"
import ProposalCard from "@/components/proposal-card"

export default function ProposalsPage() {
  const [filter, setFilter] = useState("All")
  const [searchText, setSearchText] = useState("")
  const filterOptions = ["All", "Active", "Pending", "Executed", "Failed", "Rejected"]
  const { getProposals, getProposalById } = useContext(Web3Context)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const proposalIds = await getProposals();
        
        // Get the details of all proposals
        const proposalPromises = proposalIds.map(id => getProposalById(id));
        const fetchedProposals = await Promise.all(proposalPromises);
        
        // Filter out null values and sort by ID in descending order (newest first)
        const validProposals = fetchedProposals
          .filter((p): p is Proposal => p !== null)
          .sort((a, b) => b.id - a.id);
        
        setProposals(validProposals);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [getProposals, getProposalById]);

  // Filter and search functionality
  const filteredProposals = proposals.filter(proposal => {
    // First filter by status
    const statusMatch = filter === "All" || proposal.status === filter;
    
    // Then filter by search text (case insensitive)
    const searchMatch = searchText === "" || 
      proposal.title.toLowerCase().includes(searchText.toLowerCase()) || 
      proposal.id.toString().includes(searchText);
    
    return statusMatch && searchMatch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold">Proposals</h1>
          
          <Link 
            href="/create-proposal" 
            className="glassmorphism text-white font-medium py-2 px-4 rounded-lg hover:bg-white/10 transition-all duration-300 hover-glow"
          >
            Create Proposal
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative w-full md:w-auto md:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus-glow"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 mr-2">Filter by:</span>
            <div className="flex flex-wrap gap-1">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === option ? "bg-dao-neonPurple text-white" : "bg-[#1a1f2e] text-gray-400 hover:bg-[#2a2f3e]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-dao-lightPurple">
            <div className="animate-spin h-8 w-8 border-4 border-dao-neonPurple border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading proposals...
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="py-20 text-center text-dao-lightPurple">
            {proposals.length === 0 
              ? "No proposals found. Be the first to create one!" 
              : "No proposals match your search criteria."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
