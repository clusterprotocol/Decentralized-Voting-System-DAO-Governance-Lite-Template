"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import { Web3Context } from "@/contexts/Web3Context"
import { Proposal } from "@/lib/types"
import VotingResults from "@/components/voting-results"
import { calculateTimeRemaining } from "@/lib/utils"

export default function ProposalDetail() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string, 10)
  
  const { getProposalById, executeProposal, account, isConnected } = useContext(Web3Context)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const proposalData = await getProposalById(id)
        setProposal(proposalData)
        if (proposalData) {
          setTimeRemaining(proposalData.timeRemaining);
        }
      } catch (error) {
        console.error("Error fetching proposal:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
    // Set up a refresh interval for proposal data
    const dataInterval = setInterval(fetchProposal, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(dataInterval)
  }, [id, getProposalById])

  // Update time remaining in real-time
  useEffect(() => {
    if (!proposal || proposal.status !== 'Active') return;
    
    // More robust parsing of the time string
    let endTimeUnix;
    try {
      let timeComponents = proposal.timeRemaining.split(/\s+/);
      let days = 0;
      let timeString = "";
      
      // Handle days component if it exists
      if (timeComponents[0].includes('d')) {
        days = parseInt(timeComponents[0].replace('d', ''), 10);
        timeString = timeComponents.length > 1 ? timeComponents[1] : "00:00:00";
      } else {
        // Just HH:MM:SS format without days
        timeString = timeComponents[0];
      }
      
      // Parse HH:MM:SS
      const timeParts = timeString.split(':').map(part => parseInt(part, 10));
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      const seconds = timeParts[2] || 0;
      
      const now = Math.floor(Date.now() / 1000);
      endTimeUnix = now + (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
    } catch (error) {
      console.error("Error parsing time remaining:", error);
      return; // Exit if parsing fails
    }
    
    // Update time remaining every second
    const timerInterval = setInterval(() => {
      const updatedTimeRemaining = calculateTimeRemaining(endTimeUnix);
      setTimeRemaining(updatedTimeRemaining);
      
      // If time is up, refresh the proposal to update the status
      if (updatedTimeRemaining === "0:00:00") {
        clearInterval(timerInterval);
        const fetchProposal = async () => {
          const updatedProposal = await getProposalById(id);
          if (updatedProposal) {
            setProposal(updatedProposal);
          }
        };
        fetchProposal();
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [proposal, id, getProposalById]);

  const handleExecute = async () => {
    if (!proposal || !isConnected) return;
    
    setExecuting(true);
    try {
      const success = await executeProposal(id);
      if (success) {
        // Refresh proposal data to get updated status
        const updatedProposal = await getProposalById(id);
        setProposal(updatedProposal);
      }
    } catch (error) {
      console.error("Error executing proposal:", error);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-dao-neonPurple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg">
          Proposal not found. It may have been deleted or never existed.
        </div>
        <button
          className="mt-4 glassmorphism text-dao-lightPurple hover:text-white py-2 px-4 rounded-md flex items-center hover-glow"
          onClick={() => router.push("/proposals")}
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Proposals
        </button>
      </div>
    );
  }

  // Determine if the proposal is ready for execution
  const canExecute = proposal.status === 'Pending' && isConnected;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-8">
        <button
          className="mb-6 glassmorphism text-dao-lightPurple hover:text-white py-2 px-4 rounded-md flex items-center hover-glow"
          onClick={() => router.push("/proposals")}
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Proposals
        </button>

        <h1 className="text-4xl font-bold mb-2 font-syne">{proposal.title}</h1>

        <div className="flex items-center gap-2 mb-8">
          <span className={`px-2 py-1 text-xs font-medium rounded-md font-syne ${
            proposal.status === 'Active' ? 'bg-green-600/20 text-green-400' :
            proposal.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-400' :
            proposal.status === 'Executed' ? 'bg-blue-600/20 text-blue-400' :
            'bg-red-600/20 text-red-400'
          }`}>
            {proposal.status}
          </span>
          <div className="flex items-center text-dao-lightPurple text-sm font-syne">
            <Clock size={14} className="mr-1" />
            {timeRemaining || proposal.timeRemaining}
          </div>
        </div>

        <div className="glassmorphism rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 font-syne">Description</h2>
          <p className="text-dao-lightPurple mb-6 whitespace-pre-wrap font-syne">{proposal.description}</p>

          <div className="flex flex-col sm:flex-row justify-between text-sm text-dao-lightPurple font-syne">
            <div>
              Created by: <span className="text-dao-lightBlue">{proposal.createdBy}</span>
            </div>
            <div>Created on: {proposal.createdAt}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <VotingResults 
            proposalId={id} 
            votesFor={proposal.votesFor} 
            votesAgainst={proposal.votesAgainst} 
            status={proposal.status} 
          />

          <div className="glassmorphism rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 font-syne">Quorum Status</h2>
            <div className="mb-6">
              <div className="flex justify-between mb-1 font-syne">
                <span className="text-dao-lightPurple">Threshold Required</span>
                <span className="text-dao-lightBlue font-bold">
                  {proposal.quorum.toLocaleString()} votes
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2 font-syne">
                <span className="text-dao-lightPurple">Total votes received</span>
                <span className="text-dao-lightBlue font-bold">
                  {(proposal.votesFor + proposal.votesAgainst).toLocaleString()} votes
                </span>
              </div>
              
              <div className="h-6 bg-dao-darkPurple/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-dao-neonPurple to-dao-lightBlue flex items-center justify-end px-2 text-xs font-bold font-syne text-white"
                  style={{ width: `${Math.min(((proposal.votesFor + proposal.votesAgainst) / proposal.quorum) * 100, 100)}%` }}
                >
                  {Math.min(Math.round(((proposal.votesFor + proposal.votesAgainst) / proposal.quorum) * 100), 100)}%
                </div>
              </div>
            </div>
            
            {canExecute && (
              <div className="mt-8">
                <h3 className="font-bold mb-4 font-syne">Execute Proposal</h3>
                <p className="text-dao-lightPurple mb-4 text-sm font-syne">
                  This proposal has passed and is ready to be executed on-chain.
                </p>
                <button 
                  className="bg-dao-neonPurple hover:bg-dao-neonPurple/80 text-white py-2 px-4 rounded-md flex items-center hover-glow font-syne"
                  onClick={handleExecute}
                  disabled={executing}
                >
                  {executing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Executing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Execute Proposal
                    </>
                  )}
                </button>
              </div>
            )}
            
            {proposal.status === 'Executed' && (
              <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                <div className="flex items-center text-green-400 mb-1 font-syne">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Proposal Executed</span>
                </div>
                <p className="text-green-400/80 text-sm font-syne">
                  This proposal has been successfully executed on-chain.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
