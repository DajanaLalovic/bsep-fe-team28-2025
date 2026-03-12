import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CertificateApiService,
  CertificateListDto,
  CertificateType,
  IssueCertificateRequestDto,
} from 'src/services/certificates-api.service';

@Component({
  selector: 'app-issue-certificate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './issue-certificates.component.html',
  styleUrls: ['./issue-certificates.component.css'],
})
export class IssueCertificateComponent implements OnInit {
  issueForm!: FormGroup;
  issuers: CertificateListDto[] = [];
  message = '';

  pageTitle = 'Issue Certificate';
  certificateType: CertificateType = 'INTERMEDIATE';
  ownerUserId: number | null = null;

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

  constructor(
    private fb: FormBuilder,
    private certApi: CertificateApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadIssuers();
    this.readRouteContext();
    this.setupReactivity();
  }

  private initForm() {
    this.issueForm = this.fb.nonNullable.group({
      type: this.fb.nonNullable.control<CertificateType>(
        'INTERMEDIATE',
        Validators.required,
      ),
      issuerCertificateId: this.fb.control<number | null>(null),
      validityDays: this.fb.nonNullable.control(365, [
        Validators.required,
        Validators.min(1),
      ]),
      cn: this.fb.nonNullable.control('', Validators.required),
      o: this.fb.control(''),
      c: this.fb.nonNullable.control('RS'),
      pathLen: this.fb.control<number | null>(0, [
        this.pathLenValidator.bind(this),
      ]),
      keyUsage: this.fb.nonNullable.control<string[]>([
        'KEY_CERT_SIGN',
        'CRL_SIGN',
      ]),
    });
  }

  private loadIssuers() {
    this.certApi.getIssuers().subscribe({
      next: (x) => {
        this.issuers = x.filter((i) => !i.revoked && i.type !== 'END_ENTITY');
        this.validateValidityAgainstIssuer();
        this.validatePathLenAgainstIssuer();
      },
      error: () => {
        this.message = 'Failed to load issuers.';
      },
    });
  }
  private readRouteContext() {
    this.route.data.subscribe((data) => {
      const certType = data['certType'] as CertificateType;

      this.certificateType = certType;

      if (certType === 'ROOT') {
        this.pageTitle = 'Issue Root Certificate';
      } else if (certType === 'INTERMEDIATE') {
        this.pageTitle = 'Issue Intermediate Certificate';
      } else if (certType === 'END_ENTITY') {
        this.pageTitle = 'Issue End-Entity Certificate';
      } else {
        this.pageTitle = 'Issue Certificate';
      }

      this.issueForm.patchValue({ type: this.certificateType });
      this.applyTypeRules(this.certificateType);
    });

    this.route.queryParamMap.subscribe((params) => {
      const ownerId = params.get('ownerUserId');
      this.ownerUserId = ownerId ? Number(ownerId) : null;
    });
  }

  private setupReactivity() {
    this.issueForm.get('validityDays')?.valueChanges.subscribe(() => {
      this.validateValidityAgainstIssuer();
    });

    this.issueForm.get('issuerCertificateId')?.valueChanges.subscribe(() => {
      this.validateValidityAgainstIssuer();
      this.validatePathLenAgainstIssuer();
    });

    this.issueForm.get('type')?.valueChanges.subscribe((type) => {
      this.applyTypeRules(type as CertificateType);
      this.validateValidityAgainstIssuer();
      this.validatePathLenAgainstIssuer();
    });

    this.issueForm.get('pathLen')?.valueChanges.subscribe(() => {
      this.validatePathLenAgainstIssuer();
    });
  }

  private applyTypeRules(type: CertificateType) {
    const pathLenCtrl = this.issueForm.get('pathLen');
    const issuerCtrl = this.issueForm.get('issuerCertificateId');
    const keyUsageCtrl = this.issueForm.get('keyUsage');

    if (!pathLenCtrl || !issuerCtrl || !keyUsageCtrl) return;

    if (type === 'ROOT') {
      issuerCtrl.setValue(null);
      pathLenCtrl.setValidators([this.pathLenValidator.bind(this)]);
      pathLenCtrl.setValue(pathLenCtrl.value ?? 0);
      keyUsageCtrl.setValue(['KEY_CERT_SIGN', 'CRL_SIGN']);
    }

    if (type === 'INTERMEDIATE') {
      pathLenCtrl.setValidators([this.pathLenValidator.bind(this)]);
      pathLenCtrl.setValue(pathLenCtrl.value ?? 0);
      keyUsageCtrl.setValue(['KEY_CERT_SIGN', 'CRL_SIGN']);
    }

    if (type === 'END_ENTITY') {
      pathLenCtrl.clearValidators();
      pathLenCtrl.setValue(null);
      keyUsageCtrl.setValue(['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT']);
    }

    pathLenCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private buildSubjectDn(v: any): string {
    const parts: string[] = [];
    if (v.cn) parts.push(`CN=${v.cn}`);
    if (v.o) parts.push(`O=${v.o}`);
    if (v.c) parts.push(`C=${v.c}`);
    return parts.join(',');
  }

  isKeyUsageSelected(value: string): boolean {
    return (this.issueForm.get('keyUsage')?.value ?? []).includes(value);
  }

  onKeyUsageChange(event: Event, value: string) {
    const input = event.target as HTMLInputElement | null;
    const checked = input?.checked ?? false;
    const current = (this.issueForm.get('keyUsage')?.value ?? []) as string[];

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((x: string) => x !== value);

    this.issueForm.patchValue({ keyUsage: updated });
  }

  issueCertificate() {
    this.message = '';

    const pathLenCtrl = this.issueForm.get('pathLen');
    if (pathLenCtrl?.errors?.['backendPathLen']) {
      const errors = { ...(pathLenCtrl.errors || {}) };
      delete errors['backendPathLen'];
      pathLenCtrl.setErrors(Object.keys(errors).length ? errors : null);
    }

    if (this.issueForm.invalid) {
      this.issueForm.markAllAsTouched();
      this.message = 'Please correct the form errors.';
      return;
    }

    const v = this.issueForm.getRawValue();

    if (!v.keyUsage || v.keyUsage.length === 0) {
      this.message = 'Please select at least one Key Usage option.';
      return;
    }

    if (v.type !== 'ROOT' && !v.issuerCertificateId) {
      this.message = 'Issuer certificate is required.';
      return;
    }

    const req: IssueCertificateRequestDto = {
      ownerUserId: this.ownerUserId,
      type: v.type,
      issuerCertificateId: v.type === 'ROOT' ? null : v.issuerCertificateId,
      subjectDn: this.buildSubjectDn(v),
      validityDays: v.validityDays,
      isCa: v.type !== 'END_ENTITY',
      pathLen: v.type === 'END_ENTITY' ? null : (v.pathLen ?? null),
      keyUsage:
        v.type === 'END_ENTITY'
          ? (v.keyUsage ?? ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'])
          : (v.keyUsage ?? ['KEY_CERT_SIGN', 'CRL_SIGN']),
    };

    this.certApi.issueCertificate(req).subscribe({
      next: () => {
        this.router.navigate(['/my-certificates']);
      },
      error: (err) => {
        const backendMessage =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'Error issuing certificate';

        this.message = backendMessage;

        if (backendMessage.toLowerCase().includes('pathlen')) {
          this.issueForm.get('pathLen')?.setErrors({
            ...(this.issueForm.get('pathLen')?.errors || {}),
            backendPathLen: true,
          });
        }
      },
    });
  }

  private pathLenValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    const num = Number(value);

    if (Number.isNaN(num)) return { invalidNumber: true };
    if (!Number.isInteger(num)) return { notInteger: true };
    if (num < 0) return { min: true };

    return null;
  }

  private validateValidityAgainstIssuer() {
    const type = this.issueForm.get('type')?.value;
    const issuerId = this.issueForm.get('issuerCertificateId')?.value;
    const validityCtrl = this.issueForm.get('validityDays');

    if (!validityCtrl) return;

    const currentErrors = { ...(validityCtrl.errors || {}) };
    delete currentErrors['issuerExceeded'];
    delete currentErrors['issuerExpired'];

    if (type === 'ROOT' || !issuerId) {
      validityCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const issuer = this.issuers.find((i) => i.id === issuerId);
    if (!issuer || !issuer.notAfter) {
      validityCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const validityDays = Number(validityCtrl.value);
    if (!validityDays || validityDays < 1) {
      validityCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const now = new Date();
    const issuerNotAfter = new Date(issuer.notAfter);

    if (issuerNotAfter <= now) {
      validityCtrl.setErrors({ ...currentErrors, issuerExpired: true });
      return;
    }

    const childNotAfter = new Date(now);
    childNotAfter.setDate(childNotAfter.getDate() + validityDays);

    if (childNotAfter > issuerNotAfter) {
      validityCtrl.setErrors({ ...currentErrors, issuerExceeded: true });
      return;
    }

    validityCtrl.setErrors(
      Object.keys(currentErrors).length ? currentErrors : null,
    );
  }

  private validatePathLenAgainstIssuer() {
    const type = this.issueForm.get('type')?.value;
    const issuerId = this.issueForm.get('issuerCertificateId')?.value;
    const pathLenCtrl = this.issueForm.get('pathLen');

    if (!pathLenCtrl) return;

    const currentErrors = { ...(pathLenCtrl.errors || {}) };
    delete currentErrors['issuerPathLenExceeded'];
    delete currentErrors['backendPathLen'];

    if (type === 'ROOT' || type === 'END_ENTITY' || !issuerId) {
      pathLenCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const issuer = this.issuers.find((i) => i.id === issuerId);
    if (!issuer) {
      pathLenCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const childPathLen = Number(pathLenCtrl.value);

    if (
      pathLenCtrl.value === null ||
      pathLenCtrl.value === undefined ||
      Number.isNaN(childPathLen)
    ) {
      pathLenCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const issuerPathLen = (issuer as any).pathLen;

    if (issuerPathLen === null || issuerPathLen === undefined) {
      pathLenCtrl.setErrors(
        Object.keys(currentErrors).length ? currentErrors : null,
      );
      return;
    }

    const maxAllowed = issuerPathLen - 1;

    if (childPathLen > maxAllowed) {
      pathLenCtrl.setErrors({
        ...currentErrors,
        issuerPathLenExceeded: true,
      });
      return;
    }

    pathLenCtrl.setErrors(
      Object.keys(currentErrors).length ? currentErrors : null,
    );
  }
}
