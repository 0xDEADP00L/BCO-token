pragma solidity 0.4.24;

import "./include/MintableToken.sol";
import "./include/CanReclaimToken.sol";
import "./BLLNDividendInterface.sol";

contract BLLNToken is MintableToken, CanReclaimToken {
    string public constant name = "Billion Token";
    string public constant symbol = "BLLN";
    uint32 public constant decimals = 0;
    uint256 public constant maxTotalSupply = 250*(10**6);
    BLLNDividendInterface public dividend;

    constructor(address _dividendAddress) public {
        require(_dividendAddress != address(0));
        dividend = BLLNDividendInterface(_dividendAddress);
    }

    modifier canMint() {
        require(totalSupply_ < maxTotalSupply);
        _;
    }

    modifier onlyDividend() {
        require(msg.sender == address(dividend));
        _;
    }

    modifier onlyPayloadSize(uint size) {
        require(msg.data.length == size + 4);
        _;
    }

    function () public {}

    function mint(address _to, uint256 _amount) public onlyDividend canMint returns (bool) {
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
