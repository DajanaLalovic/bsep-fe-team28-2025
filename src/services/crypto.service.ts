import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebCryptoService {

  async importPublicKey(pemPublicKey: string): Promise<CryptoKey> {
    const pem = pemPublicKey.replace(/-----\w+ PUBLIC KEY-----/g, '').replace(/\s/g, '');
    const binaryDer = this.base64ToArrayBuffer(pem);
    return await crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  }

  async encryptPassword(plainPassword: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
    return this.arrayBufferToBase64(encrypted);
  }

  // private base64ToArrayBuffer(base64: string): ArrayBuffer {
  //   const binary = atob(base64);
  //   const bytes = new Uint8Array(binary.length);
  //   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  //   return bytes.buffer;
  // }
//   private base64ToArrayBuffer(base64: string): ArrayBuffer {
//   // 1️⃣ Ukloni sve whitespace/newline
//   base64 = base64.replace(/\s/g, '');

//   // 2️⃣ Ako je URL-safe Base64
//   base64 = base64.replace(/-/g, '+').replace(/_/g, '/');

//   // 3️⃣ Dodaj padding ako nije deljivo sa 4
//   while (base64.length % 4 !== 0) {
//     base64 += '=';
//   }

//   const binary = atob(base64);
//   const bytes = new Uint8Array(binary.length);
//   for (let i = 0; i < binary.length; i++) {
//     bytes[i] = binary.charCodeAt(i);
//   }
//   return bytes.buffer;
// }
private base64ToArrayBuffer(base64: string): ArrayBuffer {

  base64 = base64.replace(/\s/g, '');
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');

  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}
public arrayBufferToBase64(buffer: ArrayBuffer): string {

  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary);
}
  // public arrayBufferToBase64(buffer: ArrayBuffer): string {
    
  //   let binary = '';
  //   const bytes = new Uint8Array(buffer);
  //   for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  //   return btoa(binary);
  // }

  //  async encryptPasswordWithPem(plainPassword: string, pemPublicKey: string): Promise<string> {
  //   const publicKey = await this.importPublicKey(pemPublicKey);
  //   return await this.encryptPassword(plainPassword, publicKey);
  // }

   /**
   * Decrypt Base64 ciphertext with RSA-OAEP private key
   * @param ciphertextB64 - Base64 encoded encrypted password
   * @param privateKey - CryptoKey (private key)
   * @returns Plain text password
   */
  async decryptPassword(ciphertextB64: string, privateKey: CryptoKey): Promise<string> {
    const encryptedData = this.base64ToArrayBuffer(ciphertextB64);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private async importPrivateKey(pem: string): Promise<CryptoKey> {

  const cleaned = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return window.crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["decrypt"]
  );
}
  // async importPrivateKey(pemPrivateKey: string): Promise<CryptoKey> {
  //   // Remove PEM headers and decode Base64
  //   const pemHeader = '-----BEGIN PRIVATE KEY-----';
  //   const pemFooter = '-----END PRIVATE KEY-----';
  //   const pemContents = pemPrivateKey
  //     .replace(pemHeader, '')
  //     .replace(pemFooter, '')
  //     .replace(/\s/g, '');
    
  //   const binaryDer = this.base64ToArrayBuffer(pemContents);
    
  //   return await window.crypto.subtle.importKey(
  //     'pkcs8',
  //     binaryDer,
  //     {
  //       name: 'RSA-OAEP',
  //       hash: 'SHA-256'
  //     },
  //     true,
  //     ['decrypt']
  //   );
  // }

  // /**
  //  * Decrypt password using PEM private key (convenience method)
  //  * @param ciphertextB64 - Base64 encoded ciphertext
  //  * @param pemPrivateKey - PEM formatted private key
  //  * @returns Plain text password
  //  */
  // async decryptPasswordWithPem(ciphertextB64: string, pemPrivateKey: string): Promise<string> {
  //   const privateKey = await this.importPrivateKey(pemPrivateKey);
  //   return await this.decryptPassword(ciphertextB64, privateKey);
  // }
  // WebCryptoService
// async decryptPasswordWithPem(data: { encryptedPassword: string, encryptedKey: string, iv: string }, pemPrivateKey: string): Promise<string> {

//   // 1️⃣ Import private key
//   const privateKey = await this.importPrivateKey(pemPrivateKey);

//   // 2️⃣ Decrypt AES key
//   const encryptedKeyBuffer = this.base64ToArrayBuffer(data.encryptedKey);
//   const aesKeyRaw = await crypto.subtle.decrypt(
//     { name: 'RSA-OAEP' },
//     privateKey,
//     encryptedKeyBuffer
//   );

//   const aesKey = await crypto.subtle.importKey(
//     'raw',
//     aesKeyRaw,
//     { name: 'AES-GCM' },
//     false,
//     ['decrypt']
//   );

//   // 3️⃣ Decode IV
//   const iv = new Uint8Array(this.base64ToArrayBuffer(data.iv));

//   // 4️⃣ Decrypt password
//   const encryptedPasswordBuffer = this.base64ToArrayBuffer(data.encryptedPassword);
//   const decryptedBuffer = await crypto.subtle.decrypt(
//     { name: 'AES-GCM', iv },
//     aesKey,
//     encryptedPasswordBuffer
//   );
// console.log('encryptedKeyBuffer', encryptedKeyBuffer);
// console.log('aesKeyRaw', aesKeyRaw);
// console.log('iv', iv);
// console.log('encryptedPasswordBuffer', encryptedPasswordBuffer);
//   return new TextDecoder().decode(decryptedBuffer);
// }

async decryptPasswordWithPem(data: any, privateKeyPem: string): Promise<string> {

  const encryptedKeyBuffer = this.base64ToArrayBuffer(data.encryptedKey);
  const iv = new Uint8Array(this.base64ToArrayBuffer(data.iv));
  const encryptedPasswordBuffer = this.base64ToArrayBuffer(data.encryptedPassword);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    this.pemToArrayBuffer(privateKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const aesKeyRaw = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKeyBuffer
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encryptedPasswordBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

  /**
   * Read .pem file and return content as string
   * @param file - File object from input[type="file"]
   * @returns PEM content as string
   */
  async readPemFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        resolve(e.target.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Validate if string is valid PEM format
   */
  isValidPemFormat(pemString: string): boolean {
//     const publicKeyPattern = /-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----/;
//     const privateKeyPattern = /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/;
//     const rsaPrivateKeyPattern = /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/;
    
//     return publicKeyPattern.test(pemString) || 
//            privateKeyPattern.test(pemString) ||
//            rsaPrivateKeyPattern.test(pemString);
//   }
return true;}

 



public pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }


}