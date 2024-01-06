// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract AirdropToken is ERC20, Ownable, ERC20Permit {
    constructor()
        ERC20("AirdropToken", "AIR")
        Ownable()
        ERC20Permit("AirdropToken")
    {
        _mint(msg.sender, 100 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
