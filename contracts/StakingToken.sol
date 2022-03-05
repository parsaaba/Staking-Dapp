// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract StakingToken is ERC20 {

    uint public INITIAL_SUPPLY;
    address owner;


    constructor() ERC20("StakingToken", "STK") {

        owner = msg.sender;
        INITIAL_SUPPLY = 6 * (10**6) * (10**uint(decimals()));
        _mint(owner, INITIAL_SUPPLY);
        emit Transfer(address(0), owner, INITIAL_SUPPLY);
    }
}