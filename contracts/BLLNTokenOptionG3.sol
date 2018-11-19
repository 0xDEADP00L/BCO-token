pragma solidity 0.4.25;

import "./BLLNTokenOptionDelegated.sol";


contract BLLNTokenOptionG3 is BLLNTokenOptionDelegated {

    address public g3Address;

    constructor(address _dividendAddress, address _tokenAddress, uint _closeTime, address _delegatedAddress, address _g3Address) public
        BLLNTokenOptionDelegated(_dividendAddress, _tokenAddress, _closeTime, _delegatedAddress) {
        g3Address = _g3Address;
    }

    function transferTokens(address /* _to */, uint /* _amount */) public {
        revert("Use transferToken(uint)");
    }

    function transferToken(uint _amount) public onlyOwner {
        require(canTransferTokens());
        require(g3Address != address(0));
        require(_amount != 0);
        token.transfer(g3Address, _amount);
    }
}
