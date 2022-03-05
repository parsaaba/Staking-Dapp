web3Provider = null;
contracts = {};
url = "http://127.0.0.1:7545";

currentAccount = null;

stakingToken_Address = null;
rewardsToken_Address = null;

stakingAdd = null;


$(function(){
    $(window).load(function(){
        init();
    });
});


function init() {
    return initWeb3();
}


function initWeb3() {
    if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        web3Provider = web3.currentProvider;
        web3 = new Web3(web3Provider);
    } else {
        // Specify default instance if no web3 instance provided
        web3Provider = new Web3.providers.HttpProvider(url);
        web3 = new Web3(web3Provider);
    }

    ethereum.on('accountsChanged', handleAccountChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // ست کردن اکانت پیش فرض
    web3.eth.defaultAccount = web3.eth.accounts[0];

    return initContract();
}


function handleAccountChanged() {
    ethereum.request({method: 'eth_requestAccounts'}).then(function(accounts){
        currentAccount = accounts[0];
        // وقتی اکانت جاری تغییر میکند باید اکانت پیش فرض وب3 را بروز کنیم
        web3.eth.defaultAccount = currentAccount;
        setCurrentAccount();
        populateInfo();
    });
}


async function handleChainChanged() {
    // ریلود شدن صفحه
    window.location.reload();
}


function initContract() {
   
    $.getJSON('StakingToken.json', function(artifact){
        // Create contract object form that artifact
        contracts.StakingToken = TruffleContract(artifact);
        contracts.StakingToken.setProvider(web3Provider);
    });

    $.getJSON('RewardsToken.json', function(artifact){
        // Create contract object form that artifact
        contracts.RewardsToken = TruffleContract(artifact);
        contracts.RewardsToken.setProvider(web3Provider);
    });

    $.getJSON('Staking.json', function(artifact){
        // Create contract object form that artifact
        contracts.Staking = TruffleContract(artifact);
        contracts.Staking.setProvider(web3Provider);

        // Set Current Account
        currentAccount = web3.eth.defaultAccount;

        // نمایش اکانت جاری در هدر صفحه
        setCurrentAccount();

        populateInfo();
    });

    return bindEvents();
}


function setCurrentAccount() {
    $("#current_account").html(currentAccount);
}


function populateInfo() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.getAddress();
    }).then(function(result){

        stakingAdd = result;
        console.log("ContractAdd: ", stakingAdd);
        return getStakingTokenAdd();

    }).catch(function(err) {
        console.log("Error in populateInfo(): ", err.message);
    });
}


function getStakingTokenAdd() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.stakingToken();
    }).then(function(result){

        stakingToken_Address = result;
        console.log("STK_Addr: ", result);
        return getRewardTokenAdd();

    }).catch(function(err) {
        console.log("Error in getStakingTokenAdd(): ", err.message);
    });
}


function getRewardTokenAdd() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.rewardsToken();
    }).then(function(result){

        rewardsToken_Address = result;
        console.log("RTK_Addr: ", result);
        return getActiveInvestorsCount();

    }).catch(function(err) {
        console.log("Error in getRewardTokenAdd(): ", err.message);
    });
}


function getActiveInvestorsCount() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.activeInvestors();
    }).then(function(result){

        $("#investors_count").text(result);
        return getStakedTokensCount();

    }).catch(function(err) {
        console.log("Error in getActiveInvestorsCount(): ", err.message);
    });
}


function getStakedTokensCount() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.getTotalStakedTokens();
    }).then(function(result){

        $("#staked_tokens_count").text(toEth(result));
        return getRewardRate();

    }).catch(function(err) {
        console.log("Error in getStakedTokensCount(): ", err.message);
    });
}


function getRewardRate() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.rewardRate();
    }).then(function(result){

        $("#reward_rate").text(toEth(result));
        return getUserSTKBalance();

    }).catch(function(err) {
        console.log("Error in getRewardRate(): ", err.message);
    });
}


function getUserSTKBalance() {
    var STKInstance;
    contracts.StakingToken.deployed().then(function(instance){
        STKInstance = instance;
        return STKInstance.balanceOf(currentAccount);
    }).then(function(result){

        $("#stk_balance").text(toEth(result));
        return getUserRTKBalance();

    }).catch(function(err) {
        console.log("Error in getUserSTKBalance(): ", err.message);
    });
}


function getUserRTKBalance() {
    var RTKInstance;
    contracts.RewardsToken.deployed().then(function(instance){
        RTKInstance = instance;
        return RTKInstance.balanceOf(currentAccount);
    }).then(function(result){

        $("#rtk_balance").text(toEth(result));
        return getUserStakedTokens();

    }).catch(function(err) {
        console.log("Error in getUserRTKBalance(): ", err.message);
    });
}


function getUserStakedTokens() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.getUserStakedTokens(currentAccount);
    }).then(function(result){

        $("#user_staked_tokens").text(toEth(result));
        return getUserPaidRewards();

    }).catch(function(err) {
        console.log("Error in getUserStakedTokens(): ", err.message);
    });
}


function getUserPaidRewards() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        return StakeInstance.userTotalRewardPaid(currentAccount);
    }).then(function(result){

        $("#user_paid_reward").text(toEth(result));

    }).catch(function(err) {
        console.log("Error in getUserPaidRewards(): ", err.message);
    });
}


function bindEvents() {
    $(document).on("click", "#stake", approveStakingToken);
    $(document).on("click", "#withdraw", withdraw);
    $(document).on("click", "#getReward", getReward);
}


function approveStakingToken() {
    if($("#stake_amount").val() === "") {
        alert("Please Fill amount!");
        return false;
    }
    var STKInstance;
    contracts.StakingToken.deployed().then(function(instance){
        STKInstance = instance;
        var amount = toWei( $("#stake_amount").val() );
        var txObj = {from: currentAccount};
        return STKInstance.approve(stakingAdd, amount, txObj);
    }).then(function(result){

        console.log("approveStakingToken() => ", result.receipt.status);
        return stake();

    }).catch(function(err) {
        console.log("Error in approveStakingToken(): ", err.message);
    });
}


function stake() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        var amount = toWei( $("#stake_amount").val() );
        var txObj = {from: currentAccount};
        return StakeInstance.stake(amount, txObj);
    }).then(function(result){

        console.log("stake() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err) {
        console.log("Error in stake(): ", err.message);
    });
}


function withdraw() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        var amount = toWei( $("#stake_amount").val() );
        var txObj = {from: currentAccount};
        return StakeInstance.withdraw(amount, txObj);
    }).then(function(result){

        console.log("withdraw() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err) {
        console.log("Error in withdraw(): ", err.message);
    });
}


function getReward() {
    var StakeInstance;
    contracts.Staking.deployed().then(function(instance){
        StakeInstance = instance;
        var txObj = {from: currentAccount};
        return StakeInstance.getReward(txObj);
    }).then(function(result){

        console.log("getReward() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err) {
        console.log("Error in getReward(): ", err.message);
    });
}






//////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////   Utils   ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function toEth(amount) {
    var ethAmount = web3.fromWei(amount.toString(), 'ether');   // 1e18 -> 1
    return ethAmount; 
}

function toWei(amount) {
    var weiAmount = web3.toWei(amount.toString(), 'ether');   // 1 -> 1e18
    return weiAmount; 
}


//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////   events   ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function setStakeRange() {
    var slider = document.getElementById("stakeRange")
    $("#stake_amount").val(slider.value);
}

