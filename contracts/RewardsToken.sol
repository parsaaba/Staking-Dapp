// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract RewardsToken is ERC20 {

    uint public INITIAL_SUPPLY;
    address owner;


    constructor() ERC20("RewardsToken", "RTK") {

        owner = msg.sender;
        INITIAL_SUPPLY = 4 * (10**6) * (10**uint(decimals()));
        _mint(owner, INITIAL_SUPPLY);
        emit Transfer(address(0), owner, INITIAL_SUPPLY);
    }
}