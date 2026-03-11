import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebCryptoService } from 'src/services/crypto.service';

@Component({
  selector: 'app-private-key-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './private-key-upload.component.html',
  styleUrls: ['./private-key-upload.component.css']
})
export class PrivateKeyUploadComponent {

  @Output() keyLoaded = new EventEmitter<string>();
  error = '';

  constructor(private crypto: WebCryptoService) {}

  async onFileSelected(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const pem = await this.crypto.readPemFile(file);

      if (!this.crypto.isValidPemFormat(pem)) {
        throw new Error('Invalid PEM format');
      }

      this.keyLoaded.emit(pem);
      this.error = '';

    } catch (err) {
      this.error = 'Invalid private key file.';
    }
  }
}