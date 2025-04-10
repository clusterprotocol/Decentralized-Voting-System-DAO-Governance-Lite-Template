import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock } from "lucide-react"
import type { Proposal } from "@/lib/types"
import { calculateTimeRemaining } from "@/lib/utils"

interface ProposalCardProps {
  proposal: Proposal
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  // State for real-time timer
  const [timeRemaining, setTimeRemaining] = useState(proposal.timeRemaining);
  
  // State for real-time vote percentage
  const [forPercentage, setForPercentage] = useState(0);
  
  // Calculate vote percentages and update in real-time
  useEffect(() => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const percentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    setForPercentage(percentage);
  }, [proposal.votesFor, proposal.votesAgainst]);
  
  // Update time remaining in real-time
  useEffect(() => {
    // Only set up interval for active proposals
    if (proposal.status !== 'Active') {
      setTimeRemaining(proposal.timeRemaining);
      return;
    }
    
    // Update the time initially
    setTimeRemaining(proposal.timeRemaining);
    
    // More robust parsing of the time string
    let endTimeUnix;
    try {
      // Parse the time string into a Unix timestamp
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
      
      if (isNaN(endTimeUnix)) {
        console.error("Invalid time format:", proposal.timeRemaining);
        return;
      }
    } catch (error) {
      console.error("Error parsing time remaining:", error);
      return; // Exit if parsing fails
    }
    
    // Set up the interval to update every second
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      // If time has expired
      if (now >= endTimeUnix) {
        setTimeRemaining("0:00:00");
        clearInterval(interval);
        return;
      }
      
      const updatedTimeRemaining = calculateTimeRemaining(endTimeUnix);
      setTimeRemaining(updatedTimeRemaining);
    }, 1000); // Update every second
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [proposal.timeRemaining, proposal.status]);
  
  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="proposal-card group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-dao-lightPurple font-syne">Proposal #{proposal.id}</div>
          <h3 className="text-xl font-semibold text-white font-syne tracking-wide">{proposal.title}</h3>
        </div>
        <span className={`status-badge ${proposal.status.toLowerCase()}`}>
          {proposal.status}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-dao-lightPurple font-syne">For</div>
          <div className="text-sm text-dao-lightPurple font-syne">{proposal.votesFor.toLocaleString()} votes</div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${forPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-dao-lightBlue">
          <Clock size={16} />
          <span className="text-sm font-syne">{timeRemaining}</span>
        </div>
      </div>
    </Link>
  )
}
