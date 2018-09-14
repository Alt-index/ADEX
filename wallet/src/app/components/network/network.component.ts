import { Component, OnInit, DoCheck }  from '@angular/core'
//import { MarketService } from '../../services/market.service';
import { Web3 } from '../../web3.service';
import { AccountService } from '../../account.service';
import { DialogService } from '../../dialog.service';


@Component({
    selector: 'app-network',
    templateUrl: './network.component.html',
})
export class NetWorkComponent implements OnInit, DoCheck{
    networks: any[] = [{chain:1, name: "Main Ethereum Network"}, {chain:3, name: "Ropsten Test Network"}]
    net: any;
    show: boolean = false;
    loading: boolean =  false;
    dialog;
    constructor(private _web3: Web3, private _account: AccountService, private _dialog: DialogService) {

    }
    ngOnInit(){
        this.net = (this._web3.network == 1)? this.networks[0]: this.networks[1];
    }

    ngDoCheck(){
        if(this._account.updated ==  true && this.loading){
            this.loading = false,
            this.dialog.close();
        }
    }

    toggleShow(){
        this.show = !this.show;
    }

    selectNetwork(network: any){
        if(this.net.chain == network.chain ){
            return false
        }
        this.loading = true;
        this.dialog = this._dialog.openLoadingDialog();
        this.net = network;
        this._web3.setNetwork(network.chain);
        this._account.refreshAccountData();
        this._account.updated = false;
        this.show = !this.show;
    }
}
