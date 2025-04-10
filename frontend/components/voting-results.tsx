"use client"

import { useState, useEffect, useContext } from "react"
import { CheckCircle2, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Web3Context } from "@/contexts/Web3Context"
import { cn } from "@/lib/utils"

interface VotingResultsProps {
  proposalId: number
  votesFor: number
  votesAgainst: number
  status: 'Active' | 'Pending' | 'Executed' | 'Failed' | 'Rejected'
}

export default function VotingResults({ proposalId, votesFor, votesAgainst, status }: VotingResultsProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [voteInfo, setVoteInfo] = useState({ hasVoted: false, support: null as boolean | null, votingPower: 0 })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [forPercentage, setForPercentage] = useState(0)
  const [againstPercentage, setAgainstPercentage] = useState(0)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  
  const { voteOnProposal, getVoteInfo, isConnected, account } = useContext(Web3Context)
  
  // Initial check for existing votes in localStorage - do this FIRST before any other checks
  useEffect(() => {
    if (isConnected && account) {
      const storedVoteKey = `vote-${proposalId}-${account}`;
      const storedVote = localStorage.getItem(storedVoteKey);
      
      if (storedVote) {
        try {
          const parsedVote = JSON.parse(storedVote);
          console.log("Found vote in localStorage:", parsedVote);
          
          // Immediately set hasVoted state to prevent buttons from appearing
          setVoteInfo(prev => ({
            ...prev,
            hasVoted: true,
            support: parsedVote.support
          }));
        } catch (error) {
          console.error("Error parsing localStorage vote:", error);
        }
      }
    }
    
    setInitialCheckDone(true);
  }, [proposalId, account, isConnected]);
  
  // Calculate percentages for display
  useEffect(() => {
    const totalVotes = votesFor + votesAgainst
    if (totalVotes > 0) {
      setForPercentage((votesFor / totalVotes) * 100)
      setAgainstPercentage((votesAgainst / totalVotes) * 100)
    } else {
      setForPercentage(0)
      setAgainstPercentage(0)
    }
  }, [votesFor, votesAgainst])
  
  // Fetch vote info from blockchain AFTER initial localStorage check
  useEffect(() => {
    // Only run this effect after the initial localStorage check
    if (!initialCheckDone) return;
    
    const fetchVoteInfo = async () => {
      if (isConnected && account) {
        try {
          const info = await getVoteInfo(proposalId);
          console.log("Vote info fetched from blockchain:", info);
          
          // If blockchain says user voted, update our local storage and state
          if (info.hasVoted) {
            const storedVoteKey = `vote-${proposalId}-${account}`;
            localStorage.setItem(storedVoteKey, JSON.stringify({
              hasVoted: true,
              support: info.support,
              timestamp: Date.now(),
              pending: false
            }));
            
            setVoteInfo(info);
            setErrorMessage(null);
          } else if (!voteInfo.hasVoted) {
            // Only update state if we don't already think user has voted
            // (defer to localStorage if there's a conflict)
            setVoteInfo(info);
          }
        } catch (error) {
          console.error("Error fetching vote info:", error);
        }
      }
    };
    
    fetchVoteInfo();
    
    // Less frequent polling to avoid rate limits
    const interval = status === 'Active' ? setInterval(fetchVoteInfo, 10000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [proposalId, isConnected, account, getVoteInfo, status, initialCheckDone, voteInfo.hasVoted]);

  // More effective handling of vote
  const handleVote = async (voteFor: boolean) => {
    // Triple-check if the user has already voted
    if (voteInfo.hasVoted) {
      console.log("Vote attempt blocked - user has already voted");
      return;
    }

    // Check for various error conditions
    if (!isConnected) {
      setErrorMessage("Please connect your wallet to vote");
      return;
    }
    
    if (status !== 'Active') {
      setErrorMessage("Voting period has ended");
      return;
    }
    
    // Check localStorage for existing vote one more time
    if (account) {
      const storedVoteKey = `vote-${proposalId}-${account}`;
      const storedVote = localStorage.getItem(storedVoteKey);
      if (storedVote) {
        console.log("Vote prevented by localStorage record");
        const parsedVote = JSON.parse(storedVote);
        setVoteInfo(prev => ({
          ...prev,
          hasVoted: true,
          support: parsedVote.support
        }));
        return;
      }
    }
    
    // Set voting state to prevent multiple clicks
    setIsVoting(true);
    setErrorMessage(null);
    
    // Set hasVoted to true IMMEDIATELY to hide the vote buttons
    setVoteInfo(prev => ({
      ...prev,
      hasVoted: true,
      support: voteFor
    }));
    
    // Save to localStorage immediately to prevent double-votes
    if (account) {
      const storedVoteKey = `vote-${proposalId}-${account}`;
      localStorage.setItem(storedVoteKey, JSON.stringify({
        hasVoted: true,
        support: voteFor,
        timestamp: Date.now(),
        pending: true
      }));
    }
    
    try {
      const success = await voteOnProposal(proposalId, voteFor);
      
      if (success) {
        // Update localStorage to mark vote as confirmed
        if (account) {
          const storedVoteKey = `vote-${proposalId}-${account}`;
          localStorage.setItem(storedVoteKey, JSON.stringify({
            hasVoted: true,
            support: voteFor,
            timestamp: Date.now(),
            pending: false
          }));
        }
      } else {
        // Even if vote failed, we keep the localStorage record to be safe
        setErrorMessage("Failed to cast vote. The transaction did not complete, but your vote intent is saved.");
      }
    } catch (error) {
      console.error("Error voting:", error);
      
      // Check if it's the "already voted" error
      const errorMsg = (error instanceof Error) 
        ? error.message 
        : (typeof error === 'string') 
          ? error 
          : "Unknown error";

      if (errorMsg.includes("Already voted")) {
        // If user already voted, show appropriate message
        setErrorMessage("You have already voted on this proposal.");
      } else {
        setErrorMessage("An error occurred while casting your vote, but your vote intent is saved.");
      }
    } finally {
      setIsVoting(false);
    }
  };
  
  const totalVotes = votesFor + votesAgainst
  
  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-bold font-syne mb-6">Voting Results</h3>
      
      {/* Only show error messages, not info about already voted status */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4 text-red-400 flex items-start gap-2">
          <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      {/* For votes */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white font-syne">For</span>
          </div>
          <div className="text-green-400 font-syne font-bold">{votesFor.toLocaleString()} votes</div>
        </div>
        <div className="h-2 bg-dao-darkPurple/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${forPercentage}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-dao-lightPurple mt-1 font-syne">
          {forPercentage.toFixed(1)}%
        </div>
      </div>
      
      {/* Against votes */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-red-400" />
            <span className="text-sm text-white font-syne">Against</span>
          </div>
          <div className="text-red-400 font-syne font-bold">{votesAgainst.toLocaleString()} votes</div>
        </div>
        <div className="h-2 bg-dao-darkPurple/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${againstPercentage}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-dao-lightPurple mt-1 font-syne">
          {againstPercentage.toFixed(1)}%
        </div>
      </div>
      
      <div className="text-sm text-dao-lightPurple mb-4 font-syne">
        Total votes: {totalVotes.toLocaleString()}
      </div>
      
      {/* Display voting UI section */}
      {isConnected && voteInfo.hasVoted ? (
        <div>
          {/* You have voted message (style matching the third image) */}
          <div className="border border-dao-neonPurple/30 bg-dao-darkPurple/30 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-dao-neonPurple" />
              <span className="text-white font-syne font-medium">You have voted</span>
            </div>
            <div className="text-sm text-dao-lightPurple font-syne">
              You voted <span className={voteInfo.support ? "text-green-400" : "text-red-400"}>
                {voteInfo.support ? "For" : "Against"}
              </span> this proposal with {voteInfo.votingPower.toLocaleString()} voting power.
            </div>
          </div>
          
          {/* This matches the third image's additional confirmation message */}
          <div className="bg-dao-darkBlue/30 border border-dao-neonPurple/40 rounded-md p-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-dao-neonPurple" />
              <p className="text-dao-lightPurple text-sm font-syne">
                You voted <span className={voteInfo.support ? "text-green-400" : "text-red-400"}>
                  {voteInfo.support ? "For" : "Against"}
                </span> this proposal
              </p>
            </div>
          </div>
        </div>
      ) : status === 'Active' && (
        <div>
          <h4 className="text-white font-syne font-medium mb-3">Cast your vote</h4>
          
          {/* Only show voting buttons if user is connected and hasn't voted */}
          {isConnected ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isVoting || voteInfo.hasVoted) return;
                  handleVote(true);
                }}
                disabled={isVoting}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 font-syne transition-all duration-200",
                  "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover-glow-green"
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                {isVoting ? "Voting..." : "Vote For"}
              </button>
              <button
                onClick={() => {
                  if (isVoting || voteInfo.hasVoted) return;
                  handleVote(false);
                }}
                disabled={isVoting}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 font-syne transition-all duration-200",
                  "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover-glow-red"
                )}
              >
                <ThumbsDown className="h-4 w-4" />
                {isVoting ? "Voting..." : "Vote Against"}
              </button>
            </div>
          ) : (
            <div className="text-yellow-400 text-sm mt-2 font-syne">
              Connect your wallet to vote on this proposal.
            </div>
          )}
        </div>
      )}
      
      {/* Show message if voting has ended */}
      {status !== 'Active' && (
        <div className="border border-dao-lightPurple/30 bg-dao-darkPurple/30 rounded-md p-4">
          <div className="text-dao-lightPurple text-sm font-syne">
            Voting period has {status === 'Pending' || status === 'Executed' ? "ended. This proposal has passed." : "ended. This proposal did not pass."}
          </div>
        </div>
      )}
    </div>
  )
}
