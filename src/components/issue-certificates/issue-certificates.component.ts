import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthStore } from 'src/services/auth.store';
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
  CertificateTemplateDto,
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
  isAdmin = false;
  isCaUser = false;
  organization = '';
  templates: CertificateTemplateDto[] = [];
  selectedTemplate: CertificateTemplateDto | null = null;
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
    private authStore: AuthStore,
  ) {}

  ngOnInit(): void {
    this.authStore.isAdmin$.subscribe((v) => (this.isAdmin = v));
    this.authStore.isCaUser$.subscribe((v) => (this.isCaUser = v));

    this.initForm();

    this.authStore.organization$.subscribe((org) => {
      this.organization = org;
      if (this.isCaUser && org) {
        this.issueForm.get('o')?.setValue(org);
      }
    });

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
      templateId: this.fb.control<number | null>(null),
      validityDays: this.fb.nonNullable.control(365, [
        Validators.required,
        Validators.min(1),
      ]),
      cn: this.fb.nonNullable.control('', [
        Validators.required,
        this.templateCnValidator,
      ]),
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

  getVisibleKeyUsageOptions(): { value: string; label: string }[] {
    const type = this.issueForm.get('type')?.value;

    const baseOptions =
      type === 'END_ENTITY'
        ? [...this.eeKeyUsageOptions]
        : [...this.caKeyUsageOptions];

    const templateValues = this.selectedTemplate?.keyUsages ?? [];

    const missingOptions = templateValues
      .filter((value) => !baseOptions.some((opt) => opt.value === value))
      .map((value) => ({
        value,
        label: this.formatKeyUsageLabel(value),
      }));

    return [...baseOptions, ...missingOptions];
  }
  private formatKeyUsageLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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

      //ca user ne sme root da izda
      if (this.isCaUser && certType === 'ROOT') {
        this.router.navigate(['/']);
        return;
      }

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

    // this.issueForm.get('issuerCertificateId')?.valueChanges.subscribe(() => {
    //   this.validateValidityAgainstIssuer();
    //   this.validatePathLenAgainstIssuer();
    // });
    this.issueForm
      .get('issuerCertificateId')
      ?.valueChanges.subscribe((issuerId) => {
        this.validateValidityAgainstIssuer();
        this.validatePathLenAgainstIssuer();

        const type = this.issueForm.get('type')?.value;

        if (type !== 'ROOT' && issuerId) {
          this.loadTemplatesByIssuer(Number(issuerId));
        } else {
          this.clearTemplateSelection();
        }
      });

    this.issueForm.get('templateId')?.valueChanges.subscribe((templateId) => {
      if (!templateId) {
        this.selectedTemplate = null;
        return;
      }

      const template = this.templates.find((t) => t.id === Number(templateId));
      if (template) {
        this.applyTemplate(template);
      }
    });

    this.issueForm.get('type')?.valueChanges.subscribe((type) => {
      this.applyTypeRules(type as CertificateType);
      this.validateValidityAgainstIssuer();
      this.validatePathLenAgainstIssuer();

      if (type === 'ROOT') {
        this.clearTemplateSelection();
      } else {
        const issuerId = this.issueForm.get('issuerCertificateId')?.value;
        if (issuerId) {
          this.loadTemplatesByIssuer(Number(issuerId));
        }
      }
    });

    this.issueForm.get('pathLen')?.valueChanges.subscribe(() => {
      this.validatePathLenAgainstIssuer();
    });
  }

  private applyTypeRules(type: CertificateType) {
    const pathLenCtrl = this.issueForm.get('pathLen');
    const issuerCtrl = this.issueForm.get('issuerCertificateId');
    const keyUsageCtrl = this.issueForm.get('keyUsage');
    const templateId = this.issueForm.get('templateId')?.value;

    if (!pathLenCtrl || !issuerCtrl || !keyUsageCtrl) return;

    if (type === 'ROOT') {
      issuerCtrl.setValue(null);
      this.issueForm.get('templateId')?.setValue(null);
      pathLenCtrl.setValidators([this.pathLenValidator.bind(this)]);
      pathLenCtrl.setValue(pathLenCtrl.value ?? 0);
      if (!templateId) {
        keyUsageCtrl.setValue(['KEY_CERT_SIGN', 'CRL_SIGN']);
      }
    }

    if (type === 'INTERMEDIATE') {
      pathLenCtrl.setValidators([this.pathLenValidator.bind(this)]);
      pathLenCtrl.setValue(pathLenCtrl.value ?? 0);

      if (!templateId) {
        keyUsageCtrl.setValue(['KEY_CERT_SIGN', 'CRL_SIGN']);
      }
    }

    if (type === 'END_ENTITY') {
      pathLenCtrl.clearValidators();
      pathLenCtrl.setValue(null);

      if (!templateId) {
        keyUsageCtrl.setValue(['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT']);
      }
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
      templateId: v.templateId ?? null,
      extendedKeyUsage:
        v.templateId && this.selectedTemplate
          ? (this.selectedTemplate.extendedKeyUsages ?? [])
          : [],
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
  private templateCnValidator = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value?.trim();
    const regexStr = this.selectedTemplate?.cnRegex;

    if (!value || !regexStr) {
      return null;
    }

    try {
      const regex = new RegExp(regexStr.trim());
      console.log('Testing:', value, 'against', regexStr);
      console.log('Result:', regex.test(value));

      return regex.test(value) ? null : { templateCnMismatch: true };
    } catch {
      return { invalidTemplateRegex: true };
    }
  };
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
  private loadTemplatesByIssuer(issuerId: number) {
    this.certApi.getTemplatesByIssuer(issuerId).subscribe({
      next: (templates) => {
        this.templates = templates;
        this.selectedTemplate = null;

        this.issueForm.patchValue({
          templateId: null,
        });
      },
      error: () => {
        this.templates = [];
        this.selectedTemplate = null;
        this.message = 'Failed to load templates for selected issuer.';
      },
    });
  }

  private applyTemplate(template: CertificateTemplateDto) {
    this.selectedTemplate = template;

    const currentType = this.issueForm.get('type')?.value;

    this.issueForm.patchValue({
      validityDays: template.maxTtlDays,
      keyUsage:
        template.keyUsages && template.keyUsages.length > 0
          ? template.keyUsages
          : currentType === 'END_ENTITY'
            ? ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT']
            : ['KEY_CERT_SIGN', 'CRL_SIGN'],
    });
    this.issueForm.get('cn')?.updateValueAndValidity({ emitEvent: true });
    this.issueForm.get('cn')?.markAsTouched();
    this.validateValidityAgainstIssuer();
    this.validatePathLenAgainstIssuer();
  }

  private clearTemplateSelection() {
    this.templates = [];
    this.selectedTemplate = null;
    this.issueForm.patchValue({ templateId: null });
    this.issueForm.get('cn')?.updateValueAndValidity();
  }

  shouldShowTemplates(): boolean {
    const type = this.issueForm.get('type')?.value;
    return (
      type !== 'ROOT' && !!this.issueForm.get('issuerCertificateId')?.value
    );
  }
}
