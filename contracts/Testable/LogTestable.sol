pragma solidity 0.4.24;

import "../Log.sol";


contract LogTestable is Log {
    function lngas(uint256 _x) public pure returns (int256) {
        return ln(_x);
    }
}
