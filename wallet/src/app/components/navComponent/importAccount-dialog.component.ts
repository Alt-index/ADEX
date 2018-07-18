import { Component } from '@angular/core'

/*Services*/
import { WalletService } from '../../wallet.service'
import { AccountService } from '../../account.service'
import { DialogService } from '../../dialog.service'

/*Dialog*/
import { MdDialog } from '@angular/material';
import { MdDialogRef } from '@angular/material';
import { LoadingDialogComponent } from '../dialogs/loading-dialog.component';


const EthUtils = require('ethereumjs-util')

@Component({
  selector: 'importAccount-dialog',
  templateUrl: './importAccount-dialog.component.html'
})
export class ImportAccountDialogComponent{
  nameAccount:string;
  importType= "keystore";
  submited : boolean = false;

  constructor(public dialogRef: MdDialogRef<ImportAccountDialogComponent>, private _wallet: WalletService,
               private _account: AccountService, public dialog: MdDialog, private dialogService: DialogService) {

    if(_wallet.wallet == null ){
      this.nameAccount= "Account 1"
    }else{
      this.nameAccount = "Account"+(_wallet.wallet.length+1);
    }
  }

 
  async importAccount(name, input, pass, pass2) {
    this.submited = true;
    let error:string = "";
    let dialog = this.dialog;
    let wallet = this._wallet;
    let account = this._account;
    let address;
    let importType = this.importType
    
    if(this.checkPass(pass, pass2) == false || this.checkInput(input) == false){
      return false
    }
    if(this.importType=="keystore"){
      try{
        address = '0x'+JSON.parse(input).address;
      }catch(e){
        error=(e.name=="SyntaxError")? "Json interface has wrong format": e.message;
      }
    }else{
      input=(input.startsWith('0x')||input.startsWith('0X'))? input : '0x'+input;
      try{
        address= (EthUtils.privateToAddress(input)).toString('hex');
      }catch(e){
        error=e.message;
      }

    }
    
    
    this.dialogRef.close();

    if(error!="" || this._wallet.wallet != null && typeof(this._wallet.getAccount(address))!== 'undefined'){
      let title = 'Unable to import account';
      let message = 'Something was wrong';
      error = (error!="")? error : 'The account you are are trying to import is a duplicate'
      let dialoRef = this.dialogService.openErrorDialog(title,message, error);
      
      return false
    }

    console.log(importType)
    try{
      if(importType=="keystore"){
        wallet.importAccountJSON(name, input, pass);
      }else{
        wallet.importAccountPrivate(name, input, pass);
      }
      if(!localStorage.getItem('acc')){
        account.getAccountData();
      } 
      console.log("finish");
    }catch(e){
      error=(e.name=="SyntaxError")? "Json interface has wrong format": e.message;
    }
    let title = (error=="")? 'Your account has been successfully imported' : 'Unable to import account';
    let message = (error=="")? 'You can find it in the account list' : 'Something was wrong';
    let dialoRef = this.dialogService.openErrorDialog(title,message, error);

  }
 
  checkPass(pass, pass2): boolean{
    if(pass != pass2){
      return false
    }

    return true
  }

  checkInput(input){
    if(input==null || input==""){
      return false
    }

    return true
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
