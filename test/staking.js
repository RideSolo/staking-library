
const chai = require('chai');
const staking = artifacts.require("Staking");
const tokenMock = artifacts.require("TokenMock");

const {
  BN, 
  time,
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

chai.use(require('chai-bn')(BN));

contract('Staking', (accounts) => {
  before(async () => {
    this.staking = await staking.deployed()
    this.tokenMock = await tokenMock.deployed()
  })

  it('Deployed successfully', async () => {
    chai.expect(await this.tokenMock.decimals()).to.be.bignumber.equal('18')
    chai.expect(await this.staking.blockReward()).to.be.bignumber.equal(web3.utils.toWei('120'))

    await this.tokenMock.addMinter(tokenMock.address,{from: accounts[0]});
    chai.expect(await this.tokenMock.isMinter(tokenMock.address)).to.be.equal(true)

    await this.tokenMock.mint(accounts[0],web3.utils.toWei('100'), {from: accounts[0]})
    await this.tokenMock.mint(accounts[1],web3.utils.toWei('300'), {from: accounts[0]})
    await this.tokenMock.mint(accounts[2],web3.utils.toWei('300'), {from: accounts[0]})

    chai.expect(await this.tokenMock.balanceOf(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('100'))
    chai.expect(await this.tokenMock.balanceOf(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('300'))
    chai.expect(await this.tokenMock.balanceOf(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('300'))

    await this.tokenMock.approve(staking.address, web3.utils.toWei('100'), {from: accounts[0]})
    await this.tokenMock.approve(staking.address, web3.utils.toWei('300'), {from: accounts[1]})
    await this.tokenMock.approve(staking.address, web3.utils.toWei('300'), {from: accounts[2]})

    chai.expect(await this.tokenMock.allowance(accounts[0], staking.address, {from: accounts[0]})).to.be.bignumber.equal(web3.utils.toWei('100'))
    chai.expect(await this.tokenMock.allowance(accounts[1], staking.address, {from: accounts[1]})).to.be.bignumber.equal(web3.utils.toWei('300'))
    chai.expect(await this.tokenMock.allowance(accounts[2], staking.address, {from: accounts[2]})).to.be.bignumber.equal(web3.utils.toWei('300'))
  })

  it('Staking test, expected result of Table 2.1  were satisfied', async () => {
    
    // please note that to get the reward for a user after that he starts staking at least one block from his
    // original block number transaction has to be executed thit is why we check the reward after execution
    // of a second transaction.

    console.log('\nThe following tests represent the expected results of Table 1 in https://github.com/RideSolo/staking-library/blob/master/doc/dsa.pdf\n')
    await this.staking.stake(web3.utils.toWei('100'), {from:accounts[0]});
    console.log('  - User 0 stake 100 tokens at block 1')
    chai.expect(await this.staking.getStake(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('100'))
    chai.expect(await this.staking.totalStakedAmount()).to.be.bignumber.equal(web3.utils.toWei('100'))
    chai.expect(await this.tokenMock.balanceOf(staking.address)).to.be.bignumber.equal(web3.utils.toWei('100'))

    
    await this.staking.stake(web3.utils.toWei('200'), {from:accounts[1]});
    chai.expect(await this.staking.getReward(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('120'))
    chai.expect(await this.staking.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.staking.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('0'))
    console.log('  - User 1 stake 200 tokens at block 2')
    chai.expect(await this.staking.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('200'))
    chai.expect(await this.staking.totalStakedAmount()).to.be.bignumber.equal(web3.utils.toWei('300'))
    chai.expect(await this.tokenMock.balanceOf(staking.address)).to.be.bignumber.equal(web3.utils.toWei('300'))

    
    await this.staking.stake(web3.utils.toWei('300'), {from:accounts[2]});
    chai.expect(await this.staking.getReward(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('160'))
    chai.expect(await this.staking.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('80'))
    chai.expect(await this.staking.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('0'))
    console.log('  - User 2 stake 300 tokens at block 3')
    chai.expect(await this.staking.getStake(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('300'))
    chai.expect(await this.staking.totalStakedAmount()).to.be.bignumber.equal(web3.utils.toWei('600'))
    chai.expect(await this.tokenMock.balanceOf(staking.address)).to.be.bignumber.equal(web3.utils.toWei('600'))

    
    await this.staking.withdraw(web3.utils.toWei('100'), {from:accounts[0]});
    chai.expect(await this.staking.getReward(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('180'))
    chai.expect(await this.staking.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('120'))
    chai.expect(await this.staking.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('60'))
    console.log('  - User 0 withdraw 100 tokens at block 4')
    chai.expect(await this.staking.getStake(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.staking.totalStakedAmount()).to.be.bignumber.equal(web3.utils.toWei('500'))
    chai.expect(await this.tokenMock.balanceOf(staking.address)).to.be.bignumber.equal(web3.utils.toWei('500'))

    
    await this.staking.stake(web3.utils.toWei('100'), {from:accounts[1]});
    chai.expect(await this.staking.getReward(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('180'))
    chai.expect(await this.staking.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('168'))
    chai.expect(await this.staking.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('132'))
    console.log('  - User 1 stake 100 tokens at block 5\n')
    chai.expect(await this.staking.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('300'))
    chai.expect(await this.staking.totalStakedAmount()).to.be.bignumber.equal(web3.utils.toWei('600'))
    chai.expect(await this.tokenMock.balanceOf(staking.address)).to.be.bignumber.equal(web3.utils.toWei('600'))

    await this.staking.stake(web3.utils.toWei('0'), {from:accounts[0]}); // dummy call just to mine a block.

    chai.expect(await this.staking.getReward(accounts[0])).to.be.bignumber.equal(web3.utils.toWei('180'))
    chai.expect(await this.staking.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('228'))
    chai.expect(await this.staking.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('192'))

    var reward0 = await this.staking.getReward(accounts[0])
    var reward1 = await this.staking.getReward(accounts[1])
    var reward2 = await this.staking.getReward(accounts[2])

    console.log("Users reward result after block 5:\n")
    console.log("  - User 0 reward: " + reward0 + " tokens")
    console.log("  - User 1 reward: " + reward1 + " tokens")
    console.log("  - User 2 reward: " + reward2 + " tokens\n")

  })
})