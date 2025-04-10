"use client"

import type React from "react"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { FileText, Send, AlertCircle } from "lucide-react"
import { Web3Context } from "@/contexts/Web3Context"

export default function CreateProposal() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [votingDuration, setVotingDuration] = useState("7")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { createProposal, isConnected, account } = useContext(Web3Context)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !account) {
      setError("Please connect your wallet to create a proposal")
      return
    }
    
    if (!title.trim()) {
      setError("Please enter a title for your proposal")
      return
    }
    
    if (!description.trim()) {
      setError("Please enter a description for your proposal")
      return
    }
    
    const duration = parseInt(votingDuration, 10)
    if (isNaN(duration) || duration < 1 || duration > 30) {
      setError("Voting duration must be between 1 and 30 days")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const proposalId = await createProposal(title, description, duration)
      
      if (proposalId !== null) {
        // Redirect to the proposal details page on success
        router.push(`/proposals/${proposalId}`)
      } else {
        setError("Failed to create proposal. Please try again.")
      }
    } catch (err) {
      console.error("Error creating proposal:", err)
      setError("An error occurred while creating the proposal. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-dao-neonPurple/20 p-2 rounded-md">
            <FileText className="text-dao-neonPurple" size={24} />
          </div>
          <h1 className="text-3xl font-bold">Create Proposal</h1>
        </div>

        {!isConnected && (
          <div className="glassmorphism p-4 mb-6 border-yellow-500/20 bg-yellow-500/10 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-yellow-500 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-yellow-500">Wallet not connected</h3>
              <p className="text-yellow-500/80 text-sm">Please connect your wallet to create a proposal.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="glassmorphism p-4 mb-6 border-red-500/20 bg-red-500/10 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-red-500">Error</h3>
              <p className="text-red-500/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="glassmorphism rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-dao-lightPurple mb-2 font-syne">
                Proposal Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                className="form-input w-full"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-dao-lightPurple mb-2 font-syne">
                Proposal Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of your proposal"
                className="form-input w-full min-h-[200px]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-8">
              <label htmlFor="duration" className="block text-dao-lightPurple mb-2 font-syne">
                Voting Duration (days)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                max="30"
                value={votingDuration}
                onChange={(e) => setVotingDuration(e.target.value)}
                className="form-input w-full"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="submit-proposal-btn flex items-center"
                disabled={isSubmitting || !isConnected}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" /> Submit Proposal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="glassmorphism rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Before You Submit</h2>
          <ul className="space-y-3 text-dao-lightPurple">
            <li className="flex items-start">
              <span className="text-dao-neonPurple mr-2">•</span>
              Ensure your proposal is clear, concise and addresses a specific need
            </li>
            <li className="flex items-start">
              <span className="text-dao-neonPurple mr-2">•</span>
              Proposals require a minimum of 1000 governance tokens to create
            </li>
            <li className="flex items-start">
              <span className="text-dao-neonPurple mr-2">•</span>
              Voting period can be set between 1-30 days
            </li>
            <li className="flex items-start">
              <span className="text-dao-neonPurple mr-2">•</span>
              You'll need to pay a small gas fee to submit on-chain
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
