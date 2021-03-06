pragma solidity 0.4.25;

import "./BLLNTokenOptionTimed.sol";


contract BLLNTokenOptionDelegated is BLLNTokenOptionTimed {

    address public delegateAddress;

    constructor(address _dividendAddress, address _tokenAddress, uint _closeTime, address _delegateAddress) public
        BLLNTokenOptionTimed(_dividendAddress, _tokenAddress, _closeTime) {
        delegateAddress = _delegateAddress;
    }

    modifier onlyDelegate() {
        require(msg.sender == delegateAddress);
        _;
    }

    function withdrawDividends() public onlyDelegate {
        dividend.withdrawTo(delegateAddress);
    }

    function changeDelegate(address _newDelegate) public onlyDelegate {
        require(_newDelegate != address(0));
        delegateAddress = _newDelegate;
    }
}
