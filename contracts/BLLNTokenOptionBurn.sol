pragma solidity 0.4.25;

import "./BLLNTokenOptionBase.sol";


contract BLLNTokenOptionBurn is BLLNTokenOptionBase {

    address public burnAddress;

    constructor(address _dividendAddress, address _tokenAddress, address _burnAddress) public
        BLLNTokenOptionBase(_dividendAddress, _tokenAddress) {
            require(_burnAddress != address(0));
            burnAddress = _burnAddress;
    }

    function transferTokens(address /* _to */, uint /* _amount */) public {
        revert("Use burnTokens(uint)");
    }

    function burnTokens(uint _amount) public onlyOwner {
        require(canTransferTokens());
        require(_amount != 0);
        token.transfer(burnAddress, _amount);
    }
}
