const fs = require("fs");
const path = require("path");
const solc = require("solc");

// Define contract files to compile
const contractFiles = ['DAOGovLiteWithToken.sol'];
const buildPath = path.join(__dirname, "build");

// Ensure build directory exists
if (!fs.existsSync(buildPath)) {
  fs.mkdirSync(buildPath);
}

// Read the content of the contract files
const sources = {};
contractFiles.forEach(contractFile => {
  const filePath = path.resolve(__dirname, contractFile);
  sources[contractFile] = {
    content: fs.readFileSync(filePath, 'utf8')
  };
});

// Import callback for OpenZeppelin and other imports
function findImports(importPath) {
  try {
    // Handle OpenZeppelin imports
    if (importPath.startsWith("@openzeppelin/")) {
      const modulePath = path.join(__dirname, "node_modules", importPath);
      return {
        contents: fs.readFileSync(modulePath, 'utf8')
      };
    }
    
    // Handle local imports (if any)
    const localPath = path.resolve(__dirname, importPath);
    if (fs.existsSync(localPath)) {
      return {
        contents: fs.readFileSync(localPath, 'utf8')
      };
    }
    
    return { error: `File not found: ${importPath}` };
  } catch (error) {
    console.error(`Error reading import: ${importPath}`, error);
    return { error: `Error reading ${importPath}: ${error.message}` };
  }
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

console.log("Compiling contracts...");

try {
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  // Error handling
  if (output.errors) {
    output.errors.forEach(err => {
      console[err.severity === 'error' ? 'error' : 'warn'](err.formattedMessage);
    });
    if (output.errors.some(err => err.severity === 'error')) {
      console.error("Compilation failed");
      process.exit(1);
    }
  }

  // Write ABIs and bytecode to files
  for (const contractFileName in output.contracts) {
    for (const contractName in output.contracts[contractFileName]) {
      const contract = output.contracts[contractFileName][contractName];
      
      // Write ABI to file
      fs.writeFileSync(
        path.join(buildPath, `${contractName}.abi`),
        JSON.stringify(contract.abi, null, 2)
      );
      
      // Write bytecode to file
      fs.writeFileSync(
        path.join(buildPath, `${contractName}.bin`),
        contract.evm.bytecode.object
      );
      
      console.log(`✅ Compiled ${contractName} successfully!`);
      console.log(`- ABI saved to: ${path.join(buildPath, `${contractName}.abi`)}`);
      console.log(`- Bytecode saved to: ${path.join(buildPath, `${contractName}.bin`)}`);
    }
  }
} catch (error) {
  console.error("Compilation error:", error);
  process.exit(1);
} 