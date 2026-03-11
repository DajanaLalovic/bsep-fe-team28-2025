export interface CreatePasswordItemRequest {
  siteName: string;          // max 255 chars
  username: string;         // max 255 chars
  encryptedPassword: string;    // Base64 encrypted password (max 4096 chars)
  certificateSerialNumber: string;  // Owner's certificate serial number
   iv: string;
   encryptedKey: string;
}

export interface PasswordItemResponse {
  id: number;
  siteName: string;
  username: string;
  encryptedPassword: string;    // Base64 RSA-OAEP encrypted password
  
  // Encryption certificate metadata
  encryptionCertificateId: number;
  encryptionCertificateSerialNumber: string;
  encryptionCertificateCommonName: string;
  
  // Owner metadata
  ownerId: number;
  ownerEmail: string;
  
  createdAt: string;  // ISO 8601 datetime string
}