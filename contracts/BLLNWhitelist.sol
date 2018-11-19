pragma solidity 0.4.25;

import "./include/Ownable.sol";


/**
 * @title BLLNWhitelist
 * @dev The simple whitelisting contract has a whitelist of addresses, and provides basic whitelist control functions.
 */
contract BLLNWhitelist is Ownable {
    uint256 public constant WHITELISTED = 0x01;
    uint256 public constant BANNED = 0x00;

    mapping (address => uint256) public whitelistedAddresses;

    event Whitelisted(address indexed operator);
    event RemovedFromWhitelist(address indexed operator);

    /**
    * @dev Throws if operator is not whitelisted.
    * @param _operator address
    */
    modifier onlyIfWhitelisted(address _operator) {
        require(whitelistedAddresses[_operator] == WHITELISTED);
        _;
    }

    /**
    * @dev add an address to the whitelist
    * @param _operator address
    * @return true if the address was added to the whitelist, false if the address was already in the whitelist
    */
    function addAddressToWhitelist(address _operator)
        public
        onlyOwner
    {
        whitelistedAddresses[_operator] = WHITELISTED;
        emit Whitelisted(_operator);
    }

    /**
    * @dev getter to determine if address is in whitelist
    */
    function whitelist(address _operator)
        public
        view
        returns (bool)
    {
        return (whitelistedAddresses[_operator] == WHITELISTED);
    }

    /**
    * @dev add addresses to the whitelist
    * @param _operators addresses
    * @return true if at least one address was added to the whitelist,
    * false if all addresses were already in the whitelist
    */
    function addAddressesToWhitelist(address[] _operators)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _operators.length; i++) {
            addAddressToWhitelist(_operators[i]);
        }
    }

    /**
    * @dev remove an address from the whitelist
    * @param _operator address
    * @return true if the address was removed from the whitelist,
    * false if the address wasn't in the whitelist in the first place
    */
    function removeAddressFromWhitelist(address _operator)
        public
        onlyOwner
    {
        whitelistedAddresses[_operator] = BANNED;
        emit RemovedFromWhitelist(_operator);
    }

    /**
    * @dev remove addresses from the whitelist
    * @param _operators addresses
    * @return true if at least one address was removed from the whitelist,
    * false if all addresses weren't in the whitelist in the first place
    */
    function removeAddressesFromWhitelist(address[] _operators)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _operators.length; i++) {
            removeAddressFromWhitelist(_operators[i]);
        }
    }
}
