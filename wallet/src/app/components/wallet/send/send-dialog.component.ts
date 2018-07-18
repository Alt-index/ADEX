import { Component, Inject  } from '@angular/core'
import { Router } from '@angular/router'

import { DialogService } from '../../../dialog.service'
import { MdDialogRef } from '@angular/material';
import { MD_DIALOG_DATA } from '@angular/material';


import { Web3 } from '../../../web3.service'
import { AccountService } from '../../../account.service'

@Component({
  selector: 'send-dialog',
  templateUrl: './send-dialog.component.html'
})
export class SendDialogComponent{

  constructor(public _web3: Web3, public _account: AccountService, private router: Router, public dialogService: DialogService, @Inject(MD_DIALOG_DATA) public data: any, public dialogRef: MdDialogRef<SendDialogComponent>) {
   }
   

  async sendTx(pass?){
    //check pass
    if (typeof(pass)=='undefined' || pass==""){
      return false
    }
    let privateKey;
    try{
      privateKey = this._account.getPrivateKey(pass)
    }catch(e){
      return false;
    }

    let self = this;
    let error = "";
    let title = "";
    let message = "";
    
    this.data.tx.sign(privateKey);
    let serialized = "0x"+(this.data.tx.serialize()).toString('hex');
    let sendResult = await this._web3.sendRawTx(serialized);
    self.dialogRef.close();

    if(sendResult instanceof Error){
      title = "Unable to complete transaction";
      message = "Something went wrong"
      error = sendResult.message;
      console.log(error)
      let dialogRef = self.dialogService.openErrorDialog(title,message,error);

    }else{
      let pending: any = await self._web3.getTx(sendResult);
      pending.timeStamp = Date.now()/1000;
      //console.log(pending)
      self._account.addPendingTx(pending);

      title = "Your transaction has been sended";
      message = "You can see the progress in the history tab"
      let dialogRef = self.dialogService.openErrorDialog(title, message, error, 'redirect');
      dialogRef.afterClosed().subscribe(result=>{
          if(typeof(result)!= 'undefined' || result != ''){
            this.router.navigate(['/wallet/history']);
          }
      })
    }

  }

  closeDialog(){
    this.dialogRef.close();
  }

}