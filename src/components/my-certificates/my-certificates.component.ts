import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from 'src/services/auth.store';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  CertificateApiService,
  CertificateListDto,
} from 'src/services/certificates-api.service';

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-certificates.component.html',
  styleUrls: ['./my-certificates.component.css'],
})
export class MyCertificatesComponent implements OnInit {
  certs: CertificateListDto[] = [];
  loading = false;
  errorMsg = '';

  // razlog koji korisnik izabere
  reasonForm = this.fb.group({
    reason: [null as string | null, Validators.required],
  });

  // X.509 razlozi (mora da se poklapaju sa enum vrednostima na backendu)
  reasons = [
    { value: 'keyCompromise', label: 'Key compromise' },
    { value: 'cACompromise', label: 'CA compromise' },
    { value: 'affiliationChanged', label: 'Affiliation changed' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'cessationOfOperation', label: 'Cessation of operation' },
    { value: 'certificateHold', label: 'Certificate hold' },
    { value: 'removeFromCRL', label: 'Remove from CRL' },
    { value: 'privilegeWithdrawn', label: 'Privilege withdrawn' },
    { value: 'aACompromise', label: 'AA compromise' },
    { value: 'unspecified', label: 'Unspecified' },
  ];

  revokingId: number | null = null;

  constructor(
    private api: CertificateApiService,
    private fb: FormBuilder,
    public authStore: AuthStore,
  ) {}

  isAdmin = false;
  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMsg = '';

    this.api.getCertificates().subscribe({
      next: (list) => {
        this.certs = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to load certificates.';
      },
    });
  }

  revoke(certId: number) {
    this.errorMsg = '';

    if (this.reasonForm.invalid) {
      this.errorMsg = 'Select revocation reason.';
      return;
    }

    const reason = this.reasonForm.value.reason!;
    this.revokingId = certId;

    this.api.revokeCertificate(certId, reason).subscribe({
      next: () => {
        this.revokingId = null;
        this.reasonForm.reset();
        this.load(); // osveži listu
      },
      error: (err) => {
        this.revokingId = null;
        this.errorMsg = err?.error?.message ?? 'Failed to revoke.';
      },
    });
  }

  downloadPem(id: number) {
    this.api
      .downloadPem(id)
      .subscribe((blob) => this.saveBlob(blob, `cert-${id}.pem`));
  }

  downloadDer(id: number) {
    this.api
      .downloadDer(id)
      .subscribe((blob) => this.saveBlob(blob, `cert-${id}.der`));
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
