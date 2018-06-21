pragma solidity 0.4.24;

import "./BLLNTokenOptionTimed.sol";


contract BLLNTokenOptionDelegated is BLLNTokenOptionTimed {

    address public m_delegateAddress;

    constructor(address _dividendAddress, address _tokenAddress, uint _closeTime, address _delegateAddress) public
        BLLNTokenOptionTimed(_dividendAddress, _tokenAddress, _closeTime) {
        m_delegateAddress = _delegateAddress;
    }

    modifier onlyDelegate() {
        require(msg.sender == m_delegateAddress);
        _;
    }

    function withdrawDividends(uint _amount) public onlyDelegate {
        require(_amount != 0);
        m_dividend.withdrawTo(m_delegateAddress, _amount);
    }

    function changeDelegate(address _newDelegate) public onlyDelegate {
        require(_newDelegate != address(0));
        m_delegateAddress = _newDelegate;
    }
}
