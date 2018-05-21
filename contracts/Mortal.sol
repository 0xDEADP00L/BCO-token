pragma solidity ^0.4.18;

import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Mortal is Ownable {
    function kill() onlyOwner public {
        selfdestruct(owner);
    }
}
