// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DAOGovLiteWithToken
 * @dev A combined DAO governance contract with an embedded governance token
 */
contract DAOGovLiteWithToken is ERC20Votes, Ownable {
    using Counters for Counters.Counter;

    // Custom errors for gas optimization
    error InsufficientTokens();
    error EmptyTitle();
    error EmptyDescription();
    error InvalidDuration();
    error ProposalNotFound();
    error AlreadyVoted();
    error VotingPeriodEnded();
    error ProposalCanceled();
    error ProposalExecuted();
    error NoVotingPower();
    error VotingPeriodNotEnded();
    error ProposalRejected();
    error NotProposer();
    error AlreadyCanceled();
    error TokensAlreadyClaimed();
    error ExceedsMaxSupply();

    // Maximum supply of tokens (1 million tokens with 18 decimals)
    uint256 private constant MAX_SUPPLY = 1000000 * 10**18;
    
    // Default amount of tokens for new users
    uint256 public defaultUserTokens = 500 * 10**18; // 500 tokens by default (increased from 100)
    
    // Minimum amount of tokens required to create a proposal
    uint256 private constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 tokens
    
    // Mapping to track which addresses have claimed their default tokens
    mapping(address => bool) public hasClaimedDefaultTokens;
    
    // Proposal counter with default starting value of 1
    Counters.Counter private _proposalIdCounter;
    
    // Proposal struct - optimized for tight packing
    struct Proposal {
        address proposer;
        uint64 startTime;   // Packed together with endTime
        uint64 endTime;
        bool executed;      // These booleans pack together in a single slot
        bool canceled;
        uint256 forVotes;
        uint256 againstVotes;
        string title;
        string description;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteSupport; // Track which way each user voted
    }
    
    // Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) private _proposals;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint64 startTime,
        uint64 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes
    );
    
    event ProposalExecutionComplete(uint256 indexed proposalId);
    
    event ProposalCancelationComplete(uint256 indexed proposalId);
    
    /**
     * @dev Constructor with default token name, symbol, and initial supply
     * @param name Token name (defaults to "DAOGovToken" if empty)
     * @param symbol Token symbol (defaults to "DGT" if empty)
     */
    constructor(string memory name, string memory symbol) 
        ERC20(bytes(name).length > 0 ? name : "DAOGovToken", 
              bytes(symbol).length > 0 ? symbol : "DGT")
        ERC20Permit(bytes(name).length > 0 ? name : "DAOGovToken")
        Ownable()
    {
        // Default governance token value: 10% of MAX_SUPPLY
        _mint(msg.sender, 100000 * 10**18); 
        
        // Default token ID: Start proposal IDs at 1
        _proposalIdCounter.increment();
    }
    
    /**
     * @dev Creates a new proposal
     * @param title The title of the proposal
     * @param description The description of the proposal
     * @param duration The duration of the voting period in seconds
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 duration
    ) external returns (uint256) {
        if (balanceOf(msg.sender) < PROPOSAL_THRESHOLD) revert InsufficientTokens();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (duration == 0) revert InvalidDuration();
        
        uint256 proposalId = _proposalIdCounter.current();
        
        Proposal storage proposal = _proposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = uint64(block.timestamp);
        
        // Using unchecked for gas optimization - duration is unlikely to cause overflow
        unchecked {
            proposal.endTime = uint64(block.timestamp + duration);
        }
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            description,
            proposal.startTime,
            proposal.endTime
        );
        
        // Using unchecked for gas optimization since _proposalIdCounter is unlikely to overflow
        unchecked {
            _proposalIdCounter.increment();
        }
        
        return proposalId;
    }
    
    /**
     * @dev Votes on a proposal
     * @param proposalId The ID of the proposal
     * @param support Whether to vote for (true) or against (false) the proposal
     */
    function vote(uint256 proposalId, bool support) external {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.hasVoted[msg.sender]) revert AlreadyVoted();
        if (uint64(block.timestamp) > proposal.endTime) revert VotingPeriodEnded();
        if (proposal.canceled) revert ProposalCanceled();
        if (proposal.executed) revert ProposalExecuted();
        
        // Check if the user has delegated their voting power yet
        if (delegates(msg.sender) == address(0)) {
            // Auto-delegate to self if not yet delegated
            _delegate(msg.sender, msg.sender);
        }
        
        uint256 votes = balanceOf(msg.sender);
        if (votes == 0) revert NoVotingPower();
        
        // Using unchecked for gas optimization since votes is unlikely to cause overflow
        unchecked {
            if (support) {
                proposal.forVotes += votes;
            } else {
                proposal.againstVotes += votes;
            }
        }
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteSupport[msg.sender] = support; // Track vote direction
        
        emit VoteCast(proposalId, msg.sender, support, votes);
    }
    
    /**
     * @dev Executes a proposal
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.executed) revert ProposalExecuted();
        if (proposal.canceled) revert ProposalCanceled();
        if (uint64(block.timestamp) <= proposal.endTime) revert VotingPeriodNotEnded();
        if (proposal.forVotes <= proposal.againstVotes) revert ProposalRejected();
        
        proposal.executed = true;
        
        emit ProposalExecutionComplete(proposalId);
    }
    
    /**
     * @dev Cancels a proposal (only by proposer)
     * @param proposalId The ID of the proposal to cancel
     */
    function cancelProposal(uint256 proposalId) external {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.executed) revert ProposalExecuted();
        if (proposal.canceled) revert AlreadyCanceled();
        if (msg.sender != proposal.proposer) revert NotProposer();
        
        proposal.canceled = true;
        
        emit ProposalCancelationComplete(proposalId);
    }
    
    /**
     * @dev Gets proposal details
     * @param proposalId The ID of the proposal
     * @return proposer The address of the proposer
     * @return title The title of the proposal
     * @return description The description of the proposal
     * @return startTime The start time of the proposal
     * @return endTime The end time of the proposal
     * @return forVotes The number of votes in favor
     * @return againstVotes The number of votes against
     * @return executed Whether the proposal has been executed
     * @return canceled Whether the proposal has been canceled
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint64 startTime,
        uint64 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool canceled
    ) {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        
        Proposal storage proposal = _proposals[proposalId];
        
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.canceled
        );
    }
    
    /**
     * @dev Gets list of all proposal IDs (iterates using counter)
     * @return Array of proposal IDs
     */
    function getProposals() external view returns (uint256[] memory) {
        uint256 count = _proposalIdCounter.current() - 1;
        uint256[] memory ids = new uint256[](count);
        
        // Use unchecked for gas optimization in the loop
        unchecked {
            for (uint256 i = 0; i < count; i++) {
                ids[i] = i + 1; // Proposal IDs start at 1
            }
        }
        
        return ids;
    }
    
    /**
     * @dev Gets proposal count
     * @return Current proposal count
     */
    function getProposalCount() external view returns (uint256) {
        unchecked {
            return _proposalIdCounter.current() - 1;
        }
    }
    
    /**
     * @dev Checks if a user has voted on a proposal and returns their vote choice
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return hasVoted Whether the user has voted
     * @return support The vote choice (true = for, false = against)
     */
    function getUserVote(uint256 proposalId, address voter) external view returns (bool hasVoted, bool support) {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        hasVoted = _proposals[proposalId].hasVoted[voter];
        
        // Only return support value if the user has voted
        if (hasVoted) {
            support = _proposals[proposalId].voteSupport[voter];
        }
        
        return (hasVoted, support);
    }
    
    /**
     * @dev Checks if a user has voted on a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return Whether the user has voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        if (!_proposalExists(proposalId)) revert ProposalNotFound();
        return _proposals[proposalId].hasVoted[voter];
    }
    
    /**
     * @dev Gets a user's voting power
     * @param voter The address of the voter
     * @return The voting power of the user
     */
    function getVotingPower(address voter) external view returns (uint256) {
        // Ensure we're returning actual voting power, not just token balance
        // If not delegated, return 0 as they have no voting power yet
        if (delegates(voter) == address(0)) {
            return 0;
        }
        // If they have delegated to themselves, return their token balance
        else if (delegates(voter) == voter) {
            return balanceOf(voter);
        }
        // Otherwise return their actual votes value
        else {
            return getVotes(voter);
        }
    }
    
    /**
     * @dev Mints new tokens to a specified address
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        unchecked {
            if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        }
        _mint(to, amount);
    }
    
    /**
     * @dev Allows a user to claim their default tokens (can only be done once per address)
     */
    function claimDefaultTokens() external {
        if (hasClaimedDefaultTokens[msg.sender]) revert TokensAlreadyClaimed();
        
        unchecked {
            if (totalSupply() + defaultUserTokens > MAX_SUPPLY) revert ExceedsMaxSupply();
        }
        
        hasClaimedDefaultTokens[msg.sender] = true;
        _mint(msg.sender, defaultUserTokens);
        
        // Explicitly delegate voting power to the sender to activate voting power
        _delegate(msg.sender, msg.sender);
        
        // Verify delegation worked
        if (delegates(msg.sender) == address(0)) {
            // Try again if it didn't work
            _delegate(msg.sender, msg.sender);
        }
    }
    
    /**
     * @dev Updates the default token amount for new users (only owner)
     * @param newDefaultAmount The new default amount of tokens
     */
    function setDefaultUserTokens(uint256 newDefaultAmount) external onlyOwner {
        defaultUserTokens = newDefaultAmount;
    }
    
    /**
     * @dev Check if a proposal exists
     * @param proposalId The ID of the proposal
     * @return Whether the proposal exists
     */
    function _proposalExists(uint256 proposalId) internal view returns (bool) {
        return proposalId > 0 && proposalId < _proposalIdCounter.current();
    }
    
    // The following functions are overrides required by Solidity

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
        
        // Auto-delegate to recipient if they're receiving tokens and haven't delegated yet
        if (to != address(0) && delegates(to) == address(0)) {
            _delegate(to, to);
        }
    }

    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20Votes) {
        super._burn(account, amount);
    }
} 