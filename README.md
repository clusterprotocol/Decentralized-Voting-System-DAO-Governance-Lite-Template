# DAOGovLite

A full-stack decentralized governance platform that enables users to create, vote on, and execute proposals on the blockchain. This platform combines a modern React frontend with secure Solidity smart contracts to deliver a complete DAO governance solution.

## 📋 Features

- **Proposal Management**
  - Create proposals with title, description, and voting duration
  - Vote on active proposals (for/against)
  - Execute passed proposals
  - Track proposal lifecycle and status

- **Wallet Integration**
  - Seamless MetaMask integration 
  - Account management and network switching
  - Transaction handling with error recovery

- **Performance Optimizations**
  - Smart caching system to reduce RPC calls
  - Rate limiting to prevent API throttling
  - Circuit breaker pattern for stability

- **User Experience**
  - Real-time updates for proposal status
  - Responsive design for all devices
  - Detailed transaction feedback

## 🏗️ Architecture

The project consists of two main components:

### Smart Contracts (Backend)

Located in the [`/blockchain`](./blockchain) directory:
- **DAOGovLite**: Main governance contract that handles proposals, voting, and execution
- **GovernanceToken**: ERC20 token that provides voting power to participants

### Frontend Application

Located in the [`/frontend`](./frontend) directory:
- Built with Next.js, TypeScript, and ethers.js
- Communicates with blockchain via Web3 provider
- Features a responsive UI with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- MetaMask browser extension

### Setting Up the Project

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/daogov-lite.git
   cd daogov-lite
   ```

2. Set up and compile the smart contracts:
   ```
   cd blockchain
   npm install
   npm run compile
   ```

3. Set up the frontend application:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env.local` file in the frontend directory with your contract addresses:
   ```
   NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=your_dao_contract_address
   NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=your_token_contract_address
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## 📖 Usage Guide

### Connecting Your Wallet

1. Open the DAOGovLite application
2. Click the "Connect Wallet" button in the header
3. Approve the connection request in MetaMask
4. Ensure you're on the correct network (Sepolia testnet for testing)

### Creating a Proposal

1. Navigate to the "Create Proposal" page
2. Fill in the proposal details (title, description, duration)
3. Click "Submit Proposal" and confirm the transaction in MetaMask
4. Wait for transaction confirmation

### Voting on Proposals

1. Browse the "Proposals" page to see active proposals
2. Click on a proposal to view details
3. Choose "Vote For" or "Vote Against"
4. Confirm the transaction in MetaMask

### Executing Proposals

1. Navigate to the "Execution" page
2. Browse proposals that have completed their voting period
3. Proposals with majority "For" votes will be executable
4. Click "Execute" on a pending proposal
5. Confirm the transaction in MetaMask

## 🔐 Security Considerations

- The contracts implement access control mechanisms
- One vote per address per proposal is enforced
- Execution is time-locked until voting completion
- The frontend implements rate limiting and circuit breakers

## 📁 Project Structure

```
daogov-lite/
├── blockchain/               # Smart contracts
│   ├── build/                # Compiled contract artifacts
│   ├── DAOGovLite.sol        # Main governance contract
│   ├── GovernanceToken.sol   # Token contract
│   └── compile.js            # Compilation script
│
└── frontend/                 # Frontend application
    ├── app/                  # Next.js app directory
    ├── components/           # React components
    ├── contexts/             # Context providers
    ├── contracts/            # Contract ABIs and addresses
    └── lib/                  # Utilities and helpers
```

## 🛠️ Technologies Used

- **Blockchain**:
  - Solidity 0.8.20
  - OpenZeppelin Contracts 4.9.0
  - ethers.js

- **Frontend**:
  - Next.js 13 (App Router)
  - TypeScript
  - Tailwind CSS
  - React Context API
