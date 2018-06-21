pragma solidity 0.4.24;

import "./include/Ownable.sol";
import "./BLLNDividendInterface.sol";
import "./BLLNToken.sol";


contract BLLNTokenOptionBase is Ownable {

    BLLNToken public m_token;
    BLLNDividendInterface public m_dividend;

    constructor(address _dividendAddress, address _tokenAddress) public {
        require(_dividendAddress != address(0));
        require(_tokenAddress != address(0));
        m_dividend = BLLNDividendInterface(_dividendAddress);
        m_token = BLLNToken(_tokenAddress);
    }

    function canTransferTokens() public view returns (bool) {
        return true;
    }

    function getTokenAmount() public view returns (uint) {
        return m_token.balanceOf(address(this));
    }

    function getDividendBalance() public view returns (uint) {
        return m_dividend.getDividendBalance(address(this));
    }

    function transferTokens(address _to, uint _amount) public onlyOwner {
        require(canTransferTokens());
        require(_to != address(0));
        require(_amount != 0);
        m_token.transfer(_to, _amount);
    }

    function withdrawDividends(uint _amount) public onlyOwner {
        require(_amount != 0);
        m_dividend.withdrawTo(owner, _amount);
    }

}
