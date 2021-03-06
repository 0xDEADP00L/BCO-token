pragma solidity 0.4.25;

import "./Ownable.sol";


contract Mortal is Ownable {
    function kill() public onlyOwner {
        selfdestruct(owner);
    }
}
