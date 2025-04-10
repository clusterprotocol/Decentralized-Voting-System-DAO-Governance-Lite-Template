const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Get recipient address from command line argument
    const recipientAddress = process.argv[2];
    if (!recipientAddress || !ethers.utils.isAddress(recipientAddress)) {
      console.error("Error: Please provide a valid Ethereum address as an argument");
      console.log("Usage: node fund-user.js <ethereum_address>");
      process.exit(1);
    }

    // Contract address - update with your deployed contract address
    const contractAddress = "0xb56787e88E184b542702724280A96f6EA363A062"
    
    // Connect to provider
    const providerUrl = process.env.ETH_PROVIDER_URL || "https://eth-sepolia.g.alchemy.com/v2/b20Yg4jZMHRLeuzNknS1pSAgta1Plerw";
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    // Set up wallet from private key (must be contract owner)
    const privateKey = process.env.PRIVATE_KEY || "8bc708c3614cb179e59ba85d2f161ab59bc38fff75659ca5310fc2219e84ae6d"
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Using wallet address: ${wallet.address}`);
    
    // Check wallet balance
    const ethBalance = await wallet.getBalance();
    console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
    
    if (parseFloat(ethers.utils.formatEther(ethBalance)) < 0.01) {
      console.warn("Warning: Your ETH balance is low. Transaction might fail.");
    }
    
    // Load ABI
    const buildDir = path.join(__dirname, "build");
    const abiPath = path.join(buildDir, "DAOGovLiteWithToken.abi");
    
    let abi;
    if (fs.existsSync(abiPath)) {
      abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } else {
      console.error("ABI file not found. Please compile the contract first.");
      process.exit(1);
    }
    
    // Connect to contract with signer
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    // Check if the wallet is the contract owner
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error("Error: Your wallet is not the contract owner!");
      console.log(`Contract owner is: ${owner}`);
      console.log("You can only fund users if you are the contract owner.");
      process.exit(1);
    }
    
    console.log("You are the contract owner. Authorized to fund users.");
    
    // Get current total supply
    const totalSupply = await contract.totalSupply();
    let maxSupply;
    try {
      maxSupply = await contract.MAX_SUPPLY();
    } catch (error) {
      maxSupply = ethers.utils.parseUnits("1000000", 18);
      console.log("Note: Using hardcoded MAX_SUPPLY value from contract source.");
    }
    
    // Get default token amount
    const defaultAmount = await contract.defaultUserTokens();
    console.log(`Default token amount: ${ethers.utils.formatUnits(defaultAmount, 18)} DGT`);
    
    // Check if recipient has already claimed tokens
    const hasRecipientClaimed = await contract.hasClaimedDefaultTokens(recipientAddress);
    if (hasRecipientClaimed) {
      console.log(`\nWarning: Address ${recipientAddress} has already claimed their default tokens.`);
      console.log("Do you still want to send them tokens? This will increase their balance beyond the default amount.");
      
      // In a real application, you might want to add a prompt here to confirm
      // For simplicity, we'll continue with the funding
    }
    
    // Check recipient's current balance
    const currentBalance = await contract.balanceOf(recipientAddress);
    console.log(`\nRecipient address: ${recipientAddress}`);
    console.log(`Recipient's current balance: ${ethers.utils.formatUnits(currentBalance, 18)} DGT`);
    
    // Amount to mint (default token amount)
    console.log(`\nFunding recipient with ${ethers.utils.formatUnits(defaultAmount, 18)} DGT...`);
    
    // Check if minting would exceed max supply
    if (totalSupply.add(defaultAmount).gt(maxSupply)) {
      console.error("Error: Funding this user would exceed the maximum token supply!");
      const maxMintable = maxSupply.sub(totalSupply);
      console.log(`Maximum you can mint: ${ethers.utils.formatUnits(maxMintable, 18)} DGT`);
      process.exit(1);
    }
    
    // Get latest gas prices for optimized transaction
    console.log("Getting latest gas prices...");
    const feeData = await provider.getFeeData();
    
    // Add buffer to gas prices to ensure transaction goes through
    const maxFeePerGas = feeData.maxFeePerGas.mul(130).div(100);
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(110).div(100);
    
    console.log(`Using maxFeePerGas: ${ethers.utils.formatUnits(maxFeePerGas, "gwei")} gwei`);
    console.log(`Using maxPriorityFeePerGas: ${ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
    
    // Use a fixed gas limit
    const gasLimit = 200000;
    console.log(`Using fixed gas limit: ${gasLimit}`);
    
    // Mint tokens (using the mint function since we can't call claimDefaultTokens on behalf of someone else)
    const tx = await contract.mint(recipientAddress, defaultAmount, {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit
    });
    
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    console.log("Waiting for transaction to be mined...");
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Check new balance
    const newBalance = await contract.balanceOf(recipientAddress);
    console.log(`\nRecipient's new balance: ${ethers.utils.formatUnits(newBalance, 18)} DGT`);
    
    // Calculate tokens received
    const tokensReceived = newBalance.sub(currentBalance);
    console.log(`Tokens sent: ${ethers.utils.formatUnits(tokensReceived, 18)} DGT`);
    
    // Updated total supply
    const newTotalSupply = await contract.totalSupply();
    console.log(`New total supply: ${ethers.utils.formatUnits(newTotalSupply, 18)} DGT`);
    
    // Now attempt to delegate tokens for the recipient
    console.log("\n=== DELEGATION INFORMATION ===");
    console.log("To ensure the recipient can vote, they need to delegate their tokens.");
    
    try {
      // Check if recipient has already delegated
      const currentDelegate = await contract.delegates(recipientAddress);
      
      if (currentDelegate === ethers.constants.AddressZero) {
        console.log(`Recipient has not delegated their tokens yet. They currently have NO VOTING POWER.`);
        console.log(`\nRECIPIENT ACTION REQUIRED: The recipient must run this function to activate their voting power:`);
        console.log(`\n  await contract.delegate("${recipientAddress}")`);
        
        // We can try to do it for them if our contract has the feature for owner delegation
        console.log("\nAttempting to initiate delegation for recipient...");
        try {
          // See if the contract has an ownerDelegateFor function
          if (typeof contract.ownerDelegateFor === 'function') {
            const delegateTx = await contract.ownerDelegateFor(recipientAddress, {
              maxFeePerGas,
              maxPriorityFeePerGas,
              gasLimit: 150000
            });
            await delegateTx.wait();
            console.log("✅ Successfully delegated tokens for recipient!");
          } else {
            // If the function doesn't exist on the contract
            console.log("❌ Auto-delegation feature not available in contract.");
            console.log("Tell recipient they MUST delegate their tokens themselves to have voting power.");
          }
        } catch (delegateError) {
          console.log("❌ Couldn't auto-delegate for recipient: ", delegateError.message);
          console.log("Tell recipient they MUST delegate their tokens themselves to have voting power.");
        }
      } else if (currentDelegate.toLowerCase() === recipientAddress.toLowerCase()) {
        console.log(`✅ Recipient has already delegated to themselves. Voting power is active.`);
      } else {
        console.log(`ℹ️ Recipient has delegated to a different address: ${currentDelegate}`);
      }
    } catch (error) {
      console.error("Error checking delegation:", error.message);
    }
    
    console.log("\n=== IMPORTANT ===");
    console.log("If recipient's tokens aren't showing in the UI:");
    console.log("1. Make sure they've delegated their tokens");
    console.log("2. Try disconnecting and reconnecting the wallet");
    console.log("3. Clear browser cache and local storage");
    console.log("4. If using MetaMask, go to Settings > Advanced > Reset Account to clear transaction history");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 