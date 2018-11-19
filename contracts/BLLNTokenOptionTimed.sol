pragma solidity 0.4.25;

import "./BLLNTokenOptionBase.sol";


contract BLLNTokenOptionTimed is BLLNTokenOptionBase {

    uint256 public closingTime;

    constructor(address _dividendAddress, address _tokenAddress, uint _closeTime) public
        BLLNTokenOptionBase(_dividendAddress, _tokenAddress) {
        closingTime = _closeTime;
    }

    function canTransferTokens() public view returns (bool) {
        return now >= closingTime;
    }
}
