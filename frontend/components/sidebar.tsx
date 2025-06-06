"use client"

import { useCallback, useEffect, useContext, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Plus, BarChart, Wallet, LogOut, ChevronRight } from "lucide-react"
import { cn, formatAddress } from "@/lib/utils"
import { Web3Context } from "@/contexts/Web3Context"
import { useSidebar } from "@/contexts/SidebarContext"
import { ethers } from "ethers"

type SidebarLinkProps = {
  icon: React.ReactNode;
  text: string;
  href: string;
  isExpanded: boolean;
  isActive?: boolean;
};

const SidebarLink = ({ icon, text, href, isExpanded, isActive = false }: SidebarLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300',
        isActive 
          ? 'bg-dao-neonPurple/20 text-white border-l-2 border-dao-neonPurple' 
          : 'text-gray-300 hover:bg-dao-darkPurple/30 hover:text-white'
      )}
    >
      <div className={cn(
        "transition-colors duration-300",
        isActive ? "text-dao-neonPurple" : "text-dao-lightBlue"
      )}>
        {icon}
      </div>
      {isExpanded && (
        <span className={cn(
          'transition-opacity duration-300 whitespace-nowrap',
          isExpanded ? 'opacity-100' : 'opacity-0'
        )}>
          {text}
        </span>
      )}
    </Link>
  );
};

// Add a helper function to safely execute contract calls
const safeContractCall = async <T,>(
  contractMethod: () => Promise<T>,
  fallbackValue: T,
  errorMessage = "Contract call failed"
): Promise<T> => {
  try {
    return await contractMethod();
  } catch (error: any) {
    console.warn(`${errorMessage}:`, error?.message || error);
    return fallbackValue;
  }
};

// Add helper to safely format addresses
const safeAddress = (address: string | null): string => {
  if (!address) {
    return ethers.constants.AddressZero;
  }
  
  try {
    // Check if this is a shortened/formatted address with ellipsis
    if (address.includes('...')) {
      console.warn("Detected shortened address format, cannot use for contract calls");
      return ethers.constants.AddressZero;
    }
    
    // Try to format the address properly using ethers
    const formattedAddress = ethers.utils.getAddress(address);
    return formattedAddress;
  } catch (e) {
    console.warn("Invalid address format:", address);
    return ethers.constants.AddressZero;
  }
};

const WalletButton = ({ 
  isConnected,
  isLoading,
  account,
  tokenBalance,
  onConnect,
  onDisconnect,
  isExpanded 
}: { 
  isConnected: boolean;
  isLoading: boolean;
  account: string | null;
  tokenBalance: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isExpanded: boolean;
}) => {
  // Add state and function to handle delegation
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegationStatus, setDelegationStatus] = useState<'none' | 'delegated' | 'unknown'>('unknown');
  const { contract } = useContext(Web3Context);
  
  // Format the account for display only
  const displayAccount = account ? formatAddress(account) : null;
  
  // Check delegation status on load
  useEffect(() => {
    const checkDelegation = async () => {
      if (!contract || !account) {
        setDelegationStatus('unknown');
        return;
      }
      
      // Ensure proper address format - using the FULL account from props
      const safeAccountAddress = safeAddress(account);
      
      // Direct balance check - this should be safer than other methods
      let balance = ethers.BigNumber.from(0);
      try {
        balance = await safeContractCall(
          () => contract.balanceOf(safeAccountAddress, { gasLimit: 300000 }),
          ethers.BigNumber.from(0),
          "Failed to get token balance"
        );
        
        // If user has no tokens, they can't delegate
        if (balance.eq(0)) {
          setDelegationStatus('none');
          return;
        }
      } catch (error) {
        console.error("Critical error checking token balance:", error);
        setDelegationStatus('unknown');
        return;
      }
      
      // Try multiple approaches with proper error handling
      let isDelegated = false;
      
      // Approach 1: Check delegation status directly (may fail due to ENS)
      try {
        const currentDelegate = await safeContractCall(
          () => contract.delegates(safeAccountAddress, { gasLimit: 300000 }),
          ethers.constants.AddressZero,
          "Failed to check delegation status"
        );
        
        if (currentDelegate !== ethers.constants.AddressZero) {
          isDelegated = true;
          setDelegationStatus('delegated');
          return;
        }
      } catch (error) {
        console.warn("Delegate check failed, trying alternative methods:", error);
      }
      
      // Approach 2: Check voting power vs balance
      try {
        const votingPower = await safeContractCall(
          () => contract.getVotingPower(safeAccountAddress, { gasLimit: 300000 }),
          ethers.BigNumber.from(0),
          "Failed to get voting power"
        );
        
        // If they have voting power, they must have delegated
        if (votingPower.gt(0)) {
          isDelegated = true;
          setDelegationStatus('delegated');
          return;
        }
      } catch (error) {
        console.warn("Voting power check failed:", error);
      }
      
      // If all checks failed to detect delegation, assume not delegated
      setDelegationStatus('none');
    };
    
    checkDelegation();
  }, [contract, account]);
  
  // Function to delegate tokens
  const delegateTokens = async () => {
    if (!contract || !account) {
      return;
    }
    
    // Ensure proper address format - using the FULL account from props
    const safeAccountAddress = safeAddress(account);
    
    setIsDelegating(true);
    
    try {
      // Use a more resilient approach with higher gas limit
      const gasLimit = 500000; // Higher gas limit to ensure transaction goes through
      
      const tx = await contract.delegate(safeAccountAddress, { gasLimit });
      
      // Wait for transaction with a timeout
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)
        )
      ]);
      
      setDelegationStatus('delegated');
      alert("Successfully delegated tokens! Your voting power is now active.");
    } catch (error: any) {
      console.error("Error delegating tokens:", error?.message || error);
      
      // Check if user rejected transaction
      if (error?.code === 4001) {
        alert("Transaction was rejected. Please try again.");
      } else {
        alert("Failed to delegate tokens. Please try again later.");
      }
    } finally {
      setIsDelegating(false);
    }
  };
  
  if (isExpanded) {
    return (
      <div className="glassmorphism p-4 rounded-lg">
        <div className="text-sm font-syne text-dao-lightPurple">Status</div>
        {isConnected && account ? (
          <>
            <div className="text-white font-medium mt-1">
              {displayAccount}
            </div>
            <div className="text-dao-lightBlue font-syne text-sm mb-3">
              {tokenBalance} Governance Tokens
            </div>
            
            {/* Add delegation button if not delegated */}
            {delegationStatus === 'none' && parseFloat(tokenBalance) > 0 && (
              <button
                onClick={delegateTokens}
                disabled={isDelegating}
                className="w-full bg-green-600 hover:bg-green-700 font-syne text-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 hover-glow-green mb-2"
              >
                {isDelegating ? "Delegating..." : "Activate Voting Power"}
              </button>
            )}
            
            {/* Show delegation status */}
            {delegationStatus === 'delegated' && (
              <div className="text-green-400 text-sm mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Voting Power Active
              </div>
            )}
            
            <button 
              onClick={onDisconnect}
              className="w-full bg-red-500 hover:bg-red-600 font-syne text-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 hover-glow-red"
            >
              Disconnect <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="text-white font-syne font-medium mt-1 mb-3">Wallet Not Connected</div>
            <button 
              onClick={onConnect}
              disabled={isLoading}
              className={`w-full bg-dao-neonPurple hover:bg-dao-neonPurple/80 font-synetext-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover-glow'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 font-syne border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </>
              ) : (
                <>
                  Connect Wallet <ChevronRight size={14} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    );
  } else {
    return (
      <div className="flex font-syne justify-center">
        <button 
          onClick={isConnected ? onDisconnect : onConnect}
          className={`w-10 h-10 rounded-full ${
            isConnected 
              ? 'bg-dao-lightBlue/20 border border-dao-lightBlue/30' 
              : 'bg-dao-deepBlue hover:bg-dao-neonPurple/20 border border-dao-neonPurple/30'
          } flex items-center justify-center transition-colors duration-300`}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-dao-neonPurple border-t-transparent rounded-full"></div>
          ) : (
            <Wallet size={18} className={isConnected ? 'text-dao-lightBlue' : 'text-dao-neonPurple'} />
          )}
        </button>
      </div>
    );
  }
};

export default function Sidebar() {
  const pathname = usePathname()
  const { isExpanded, setIsExpanded } = useSidebar();
  const { 
    account, 
    isConnected, 
    tokenBalance, 
    isLoading, 
    connectWallet, 
    disconnectWallet 
  } = useContext(Web3Context);

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={20} /> },
    { name: "Proposals", path: "/proposals", icon: <FileText size={20} /> },
    { name: "Create Proposal", path: "/create-proposal", icon: <Plus size={20} /> },
    { name: "Execution", path: "/execution", icon: <BarChart size={20} /> },
  ]

  // Check if a route is active
  const isRouteActive = useCallback((path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  }, [pathname]);

  // Add an effect that adjusts the main content margin when sidebar state changes
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Add a small delay to make the transition smooth
      setTimeout(() => {
        mainContent.style.marginLeft = isExpanded ? '16rem' : '4rem';
        mainContent.style.transition = 'margin-left 0.3s ease';
      }, 50);
    }
    
    // Dispatch a custom event for other components to listen to
    const event = new CustomEvent('sidebarStateChanged', { detail: { isExpanded } });
    window.dispatchEvent(event);
    
    // Cleanup function to reset margin when component unmounts
    return () => {
      if (mainContent) {
        mainContent.style.marginLeft = '0';
      }
    };
  }, [isExpanded]);

  // Format the account address for DISPLAY ONLY - not for contract interactions
  const formattedAccountDisplay = account ? formatAddress(account) : null;
  
  // Format token balance for display
  const formattedBalance = tokenBalance 
    ? parseFloat(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '0';

  return (
    <div 
      className={cn(
        'h-screen fixed top-0 left-0 bg-dao-deepBlue/90 backdrop-blur-sm transition-all duration-300 border-r border-dao-neonPurple/20 z-40 hover:shadow-lg hover:shadow-dao-neonPurple/5',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          'flex items-center p-3 border-b border-dao-neonPurple/20',
          isExpanded ? 'justify-between' : 'justify-center'
        )}>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <span className="font-syne font-bold text-white">DAOGovLite</span>
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-dao-lightPurple hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-dao-neonPurple/10"
          >
            <ChevronRight className={cn(
              "transition-transform duration-300",
              isExpanded ? "rotate-180" : "rotate-0"
            )} />
          </button>
        </div>

        <div className="flex flex-col flex-1 py-6 px-2 gap-2">
          {navItems.map((item) => (
            <SidebarLink 
              key={item.path}
              icon={item.icon} 
              text={item.name} 
              href={item.path} 
              isExpanded={isExpanded} 
              isActive={isRouteActive(item.path)}
            />
          ))}
        </div>

        <div className={cn(
          'p-3 border-t border-dao-neonPurple/20 mt-auto',
          isExpanded ? 'space-y-4' : ''
        )}>
          <WalletButton
            isConnected={isConnected}
            isLoading={isLoading}
            account={account}
            tokenBalance={formattedBalance}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            isExpanded={isExpanded}
          />
          

        </div>
      </div>
    </div>
  )
}

