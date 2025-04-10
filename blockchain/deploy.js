const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const solc = require("solc");

// Read the contract source
const contractPath = path.join(__dirname, "DAOGovLiteWithToken.sol");
const contractSource = fs.readFileSync(contractPath, "utf8");

// Function to find all import statements in the contract
function findImports(importPath) {
  try {
    // Handle relative imports and OpenZeppelin imports
    let resolvedPath;
    if (importPath.startsWith('@openzeppelin')) {
      resolvedPath = path.resolve(__dirname, 'node_modules', importPath);
    } else {
      resolvedPath = path.resolve(path.dirname(contractPath), importPath);
    }
    
    return { contents: fs.readFileSync(resolvedPath, 'utf8') };
  } catch (e) {
    console.error(`Error finding import ${importPath}: ${e.message}`);
    return { error: `File not found: ${importPath}` };
  }
}

async function main() {
  try {
    console.log("Compiling updated DAOGovLiteWithToken contract with fixed voting...");
    
    // Prepare input for solc compiler
    const input = {
      language: "Solidity",
      sources: {
        "DAOGovLiteWithToken.sol": {
          content: contractSource,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200, // Balance between deployment cost and function call cost
        },
      },
    };

    // Compile with solc
    console.log("Running solc compiler...");
    const output = JSON.parse(
      solc.compile(JSON.stringify(input), { import: findImports })
    );

    // Check for errors
    if (output.errors) {
      let hasError = false;
      output.errors.forEach((error) => {
        if (error.severity === "error") {
          console.error(error.formattedMessage);
          hasError = true;
        } else {
          console.warn(error.formattedMessage);
        }
      });

      if (hasError) {
        console.error("Compilation failed");
        process.exit(1);
      }
    }

    const contractOutput = output.contracts["DAOGovLiteWithToken.sol"]["DAOGovLiteWithToken"];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    // Save ABI and bytecode to files
    const buildDir = path.join(__dirname, "build");
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    fs.writeFileSync(
      path.join(buildDir, "DAOGovLiteWithToken-Fixed.abi"),
      JSON.stringify(abi)
    );
    fs.writeFileSync(path.join(buildDir, "DAOGovLiteWithToken-Fixed.bin"), bytecode);

    console.log("Contract compiled successfully");

    // Provider setup
    const providerUrl = process.env.ETH_PROVIDER_URL || "https://eth-sepolia.g.alchemy.com/v2/b20Yg4jZMHRLeuzNknS1pSAgta1Plerw";
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    // Get current network gas prices
    const feeData = await provider.getFeeData();
    console.log(`Current gas price: ${ethers.utils.formatUnits(feeData.gasPrice, "gwei")} gwei`);

    // Wallet setup
    const privateKey = process.env.PRIVATE_KEY || "8bc708c3614cb179e59ba85d2f161ab59bc38fff75659ca5310fc2219e84ae6d"
    const wallet = new ethers.Wallet(privateKey, provider);

    // Check wallet balance
    const balance = await wallet.getBalance();
    console.log(`Deploying from wallet: ${wallet.address}`);
    console.log(`Current wallet balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (parseFloat(ethers.utils.formatEther(balance)) < 0.02) {
      console.warn("Warning: Low ETH balance. You may need more ETH to deploy.");
    }

    // Token details
    const tokenName = "DAOGovToken";
    const tokenSymbol = "DGT";

    console.log(`Deploying updated DAOGovLiteWithToken contract with name=${tokenName} and symbol=${tokenSymbol}...`);

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    // Using EIP-1559 gas settings
    const maxFeePerGas = feeData.maxFeePerGas.mul(130).div(100); // 30% higher than current
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(110).div(100); // 10% higher than current
    
    console.log(`Using maxFeePerGas: ${ethers.utils.formatUnits(maxFeePerGas, "gwei")} gwei`);
    console.log(`Using maxPriorityFeePerGas: ${ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
    
    // Deploy with optimized gas settings
    const deploymentOptions = {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: 5000000 // Fixed gas limit
    };

    // Deploy contract
    const contract = await factory.deploy(tokenName, tokenSymbol, deploymentOptions);
    console.log(`Deployment transaction hash: ${contract.deployTransaction.hash}`);

    console.log("Waiting for transaction to be mined...");
    await contract.deployed();

    console.log(`Contract deployed successfully at address: ${contract.address}`);

    // Save deployment information
    const receipt = await contract.deployTransaction.wait();
    const deploymentInfo = {
      contractAddress: contract.address,
      transactionHash: contract.deployTransaction.hash,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      network: (await provider.getNetwork()).name,
      gasUsed: receipt.gasUsed.toString(),
      totalCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
      defaultTokenAmount: "500",
      features: ["FixedVoting", "AutoVotingPower", "IncreasedDefaultTokens", "AutoDelegation"]
    };

    fs.writeFileSync(
      path.join(__dirname, "deployment-fixed-voting-info.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`Deployment information saved to deployment-fixed-voting-info.json`);
    console.log(`\nFrontend Integration Instructions:`);
    console.log(`1. Update your frontend config with the new contract address: ${contract.address}`);
    console.log(`2. Users will now automatically get 500 DGT tokens with voting power when they claim tokens`);
    console.log(`3. No need for separate delegation transactions - voting power is auto-delegated`);
    console.log(`4. Voting display will now correctly show user's actual vote choice`);

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main(); 