// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Staking {

    // توکن سپرده گذاری
    IERC20 public stakingToken;

    // توکن سوددهی
    IERC20 public rewardsToken;

    // نرخ سود - پارامتر تنظیم میزان "سود به ازای هر توکن" قابل پرداخت به سرمایه گذار 
    uint public rewardRate = 3*10**13;

    /* آخرین لحظه بروزرسانی
            این متغیر قبل از انجام عملیات زیر آپدیت می شود:
                1- stake()
                2- withdraw()
                3- getReward()
    */
    uint public lastUpdateTime;

    // سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه" 
    uint public rewardPerTokenStored;

    // تعداد سرمایه گذارانی که حساب سپرده آنها خالی نیست
    uint public activeInvestors;

    // تعداد کل توکن های استیک شده در سیستم
    uint private _totalSupply;

    // سود به ازای هر توکن" سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه" 
    mapping(address => uint) public userRewardPerTokenPaid;

    // تعداد کل توکن های پرداخت شده به سرمایه گذار از لحظه شروع سرمایه گذاری تا کنون
    mapping(address => uint) public userTotalRewardPaid;

    // کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه"
    mapping(address => uint) public rewards;

    // تعداد توکن های استیک شده سرمایه گذار
    mapping(address => uint) private _balances;

    // دریافت آدرس توکن های سپرده و سوددهی به عنوان ورودی سازنده کانترکت
    constructor(address _stakingToken, address _rewardsToken) {

        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
    }



    //////////////////////////////////////////////////////////////////////////////////
    //                                  Stake                                       //
    //////////////////////////////////////////////////////////////////////////////////

    function stake(uint _amount) external updateReward(msg.sender) {

        // وقتی شخصی با سپرده خالی در حال سپرده گذاری است یعنی یک نفر به سپرده گذاران فعال اضافه می شود
        if(_balances[msg.sender] == 0)
            activeInvestors++;

        // بروزرسانی تعداد کل توکن های استیک شده سیستم  
        _totalSupply += _amount;


        // بروزرسانی تعداد توکن های استیک شده سرمایه گذار فعلی
        _balances[msg.sender] += _amount;

        // قبل از انتقال توکن های استیکینگ، از لایه فرانت، به مقدار مورد نظر از توکن استیکینگ برای کانترکت تایید شده است
        // stakingToken.approve(msg.sender, address(this), _amount);  --- در لایه فرانت انجام شده است

        // انتقال توکن های سرمایه گذار به حساب کانترکت استیکینگ
        stakingToken.transferFrom(msg.sender, address(this), _amount);  
    }


    // بروزرسانی مقادیر سیستم از آخرین لحظه بروزرسانی تا این لحظه
    modifier updateReward(address account) {

        // بروزرسانی "سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه 
        rewardPerTokenStored = rewardPerToken();

        // مقدار جدید آخرین تایم بروزرسانی
        lastUpdateTime = block.timestamp;


        // کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه"
        rewards[account] = earned(account);


        // سود به ازای هر توکن" پرداخت شده به سرمایه گذار تا این لحظه"
        userRewardPerTokenPaid[account] = rewardPerTokenStored;

        _;
    }

    // محاسبه "سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه 
    function rewardPerToken() public view returns(uint) {
        
        if(_totalSupply == 0) {
            return 0;
        }

        return rewardPerTokenStored + ( ( (block.timestamp - lastUpdateTime) * rewardRate * 1e18 ) /  _totalSupply );
    }


    // کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه"
    function earned(address account) public view returns(uint) {
        
        return ( rewards[account] +  (  _balances[account] * ( rewardPerToken() - userRewardPerTokenPaid[account]  )  ) / 1e18  );
    }



    //////////////////////////////////////////////////////////////////////////////////
    //                                  withdraw                                    //
    //////////////////////////////////////////////////////////////////////////////////

    // برداشت کل یا مقداری از توکن های استیک شده سرمایه گذار
    function withdraw(uint _amount) public updateReward(msg.sender) {
        
        // کم کردن از تعداد کل توکن های استیک شده در سیستم
        _totalSupply -= _amount;

        // بروزرسانی تعداد توکن های استیک شده سرمایه گذار فعلی
        _balances[msg.sender] -= _amount;

        // برداشت و انتقال توکن های استیک از کانترکت استیکینگ به حساب سرمایه گذار
        stakingToken.transfer(msg.sender, _amount);
        
        // وقتی سپرده شخص صفر می شود یعنی یک نفر از سپرده گذاران فعال کم می شود
        if(_balances[msg.sender] == 0)
            activeInvestors--;
    }



    //////////////////////////////////////////////////////////////////////////////////
    //                                  getReward                                   //
    //////////////////////////////////////////////////////////////////////////////////

    // برداشت "کل سود" پرداخت نشده سرمایه گذار تا کنون
    function getReward() public updateReward(msg.sender) {

        // کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه"
        uint reward = rewards[msg.sender];

        //صفر کردن "کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه
        rewards[msg.sender] = 0;

        // برداشت و انتقال توکن سوددهی به مقدار ریوارد از حساب کانترکت به حساب سرمایه گذار
        rewardsToken.transfer(msg.sender, reward);

        // بروزرسانی تعداد کل توکن های پرداخت شده به سرمایه گذار از لحظه شروع سرمایه گذاری تا کنون
        userTotalRewardPaid[msg.sender] += reward;  
    }


    //////////////////////////////////////////////////////////////////////////////////
    //                                  Exit                                        //
    //////////////////////////////////////////////////////////////////////////////////

    // خروج از سیستم با برداشت کل اصل سپرده و کل سود سرمایه گذار تا کنون
    function exit() external {
        
        // برداشت اصل سرمایه
        withdraw(_balances[msg.sender]);

        // برداشت "کل سود" پرداخت نشده تا کنون
        getReward();
    }


    //////////////////////////////////////////////////////////////////////////////////
    //                           Other Functions                                    //
    //////////////////////////////////////////////////////////////////////////////////

    // آدرس کانترکت استیکینگ
    function getAddress() public view returns(address) {
        return address(this);
    }

    // تعداد کل توکن های استیک شده در سیستم
    function getTotalStakedTokens() public view returns(uint) {
        return _totalSupply;
    }

    // تعداد کل توکن های استیک شده سرمایه گذار
    function getUserStakedTokens(address account) public view returns(uint) {
        return _balances[account];
    }

}