"use client"

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
// Import the combined contract ABI and address
import DAOGovLiteWithTokenABI from '../contracts/DAOGovLiteWithToken-abi.json';
import DAOGovLiteWithTokenAddress from '../contracts/DAOGovLiteWithToken-address.json';
// Keep using the network utilities but exclude getContractAddress
import { DEFAULT_NETWORK, getNetworkNameFromChainId, BLOCKCHAIN_CACHE_TIMES, RPC_ENDPOINTS } from '@/lib/contracts/addresses';
import { Proposal, Web3StateType } from '@/lib/types';
import { calculateTimeRemaining, formatAddress, getProposalStatus } from '@/lib/utils';

// Extend Window type to include ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextProps extends Web3StateType {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getProposals: () => Promise<number[]>;
  getProposalById: (id: number) => Promise<Proposal | null>;
  createProposal: (title: string, description: string, duration: number) => Promise<number | null>;
  voteOnProposal: (proposalId: number, voteFor: boolean) => Promise<boolean>;
  executeProposal: (proposalId: number) => Promise<boolean>;
  getVoteInfo: (proposalId: number) => Promise<{ hasVoted: boolean; support: boolean | null; votingPower: number }>;
}

// Create the context with default values
export const Web3Context = createContext<Web3ContextProps>({
  account: null,
  chainId: null,
  isConnected: false,
  provider: null,
  contract: null,
  tokenBalance: '0',
  isLoading: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  getProposals: async () => [],
  getProposalById: async () => null,
  createProposal: async () => null,
  voteOnProposal: async () => false,
  executeProposal: async () => false,
  getVoteInfo: async () => ({ hasVoted: false, support: null, votingPower: 0 }),
});

// Cache for responses to minimize RPC calls
interface CacheEntry {
  value: any;
  timestamp: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

const cache: CacheStore = {};

// Function to get contract address based on network
const getContractAddress = (networkName: string): string => {
  // Use environment variables if available, otherwise use the JSON file
  if (networkName === 'SEPOLIA') {
    return process.env.NEXT_PUBLIC_CONTRACT_DAOGOV_WITH_TOKEN_SEPOLIA || DAOGovLiteWithTokenAddress.address;
  } else if (networkName === 'LOCALHOST') {
    return process.env.NEXT_PUBLIC_CONTRACT_DAOGOV_WITH_TOKEN_LOCALHOST || DAOGovLiteWithTokenAddress.address;
  }
  return DAOGovLiteWithTokenAddress.address;
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Web3StateType>({
    account: null,
    chainId: null,
    isConnected: false,
    provider: null,
    contract: null,
    tokenBalance: '0',
    isLoading: false,
  });

  // Initialize provider and contract
  const initializeProviderAndContract = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      // Use a fallback provider for read-only operations if MetaMask is not available
      let ethersProvider;
      let signer = null;
      let account = null;
      
      if (window.ethereum) {
        ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts', // This doesn't prompt, just checks if already connected
          });
          
          if (accounts && accounts.length > 0) {
            signer = ethersProvider.getSigner();
            account = accounts[0];
          }
        } catch (error) {
          console.log('No connected accounts:', error);
        }
      } else {
        // Fallback to a public RPC for read-only operations
        const fallbackNetwork = DEFAULT_NETWORK;
        const fallbackRPC = RPC_ENDPOINTS[fallbackNetwork];
        ethersProvider = new ethers.providers.JsonRpcProvider(fallbackRPC);
        console.log('Using fallback provider for read-only operations');
      }
      
      const networkInfo = await ethersProvider.getNetwork();
      const networkName = getNetworkNameFromChainId(networkInfo.chainId);
      
      const contractAddress = getContractAddress(networkName);

      // Create contract with signer if available, otherwise use provider for read-only
      const contractProvider = signer || ethersProvider;
      const contract = new ethers.Contract(contractAddress, DAOGovLiteWithTokenABI, contractProvider);

      // Get token balance if account is available
      let tokenBalance = '0';
      if (account) {
        try {
          const balanceWei = await contract.balanceOf(account);
          tokenBalance = ethers.utils.formatUnits(balanceWei, 18);
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      }

      setState(prev => ({
        ...prev,
        provider: ethersProvider,
        contract,
        chainId: networkInfo.chainId,
        account,
        isConnected: !!account,
        tokenBalance,
      }));

      return {
        provider: ethersProvider,
        contract,
        chainId: networkInfo.chainId,
        account,
        isConnected: !!account,
        tokenBalance,
      };
    } catch (error) {
      console.error('Failed to initialize provider and contract:', error);
      return null;
    }
  }, []);

  // Initialize on first load
  useEffect(() => {
    initializeProviderAndContract();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setState(prev => ({
            ...prev,
            account: null,
            isConnected: false,
            tokenBalance: '0',
          }));
        } else {
          // Reinitialize with new account
          initializeProviderAndContract();
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        // Reload the page on chain change
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [initializeProviderAndContract]);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this application');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request accounts from MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const contracts = await initializeProviderAndContract();
        
        if (contracts) {
          setState(prev => ({
            ...prev,
            account: accounts[0],
            isConnected: true,
            tokenBalance: contracts.tokenBalance,
            isLoading: false,
          }));
          
          // Auto-delegate tokens if needed
          await autoDelegateTokens(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Auto-delegate tokens function
  const autoDelegateTokens = async (account: string) => {
    if (!state.contract) return;
    
    try {
      // Check if the user has already delegated their tokens
      const currentDelegate = await state.contract.delegates(account);
      
      // If the user hasn't delegated yet and has a token balance
      if (currentDelegate === ethers.constants.AddressZero) {
        const balance = await state.contract.balanceOf(account);
        
        if (balance.gt(0)) {
          console.log("Auto-delegating tokens to activate voting power...");
          
          // Check if delegate function exists
          if (typeof state.contract.delegate === 'function') {
            try {
              // Delegate to self
              const tx = await state.contract.delegate(account);
              await tx.wait();
              console.log("✅ Successfully auto-delegated tokens to enable voting!");
              
              // Show toast notification
              if (typeof window !== 'undefined' && window.alert) {
                window.alert("Your tokens have been auto-delegated to activate your voting power!");
              }
            } catch (error) {
              console.error("Error auto-delegating tokens:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking delegation status:", error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
    }));
    
    // Small timeout to prevent UI flickering
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        account: null,
        isConnected: false,
        tokenBalance: '0',
        isLoading: false,
      }));
    }, 500);
  };

  // Get all proposal IDs
  const getProposals = async (): Promise<number[]> => {
    if (!state.contract) {
      console.error('Contract not initialized');
      return [];
    }

    const cacheKey = 'proposals';
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < BLOCKCHAIN_CACHE_TIMES.PROPOSALS) {
      return cache[cacheKey].value;
    }

    try {
      const proposalIds = await state.contract.getProposals();
      const result = proposalIds.map((id: ethers.BigNumber) => id.toNumber());
      
      // Cache the result
      cache[cacheKey] = {
        value: result,
        timestamp: Date.now(),
      };
      
      return result;
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return [];
    }
  };

  // Get proposal by ID
  const getProposalById = async (id: number): Promise<Proposal | null> => {
    if (!state.contract) {
      console.error('Contract not initialized');
      return null;
    }

    const cacheKey = `proposal-${id}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < BLOCKCHAIN_CACHE_TIMES.PROPOSAL_DETAILS) {
      return cache[cacheKey].value;
    }

    try {
      const proposalData = await state.contract.getProposal(id);
      
      const [
        proposer,
        title,
        description,
        startTime,
        endTime,
        forVotes,
        againstVotes,
        executed,
        canceled
      ] = proposalData;
      
      // Safely handle large numbers by using string conversion and Number parsing
      const endTimeValue = endTime.toNumber(); // Safe for timestamps
      const startTimeValue = startTime.toNumber(); // Safe for timestamps
      
      // Handle large vote numbers safely
      const votesForValue = parseFloat(ethers.utils.formatUnits(forVotes, 18));
      const votesAgainstValue = parseFloat(ethers.utils.formatUnits(againstVotes, 18));
      
      const status = getProposalStatus(
        endTimeValue,
        executed,
        canceled,
        // Convert back to numbers but safely for comparison only
        forVotes,
        againstVotes
      );
      
      const timeRemaining = calculateTimeRemaining(endTimeValue);
      
      const proposal: Proposal = {
        id,
        title,
        description,
        status,
        timeRemaining,
        votesFor: votesForValue,
        votesAgainst: votesAgainstValue,
        quorum: 2000000, // Hardcoded for now, can be made dynamic
        createdBy: formatAddress(proposer),
        createdAt: new Date(startTimeValue * 1000).toISOString().split('T')[0],
      };
      
      // Cache the result
      cache[cacheKey] = {
        value: proposal,
        timestamp: Date.now(),
      };
      
      return proposal;
    } catch (error) {
      console.error(`Error fetching proposal #${id}:`, error);
      return null;
    }
  };

  // Create a new proposal
  const createProposal = async (title: string, description: string, duration: number): Promise<number | null> => {
    if (!state.contract || !state.account) {
      console.error('Contract not initialized or wallet not connected');
      return null;
    }

    // Convert duration from days to seconds
    const durationSeconds = duration * 24 * 60 * 60;

    try {
      // Call the contract method
      const tx = await state.contract.createProposal(title, description, durationSeconds);
      const receipt = await tx.wait();
      
      // Get the proposal ID from events
      const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated');
      if (event && event.args) {
        const proposalId = event.args.proposalId.toNumber();
        
        // Clear proposals cache to reflect new proposal
        delete cache['proposals'];
        
        return proposalId;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating proposal:', error);
      return null;
    }
  };

  // Vote on a proposal
  const voteOnProposal = async (proposalId: number, voteFor: boolean): Promise<boolean> => {
    if (!state.contract || !state.account) {
      console.error('Contract not initialized or wallet not connected');
      return false;
    }

    try {
      // Call the contract method
      const tx = await state.contract.vote(proposalId, voteFor);
      const receipt = await tx.wait();
      
      // Check if the transaction was successful
      return receipt.status === 1;
    } catch (error) {
      console.error(`Error voting on proposal #${proposalId}:`, error);
      return false;
    }
  };

  // Execute a proposal
  const executeProposal = async (proposalId: number): Promise<boolean> => {
    if (!state.contract || !state.account) {
      console.error('Contract not initialized or wallet not connected');
      return false;
    }

    try {
      // Call the contract method
      const tx = await state.contract.executeProposal(proposalId);
      const receipt = await tx.wait();
      
      // Check if the transaction was successful
      return receipt.status === 1;
    } catch (error) {
      console.error(`Error executing proposal #${proposalId}:`, error);
      return false;
    }
  };

  // Get vote info for a proposal
  const getVoteInfo = async (proposalId: number): Promise<{ hasVoted: boolean; support: boolean | null; votingPower: number }> => {
    if (!state.contract || !state.account) {
      console.error('Contract not initialized or wallet not connected');
      return { hasVoted: false, support: null, votingPower: 0 };
    }

    try {
      // Check if user has voted on this proposal using different methods
      let hasVoted = false;
      try {
        // Try getUserVote first if it exists
        if (typeof state.contract.getUserVote === 'function') {
          const [voted, support] = await state.contract.getUserVote(proposalId, state.account);
          return { 
            hasVoted: voted, 
            support, 
            votingPower: parseFloat(ethers.utils.formatUnits(await state.contract.getVotingPower(state.account), 18))
          };
        }
        // Try hasVoted if it exists
        else if (typeof state.contract.hasVoted === 'function') {
          hasVoted = await state.contract.hasVoted(proposalId, state.account);
        }
        // If neither function exists, check proposal data directly
        else {
          // Try to get proposal data and check votes
          const proposal = await state.contract.getProposal(proposalId);
          // We can't determine if they voted directly, so rely on localStorage
          console.log("Contract doesn't have vote checking functions - relying on localStorage");
        }
      } catch (error) {
        console.error("Error checking vote status:", error);
        // If all methods fail, check localStorage
      }

      // Get user's vote direction from local storage
      let support = null;
      if (hasVoted) {
        // Try to get from local storage
        const storedVoteKey = `vote-${proposalId}-${state.account}`;
        const storedVote = localStorage.getItem(storedVoteKey);
        if (storedVote) {
          try {
            const parsedVote = JSON.parse(storedVote);
            support = parsedVote.support;
          } catch (error) {
            console.error("Error parsing localStorage vote:", error);
          }
        }

        // If not in localStorage, check voting results to determine
        if (support === null) {
          try {
            const proposal = await state.contract.getProposal(proposalId);
            const votesFor = proposal[5];
            const votesAgainst = proposal[6];
            
            // If there are votes for and no votes against, assume voted for
            if (votesFor.gt(0) && votesAgainst.eq(0)) {
              support = true;
            } 
            // If there are votes against and no votes for, assume voted against
            else if (votesAgainst.gt(0) && votesFor.eq(0)) {
              support = false;
            }
          } catch (error) {
            console.error("Error determining vote direction:", error);
          }
        }
      } else {
        // Check localStorage even if contract says hasVoted is false
        const storedVoteKey = `vote-${proposalId}-${state.account}`;
        const storedVote = localStorage.getItem(storedVoteKey);
        if (storedVote) {
          try {
            const parsedVote = JSON.parse(storedVote);
            hasVoted = true;
            support = parsedVote.support;
          } catch (error) {
            console.error("Error parsing localStorage vote:", error);
          }
        }
      }
      
      // Get voting power (token balance)
      const votingPower = await state.contract.getVotingPower(state.account);
      
      return { 
        hasVoted, 
        support,
        votingPower: parseFloat(ethers.utils.formatUnits(votingPower, 18)) 
      };
    } catch (error) {
      console.error(`Error getting vote info for proposal #${proposalId}:`, error);
      return { hasVoted: false, support: null, votingPower: 0 };
    }
  };

  return (
    <Web3Context.Provider value={{
      ...state,
      connectWallet,
      disconnectWallet,
      getProposals,
      getProposalById,
      createProposal,
      voteOnProposal,
      executeProposal,
      getVoteInfo
    }}>
      {children}
    </Web3Context.Provider>
  );
}