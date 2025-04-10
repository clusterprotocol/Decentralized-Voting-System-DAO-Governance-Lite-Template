export interface Proposal {
  id: number
  title: string
  description: string
  status: 'Active' | 'Pending' | 'Executed' | 'Failed' | 'Rejected'
  timeRemaining: string
  votesFor: number
  votesAgainst: number
  quorum: number
  createdBy: string
  createdAt: string
}

export interface Web3StateType {
  account: string | null
  chainId: number | null
  isConnected: boolean
  provider: any | null
  contract: any | null
  tokenBalance: string
  isLoading: boolean
}

export interface VoteInfo {
  hasVoted: boolean
  support: boolean | null
  votingPower: number
}

export interface ProposalVote {
  voter: string
  support: boolean
  votes: number
  timestamp: number
}

export interface NavItem {
  title: string
  href: string
  disabled?: boolean
}
