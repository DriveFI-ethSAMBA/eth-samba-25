// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title Car NFT ERC721 with car metadata stored on-chain
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CarNFT is ERC721URIStorage {
    uint256 private _currentId = 0; 

    struct Car {
        string vin;       // Vehicle Identification Number
        string make;
        string model;
        uint16 year;
        uint256 mileage;
        string extra;     // optional extra data
    }

    // tokenId => Car
    mapping(uint256 => Car) public cars;

    event CarMinted(address indexed owner, uint256 indexed tokenId, string vin);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /**
     * @notice Mint a new Car NFT and store car metadata on-chain
     * @param to recipient address
     * @param tokenURI optional token metadata URI
     * @param vin Vehicle Identification Number
     * @param make car make
     * @param model car model
     * @param year year of manufacture
     * @param mileage current mileage
     * @param extra optional extra string (e.g., RENAVAM, notes)
     */
    function mintCar(
        address to,
        string memory tokenURI,
        string memory vin,
        string memory make,
        string memory model,
        uint16 year,
        uint256 mileage,
        string memory extra
    ) external returns (uint256) {
        _currentId++;
        uint256 newId = _currentId;

        // mint NFT
        _safeMint(to, newId);
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(newId, tokenURI);
        }

        // store car metadata on-chain
        cars[newId] = Car({
            vin: vin,
            make: make,
            model: model,
            year: year,
            mileage: mileage,
            extra: extra
        });

        emit CarMinted(to, newId, vin);
        return newId;
    }

    /// helper to fetch car data
    function getCar(uint256 tokenId) external view returns (Car memory) {
        return cars[tokenId];
    }
}
