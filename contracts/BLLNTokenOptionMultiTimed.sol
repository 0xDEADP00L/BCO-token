pragma solidity 0.4.25;

import "./BLLNTokenOptionBase.sol";


contract BLLNTokenOptionMultiTimed is BLLNTokenOptionBase {

    /// @dev key - stage, value - tokens amount
    mapping (uint => uint) public tokenStage;
    uint[] public timePoints;
    uint public transferredTokens;

    constructor(address _dividendAddress, address _tokenAddress) public
        BLLNTokenOptionBase(_dividendAddress, _tokenAddress) {}

    function addStage(uint _timePoint, uint _amount) public onlyOwner {
        require(_timePoint != 0);
        require(now <= _timePoint);
        require(_amount > 0);

        if (timePoints.length != 0) {
            uint lastElementIndex = timePoints.length - 1;
            uint previosTimePoint = timePoints[lastElementIndex];
            uint previosTokenAmount = tokenStage[lastElementIndex];

            assert(_timePoint > previosTimePoint);
            assert(_amount > previosTokenAmount);

            timePoints.push(_timePoint);
            tokenStage[lastElementIndex + 1] =  _amount;

            return;
        }

        timePoints.push(_timePoint);
        tokenStage[0] =  _amount;
    }

    function canTransferToken(uint _amount) public view returns (bool) {
        if (timePoints.length == 0) { return false; }
        if (_amount == 0) { return false; }

        uint lastElementIndex = timePoints.length - 1;
        if (timePoints[lastElementIndex] <= now) { return true; }

        uint currentStage = getCurrentStage();
        uint stageTokens = tokenStage[currentStage];

        uint sumTokens = transferredTokens + _amount;
        if (sumTokens <= stageTokens) { return true; }
        return false;
    }

    function canTransferTokens() public view returns (bool) {
        return canTransferToken(1);
    }

    function transferTokens(address _to, uint _amount) public onlyOwner {
        require(canTransferToken(_amount));
        require(_to != address(0));
        require(_amount != 0);
        token.transfer(_to, _amount);
        transferredTokens += _amount;
    }

    function getCurrentStage() public view returns (uint) {
        require(timePoints.length != 0);
        uint lastElementIndex = timePoints.length - 1;

        for (uint i = lastElementIndex; i > 0; i--) {
            if (now < timePoints[i] && now >= timePoints[(i - 1)]) {
                return i;
            }
        }

        return 0;
    }

}
