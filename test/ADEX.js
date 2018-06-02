var adex = artifacts.require("ALX");
var adex2 = artifacts.require("ALX2");

contract('Adex Text', async (accounts) =>{

  it("check constructor params", async() => {

    let instance = await adex.deployed();
    let meta = instance;

    //expected values
    let expectedTotalSupply = 10000000000000000;
    let expectedName = "Alt Index, Open End Crypto Fund ERC20"
    let expectedTokenSymbol = "ALX";
    let expectedHoldTime = 0;
    let expectedHoldMax = 604800;
    let expectedOwner = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
    let expectedStandard =  "ERC20 ALX";
    let expectedDecimals= 8;

    //contract values
    let totalSupply = await meta.totalSupply();
    let name = await meta.name();
    let tokenSymbol = await meta.symbol();
    let holdTime = await meta.holdTime();
    let holdMax = await meta.holdMax();
    let owner=await meta.owner();
    let standard =  await meta.standard();
    let decimals = await meta.decimals();
    let ownerBalance = await meta.balanceOf(owner);
    ownerBalance = ownerBalance.toNumber();

    //totalSupply equal to balances[owner]

    assert.equal(totalSupply, expectedTotalSupply, "totalSupply must be equal to expectedTotalSupply");
    assert.equal(name, expectedName, "Name must be equal to expectedName");
    assert.equal(tokenSymbol, expectedTokenSymbol, "tokenSymbol must be equal to expectedTokenSymbol");
    assert.equal(holdTime, expectedHoldTime, "holdTime must be equal to expectedHoldTime");
    assert.equal(standard, expectedStandard, "standard must be equal to expectedStandard");
    assert.equal(decimals, expectedDecimals, "decimals must be equal to expectedDecimals");
    assert.equal(ownerBalance, expectedTotalSupply, "ownerBalance must be equal to expectedTotalSupply");
  });

  it("should buy amount correctly", async () => {
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 3000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    let owner = await meta.owner();

    let ownerBalanceBefore = await meta.balanceOf(owner);
    ownerBalanceBefore = ownerBalanceBefore.toNumber();

    let senderBalanceBefore = await meta.balanceOf(account_two);
    senderBalanceBefore = senderBalanceBefore.toNumber();

    let totalSupplyBefore = await meta.totalSupply();
    totalSupplyBefore = totalSupplyBefore.toNumber();


    await meta.buy({value:amount, from:account_two});

    let ownerBalanceAfter = await meta.balanceOf(owner);
    ownerBalanceAfter = ownerBalanceAfter.toNumber();

    let senderBalanceAfter = await meta.balanceOf(account_two);
    senderBalanceAfter = senderBalanceAfter.toNumber();

    let priceAfter = await meta.tokenPrice();
    priceAfter = priceAfter.toNumber();

    let totalSupplyAfter = await meta.totalSupply();
    totalSupplyAfter = totalSupplyAfter.toNumber();

    let tokenUnit = await meta.tokenUnit();
    tokenUnit = tokenUnit.toNumber();

    let tokenAmount = (amount * tokenUnit)/priceAfter;

    let expectedTotalSupply = totalSupplyBefore + tokenAmount;

    let teamAmount = tokenAmount*10/100;

    expectedTotalSupply = expectedTotalSupply + teamAmount;

    let expectedSenderBalance = senderBalanceBefore + tokenAmount;
    let expectedOwnerBalance = ownerBalanceBefore + teamAmount;

    assert.notEqual(ownerBalanceBefore, ownerBalanceAfter, "ownerBalance before and after don't have to be equal after buy");
    assert.notEqual(senderBalanceBefore, senderBalanceAfter, "senderBalance before and after don't have to be equal after buy");
    assert.notEqual(totalSupplyBefore, totalSupplyAfter, "totalSupply before and after don't have to be equal after buy");

    assert.equal(totalSupplyAfter , expectedTotalSupply , "totalSupply must be equal than expectedTotalSupply after buy");
    assert.equal(senderBalanceAfter, expectedSenderBalance, "senderBalance must be equal than expected value after buy");
    assert.equal(ownerBalanceAfter, expectedOwnerBalance, "ownerBalance must be equal than expected value after buy");

  });

  it("should deposit amount correctly", async () => {

    let amount = 1000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    let contractEthBefore=await meta.contractBalance();
    contractEthBefore = contractEthBefore.toNumber();

    await meta.deposit({value:amount});

    let contractEth=await meta.contractBalance();
    contractEth = contractEth.toNumber();

    console.log("Contract ETH: "+ contractEthBefore+" after : " + contractEth);

    assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

    assert.equal(contractEth , amount, "contractEth must be equal than amount deposited");

  });

  it("should transfer coin correctly", async () => {

    // Get initial balances of first and second account.
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 1000;

    let instance = await adex.deployed();
    let meta = instance;

    let senderBalanceBefore = await meta.balanceOf(account_one);
    senderBalanceBefore = senderBalanceBefore.toNumber();

    let receiverBalanceBefore = await meta.balanceOf(account_two);
    receiverBalanceBefore = receiverBalanceBefore.toNumber();

    let feeBefore = await meta.transactionFee();
    feeBefore = feeBefore.toNumber();

    await meta.setTransactionFee(20);
    await meta.transfer(account_two, amount);

    let senderBalanceAfter = await meta.balanceOf(account_one);
    senderBalanceAfter = senderBalanceAfter.toNumber();

    let receiverBalanceAfter = await meta.balanceOf(account_two);
    receiverBalanceAfter = receiverBalanceAfter.toNumber();

    let feeAfter = await meta.transactionFee();
    feeAfter = feeAfter.toNumber();

    let feeAmount = (amount * feeAfter)/1000;
    console.log("Sender Balance before: "+senderBalanceBefore+ " after: "+senderBalanceAfter);

    console.log("Receiver Balance before: "+receiverBalanceBefore+" after: "+receiverBalanceAfter);

    console.log("Transaction Fee before: "+feeBefore+" after: "+feeAfter);
    console.log("FeeAmount: " + feeAmount);

    assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
    assert.notEqual(senderBalanceBefore, senderBalanceAfter, "sender balance before and after transfer don't have to be equal");
    assert.notEqual(receiverBalanceBefore, receiverBalanceAfter, "receiver balance before and after transfer don't have to be equal");
    assert.notEqual(feeBefore, feeAfter, "fee value have to change after setTransactionFee")

    assert.equal(receiverBalanceAfter, receiverBalanceBefore + (amount-feeAmount), "Amount wasn't correctly sent to the receiver");
    assert.equal(senderBalanceAfter, (senderBalanceBefore - amount)+feeAmount, "Amount wasn't correctly taken from the sender");

  });

  it("should approve amount correctly", async () => {

    // Get initial balances of first and second account.
    let account_one = accounts[0];

    let amount = 1000;

    let instance = await adex.deployed();
    let meta = instance;

    let allowanceBefore = await meta.allowance(account_one, account_one);
    allowanceBefore = allowanceBefore.toNumber();

    await meta.approve(account_one, amount);

    let allowanceAfter = await meta.allowance(account_one, account_one);
    allowanceAfter = allowanceAfter.toNumber();

    console.log("Allowance Before: " + allowanceBefore);
    console.log("Allowance After: " + allowanceAfter);

    assert.notEqual(allowanceBefore, allowanceAfter, "approved amount before and after allowance don't have to be equal");

    assert.equal(amount, allowanceAfter, "Allowance needs to be equal than amount");

  });

  it("should transferFrom amount correctly", async () => {

    // Get initial balances of first and second account.
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 1000;

    let instance = await adex.deployed();
    let meta = instance;

    let allowanceBefore = await meta.allowance(account_one, account_one);
    allowanceBefore = allowanceBefore.toNumber();

    let balance_start = await meta.balanceOf(account_one);
    balance_start = balance_start.toNumber();

    let balance_start_2 = await meta.balanceOf(account_two);
    balance_start_2 = balance_start_2.toNumber();

    await meta.transferFrom(account_one, account_two, amount);

    let allowanceAfter = await meta.allowance(account_one, account_one);
    allowanceAfter = allowanceAfter.toNumber();

    let balance_end = await meta.balanceOf(account_one);
    balance_end = balance_end.toNumber();

    let balance_end_2 = await meta.balanceOf(account_two);
    balance_end_2 = balance_end_2.toNumber();

    let fee = await meta.transactionFee();
    fee = fee.toNumber();
    let feeAmount = (amount * fee)/1000;

    console.log("Allowance before transfer: " + allowanceBefore);
    console.log("Allowance after transfer: " + allowanceAfter);
    console.log("Sender Balance Start: " + balance_start);
    console.log("Sender Balance End: " + balance_end);
    console.log("Receiver Balance Start: " + balance_start_2);
    console.log("Receiver Balance End: " + balance_end_2);


    assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
    assert.notEqual(balance_start, balance_end, "account_one starting balance and ending balance don't have to be equal");
    assert.notEqual(balance_start_2, balance_end_2, "account_two starting balance and ending balance don't have to be equal");
    assert.notEqual(allowanceBefore, allowanceAfter, "allowance before and after transfer don't have to be equal");

    assert.equal(balance_end, (balance_start - amount)+feeAmount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
    assert.equal(balance_end_2, balance_start_2 + (amount-feeAmount), "Amount wasn't correctly sent to the receiver");

  });

  it("steps before request withdraw", async () => {
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 1000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    await meta.deposit({value:amount});
    await meta.buy({value:amount});

  });

  it("should request withdraw reward amount correctly", async () => {

    let account_one = accounts[0];
    let account_two = accounts[1];

    let instance = await adex.deployed();
    let meta = instance;

    let balance = await meta.balanceOf(account_one);
    balance = balance.toNumber();
    console.log("Balance: "+balance);

    let amount = 2000;

    await meta.requestWithdraw(amount);

    let roundCounter = await meta.roundCounter();
    roundCounter = roundCounter.toNumber();
    console.log(roundCounter);

    let requestOfAmount = await meta.requestOfAmount(account_one, roundCounter);
    requestOfAmount = requestOfAmount.toNumber();
    console.log(requestOfAmount);

    assert.equal(amount, requestOfAmount, "request of amount have to be equal to amount requested")

  });

  it("wait for block", async () => {
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 1000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    await meta.deposit({value:amount});
    await meta.deposit({value:amount});
    await meta.deposit({value:amount});
    await meta.deposit({value:amount});
    await meta.deposit({value:amount});
    await meta.deposit({value:amount});
    await meta.deposit({value:amount});

  });

   it("should withdraw reward amount correctly", async () => {

    let account_one = accounts[0];
    let account_two = accounts[1];

    let instance = await adex.deployed();
    let meta = instance;

    let totalSupplyBefore= await meta.totalSupply();
    totalSupplyBefore = totalSupplyBefore.toNumber();

    let roundCounter = await meta.roundCounter();
    roundCounter = roundCounter.toNumber();

    let requestOfAmount = await meta.requestOfAmount(account_one, roundCounter);
    requestOfAmount = requestOfAmount.toNumber();
    console.log(requestOfAmount);

    let balance = await meta.balanceOf(account_one);
    balance = balance.toNumber();


    await meta.withdrawReward();

    let totalSupplyAfter = await meta.totalSupply();
    totalSupplyAfter = totalSupplyAfter.toNumber();

    console.log("totalSupplyBefore: " + totalSupplyBefore);
    console.log("totalSupplyAfter: " + totalSupplyAfter);

    let balanceAfter = await meta.balanceOf(account_one);
    balanceAfter = balanceAfter.toNumber();
    console.log("balanceBefore: " + balance);
    console.log("balanceAfter: " + balanceAfter);

    assert.notEqual(totalSupplyBefore, totalSupplyAfter, "totalSupply don't have to be equal before and after withdrawReward");
    assert.notEqual(balance, balanceAfter, "balance before and after withdrawReward don't have to be equal");

    assert.equal(totalSupplyAfter, totalSupplyBefore - requestOfAmount, "totalSupply after have to be equal to totalSupplyBefore - requestOfAmount ");
    assert.equal((totalSupplyBefore - totalSupplyAfter), requestOfAmount, "difference between totalSupplyBefore and totalSupplyAfter must be equal than amount requested to withdraw");
    assert.equal(balanceAfter, balance - requestOfAmount, "balanceAfter have to be equal to balanceBefore - requestOfAmount");
    assert.equal((balance - balanceAfter), requestOfAmount, "difference between balance before and after have to be equal to requestOfAmount")
  });

  it("should increasse approval amount correctly", async () => {
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 50000;

    let instance = await adex.deployed();
    let meta = instance;

    await meta.approve(account_two, amount);

    let allowanceBefore = await meta.allowance(account_one, account_two);
    allowanceBefore = allowanceBefore.toNumber();

    await meta.increaseApproval(account_two, amount);

    let amount_two = amount + amount;

    let allowanceAfter = await meta.allowance(account_one, account_two);
    allowanceAfter = allowanceAfter.toNumber();

    console.log("Balance allowed before increaseApproval: " + allowanceBefore);
    console.log("Balance allowed after increaseApproval: " + allowanceAfter);

    assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
    assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

    assert.equal(allowanceBefore, amount, "Allowance must be equal than amount approved.");
    assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount multiplied by two.");

  });

  it("should decrease approval amount correctly", async () => {
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 100000;

    let instance = await adex.deployed();
    let meta = instance;

    let allowanceBefore = await meta.allowance(account_one, account_two);
    allowanceBefore = allowanceBefore.toNumber();

    let amount_two = amount / 2;

    await meta.decreaseApproval(account_two, amount_two);

    let allowanceAfter = await meta.allowance(account_one, account_two);
    allowanceAfter = allowanceAfter.toNumber();

    console.log("Balance allowed before decreaseApproval: " + allowanceBefore);
    console.log("Balance allowed after decreaseApproval: " + allowanceAfter);

    assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
    assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

    assert.equal(allowanceBefore, amount, "Allowance must be equal than the last amount approved");
    assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount");

  });

  it("should approve and communicate the approved correctly", async () => {
    let account_one = accounts[0];

    let amount = 20000;

    let instance = await adex.deployed();
    let meta = instance;


    let instance_two = await adex2.deployed();

    let contractAddress = instance_two.address;

    let allowanceBefore = await meta.allowance(account_one, contractAddress);
    allowanceBefore = allowanceBefore.toNumber();

    let _data = "";

    await meta.approveAndCall(contractAddress, amount, _data);

    let balanceAfter = await meta.allowance(account_one, contractAddress);
    let allowanceAfter = balanceAfter.toNumber();

    console.log("Balance allowed after approveAndCall: " + allowanceAfter);

    assert.notEqual(account_one, contractAddress, "account_one don't have to be equal than addressContract");
    assert.notEqual(allowanceBefore, allowanceAfter, "allowanceBefore approveAndCall don't have to be equal than allowanceAfter");

    assert.equal(allowanceAfter, amount, "Allowance must be equal than amount after approveAndCall function");

  });
  it("should withdraw amount correctly", async () => {
    let account_one = accounts[0];

    let amount = 1000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    let contractBalanceBefore = await meta.contractBalance();
    contractBalanceBefore = contractBalanceBefore.toNumber();
    console.log(contractBalanceBefore);

    await meta.withdraw(amount);

    let contractBalanceAfter = await meta.contractBalance();
    contractBalanceAfter = contractBalanceAfter.toNumber();
    console.log(contractBalanceAfter);


    assert.notEqual(contractBalanceBefore, contractBalanceAfter, "contract balance before and after withdraw don't have to be equal");

    assert.equal((contractBalanceBefore - contractBalanceAfter), amount, "contractBalanceBefore-contractBalanceAfter have to be equal to amount");

  });
  it("should check all setters", async () => {
    let account_one = accounts[0];

    let amount = 1000000000000000000;
    let amount2 = 2000000000000000000;

    let instance = await adex.deployed();
    let meta = instance;

    let minPriceBefore = await meta.minPrice();
    minPriceBefore = minPriceBefore.toNumber();
    console.log("minPriceBefore: " + minPriceBefore);

    let tokenPriceBefore = await meta.tokenPrice();
    tokenPriceBefore = tokenPriceBefore.toNumber();
    console.log("tokenPriceBefore: " + tokenPriceBefore);

    let roundCounterBefore = await meta.roundCounter();
    roundCounterBefore = roundCounterBefore.toNumber();
    console.log("roundCounterBefore: " + roundCounterBefore);

    let withdrawFeeBefore = await meta.withdrawFee();
    withdrawFeeBefore= withdrawFeeBefore.toNumber();
    console.log("withdrawFeeBefore: " + withdrawFeeBefore);

    let transactionFeeBefore = await meta.transactionFee();
    transactionFeeBefore= transactionFeeBefore.toNumber();
    console.log("withdrawFeeBefore: " + transactionFeeBefore);

    let icoEndBefore = await meta.icoEnd();
    icoEndBefore = icoEndBefore.toNumber();
    console.log("icoEndBefore: " + icoEndBefore);

    await meta.setMinPrice(amount);
    await meta.setPrice(amount2);
    await meta.setWithdrawFee(2);
    await meta.setTransactionFee(2);
    await meta.setIcoEnd(20);

    let minPriceAfter = await meta.minPrice();
    minPriceAfter = minPriceAfter.toNumber();
    console.log("minPriceAfter: " + minPriceAfter);

    let tokenPriceAfter = await meta.tokenPrice();
    tokenPriceAfter = tokenPriceAfter.toNumber();
    console.log("tokenPriceAfter: " + tokenPriceAfter);

    let roundCounterAfter = await meta.roundCounter();
    roundCounterAfter = roundCounterAfter.toNumber();
    console.log("roundCounterAfter: " + roundCounterAfter);

    let withdrawFeeAfter = await meta.withdrawFee();
    withdrawFeeAfter= withdrawFeeAfter.toNumber();
    console.log("withdrawFeeAfter: " + withdrawFeeAfter);

    let transactionFeeAfter = await meta.transactionFee();
    transactionFeeAfter= transactionFeeAfter.toNumber();
    console.log("transactionFeeAfter: " + transactionFeeAfter);

    let icoEndAfter = await meta.icoEnd();
    icoEndAfter = icoEndAfter.toNumber();
    console.log("icoEndAfter: " + icoEndAfter);

    assert.notEqual(minPriceBefore, minPriceAfter, "minPrice before and after setMinPrice don't have to be equal");
    assert.notEqual(tokenPriceBefore, tokenPriceAfter, "tokenPrice before and after setPrice don't have to be equal");
    assert.notEqual(roundCounterBefore, roundCounterAfter, "roundCounter before and after setPrice don't have to be equal");
    assert.notEqual(withdrawFeeBefore, withdrawFeeAfter, "withdrawFee before and after setWithdrawFee don't have to be equal");
    assert.notEqual(transactionFeeBefore, transactionFeeAfter, "transactionFee before and after setTransactionFee don't have to be equal");
    assert.notEqual(icoEndBefore, icoEndAfter, "icoEnd before and after setIcoEnd don't have to be equal");
  });

});
