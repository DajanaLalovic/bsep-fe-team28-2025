import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CertificateApiService,
  CertificateListDto,
  IssueCertificateResponseDto,
} from 'src/services/certificates-api.service';

@Component({
  selector: 'app-upload-csr',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-csr.component.html',
  styleUrls: ['./upload-csr.component.css'],
})
export class UploadCsrComponent implements OnInit {
  csrFile: File | null = null;

  issuers: CertificateListDto[] = [];
  loadingIssuers = false;

  submitting = false;
  downloading = false;

  errorMsg = '';
  issued: IssueCertificateResponseDto | null = null;

  form = this.fb.group({
    issuerCertificateId: [null as number | null, Validators.required],
    validityDays: [365, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private fb: FormBuilder,
    private api: CertificateApiService,
  ) {}

  ngOnInit(): void {
    this.loadIssuers();
  }

  loadIssuers() {
    this.loadingIssuers = true;
    this.api.getIssuers().subscribe({
      next: (list) => {
        this.issuers = list.filter(
          (c) => !c.revoked && (c.type === 'ROOT' || c.type === 'INTERMEDIATE'),
        );
        this.loadingIssuers = false;
      },
      error: () => {
        this.loadingIssuers = false;
        this.errorMsg = 'Failed to load issuer certificates.';
      },
    });
  }
  get selectedIssuer(): CertificateListDto | null {
    const id = this.form.value.issuerCertificateId;
    if (!id) return null;
    return this.issuers.find((c) => c.id === id) ?? null;
  }
  onCsrSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.csrFile = input.files && input.files.length ? input.files[0] : null;
    this.errorMsg = '';
    this.issued = null;
  }

  submit() {
    this.errorMsg = '';
    this.issued = null;

    if (!this.csrFile) {
      this.errorMsg = 'CSR file is required.';
      return;
    }
    if (this.form.invalid) {
      this.errorMsg = 'Please select issuer and validity days.';
      return;
    }

    const issuerId = this.form.value.issuerCertificateId!;
    const validityDays = this.form.value.validityDays!;
    const issuer = this.selectedIssuer;
    if (issuer) {
      const now = new Date();
      const issuerNotAfter = new Date(issuer.notAfter);

      const maxDays = Math.floor(
        (issuerNotAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (validityDays > maxDays) {
        this.errorMsg = `Validity too long. Maximum allowed is ${maxDays} days for selected CA.`;
        this.submitting = false;
        return;
      }
    }

    this.submitting = true;

    this.api.issueFromCsr(this.csrFile, issuerId, validityDays).subscribe({
      next: (res) => {
        this.submitting = false;
        this.issued = res;
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg =
          err?.error?.message ?? 'Failed to issue certificate from CSR.';
      },
    });
  }

  downloadPem() {
    if (!this.issued?.id) return;

    this.downloading = true;
    this.api.downloadPem(this.issued.id).subscribe({
      next: (blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cert-${this.issued!.id}.pem`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.errorMsg = 'Failed to download PEM.';
      },
    });
  }
}
