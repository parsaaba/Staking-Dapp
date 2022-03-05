const StakingToken = artifacts.require("StakingToken");
const RewardsToken = artifacts.require("RewardsToken");
const Staking = artifacts.require("Staking");

module.exports = async function (deployer) {

  // Deploy StakingToken
  await deployer.deploy(StakingToken);
  const staking_token = await StakingToken.deployed()

  // Deploy RewardsToken
  await deployer.deploy(RewardsToken);
  const rewards_token = await RewardsToken.deployed()

  // Deploy Staking
  await deployer.deploy(Staking, staking_token.address, rewards_token.address);
  const staking_contract = await Staking.deployed()

  await rewards_token.transfer(staking_contract.address, '4000000000000000000000000')
};