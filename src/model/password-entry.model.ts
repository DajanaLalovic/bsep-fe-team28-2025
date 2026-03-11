// models/password-entry.model.ts
export interface PasswordShare {
  id: number;
  userId: number;
  encryptedPassword: string;
  createdAt: string;
  createdBy: number;
}

export interface PasswordEntry {
  id: number;
  siteName: string;
  username: string;
  ownerId: number;
  shares: PasswordShare[];
}