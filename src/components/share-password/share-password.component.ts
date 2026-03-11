import { Component, Input, OnInit } from '@angular/core';
import { PasswordEntryWithShares, PasswordShareService } from '../../services/password-share.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../model/user.model';
import { WebCryptoService } from 'src/services/crypto.service';

@Component({
  selector: 'app-password-share',
  templateUrl: './share-password.component.html',
  styleUrls:['./share-password.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SharePasswordComponent implements OnInit {

  public entries: PasswordEntryWithShares[] = [];
  public userList: User[] = [];
  @Input() public privateKeyPem: string | null = null;

  passwordEntry?: PasswordEntryWithShares;
  targetUserId?: number;

  constructor(private shareService: PasswordShareService, private cryptoService: WebCryptoService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    let currentUserEmail = '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserEmail = payload.sub;
      } catch (e) {
        console.error('Invalid token', e);
      }
    }

    // Učitavanje korisnika
    this.shareService.getOtherUsers(currentUserEmail).subscribe(users => {
      this.userList = users;
      if (!this.targetUserId && users.length > 0) {
        this.targetUserId = users[0].id ?? 0;
      }
    });

    // Učitavanje lozinki sa share-ovima
    this.shareService.getEntriesWithShares().subscribe(entries => {
      this.entries = entries;
      if (entries.length > 0) {
        this.passwordEntry = entries[0];
        // zaštita ako shares ne postoji
        if (!this.passwordEntry.shares) {
          this.passwordEntry.shares = [];
        }
      }
    });
  }





async sharePassword() {
  
  if (!this.passwordEntry || !this.targetUserId) return;

  const ownerShare = this.passwordEntry.shares.find(
    s => s.userId === this.passwordEntry?.entry.ownerId
  );

  if (!ownerShare) {
    alert("Owner share not found!");
    return;
  }

  const response = await this.shareService
    .getUserPublicKey(this.targetUserId)
    .toPromise();

  const publicKeyPem = response?.publicKeyPem;
  if (!publicKeyPem) {
    alert("Public key not found!");
    return;
  }

  // 1️⃣ Decrypt owner password (trenutno je plain Base64)
  const decryptedPassword = await this.decryptPassword(ownerShare);

  // 2️⃣ Generiši AES key i IV
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 3️⃣ Enkriptuј password sa AES-GCM
  const encryptedPasswordBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(decryptedPassword)
  );

  // 4️⃣ Eksportuj AES key u raw
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 5️⃣ Enkriptuј AES key sa korisnikovim RSA public key
  const rsaKey = await window.crypto.subtle.importKey(
    "spki",
    this.pemToArrayBuffer(publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaKey,
    rawAesKey
  );

  // 6️⃣ Pretvori u Base64 za slanje
  const encryptedPasswordB64 = this.arrayBufferToBase64(encryptedPasswordBuffer);
  const encryptedAesKeyB64 = this.arrayBufferToBase64(encryptedAesKey);
  const ivB64 = this.arrayBufferToBase64(iv.buffer);

  // 7️⃣ Pošalji backend-u
  this.shareService
    .sharePassword(this.passwordEntry.entry.id, this.targetUserId, {
      encryptedPassword: encryptedPasswordB64,
      encryptedKey: encryptedAesKeyB64,
      iv: ivB64
    })
    .subscribe(updated => {
      this.passwordEntry = updated;
      alert("Shared successfully!");
    });
}

// Helper: ArrayBuffer -> Base64
private arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
  private async encryptPassword(password: string, publicKeyPem: string): Promise<string> {
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      this.pemToArrayBuffer(publicKeyPem),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );


console.log("Key imported", cryptoKey);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      new TextEncoder().encode(password)
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

private async decryptPassword(share: any): Promise<string> {

  
  if (!this.privateKeyPem) {
    throw new Error("Private key required");
  }

  console.log("SHARE DATA:", share);
  const decrypted = await this.cryptoService.decryptPasswordWithPem(
    {
      encryptedPassword: share.encryptedPassword,
      encryptedKey: share.encryptedKey,
      iv: share.iv
    },
    this.privateKeyPem
  );

  return decrypted;
}

  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}