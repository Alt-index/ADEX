pragma solidity ^0.4.24;

/*
    Copyright 2018, Vicent Nos

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


 */



library SafeMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        assert(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () internal {
      owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}


//////////////////////////////////////////////////////////////
//                                                          //
//  Alt Index, Open End Crypto Fund ERC20                    //
//                                                          //
//////////////////////////////////////////////////////////////

contract ALXERC20 is Ownable {

    using SafeMath for uint256;


    mapping (address => uint256) public balances;

    mapping (address => uint256) public requestWithdraws;

    mapping (address => mapping (address => uint256)) internal allowed;

    //mapping (address => timeHold) public holded;

    roundHold[] internal roundHolds;

    uint256 public transactionFee = 1;
    uint256 public withdrawFee = 1;

    uint256 public roundCounter=0;

    struct roundHold{
        mapping (address => timeHold) holded;   
    }
    
    struct timeHold{
        uint256[] amount;
        uint256[] time;
        uint256 length;
    }
    
    
    
    
    /* Public variables for the ERC20 token */
    string public constant standard = "ERC20 ALX";
    uint8 public constant decimals = 8; // hardcoded to be a constant
    uint256 public totalSupply;
    string public name;
    string public symbol;

    uint256 public holdTime;
    uint256 public holdMax;
    uint256 public maxSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);


    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }


    function holdedOf(address _owner, uint256 n, uint256 round) public view returns (uint256) {
        return roundHolds[round].holded[_owner].amount[n];
        //return holded[_owner].amount[n];
    }

    function hold(address _to, uint256 _value) internal {
        roundHolds[roundCounter].holded[_to].amount.push(_value);
        roundHolds[roundCounter].holded[_to].time.push(block.number);
        roundHolds[roundCounter].holded[_to].length++;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {

        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);

        uint256 fee=(_value*transactionFee)/100;
 
        balances[_to] = balances[_to].add(_value-fee);
        balances[owner]=balances[owner].add(fee);
        
        emit Transfer(msg.sender, _to, _value);
        emit Transfer(msg.sender, owner, fee);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);

        uint256 fee=(_value*transactionFee)/100;

        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);


        balances[_to] = balances[_to].add(_value-fee);
        balances[owner]=balances[owner].add(fee);
        
        emit Transfer(_from, _to, _value);
        emit Transfer(_from, owner, fee);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }

    function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    /* Approve and then communicate the approved contract in a single tx */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
        tokenRecipient spender = tokenRecipient(_spender);

        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }
}


interface tokenRecipient {
    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external ;
}


contract ALX is ALXERC20 {

    // Contract variables and constants


    uint256 public tokenPrice = 0;
    uint256 public tokenAmount=0;

    // constant to simplify conversion of token amounts into integer form
    uint256 public tokenUnit = uint256(10)**decimals;


    //Declare logging events
    event LogDeposit(address sender, uint amount);


    /* Initializes contract with initial supply tokens to the creator of the contract */
        constructor (
            
            uint256 initialSupply,
            string contractName,
            string tokenSymbol,
            uint256 contractHoldTime,
            uint256 contractHoldMax,
            
            address contractOwner

        ) public {


        totalSupply = initialSupply;  // Update total supply
        name = contractName;             // Set the name for display purposes
        symbol = tokenSymbol;         // Set the symbol for display purposes
        holdTime=contractHoldTime;
        holdMax=contractHoldMax;
        
        owner=contractOwner;
        balances[contractOwner]= balances[contractOwner].add(totalSupply);

    }

    function () public payable {
        buy();   // Allow to buy tokens sending ether directly to contract
    }


    uint256 public contractBalance=0;

    function deposit() external payable onlyOwner returns(bool success) {
        // Check for overflows;





        //executes event to reflect the changes
        emit LogDeposit(msg.sender, msg.value);

        return true;
    }


    function withdrawReward() external {

        uint i = 0;
        uint256 ethAmount = 0;
        uint256 len = roundHolds[roundCounter].holded[msg.sender].length;

        while (i <= len - 1){
            if (block.number -  roundHolds[roundCounter].holded[msg.sender].time[i] > holdTime && block.number -  roundHolds[roundCounter].holded[msg.sender].time[i] < holdMax){
                ethAmount += tokenPrice * roundHolds[roundCounter].holded[msg.sender].amount[i];
            }
            i++;
        }


        require(ethAmount > 0);

        require(ethAmount>=(tokenPrice*requestWithdraws[msg.sender]));

        emit LogWithdrawal(msg.sender, ethAmount);


        totalSupply = totalSupply.sub(requestWithdraws[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(requestWithdraws[msg.sender]);

        emit Transfer(msg.sender, this, requestWithdraws[msg.sender]);

        delete roundHolds[roundCounter].holded[msg.sender];

        hold(msg.sender,balances[msg.sender]);

        uint256 fee=(ethAmount*withdrawFee)/100;


        
        balances[msg.sender] = balances[msg.sender].sub(ethAmount-fee);

        msg.sender.transfer((tokenPrice*requestWithdraws[msg.sender]/tokenUnit)-fee);
        owner.transfer(fee);

    }



    function setPrice(uint256 _value) public onlyOwner{
      tokenPrice=_value;
      roundCounter++;

    }

    function setTransactionFee(uint256 _value) public onlyOwner{
      transactionFee=_value;
 
    }

    function setWithdrawFee(uint256 _value) public onlyOwner{
      withdrawFee=_value;
 
    }

    event LogWithdrawal(address receiver, uint amount);

    function requestWithdraw(uint value) public {
      require(value <= balances[msg.sender]);
      delete roundHolds[roundCounter].holded[msg.sender];
      hold(msg.sender, value);

      requestWithdraws[msg.sender]=value;
      //executes event ro register the changes

    }



    function buy() public payable {
        
         tokenAmount = (msg.value * tokenUnit) / tokenPrice ;  // calculates the amount
        
        transferBuy(msg.sender, tokenAmount);
        owner.transfer(msg.value);
    }

    function transferBuy(address _to, uint256 _value) internal returns (bool) {
        require(_to != address(0));

        // SafeMath.add will throw if there is not enough balance.
        totalSupply = totalSupply.add(_value);
        
        uint256 teamAmount=_value*10/100;

        totalSupply = totalSupply.add(teamAmount);



        balances[_to] = balances[_to].add(_value);
        balances[owner] = balances[owner].add(teamAmount);

        emit Transfer(this, _to, _value);
        emit Transfer(this, owner, teamAmount);
        return true;

    }
}
