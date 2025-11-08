// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * VehicleSale.sol
 * - Accepts ERC20 installment payments (buyer must approve this contract)
 * - Tracks installmentsPaid
 * - Uses Chainlink Automation (KeeperCompatibleInterface) to automatically finalize sale:
 *    when installmentsPaid >= totalInstallments, Chainlink Automation will call performUpkeep,
 *    which transfers the NFT to buyer and transfers the accumulated ERC20 balance to seller.
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Minimal KeeperCompatibleInterface definition to avoid import error
interface KeeperCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

contract VehicleSale is KeeperCompatibleInterface, ReentrancyGuard {
    // Participants
    address public seller;
    address public buyer;

    // NFT
    IERC721 public nft;
    uint256 public tokenId;

    // ERC20 payment token (ex: MockUSDT)
    IERC20 public paymentToken;

    // Installment plan
    uint256 public totalInstallments;
    uint256 public installmentsPaid;
    uint256 public installmentAmount; // in payment token's smallest unit

    // State
    bool public finalized;
    uint256 public startedAt;

    // Events
    event InstallmentPaid(address indexed payer, uint256 indexed installmentNumber, uint256 amount);
    event Finalized(address indexed seller, address indexed buyer, uint256 totalReceived);
    event NFTDeposited(address indexed from, uint256 indexed tokenId);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller");
        _;
    }

    constructor(
        address _seller,
        address _buyer,
        address _nftAddress,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _totalInstallments,
        uint256 _installmentAmount
    ) {
        require(_seller != address(0) && _buyer != address(0), "Invalid participants");
        require(_totalInstallments > 0, "Installments > 0");
        require(_installmentAmount > 0, "Amount > 0");

        seller = _seller;
        buyer = _buyer;
        nft = IERC721(_nftAddress);
        tokenId = _tokenId;
        paymentToken = IERC20(_paymentToken);
        totalInstallments = _totalInstallments;
        installmentAmount = _installmentAmount;
        finalized = false;
        installmentsPaid = 0;
    }

    /**
     * @notice Seller deposits the NFT into the contract escrow.
     * Seller must have approved this contract to transfer the token.
     */
    function escrowNFT() external onlySeller {
        // transfer NFT from seller to this contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        emit NFTDeposited(msg.sender, tokenId);
        // Mark start time when NFT deposited
        if (startedAt == 0) {
            startedAt = block.timestamp;
        }
    }

    /**
     * @notice Buyer pays one installment. Buyer must approve this contract for installmentAmount.
     */
    function payInstallment() external nonReentrant onlyBuyer {
        require(!finalized, "Sale finalized");
        // require contract holds the NFT (escrow)
        require(nft.ownerOf(tokenId) == address(this), "NFT not escrowed");

        // transfer installment from buyer to this contract
        bool ok = paymentToken.transferFrom(msg.sender, address(this), installmentAmount);
        require(ok, "ERC20 transferFrom failed");

        installmentsPaid += 1;
        emit InstallmentPaid(msg.sender, installmentsPaid, installmentAmount);
    }

    /// helper view
    function installmentsRemaining() external view returns (uint256) {
        if (installmentsPaid >= totalInstallments) return 0;
        return totalInstallments - installmentsPaid;
    }

    function totalInstallmentsView() external view returns (uint256) {
        return totalInstallments;
    }

    function installmentsPaidView() external view returns (uint256) {
        return installmentsPaid;
    }

    // ========== Chainlink Automation (Keepers) ==========
    /**
     * @notice checkUpkeep is called off-chain by Chainlink nodes to know if upkeep is needed.
     * We signal upkeepNeeded when escrow contains the NFT, sale is not finalized, and installments fully paid.
     */
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // upkeep needed when:
        // - not finalized
        // - contract owns the NFT
        // - installmentsPaid >= totalInstallments
        if (!finalized && nft.ownerOf(tokenId) == address(this) && installmentsPaid >= totalInstallments) {
            upkeepNeeded = true;
        } else {
            upkeepNeeded = false;
        }
        performData = "";
    }

    /**
     * @notice performUpkeep is called by Chainlink Automation when checkUpkeep returns true.
     * It finalizes the sale: transfers the NFT to buyer and sends the ERC20 balance to seller.
     */
    function performUpkeep(bytes calldata) external override nonReentrant {
        // double-check conditions (recommended pattern)
        if (finalized) { return; }
        if (nft.ownerOf(tokenId) != address(this)) { return; }
        if (installmentsPaid < totalInstallments) { return; }

        // Transfer NFT to buyer (contract must be owner)
        nft.safeTransferFrom(address(this), buyer, tokenId);

        // Transfer accumulated ERC20 funds to seller
        uint256 balance = paymentToken.balanceOf(address(this));
        if (balance > 0) {
            bool sent = paymentToken.transfer(seller, balance);
            require(sent, "ERC20 transfer to seller failed");
        }

        finalized = true;
        emit Finalized(seller, buyer, balance);
    }

    // emergency function for seller to reclaim NFT if sale not started / or by mutual agreement
    function sellerRetrieveNFT() external onlySeller {
        require(!finalized, "Already finalized");
        require(nft.ownerOf(tokenId) == address(this), "Contract not owner of NFT");
        nft.safeTransferFrom(address(this), seller, tokenId);
    }

    // receive ERC721 tokens (so escrowNFT safeTransferFrom works)
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
