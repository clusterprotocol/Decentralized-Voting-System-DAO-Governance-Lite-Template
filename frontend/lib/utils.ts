import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethers } from "ethers"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  
  // If the address is already truncated (contains '...'), return as is
  if (address.includes('...')) {
    return address;
  }
  
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

export function formatNumber(num: number | string, decimals = 0): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  return value.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Calculate time remaining in human readable format
export function calculateTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  let remaining = endTime - now;
  
  if (remaining <= 0) return "0:00:00";
  
  const days = Math.floor(remaining / 86400);
  remaining -= days * 86400;
  
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  
  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;
  
  const seconds = remaining;
  
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Convert proposal status from contract to UI format
export function getProposalStatus(
  endTime: number, 
  executed: boolean, 
  canceled: boolean, 
  forVotes: ethers.BigNumber | number, 
  againstVotes: ethers.BigNumber | number
): 'Active' | 'Pending' | 'Executed' | 'Failed' | 'Rejected' {
  const now = Math.floor(Date.now() / 1000);
  
  if (canceled) {
    return 'Failed';
  }
  
  if (executed) {
    return 'Executed';
  }
  
  if (now > endTime) {
    // Handle comparison for BigNumber objects
    if (forVotes instanceof ethers.BigNumber && againstVotes instanceof ethers.BigNumber) {
      return forVotes.gt(againstVotes) ? 'Pending' : 'Rejected';
    }
    // Handle regular number comparison
    return forVotes > againstVotes ? 'Pending' : 'Rejected';
  }
  
  return 'Active';
}
