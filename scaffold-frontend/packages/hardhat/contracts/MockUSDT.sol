// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract usdtTest is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner, address[] memory users)
        ERC20("USDT", "USDT")
        Ownable(initialOwner)
    {
        for (uint256 i = 0; i < users.length; i++) {
            _mint(users[i], 100000 * 10 ** 6);
        }
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
