pragma solidity 0.4.25;

import "./include/Ownable.sol";
import "./include/SafeMath.sol";
import "./include/CanReclaimToken.sol";
import "./include/MintableToken.sol";
import "./BLLNWhitelist.sol";
import "./BLLNDividendInterface.sol";
import "./Log.sol";


contract BLLNTokensaleController is Ownable, Log, CanReclaimToken, BLLNWhitelist {
    using SafeMath for uint256;

    event PresaleFinished();

    uint256 internal constant rounding = 10**18;

    MintableToken public token;
    BLLNDividendInterface public dividend;

    bool public presaleFinished;
    uint256 public maxTotalSupply;
    uint256 public tokenDiscountThreshold;

    mapping (address => uint256) public whitelistedTokensales;

    modifier onlyPresale() {
        require(!presaleFinished);
        _;
    }

    constructor(uint256 _maxTotalSupply, address _dividendAddress, address _tokenAddress)
        public
    {
        require(_maxTotalSupply > 0);
        require(_dividendAddress != address(0));
        require(_tokenAddress != address(0));

        presaleFinished = false;
        owner = msg.sender;
        maxTotalSupply = _maxTotalSupply;
        tokenDiscountThreshold = 10**4;
        dividend = BLLNDividendInterface(_dividendAddress);
        token = MintableToken(_tokenAddress);
    }

    function () public { }

    function setDividendAddress(address _dividendAddress)
        external
        onlyOwner
    {
        require(_dividendAddress != address(0));
        dividend = BLLNDividendInterface(_dividendAddress);
    }

    function setTokenAddress(address _tokenAddress)
        external
        onlyOwner
    {
        require(_tokenAddress != address(0));
        token = MintableToken(_tokenAddress);
    }

    function setTokenDiscountThreshold(uint256 _discountThreshold)
        external
        onlyOwner
    {
        require(_discountThreshold > 0);
        tokenDiscountThreshold = _discountThreshold;
    }

    function mintPresale(uint256 _presaleAmount, address _receiver)
        external
        onlyOwner
        onlyPresale
        returns (bool)
    {
        require(_presaleAmount > 0);
        require(_receiver != address(0));
        require(address(token) != address(0));
        require(address(dividend) != address(0));
        require(token.mint(_receiver, _presaleAmount));
        return true;
    }

    function finishPresale()
        external
        onlyOwner
        onlyPresale
        returns (bool)
    {
        presaleFinished = true;
        emit PresaleFinished();
        return true;
    }

    function buyTokens(address _receiver, uint256 _tokenAmount, uint256 _change)
        public
        onlyIfWhitelisted(msg.sender)
        payable
        returns (bool)
    {
        require(msg.value > 0);

        uint256 totalSupply = token.totalSupply();

        uint256 tokensToBuy;
        uint256 totalPrice;
        uint256 change;
        uint256 tokensPrice = msg.value.sub(_change);
        (tokensToBuy, totalPrice, change) = calculateTokensAmountToSale(tokensPrice, _tokenAmount, totalSupply);
        change = change.add(_change);

        dividend.shareDividends.value(totalPrice)();
        dividend.addToDividendBalance.value(change)(_receiver);
        require(token.mint(_receiver, tokensToBuy));
        return true;
    }

    // @dev Calculates token price with amount discount
    // @param _tokenPrice: Single token price
    // @param _tokenAmount: Total token amount to purchase
    // @param _totalTokens: Total available tokens at the moment
    function priceWithDiscount(uint256 _tokenPrice, uint256 _tokenAmount, uint256 _totalTokens)
        public
        pure
        returns (uint256)
    {
        uint256 s = _totalTokens.add(_tokenAmount).mul(rounding).div(_totalTokens);
        int256 log = ln(s);
        return _tokenPrice.mul(_totalTokens).mul(uint256(log)).div(rounding);
    }

    // MARK: Private functions
    // @dev Calculates available tokens to buy, total price and change
    // @param _value: Sent value for purchase
    // @param _tokenAmount: Token amount to purchase
    // @param _totalSupply: Current total supply
    // @returns (tokensToBuy, totalPrice, changeAmount)
    function calculateTokensAmountToSale(uint256 _value, uint256 _tokenAmount, uint256 _totalSupply)
        private
        view
        returns (uint256, uint256, uint256)
    {
        uint256 l_maxTotalSupply = maxTotalSupply;
        require(_totalSupply < l_maxTotalSupply);
        uint256 singlePrice = _value.div(_tokenAmount);

        uint256 tokensToBuy;
        uint256 remainingTokens = l_maxTotalSupply.sub(_totalSupply);
        if (remainingTokens < _tokenAmount) {
            tokensToBuy = remainingTokens;
        } else {
            tokensToBuy = _tokenAmount;
        }

        uint256 totalPrice;
        if (tokensToBuy >= tokenDiscountThreshold) {
            totalPrice = priceWithDiscount(singlePrice, tokensToBuy, _totalSupply);
        } else {
            totalPrice = tokensToBuy.mul(singlePrice);
        }

        uint256 change = _value.sub(totalPrice);
        return (tokensToBuy, totalPrice, change);
    }
}
