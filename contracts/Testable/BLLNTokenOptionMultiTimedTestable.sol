pragma solidity 0.4.25;

import "../BLLNTokenOptionMultiTimed.sol";


contract BLLNTokenOptionMultiTimedTestable is BLLNTokenOptionMultiTimed {

    constructor(address _dividendAddress, address _tokenAddress) public
        BLLNTokenOptionMultiTimed(_dividendAddress, _tokenAddress) {
    }

    function pointsCount() public view returns (uint) {
        return timePoints.length;
    }

    function tokenAmountFor(uint _timePointIndex) view public returns (uint) {
        return tokenStage[_timePointIndex];
    }


}
