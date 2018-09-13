import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import { AccountService } from './account.service';

import {MdDialog} from '@angular/material';

import { LoadingDialogComponent } from './components/dialogs/loading-dialog.component';
import { Web3 } from './web3.service';

@Component({
  selector: 'ion-app',
  templateUrl: './app.html',
})
export class MyApp implements OnInit {
  loadingD;
  interval;
  
  constructor(private _account: AccountService, private dialog: MdDialog, private _web3: Web3, private router : Router) {
    if(this._account.apikey=="" || this._web3.infuraKey == ""){
      this.router.navigate(['/settings']);
    }else{
      this.loadingD = this.dialog.open(LoadingDialogComponent, {
        width: '660px',
        height: '150px',
        disableClose: true,
      });
    }  
  }
  async ngOnInit() {
    if(this._account.apikey!="" && this._web3.infuraKey != ""){
      this.interval = setInterval(async() => {
        if('address'in this._account.account){
          if('balance' in this._account.account){
            this.loadingD.close();
            clearInterval(this.interval);
          }
        }else{
          clearInterval(this.interval);
          this.loadingD.close();
        } 
      });
    }
  }

  loadingDialog(){
    let dialogRef=this.dialog.open(LoadingDialogComponent, {
      width: '660px',
      height: '150px',
      disableClose: true,
    });
  }
}
