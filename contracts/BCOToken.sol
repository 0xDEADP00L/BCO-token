pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import './BCODividendInterface.sol';
import './Mortal.sol';

contract BCOToken is MintableToken, Mortal {
	event PresaleFinished();

	string public constant name = "Billion Coin Offering_2";
	string public constant symbol = "BCO";
	uint32 public constant decimals = 0;
	uint256 public constant maxTotalSupply = 250*(10**6);
	BCODividendInterface public dividend;

	bool public m_presaleFinished = false;

	function BCOToken(address _dividendAddress) public {
		require(_dividendAddress != address(0));
		dividend = BCODividendInterface(_dividendAddress);
	}

	modifier canMint() {
		require(!mintingFinished);
		require(totalSupply() <= maxTotalSupply);
		_;
	}

	modifier extendOwner {
		require (address(dividend) != address(0));
		require ((msg.sender == owner) || (msg.sender == address(dividend)));
		_;
	}

	modifier onlyPayloadSize(uint size) {
		assert(msg.data.length == size + 4);
		_;
	}

	function mintPresale(uint256 _presaleAmount, address _receiver) onlyOwner public returns (bool) {
		require(!m_presaleFinished);
		require(_presaleAmount > 0);
		require(_receiver != address(0));
		assert(mint(_receiver, _presaleAmount));
		return true;
	}

	function finishPresale() onlyOwner public returns (bool) {
		require(!m_presaleFinished);
		m_presaleFinished = true;
		emit PresaleFinished();
		return true;
	}

	function mint(address _to, uint256 _amount) extendOwner canMint public returns (bool) {
		uint256 newTotalSupply = totalSupply_.add(_amount);
		assert(newTotalSupply <= maxTotalSupply);

		totalSupply_ = newTotalSupply;
		balances[_to] = balances[_to].add(_amount);

		dividend.updateDividendBalance(totalSupply_, _to, _amount);
		emit Mint(_to, _amount);
		emit Transfer(address(0), _to, _amount);
		if (totalSupply_ == maxTotalSupply) { mintingFinished = true; }
		return true;
	}

	function transfer(address _to, uint256 _value) onlyPayloadSize(2*32) public returns (bool) {
		require(_to != address(0));
		require(_value <= balances[msg.sender]);

		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);
		assert(dividend.transferTokens(msg.sender, _to, _value));
		emit Transfer(msg.sender, _to, _value);
		return true;
	}

	function getPercentageOfTokens() view public returns (uint256) {
		if (totalSupply_ == 0) { return 0; }
		uint256 addressTokens = balances[msg.sender];
		uint256 percent = addressTokens.mul(10**18).div(totalSupply_);
		return percent;
	}
}
