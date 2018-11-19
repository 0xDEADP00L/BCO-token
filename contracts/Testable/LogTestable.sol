pragma solidity 0.4.25;

import "../Log.sol";


contract LogTestable is Log {
    function lngas(uint256 _x) public returns (int256) {
        return ln(_x);
    }
}
