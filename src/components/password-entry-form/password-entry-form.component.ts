// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
// import { PasswordManagerService, CreatePasswordRequest } from 'src/services/password-manager.service';

// @Component({
//   selector: 'app-password-entry-form',
//   templateUrl: './password-entry-form.component.html',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule]
// })
// export class PasswordEntryFormComponent {
//   form = new FormGroup({
//     siteName: new FormControl(''),
//     username: new FormControl(''),
//     password: new FormControl(''),
//   });

//   constructor(private pmService: PasswordManagerService) {}

//   async save() {
//     const values = this.form.value;
//     const password = values.password ?? '';

//     // Šifrovanje lozinke javnim ključem korisnika (trenutno test base64)
//     const encryptedPassword = await this.encryptWithPublicKey(password);

//     const req: CreatePasswordRequest = {
//       siteName: values.siteName!,
//       username: values.username!,
//       encryptedPassword
//     };

//     this.pmService.saveEntry(req).subscribe(() => {
//       alert('Password saved!');
//       this.form.reset();
//     });
//   }

//   async encryptWithPublicKey(password: string): Promise<string> {
//     // Ovde kasnije ide WEB Crypto API i javni ključ korisnika
//     return btoa(password);
//   }
// }