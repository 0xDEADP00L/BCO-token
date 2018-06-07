pragma solidity 0.4.24;

import "./include/MintableToken.sol";
import "./include/CanReclaimToken.sol";
import "./BCODividendInterface.sol";

contract BCOToken is MintableToken, CanReclaimToken {
    event PresaleFinished();

    string public constant name = "Billion Coin Offering";
    string public constant symbol = "BCO";
    uint32 public constant decimals = 0;
    uint256 public constant maxTotalSupply = 250*(10**6);
    BCODividendInterface public dividend;

    bool public m_presaleFinished = false;

    constructor(address _dividendAddress) public {
        require(_dividendAddress != address(0));
        dividend = BCODividendInterface(_dividendAddress);
    }

    modifier canMint() {
        require(totalSupply_ < maxTotalSupply);
        require(totalSupply() <= maxTotalSupply);
        _;
    }

    modifier extendOwner {
        require(address(dividend) != address(0));
        require((msg.sender == owner) || (msg.sender == address(dividend)));
        _;
    }

    modifier onlyPayloadSize(uint size) {
        require(msg.data.length == size + 4);
        _;
    }

    function () public {}

    function mintPresale(uint256 _presaleAmount, address _receiver) public onlyOwner returns (bool) {
        require(!m_presaleFinished);
        require(_presaleAmount > 0);
        require(_receiver != address(0));
        assert(mint(_receiver, _presaleAmount));
        return true;
    }

    function finishPresale() public onlyOwner returns (bool) {
        require(!m_presaleFinished);
        m_presaleFinished = true;
        emit PresaleFinished();
        return true;
    }

    function mint(address _to, uint256 _amount) public extendOwner canMint returns (bool) {
        require(_to != address(0));
        require(_amount != 0);
        uint256 newTotalSupply = totalSupply_.add(_amount);
        require(newTotalSupply <= maxTotalSupply);

        totalSupply_ = newTotalSupply;
        balances[_to] = balances[_to].add(_amount);

        dividend.updateDividendBalance(totalSupply_, _to, _amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function transfer(address _to, uint256 _value) public onlyPayloadSize(2*32) returns (bool) {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        require(dividend.transferTokens(msg.sender, _to, _value));
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

}
