pragma solidity 0.4.25;

import "./BLLNTokenOptionMultiTimed.sol";


contract BLLNTokenOptionMultiTimedDelegated is BLLNTokenOptionMultiTimed {

    address public delegateAddress;

    constructor(address _dividendAddress, address _tokenAddress, address _delegatedAddress) public
        BLLNTokenOptionMultiTimed(_dividendAddress, _tokenAddress) {
        delegateAddress = _delegatedAddress;
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
