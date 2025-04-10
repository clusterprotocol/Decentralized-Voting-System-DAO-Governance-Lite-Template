"use client"

import { useState, useEffect, useContext } from "react"
import { Clock, Check, PlayCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Web3Context } from "@/contexts/Web3Context"
import { Proposal } from "@/lib/types"

export default function ExecutionPage() {
  const { getProposals, getProposalById, executeProposal, account, isConnected } = useContext(Web3Context)
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([])
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<Record<number, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const proposalIds = await getProposals()
        
        // Get the details of all proposals
        const proposalPromises = proposalIds.map(id => getProposalById(id))
        const fetchedProposals = await Promise.all(proposalPromises)
        
        // Filter out null values
        const validProposals = fetchedProposals.filter((p): p is Proposal => p !== null)
        
        // Separate active and pending proposals
        const active = validProposals.filter(p => p.status === 'Active')
        const pending = validProposals.filter(p => p.status === 'Pending')
        
        setActiveProposals(active)
        setPendingProposals(pending)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (error) {
        console.error("Error fetching proposals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
    // Refresh more frequently (every 10 seconds instead of 30) for more accurate timers
    const interval = setInterval(fetchProposals, 10000)
    
    return () => clearInterval(interval)
  }, [getProposals, getProposalById])

  const handleExecute = async (proposalId: number) => {
    if (!isConnected) return
    
    setExecuting(prev => ({ ...prev, [proposalId]: true }))
    
    try {
      const success = await executeProposal(proposalId)
      
      if (success) {
        // Refresh proposals list
        const pendingWithoutExecuted = pendingProposals.filter(p => p.id !== proposalId)
        setPendingProposals(pendingWithoutExecuted)
        
        // Get the updated proposal
        const executedProposal = await getProposalById(proposalId)
        if (executedProposal && executedProposal.status === 'Executed') {
          // Update the UI to show it's executed
          console.log("Proposal executed successfully:", executedProposal)
        }
      }
    } catch (error) {
      console.error(`Error executing proposal #${proposalId}:`, error)
    } finally {
      setExecuting(prev => ({ ...prev, [proposalId]: false }))
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
          <h1 className="text-3xl font-bold">Execute Proposals</h1>
          <div className="text-sm text-dao-lightPurple">Last updated: {lastUpdated}</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-dao-lightPurple">
            <div className="animate-spin h-8 w-8 border-4 border-dao-neonPurple border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading proposals...
          </div>
        ) : (
          <>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Ready for Execution</h2>
                <div className="text-sm text-dao-lightPurple">
                  {pendingProposals.length} proposal{pendingProposals.length !== 1 ? 's' : ''}
                </div>
              </div>
              <p className="text-dao-lightPurple mb-6">
                These proposals have passed voting and are ready to be executed.
              </p>

              {pendingProposals.length === 0 ? (
                <div className="glassmorphism p-6 text-center text-dao-lightPurple">
                  <XCircle className="mx-auto h-8 w-8 mb-2 text-yellow-400" />
                  <p>No proposals are currently ready for execution.</p>
                  <p className="mt-2 text-sm">Check back later or create a new proposal.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pendingProposals.map((proposal) => {
                    // Calculate vote percentages
                    const totalVotes = proposal.votesFor + proposal.votesAgainst
                    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
                    
                    return (
                      <div key={proposal.id} className="glassmorphism rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-sm text-dao-lightPurple">Proposal #{proposal.id}</div>
                              <h3 className="font-bold">
                                <Link href={`/proposals/${proposal.id}`} className="hover:text-dao-lightBlue transition-colors">
                                  {proposal.title}
                                </Link>
                              </h3>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-yellow-600/20 text-yellow-400">
                              Pending
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm text-dao-lightPurple mb-1">Result</div>
                            <div className="flex items-center">
                              <span className="font-bold">{forPercentage.toFixed(2)}%</span>
                              <div className="ml-2 w-24 bg-dao-darkBlue h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                  style={{ width: `${forPercentage}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-dao-lightPurple">{proposal.votesFor.toLocaleString()} votes</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleExecute(proposal.id)}
                            disabled={executing[proposal.id] || !isConnected}
                            className={`w-full mt-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                              !isConnected
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-dao-neonPurple hover:bg-dao-neonPurple/80 text-white hover-glow'
                            }`}
                          >
                            {executing[proposal.id] ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 font-syne border-white border-t-transparent rounded-full"></div>
                                Executing...
                              </>
                            ) : (
                              <>
                                <PlayCircle font-syne size={16} />
                                Execute
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mb-12">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Active Voting Proposals</h2>
                <div className="text-sm text-dao-lightPurple">
                  {activeProposals.length} proposal{activeProposals.length !== 1 ? 's' : ''}
                </div>
              </div>
              <p className="text-dao-lightPurple font-syne mb-6">
                These proposals are still in the voting period and cannot be executed yet.
              </p>

              {activeProposals.length === 0 ? (
                <div className="glassmorphism p-6 text-center text-dao-lightPurple">
                  <XCircle className="mx-auto h-8 w-8 mb-2 text-yellow-400" />
                  <p>No proposals are currently active for voting.</p>
                  <p className="mt-2 text-sm">
                    <Link href="/create-proposal" className="text-dao-lightBlue hover:underline">
                      Create a new proposal
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeProposals.map((proposal) => {
                    // Calculate vote percentages
                    const totalVotes = proposal.votesFor + proposal.votesAgainst
                    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
                    
                    return (
                      <div key={proposal.id} className="glassmorphism rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-sm text-dao-lightPurple">Proposal #{proposal.id}</div>
                              <h3 className="font-bold">
                                <Link href={`/proposals/${proposal.id}`} className="hover:text-dao-lightBlue transition-colors">
                                  {proposal.title}
                                </Link>
                              </h3>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-600/20 text-green-400">
                              Active
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <div className="text-sm text-dao-lightPurple">For</div>
                              <div className="flex items-center">
                                <span className="font-bold">{forPercentage.toFixed(2)}%</span>
                                <div className="ml-2 w-24 bg-dao-darkBlue h-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-dao-neonPurple to-dao-lightPurple"
                                    style={{ width: `${forPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-dao-lightPurple">{proposal.votesFor.toLocaleString()}</span>
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-dao-lightPurple">Time remaining:</div>
                              <div className="text-dao-lightBlue font-mono">{proposal.timeRemaining}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
