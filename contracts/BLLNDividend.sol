pragma solidity 0.4.25;

import "./include/Ownable.sol";
import "./include/SafeMath.sol";
import "./include/CanReclaimToken.sol";
import "./BLLNDividendInterface.sol";


contract BLLNDividend is Ownable, BLLNDividendInterface, CanReclaimToken {
    using SafeMath for uint256;

    event PresaleFinished();

    event DividendsArrived(
        uint256 newD_n
    );

    struct UserHistory {
        uint256 lastD_n;
        uint256 tokens;
    }

    uint256 internal constant ROUNDING = 10**18;

    address public token;

    uint256 public sharedDividendBalance;

    uint256 public D_n;
    uint256 public totalTokens;
    mapping (address => uint256) public dividendBalances;
    mapping (address => UserHistory) public userHistories;

    constructor() public { }

    modifier onlyToken() {
        require(msg.sender == address(token));
        _;
    }

    function () public {
        _withdraw(msg.sender);
    }

    function setTokenAddress(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0));
        token = _tokenAddress;
    }

    function withdraw() external {
        _withdraw(msg.sender);
    }

    function withdrawTo(address _to) external {
        _withdrawTo(msg.sender, _to);
    }

    function tokensMinted(address _address, uint256 _tokensAmount) external onlyToken {
        totalTokens = totalTokens.add(_tokensAmount);

        _takeDividends(_address);
        userHistories[_address].tokens = userHistories[_address].tokens.add(_tokensAmount);
    }

    function tokensTransferred(address _from, address _to, uint256 _amount) external onlyToken returns (bool) {
        _takeDividends(_from);
        _takeDividends(_to);

        userHistories[_from].tokens = userHistories[_from].tokens.sub(_amount);
        userHistories[_to].tokens = userHistories[_to].tokens.add(_amount);
        return true;
    }

    function shareDividends() external payable {
        require(msg.value > 0);
        sharedDividendBalance = sharedDividendBalance.add(msg.value);
        D_n = D_n.add(msg.value.mul(ROUNDING).div(totalTokens));

        emit DividendsArrived(D_n);
    }

    function addToDividendBalance(address _address) external payable {
        dividendBalances[_address] = dividendBalances[_address].add(msg.value);
    }

    function getDividendBalance(address _address) external view returns (uint256) {
        return dividendBalances[_address].add(calculateDividendAmount(_address));
    }

    function calculateDividendAmount(address _address) public view returns (uint256) {
        UserHistory storage history = userHistories[_address];
        if (history.tokens == 0) {
            return 0;
        }
        uint256 diff_D_n = D_n.sub(history.lastD_n);
        if (diff_D_n == 0) {
            return 0;
        }

        return diff_D_n.mul(history.tokens).div(ROUNDING);
    }

    // MARK: Private functions
    function _withdraw(address _address) private {
        _takeDividends(_address);

        uint256 userBalance = dividendBalances[_address];
        require(userBalance > 0);

        dividendBalances[_address] = 0;
        _address.transfer(userBalance);
    }

    function _withdrawTo(address _from, address _to) private {
        require(_to != address(0));

        _takeDividends(_from);
        uint256 userBalance = dividendBalances[_from];
        require(userBalance > 0);

        dividendBalances[_from] = 0;
        _to.transfer(userBalance);
    }

    function _takeDividends(address _user) private {
        uint256 userAmount = calculateDividendAmount(_user);
        userHistories[_user].lastD_n = D_n;
        if (userAmount == 0) {
            return;
        }
        dividendBalances[_user] = dividendBalances[_user].add(userAmount);
        sharedDividendBalance = sharedDividendBalance.sub(userAmount);
    }
}
