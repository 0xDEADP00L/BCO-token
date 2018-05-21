pragma solidity ^0.4.18;

contract Log {
    function ln(uint256 _x) pure public returns (int256) {
        int256 epsilon = 1000;
        int256 x = int256(_x);
        int256 result = 0;
        while (x >= 1.5*(10**18)) {
            result = result + 405465108108164381; // log2(1.5)
            x = x * 2 / 3;
        }
        x = x - 10**18;
        int256 next = x;
        int step = 1;
        while (next > epsilon) {
            result = result + (next / step);
            step = step + 1;
            next = next * x / 10**18;
            result = result - (next / step);
            step = step + 1;
            next = next * x / 10**18;
        }
        return result;
    }

    function lngas(uint256 _x) public returns (int256) {
        return ln(_x);
    }
}
