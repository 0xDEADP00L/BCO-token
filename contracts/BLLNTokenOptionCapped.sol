pragma solidity 0.4.25;

import "./BLLNTokenOptionBase.sol";


contract BLLNTokenOptionCapped is BLLNTokenOptionBase {

    uint public maxTotalSupply;

    constructor(address _dividendAddress, address _tokenAddress, uint _maxTotalSupply) public
        BLLNTokenOptionBase(_dividendAddress, _tokenAddress) {
        maxTotalSupply = _maxTotalSupply;
    }

    function canTransferTokens() public view returns (bool) {
        uint currentTotalSupply = token.totalSupply();
        return currentTotalSupply >= maxTotalSupply;
    }
}
