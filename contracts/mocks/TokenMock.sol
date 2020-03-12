pragma solidity ^0.5.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract TokenMock is ERC20, ERC20Mintable, ERC20Detailed {
	constructor() ERC20Detailed("TST","TESTTOKENS", 18) public {

    }
}
