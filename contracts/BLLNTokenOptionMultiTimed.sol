pragma solidity 0.4.24;

import "./BLLNTokenOptionBase.sol";


contract BLLNTokenOptionMultiTimed is BLLNTokenOptionBase {

    /// @dev key - stage, value - tokens amount
    mapping (uint => uint) public m_tokenStage;
    uint[] public m_timePoints;
    uint public transferredTokens;

    constructor(address _dividendAddress, address _tokenAddress) public
        BLLNTokenOptionBase(_dividendAddress, _tokenAddress) {}

    function addStage(uint _timePoint, uint _amount) public onlyOwner {
        require(_amount != 0);
        require(_timePoint != 0);

        if (m_timePoints.length != 0) {
            uint lastElementIndex = m_timePoints.length - 1;
            uint previosTimePoint = m_timePoints[lastElementIndex];
            uint previosTokenAmount = m_tokenStage[previosTimePoint];

            assert(_timePoint > previosTimePoint);
            assert(_amount > previosTokenAmount);

            m_timePoints.push(_timePoint);
            m_tokenStage[lastElementIndex + 1] =  _amount;

            return;
        }

        m_timePoints.push(_timePoint);
        m_tokenStage[0] =  _amount;
    }

    function canTransferTokens(uint _amount) public view returns (bool) {
        if (m_timePoints.length == 0) { return false; }
        if (_amount == 0) { return false; }

        uint currentStage = getCurrentStage();
        uint stageTokens = m_tokenStage[currentStage];

        uint sumTokens = transferredTokens + _amount;
        if (sumTokens <= stageTokens) { return true; }
        return false;
    }

    function transferTokens(address _to, uint _amount) public onlyOwner {
        require(canTransferTokens());
        require(_to != address(0));
        require(_amount != 0);
        m_token.transfer(_to, _amount);
        transferredTokens += _amount;
    }

    function getCurrentStage() public view returns (uint) {
        require(m_timePoints.length != 0);
        uint lastElementIndex = m_timePoints.length - 1;

        for (uint i = lastElementIndex; i > 0; i--) {
            if (now < m_timePoints[i] && now >= m_timePoints[(i - 1)]) {
                return i;
            }
        }

        return 0;
    }

    /// FIXME remove to correspond testable contract
    function pointsCount() public view returns (uint) {
        return m_timePoints.length;
    }

    function tokenAmountFor(uint _timePoint) view public returns (uint) {
        return m_tokenStage[_timePoint];
    }

}
