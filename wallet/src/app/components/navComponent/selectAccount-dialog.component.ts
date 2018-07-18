import { Component, OnInit} from '@angular/core'

/*Dialog*/
import {MdDialog} from '@angular/material';
import {MdDialogRef} from '@angular/material';

/*Services*/
import { AccountService } from '../../account.service'
import { WalletService } from '../../wallet.service'


@Component({
  selector: 'selectAccount-dialog',
  templateUrl: './selectAccount-dialog.component.html',
  styleUrls: ['./selectAccount.css']
})
export class SelectAccountDialogComponent implements OnInit{

  selectedAcc;

  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<SelectAccountDialogComponent>, public _account: AccountService, private _wallet: WalletService) {

  }
  ngOnInit(){
    this.selectedAcc = this._account.account;
  }

  changeSelected(account){
    this.selectedAcc=account;    
  }
  selectAccount(){
    if(this._account.account.address != this.selectedAcc.address){
      this._account.setAccount(this.selectedAcc);
      this.dialogRef.close('loading');
    }else{
      this.dialogRef.close();
    }
    
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
