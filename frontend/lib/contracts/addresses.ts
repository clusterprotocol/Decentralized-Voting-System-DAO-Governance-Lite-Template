// Supported networks
export const NETWORKS = {
  LOCALHOST: "LOCALHOST",
  MAINNET: "MAINNET",
  SEPOLIA: "SEPOLIA",
};

// Default network to use
export const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || NETWORKS.SEPOLIA;

// Configure RPC endpoints with rate limiting
export const RPC_ENDPOINTS = {
  [NETWORKS.LOCALHOST]: process.env.NEXT_PUBLIC_RPC_LOCALHOST || "http://localhost:8545",
  [NETWORKS.MAINNET]: process.env.NEXT_PUBLIC_RPC_MAINNET || "https://eth-mainnet.public.blastapi.io", // Free RPC endpoint with higher rate limits
  [NETWORKS.SEPOLIA]: process.env.NEXT_PUBLIC_RPC_SEPOLIA || "https://eth-sepolia.g.alchemy.com/v2/demo", // Default to public demo endpoint
};

// Cache time for various blockchain calls (in milliseconds)
export const BLOCKCHAIN_CACHE_TIMES = {
  PROPOSALS: parseInt(process.env.NEXT_PUBLIC_CACHE_PROPOSALS || '5000'),          // 5 seconds for proposals list
  PROPOSAL_DETAILS: parseInt(process.env.NEXT_PUBLIC_CACHE_PROPOSAL_DETAILS || '5000'),   // 5 seconds for individual proposal details
  TOKEN_BALANCE: parseInt(process.env.NEXT_PUBLIC_CACHE_TOKEN_BALANCE || '10000'),     // 10 seconds for token balance
  GLOBAL_STATE: parseInt(process.env.NEXT_PUBLIC_CACHE_GLOBAL_STATE || '10000'),      // 10 seconds for global contract state
  VOTE_STATUS: parseInt(process.env.NEXT_PUBLIC_CACHE_VOTE_STATUS || '5000'),        // 5 seconds for vote status
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CACHE_CHAIN_ID || '30000'),          // 30 seconds for chain ID
};

// Function to map chain IDs to network names
export const getNetworkNameFromChainId = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return NETWORKS.MAINNET;
    case 11155111:
      return NETWORKS.SEPOLIA;
    default:
      return NETWORKS.LOCALHOST;
  }
};

// Contract addresses for different networks
interface ContractAddresses {
  [key: string]: {
    [key: string]: string;
  };
}

const contractAddresses: ContractAddresses = {
"DAOGovLiteWithToken": {
  [NETWORKS.LOCALHOST]: "your_deployed_address",
  [NETWORKS.SEPOLIA]: "0xb56787e88E184b542702724280A96f6EA363A062"
},
};

export const getContractAddress = (contractName: string, network: string = DEFAULT_NETWORK): string => {
  if (!contractName || !network) {
    console.error(`Invalid parameters: contractName=${contractName}, network=${network}`);
    return "";
  }
  
  if (!contractAddresses[contractName]) {
    console.error(`Contract "${contractName}" not found in address mapping`);
    return "";
  }
  
  const address = contractAddresses[contractName]?.[network];
  if (!address) {
    console.error(`No contract address found for ${contractName} on network ${network}`);
    return "";
  }
  
  console.log(`Resolved ${contractName} address on ${network}: ${address}`);
  return address;
};

export default contractAddresses; 