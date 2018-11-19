pragma solidity 0.4.25;

import "./include/Ownable.sol";
import "./BLLNDividendInterface.sol";
import "./include/ERC20.sol";


contract BLLNTokenOptionBase is Ownable {

    ERC20 public token;
    BLLNDividendInterface public dividend;

    constructor(address _dividendAddress, address _tokenAddress) public {
        require(_dividendAddress != address(0));
        require(_tokenAddress != address(0));
        dividend = BLLNDividendInterface(_dividendAddress);
        token = ERC20(_tokenAddress);
    }

    function canTransferTokens() public view returns (bool) {
        return true;
    }

    function getTokenAmount() public view returns (uint) {
        return token.balanceOf(address(this));
    }

    function getDividendBalance() public view returns (uint) {
        return dividend.getDividendBalance(address(this));
    }

    function transferTokens(address _to, uint _amount) public onlyOwner {
        require(canTransferTokens());
        require(_to != address(0));
        require(_amount != 0);
        token.transfer(_to, _amount);
    }

    function withdrawDividends() public onlyOwner {
        dividend.withdrawTo(owner);
    }
}
