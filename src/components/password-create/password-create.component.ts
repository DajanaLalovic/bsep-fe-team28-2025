import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { PasswordService } from '../../services/password.service';
import { UserService } from '../../services/user.service';
import { WebCryptoService } from 'src/services/crypto.service';
import { CreatePasswordItemRequest } from 'src/model/password-item.model';
import { getUserIdFromToken } from 'src/utils/auth.utils';

@Component({
  selector: 'app-password-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-create.component.html',
  styleUrls: ['./password-create.component.css']
})
export class PasswordCreateComponent {

  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private passwordService: PasswordService,
    private userService: UserService,
    private cryptoService: WebCryptoService,
    private router: Router
  ) {
    this.form = this.fb.group({
      siteName: ['', [Validators.required, Validators.maxLength(255)]],
      username: ['', [Validators.required, Validators.maxLength(255)]],
      password: ['', [Validators.required]]
    });
  }

  async save() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const siteName = this.form.value.siteName;
      const username = this.form.value.username;
      const plainPassword = this.form.value.password;

      // 1️⃣ Uzmemo public key trenutnog korisnika
      // Backend treba da vrati njegov EE cert public key
      const currentUserId = getUserIdFromToken();

if (!currentUserId) {
  throw new Error('User not authenticated');
}
      const publicKeyResponse = await this.userService
        .getUserPublicKey(currentUserId)
        .toPromise();

      if (!publicKeyResponse) {
        throw new Error('Public key not found');
      }

      const pemPublicKey = publicKeyResponse.publicKeyPem;

      // 2️⃣ Enkriptujemo password ovde si dodala novo 
      // const encryptedPassword = await this.cryptoService
      //   .encryptPasswordWithPem(plainPassword, pemPublicKey);
      // 2️⃣ Generiši AES key
const aesKey = await window.crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// 3️⃣ Generiši IV
const iv = window.crypto.getRandomValues(new Uint8Array(12));

// 4️⃣ Enkriptuј password sa AES
const encryptedPasswordBuffer = await window.crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  aesKey,
  new TextEncoder().encode(plainPassword)
);

// 5️⃣ Export AES key
const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

// 6️⃣ Import RSA public key
const rsaKey = await window.crypto.subtle.importKey(
  "spki",
  this.cryptoService.pemToArrayBuffer(pemPublicKey),
  { name: "RSA-OAEP", hash: "SHA-256" },
  false,
  ["encrypt"]
);

// 7️⃣ Encrypt AES key with RSA
const encryptedAesKey = await window.crypto.subtle.encrypt(
  { name: "RSA-OAEP" },
  rsaKey,
  rawAesKey
);

// 8️⃣ Pretvori u Base64
const encryptedPasswordB64 = this.cryptoService.arrayBufferToBase64(encryptedPasswordBuffer);
const encryptedAesKeyB64 = this.cryptoService.arrayBufferToBase64(encryptedAesKey);
const ivB64 = this.cryptoService.arrayBufferToBase64(iv.buffer);

      // 3️⃣ Certificate serial (ovde backend mora da zna koji EE cert je aktivan)
      // Ako backend vraca serial uz public key – koristi taj
      //const certificateSerialNumber = publicKeyResponse.userId; // ← promeni ako BE vraća serial posebno
       const certificateSerialNumber = publicKeyResponse.certificateSerialNumber;
      const request: CreatePasswordItemRequest = {
        siteName,
        username,
        encryptedPassword : encryptedPasswordB64,
        certificateSerialNumber,
        encryptedKey: encryptedAesKeyB64,
  iv: ivB64,
      };

      await this.passwordService.createPassword(request).toPromise();

      this.successMessage = 'Password saved successfully 🔐';
      this.form.reset();

    } catch (err: any) {
      console.error(err);
      this.errorMessage = 'Encryption or save failed.';
    } finally {
      this.loading = false;
    }
  }
}