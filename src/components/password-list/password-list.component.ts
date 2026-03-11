import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordService } from '../../services/password.service';
import { WebCryptoService } from 'src/services/crypto.service';
import { PrivateKeyUploadComponent } from '../private-key-upload/private-key-upload.component';
import { SharePasswordComponent } from '../share-password/share-password.component';

@Component({
  selector: 'app-password-list',
  standalone: true,
  imports: [CommonModule, PrivateKeyUploadComponent, SharePasswordComponent],
  templateUrl: './password-list.component.html',
  styleUrls: ['./password-list.component.css']
})
export class PasswordListComponent {

  passwords: any[] = [];
  privateKeyPem: string | null = null;
  loading = false;
  error = '';

  constructor(
    private passwordService: PasswordService,
    private crypto: WebCryptoService
  ) {}

  ngOnInit() {
   // this.loadPasswords();
  }

  loadPasswords() {
    this.passwordService.getMyPasswords().subscribe({
      next: (data: any[]) => this.passwords = data,
      error: () => this.error = 'Failed to load passwords'
    });
  }

  onKeyLoaded(pem: string) {
    console.log('tu smooooo')
    this.privateKeyPem = pem;
    this.loadPasswords();

  }
  async decrypt(item: any) {

  if (!this.privateKeyPem) {
    alert("Upload private key first");
    return;
  }

  if (!item.encryptedPassword || !item.encryptedKey || !item.iv) {
    alert("Invalid encrypted data");
    return;
  }

  try {

    const decrypted = await this.crypto.decryptPasswordWithPem(
      {
        encryptedPassword: item.encryptedPassword,
        encryptedKey: item.encryptedKey,
        iv: item.iv
      },
      this.privateKeyPem
    );

    item.decryptedPassword = decrypted;

  } catch (e) {
    console.error("Decrypt error:", e);
    alert("Decryption failed. Wrong key?");
  }
}
//   async decrypt(item: any) {
//   if (!this.privateKeyPem) {
//     alert('Upload private key first');
//     return;
//   }

//   try {
    
//     const decrypted = await this.crypto.decryptPasswordWithPem(
//       {
//         encryptedPassword: item.encryptedPassword,
//         encryptedKey: item.encryptedKey,
//         iv: item.iv
//       },
//       this.privateKeyPem
//     );

//     item.decryptedPassword = decrypted;

//   } catch (e) {
//     console.error(e);
//     alert('Decryption failed. Wrong key?');
//   }
// }

//   async decrypt(item: any) {
//     if (!this.privateKeyPem) {
//       alert('Upload private key first');
//       return;
//     }

//     try {
//       const decrypted = await this.crypto.decryptPasswordWithPem(
//         item.encryptedPassword,
//         this.privateKeyPem
//       );

//       item.decryptedPassword = decrypted;

//     } catch (e) {
//       alert('Decryption failed. Wrong key?');
//     }
//   }
}