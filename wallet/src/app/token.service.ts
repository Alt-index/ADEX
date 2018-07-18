import { Injectable} from '@angular/core';


import { Web3 } from "./web3.service";
@Injectable()
export class TokenService{
    tokenAbi = require('human-standard-token-abi');
    token;
    contractAddress;
    constructor(private _web3: Web3){

    }
    setToken(contractAddress){
        this.contractAddress = contractAddress;
        this.token= this._web3.web3.eth.contract(this.tokenAbi).at(contractAddress);
    }

    getDataTransfer(to, amount): string{
        let txData=this.token.transfer.getData(to, amount);
        return txData;
    }

    getSymbol() : Promise<string>{
        let self=this
        return new Promise (function (resolve, reject) {
            self.token.symbol.call(function(err, res){  
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
    getDecimal() : Promise<number>{
        let self=this
        return new Promise (function (resolve, reject) {
            self.token.decimals.call(function(err, res){  
                if (err) {
                    reject(err);
                } else {
                    console.log(res.toNumber());
                    resolve(res.toNumber());
                }
            });
        });
    }
    getName() : Promise<string>{
        let self=this
        return new Promise (function (resolve, reject) {
            self.token.name.call(function(err, res){  
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
    getBalanceOf(addr){
        let self=this
        return new Promise (function (resolve, reject) {
            self.token.balanceOf.call(addr,function(err, res){  
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
}