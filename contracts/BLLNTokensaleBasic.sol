pragma solidity 0.4.25;

import "./include/Ownable.sol";
import "./include/SafeMath.sol";
import "./include/CanReclaimToken.sol";
import "./BLLNTokensaleController.sol";


contract BLLNTokensaleBasic is Ownable, CanReclaimToken {
    using SafeMath for uint256;

    BLLNTokensaleController tokensaleController;
    uint256 tokenPrice;

    event PriceChanged(uint256 newTokenPrice);

    constructor(address _tokensaleController, uint256 _tokenPrice)
        public
    {
        require(_tokensaleController != address(0));
        require(_tokenPrice != 0);
        tokensaleController = BLLNTokensaleController(_tokensaleController);
        tokenPrice = _tokenPrice;
    }

    function ()
        external
        payable
    {
        buyTokens(msg.sender);
    }

    function buyTokens(address _receiver)
        public
        payable
    {
        require(msg.value >= tokenPrice, "Low value");

        uint256 tokenAmount = msg.value.div(tokenPrice);
        uint256 change = msg.value.sub(tokenAmount.mul(tokenPrice));
        require(tokensaleController.buyTokens.value(msg.value)(_receiver, tokenAmount, change));
    }

    function setPrice(uint256 _tokenPrice)
        public
        onlyOwner
    {
        require(_tokenPrice != 0);
        tokenPrice = _tokenPrice;
        emit PriceChanged(_tokenPrice);
    }
}
