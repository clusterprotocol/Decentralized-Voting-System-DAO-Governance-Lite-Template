# DAOGovLite - Blockchain

This directory contains the smart contracts for the DAOGovLite governance platform, implementing a decentralized autonomous organization (DAO) with proposal and voting capabilities.

## Contracts

Tip - To Fund Other User use node fund-user.js UserAddress

### DAOGovLiteWithToken.sol

The combined governance and token contract that handles:
- Proposal creation and management
- Voting mechanisms with delegation
- Execution of approved proposals
- Token management with automatic delegation
- Access control based on token holdings

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. The contracts use OpenZeppelin libraries (v4.9.0) for secure implementations of:
   - ERC20 token standard with voting extensions (ERC20Votes)
   - Access control via Ownable

## Compilation

Compile the contracts using the custom compilation script:

```
npm run compile
```

This will:
1. Read the Solidity source files
2. Compile using solc compiler
3. Generate ABI and bytecode files in the `build/` directory
4. Output separate files for each contract and interface

## Contract Deployment

To deploy the contract:

1. Create a `.env` file with your configuration (optional):
   ```
   PRIVATE_KEY=your_wallet_private_key
   ETH_PROVIDER_URL=your_rpc_endpoint
   ```

2. Run the deployment script:
   ```
   node deploy.js
   ```

3. The script will:
   - Deploy the combined DAOGovLiteWithToken contract
   - Save deployment information to `deployment-fixed-voting-info.json`
   - Output the contract address for frontend integration

## Token Management

### Important: Token Delegation

In this governance system, **delegation of tokens is required to activate voting power**:

- Tokens must be delegated before they can be used for voting
- By default, new tokens minted or transferred will now attempt to auto-delegate
- Without delegation, users can hold tokens but cannot vote

### Funding Users

Use the `fund-user.js` script to mint tokens to users:

```
node fund-user.js <recipient_address>
```

This script:
- Mints tokens to the specified address
- Attempts to check delegation status
- Provides instructions if delegation is needed

## User Voting Requirements

- **Proposal Creation**: Requires 1000 tokens minimum
- **Voting**: Requires any token balance with delegation
- **Execution**: Anyone can execute a passed proposal

## Integration with Frontend

The frontend application uses:
1. Contract ABIs from the `build` directory
2. Contract address specified in `deployment-fixed-voting-info.json`

## Troubleshooting

If users report issues with voting:
1. Verify they have delegated tokens (call `delegates(userAddress)`)
2. Check their token balance (call `balanceOf(userAddress)`)
3. Check voting power (call `getVotingPower(userAddress)`)
4. If power is 0 despite having tokens, delegate by calling `delegate(userAddress)`

## Development Notes

- Contracts use Solidity 0.8.20
- The `compile.js` script handles imports from OpenZeppelin automatically
- Proposal threshold is set to 1000 tokens (adjustable in the contract)
- Function access is restricted based on token holdings 