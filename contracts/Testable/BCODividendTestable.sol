pragma solidity 0.4.24;

import {BCODividend} from "../BCODividend.sol";


contract BCODividendTestable is BCODividend {
    uint256 public changeCommon;

    constructor(uint256 _presaleTokenAmount, uint256 _maxTotalSupply) public
        BCODividend(_presaleTokenAmount, _maxTotalSupply) { }

    function buyToken() external payable {
        buyTokens(msg.sender);
    }

    function genAddressesWithTokens(uint _from, uint _to) public onlyOwner {
        for (uint i = _from; i < _to; i++) {
            address user = address(i);
            UserHistory memory userHistory;
            userHistory.tokens = i;
            userHistory.lastD_n = m_D_n;
            m_userHistories[user] = userHistory;
        }
    }

    function genAddressesWith1Tokens(uint _from, uint _to) public onlyOwner {
        for (uint i = _from; i < _to; i++) {
            address user = address(i);
            UserHistory memory userHistory;
            userHistory.tokens = 1;
            userHistory.lastD_n = m_D_n;
            m_userHistories[user] = userHistory;
        }
    }

    function getCommonContractBalance() public view returns (uint256) {
        return address(this).balance;
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

        changeCommon += change;
        require(m_token.mint(_receiver, tokens));
    }

    function getCommonChange() public view returns (uint256) {
        return changeCommon;
    }

    function getDividendBalance2(address _address) public view returns (uint256) {
        return m_dividendBalances[_address].add(getDividendAmount(_address));
    }
}
