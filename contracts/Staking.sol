pragma solidity ^0.5.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "./mocks/TokenMock.sol";

contract Staking is Context {

    using SafeMath for uint;

    struct Staker {
        uint stake; 
        uint reward;        
        uint lastWeightedBlockReward;
    }
    
    mapping(address => Staker) public stakers;
    
    uint public totalStakedAmount;
    uint public weightedBlockReward;
    uint public lastBlock;
    uint public blockReward;
    uint public tokenbase;
    TokenMock public tokenAddress;

    constructor(address _token, uint _blockReward) public {
        require(_token != address(0), "Invalid token address");
        tokenAddress = TokenMock(_token);
        tokenbase = uint(10**uint(tokenAddress.decimals()));
        blockReward = tokenbase.mul(_blockReward);
    }

    function stake_update(uint _deposit,uint _withdraw, bool _sign) internal {
        if (totalStakedAmount!=0) {
            uint m_intervalReward = block.number.sub(lastBlock).mul(blockReward);
            weightedBlockReward = weightedBlockReward.add((m_intervalReward.mul(tokenbase)).div(totalStakedAmount));
        }

        lastBlock = block.number;
        
        if(_sign && _deposit > 0) totalStakedAmount = totalStakedAmount.add(_deposit);
        else if(_withdraw > 0) totalStakedAmount = totalStakedAmount.sub(_withdraw);
    }

    function reward_update(Staker storage staker ) internal {
        uint stakerIntervalWeightedBlockReward = weightedBlockReward.sub(staker.lastWeightedBlockReward);
        uint _reward = staker.stake.mul(stakerIntervalWeightedBlockReward).div(tokenbase);
        staker.reward = staker.reward.add(_reward);
        staker.lastWeightedBlockReward = weightedBlockReward;
    }

    function stake(uint _amount) public payable {
        require(tokenAddress.transferFrom(_msgSender(),address(this),_amount));
        Staker storage staker = stakers[_msgSender()];
        stake_update(_amount,0,true);
        reward_update(staker); 
        staker.stake = staker.stake.add(_amount); 
    }
    
    function withdraw(uint _amount) public {
        Staker storage staker = stakers[_msgSender()];
        stake_update(0,_amount,false);
        reward_update(staker);
        staker.stake  = staker.stake.sub(_amount);
        require(tokenAddress.transfer(_msgSender(),_amount));
    }

    function claim(uint _reward) public {
        Staker storage staker = stakers[_msgSender()];
        stake_update(0,0,true);
        reward_update(staker);
        staker.reward  = staker.reward.sub(_reward);
        require(tokenAddress.mint(_msgSender(),_reward));
    }

    function getReward(address _addr) public view returns(uint _reward) {
        Staker memory staker = stakers[_addr];
        uint reward;
        if (totalStakedAmount!=0) {

            uint m_weightedBlockReward = weightedBlockReward.add((block.number.sub(lastBlock).mul(blockReward)).div(totalStakedAmount));
            uint m_stakerIntervalWeightedBlockReward = m_weightedBlockReward.sub(staker.lastWeightedBlockReward);
            reward = staker.stake.mul(m_stakerIntervalWeightedBlockReward).div(tokenbase);
        }
        _reward = staker.reward + reward;
    }

    function getStake(address _addr) public view returns(uint) {
        return stakers[_addr].stake;
    }
}
