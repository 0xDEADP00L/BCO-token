pragma solidity 0.4.25;


interface BLLNDividendInterface {
    // @dev Called by token contract on minting
    function tokensMinted(address _address, uint256 _tokensAmount) external;
    // @dev Called by token contract on transfers to syncronize user dividends accounts
    function tokensTransferred(address _from, address _to, uint256 _amount) external returns (bool);
    // @dev Share dividends with token holders
    function shareDividends() external payable;
    // @dev Add value directly to one's dividend account
    function addToDividendBalance(address _address) external payable;
    // @dev Calculate and return user claimable dividends.
    function getDividendBalance(address _address) external view returns (uint256);
    // @dev Withdraw all available user's dividends
    function withdraw() external;
    // @dev Withdraw user's dividends and send them to a specific address
    function withdrawTo(address _to) external;
}
