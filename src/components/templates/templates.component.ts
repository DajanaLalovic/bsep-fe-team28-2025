import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CertificateApiService,
  CertificateListDto,
  CertificateTemplateDto,
  CreateCertificateTemplateDto,
} from 'src/services/certificates-api.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css'],
})
export class TemplatesComponent implements OnInit {
  templateForm!: FormGroup;
  issuers: CertificateListDto[] = [];
  templates: CertificateTemplateDto[] = [];
  message = '';
  loading = false;

  caKeyUsageOptions = [
    { value: 'KEY_CERT_SIGN', label: 'Key Cert Sign' },
    { value: 'CRL_SIGN', label: 'CRL Sign' },
  ];

  eeKeyUsageOptions = [
    { value: 'DIGITAL_SIGNATURE', label: 'Digital Signature' },
    { value: 'KEY_ENCIPHERMENT', label: 'Key Encipherment' },
    { value: 'KEY_AGREEMENT', label: 'Key Agreement' },
    { value: 'DATA_ENCIPHERMENT', label: 'Data Encipherment' },
    { value: 'NON_REPUDIATION', label: 'Non Repudiation' },
  ];

  ekuOptions = [
    { value: 'SERVER_AUTH', label: 'Server Auth' },
    { value: 'CLIENT_AUTH', label: 'Client Auth' },
    { value: 'CODE_SIGNING', label: 'Code Signing' },
    { value: 'EMAIL_PROTECTION', label: 'Email Protection' },
    { value: 'TIME_STAMPING', label: 'Time Stamping' },
    { value: 'OCSP_SIGNING', label: 'OCSP Signing' },
  ];

  constructor(
    private fb: FormBuilder,
    private certApi: CertificateApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadIssuers();
    this.loadTemplates();

    this.templateForm
      .get('issuerCertificateId')
      ?.valueChanges.subscribe((id) => {
        if (id) {
          this.loadTemplatesByIssuer(id);
        } else {
          this.loadTemplates();
        }
      });
  }

  private initForm() {
    this.templateForm = this.fb.nonNullable.group({
      name: this.fb.nonNullable.control('', Validators.required),
      issuerCertificateId: this.fb.control<number | null>(
        null,
        Validators.required,
      ),
      cnRegex: this.fb.nonNullable.control('', Validators.required),
      sanRegex: this.fb.control<string | null>(null),
      maxTtlDays: this.fb.nonNullable.control(365, [
        Validators.required,
        Validators.min(1),
      ]),
      keyUsages: this.fb.nonNullable.control<string[]>([
        'KEY_CERT_SIGN',
        'CRL_SIGN',
      ]),
      extendedKeyUsages: this.fb.nonNullable.control<string[]>([]),
    });
  }

  private loadIssuers() {
    this.certApi.getIssuers().subscribe({
      next: (x) => {
        this.issuers = x.filter((i) => !i.revoked && i.type !== 'END_ENTITY');
      },
      error: () => {
        this.message = 'Failed to load issuers.';
      },
    });
  }

  private loadTemplates() {
    this.certApi.getTemplates().subscribe({
      next: (x) => {
        this.templates = x;
      },
      error: () => {
        this.message = 'Failed to load templates.';
      },
    });
  }

  private loadTemplatesByIssuer(issuerId: number) {
    this.certApi.getTemplatesByIssuer(issuerId).subscribe({
      next: (x) => {
        this.templates = x;
      },
      error: () => {
        this.message = 'Failed to load templates for selected issuer.';
      },
    });
  }

  createTemplate() {
    this.message = '';

    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      this.message = 'Please correct the form errors.';
      return;
    }

    const v = this.templateForm.getRawValue();

    const req: CreateCertificateTemplateDto = {
      name: v.name,
      issuerCertificateId: v.issuerCertificateId!,
      cnRegex: v.cnRegex,
      sanRegex: v.sanRegex || null,
      maxTtlDays: v.maxTtlDays,
      keyUsages: v.keyUsages ?? [],
      extendedKeyUsages: v.extendedKeyUsages ?? [],
    };

    this.loading = true;

    this.certApi.createTemplate(req).subscribe({
      next: () => {
        this.message = 'Template created successfully.';
        this.loading = false;

        const selectedIssuer = this.templateForm.get(
          'issuerCertificateId',
        )?.value;

        this.templateForm.patchValue({
          name: '',
          cnRegex: '',
          sanRegex: null,
          maxTtlDays: 365,
          keyUsages: ['KEY_CERT_SIGN', 'CRL_SIGN'],
          extendedKeyUsages: [],
        });

        if (selectedIssuer) {
          this.loadTemplatesByIssuer(selectedIssuer);
        } else {
          this.loadTemplates();
        }
      },
      error: (err) => {
        this.loading = false;
        this.message =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          'Failed to create template.';
      },
    });
  }

  isKeyUsageSelected(value: string): boolean {
    return (this.templateForm.get('keyUsages')?.value ?? []).includes(value);
  }

  onKeyUsageChange(event: Event, value: string) {
    const input = event.target as HTMLInputElement | null;
    const checked = input?.checked ?? false;
    const current = (this.templateForm.get('keyUsages')?.value ??
      []) as string[];

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((x) => x !== value);

    this.templateForm.patchValue({ keyUsages: updated });
  }

  isEkuSelected(value: string): boolean {
    return (this.templateForm.get('extendedKeyUsages')?.value ?? []).includes(
      value,
    );
  }

  onEkuChange(event: Event, value: string) {
    const input = event.target as HTMLInputElement | null;
    const checked = input?.checked ?? false;
    const current = (this.templateForm.get('extendedKeyUsages')?.value ??
      []) as string[];

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((x) => x !== value);

    this.templateForm.patchValue({ extendedKeyUsages: updated });
  }

  get name(): AbstractControl | null {
    return this.templateForm.get('name');
  }

  get issuerCertificateId(): AbstractControl | null {
    return this.templateForm.get('issuerCertificateId');
  }

  get cnRegex(): AbstractControl | null {
    return this.templateForm.get('cnRegex');
  }

  get maxTtlDays(): AbstractControl | null {
    return this.templateForm.get('maxTtlDays');
  }
}
