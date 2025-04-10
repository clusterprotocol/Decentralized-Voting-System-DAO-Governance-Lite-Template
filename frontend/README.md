# DAOGovLite - Frontend

This directory contains the frontend application for the DAOGovLite governance platform, providing a user interface for interacting with the blockchain contracts.

## Technology Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Interaction**: ethers.js
- **State Management**: React Context API

## Features

- **Wallet Connection**: Seamless integration with MetaMask and other Web3 wallets
- **Token Delegation**: Automatic and manual delegation to activate voting power
- **Proposal Management**:
  - Create new governance proposals
  - Vote on active proposals
  - Execute passed proposals
- **Dashboard**: View and manage your governance activities
- **Responsive Design**: Works on mobile and desktop devices

## Directory Structure

```
frontend/
├── app/                  # Next.js App Router pages
│   ├── proposals/        # Proposal listing and details
│   ├── execution/        # Proposal execution interface
│   ├── create-proposal/  # Proposal creation form
│   └── layout.tsx        # Main layout component
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── proposal-card.tsx # Proposal display component
│   └── ...
├── contexts/             # React Context providers
│   └── Web3Context.tsx   # Blockchain connectivity
├── contracts/            # Contract ABIs and addresses
│   ├── DAOGovLiteWithToken-abi.json
│   ├── DAOGovLiteWithToken-address.json
│   └── ...
├── lib/                  # Utility functions
│   ├── contracts/        # Contract utilities
│   └── utils.ts          # Helper functions
└── styles/               # Global styling
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Update contract address in `contracts/DAOGovLiteWithToken-address.json` and `lib/contracts/addresses.ts`:
   ```
   {
     "address": "your_deployed_contract_address"
   }
   ```

## Running the Application

Development mode:
```
npm run dev
```

Production build:
```
npm run build
npm start
```

## Contract Integration

The frontend integrates with the blockchain contracts through:

1. **JSON Contract Files**: Located in the `contracts/` directory:
   - ABI files containing contract interfaces
   - Address files with deployed contract addresses

2. **Web3Context**: Provides blockchain connectivity:
   - Wallet connection handling
   - Contract instance creation
   - Transaction management
   - Auto-delegation of tokens

## Key User Workflows

### Token Delegation (Important!)

For tokens to be usable for voting, they must be delegated:

1. **Auto-delegation**:
   - When a user connects their wallet, the application attempts to auto-delegate tokens
   - This happens in `Web3Context.tsx` via the `autoDelegateTokens` function

2. **Manual delegation**:
   - If auto-delegation fails, users can manually delegate via the "Activate Voting Power" button in the sidebar
   - Delegation status is visually indicated in the UI

### Voting Process

1. Users must have delegated tokens to vote (any non-zero amount)
2. Proposals require a minimum of 1000 tokens to create
3. Votes are recorded on-chain and in local storage for UI state management

## Troubleshooting

If users report issues with voting:

1. **Token delegation issues**:
   - Check if the wallet shows "Voting Power Active" indicator in the sidebar
   - If not, use the "Activate Voting Power" button
   - Verify delegation by checking the browser console logs

2. **UI display issues**:
   - Try disconnecting and reconnecting wallet
   - Clear browser localStorage and cache
   - Check browser console for errors

3. **Transaction errors**:
   - Ensure users have ETH for gas
   - Verify they're connected to the correct network

## Development Notes

- Use `app/` directory for creating new pages (Next.js App Router)
- Component styling is done with Tailwind utility classes
- Contract interaction should be done through the Web3Context 