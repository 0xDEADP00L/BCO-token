pragma solidity 0.4.24;

import "./include/Ownable.sol";
import "./include/SafeMath.sol";
import "./include/CanReclaimToken.sol";
import "./BCOToken.sol";
import "./BCODividendInterface.sol";
import "./Log.sol";


contract BCODividend is Ownable, Log, BCODividendInterface, CanReclaimToken {
    using SafeMath for uint256;

    struct UserHistory {
        uint256 lastD_n;
        uint256 tokens;
    }

    uint256 internal constant rounding = 10**18;

    BCOToken public m_token;
    uint256 public m_sharedDividendBalance;
    uint256 private m_presaleTokenAmount;
    uint256 public m_maxTotalSupply;
    uint256 public m_tokenPrice = 170 szabo; // 0.11$
    uint256 public m_tokenDiscountThreshold;

    uint256 public m_D_n;
    uint256 public m_totalTokens;
    mapping (address => uint256) public m_dividendBalances;
    mapping (address => UserHistory) public m_userHistories;

    constructor(uint256 _presaleTokenAmount, uint256 _maxTotalSupply) public {
        require(_maxTotalSupply > 0);

        owner = msg.sender;
        m_presaleTokenAmount = _presaleTokenAmount;
        m_maxTotalSupply = _maxTotalSupply;
        m_tokenDiscountThreshold = 10**4;
    }

    modifier extendOwner {
        require(address(m_token) != address(0));
        require((msg.sender == owner) || (msg.sender == address(m_token)));
        _;
    }

    modifier onlyToken() {
        require(msg.sender == address(m_token));
        _;
    }

    function () external payable {
        buyTokens(msg.sender);
    }

    function setTokenAddress(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0));
        m_token = BCOToken(_tokenAddress);
    }

    function setTokenDiscountThreshold(uint256 _discountThreshold) external onlyOwner {
        require(_discountThreshold > 0);
        m_tokenDiscountThreshold = _discountThreshold;
    }

    function buyToken() external payable {
        buyTokens(msg.sender);
    }

    function withdraw(uint256 _amount) external {
        uint256 userBalance = m_dividendBalances[msg.sender].add(getDividendAmount(msg.sender));
        require(userBalance >= _amount);

        takeDividends(msg.sender);

        m_dividendBalances[msg.sender] = userBalance.sub(_amount);
        msg.sender.transfer(_amount);
    }

    function updateDividendBalance(uint256 _totalSupply, address _address, uint256 _tokensAmount) external onlyToken {
        m_totalTokens = m_totalTokens.add(_tokensAmount);
        require(m_totalTokens == _totalSupply);

        takeDividends(_address);
        m_userHistories[_address].tokens = m_userHistories[_address].tokens.add(_tokensAmount);
    }

    function transferTokens(address _from, address _to, uint256 _amount) external onlyToken returns (bool) {
        require(_from != address(0));
        require(_to != address(0));
        takeDividends(_from);
        takeDividends(_to);

        m_userHistories[_from].tokens = m_userHistories[_from].tokens.sub(_amount);
        m_userHistories[_to].tokens = m_userHistories[_to].tokens.add(_amount);
        return true;
    }

    function shareDividends() external onlyOwner payable {
        require(msg.value > 0);
        m_sharedDividendBalance = m_sharedDividendBalance.add(msg.value);
        m_D_n = m_D_n.add(msg.value.mul(rounding).div(m_totalTokens));
    }

    function getDividendBalance(address _address) external view returns (uint256) {
        return m_dividendBalances[_address].add(getDividendAmount(_address));
    }

    function getDividendAmount(address _address) public view returns (uint256) {
        UserHistory memory history = m_userHistories[_address];
        if (history.tokens == 0) {
            return 0;
        }

        uint256 dividends = m_D_n.sub(history.lastD_n).mul(history.tokens);

        dividends = dividends.div(rounding);

        return dividends;
    }

    function buyTokens(address _receiver) public payable {
        require(msg.value > 0);

        uint256 totalSupply = m_token.totalSupply();
        uint256 tokens;
        uint256 change;
        (tokens, change) = calculateTokensFrom(msg.value, totalSupply);
        uint256 tokenPrice = msg.value.sub(change);

        m_sharedDividendBalance = m_sharedDividendBalance.add(tokenPrice);

        m_D_n = m_D_n.add(tokenPrice.mul(rounding).div(m_totalTokens));
        m_dividendBalances[_receiver] = m_dividendBalances[_receiver].add(change);

        require(m_token.mint(_receiver, tokens));
    }

    function getSellableTokenAmount() public view returns (uint256) {
        return m_maxTotalSupply.sub(m_presaleTokenAmount);
    }

    function calculateTokensFrom(uint256 _value, uint256 _totalSupply) public view returns (uint256, uint256) {
        require(_value >= m_tokenPrice);
        return calculateTokensAmountToSale(_value, _totalSupply);
    }

    function priceFor(uint256 _tokenAmount) public view returns (uint256) {
        uint256 price = m_tokenPrice.mul(_tokenAmount);
        return price;
    }

    function priceWithDiscount(uint256 _tokenAmount, uint256 _totalTokens) public view returns (uint256) {
        uint256 s = _totalTokens.add(_tokenAmount).mul(rounding).div(_totalTokens);
        int256 log = ln(s);
        return m_tokenPrice.mul(_totalTokens).mul(uint256(log)).div(rounding);
    }

    function tokensAmountFrom(uint256 _value) public view returns (uint256) {
        uint256 tokensAmount = _value.div(m_tokenPrice);
        return tokensAmount;
    }

    // MARK: Private functions
    function takeDividends(address _user) private {
        uint256 userAmount = getDividendAmount(_user);
        m_userHistories[_user].lastD_n = m_D_n;
        if (userAmount == 0) {
            return;
        }
        m_dividendBalances[_user] = m_dividendBalances[_user].add(userAmount);
        m_sharedDividendBalance = m_sharedDividendBalance.sub(userAmount);
    }

    function calculateTokensAmountToSale(uint256 _value, uint256 _totalSupply) private view returns (uint256, uint256) {
        uint256 maxTotalSupply = m_maxTotalSupply;
        require(_totalSupply < maxTotalSupply);

        uint256 remainingTokens = maxTotalSupply.sub(_totalSupply);
        uint256 remainingPrice = priceFor(remainingTokens);

        if (remainingPrice < _value) {
            return (remainingTokens, _value - remainingPrice);
        }

        uint256 approxTokens = tokensAmountFrom(_value);
        uint256 approxPrice;

        if (approxTokens >= m_tokenDiscountThreshold) {
            approxPrice = priceWithDiscount(approxTokens, _totalSupply);
        } else {
            approxPrice = priceFor(approxTokens);
        }

        uint256 change = _value.sub(approxPrice);
        return (approxTokens, change);
    }
}
