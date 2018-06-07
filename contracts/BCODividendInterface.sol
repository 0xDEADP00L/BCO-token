pragma solidity 0.4.24;


interface BCODividendInterface {
    function setTokenAddress(address _tokenAddress) external;
    function buyToken() external payable;
    function withdraw(uint256 _amount) external;
    function updateDividendBalance(uint256 _totalSupply, address _address, uint256 _tokensAmount) external;
    function transferTokens(address _from, address _to, uint256 _amount) external returns (bool);
    function shareDividends() external payable;
    function getDividendBalance(address _address) external view returns (uint256);
}
