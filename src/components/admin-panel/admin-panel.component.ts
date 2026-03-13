import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  CertificateApiService,
  CertificateListDto,
  CertificateType,
  IssueCertificateRequestDto,
} from 'src/services/certificates-api.service';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  AuthService,
  RegisterRequest,
  UserListDto,
} from 'src/services/auth.service';

@Component({
  selector: 'admin-pannel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent implements OnInit {
  isAdmin = false;
  showModal = false;
  form!: FormGroup;
  message = '';
  showIssueModal = false;
  selectedUserId?: number;
  issuers: CertificateListDto[] = [];
  caUsers: UserListDto[] = [];
  loadingUsers = false;
  issueForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private certApi: CertificateApiService,
    private router: Router,
  ) {}
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

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    this.isAdmin = payload.roles?.includes('ADMINISTRATOR');

    this.form = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      organization: ['', Validators.required],
    });
    // this.certApi.getIssuers().subscribe((x) => (this.issuers = x));
    // this.certApi.getIssuers().subscribe((x) => {
    //   this.issuers = x.filter((i) => !i.revoked);
    // });
    this.certApi.getIssuers().subscribe((x) => {
      this.issuers = x.filter((i) => !i.revoked && i.type !== 'END_ENTITY');
    });
    this.loadCaUsers();

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

      // pathLen: this.fb.control<number | null>(0),
      pathLen: this.fb.control<number | null>(0, [
        this.pathLenValidator.bind(this),
      ]),

      keyUsage: this.fb.nonNullable.control<string[]>([
        'KEY_CERT_SIGN',
        'CRL_SIGN',
      ]),
    });

    this.issueForm.get('validityDays')?.valueChanges.subscribe(() => {
      this.validateValidityAgainstIssuer();
    });

    this.issueForm.get('issuerCertificateId')?.valueChanges.subscribe(() => {
      this.validateValidityAgainstIssuer();
    });

    this.issueForm.get('type')?.valueChanges.subscribe(() => {
      this.validateValidityAgainstIssuer();
    });

    this.issueForm.get('pathLen')?.valueChanges.subscribe(() => {
      this.validatePathLenAgainstIssuer();
    });

    this.issueForm.get('issuerCertificateId')?.valueChanges.subscribe(() => {
      this.validatePathLenAgainstIssuer();
    });

    this.issueForm.get('type')?.valueChanges.subscribe(() => {
      this.validatePathLenAgainstIssuer();
    });

    //predefinisano-sta se uglavnom kroisti
    this.issueForm.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'END_ENTITY') {
        this.issueForm.patchValue({
          keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
          pathLen: null,
        });
      }

      if (type === 'INTERMEDIATE' || type === 'ROOT') {
        this.issueForm.patchValue({
          keyUsage: ['KEY_CERT_SIGN', 'CRL_SIGN'],
          pathLen: 0,
        });
      }
    });

    //da ogranciim-pathLen je obavezan (za CA),za EE je null,a keyUsage se resetuje na defaulte
    const applyTypeRules = (type: CertificateType) => {
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
      this.validatePathLenAgainstIssuer();
    };

    applyTypeRules(this.issueForm.get('type')!.value);

    this.issueForm
      .get('type')!
      .valueChanges.subscribe((t) => applyTypeRules(t as CertificateType));
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
      validityCtrl.setErrors({
        ...currentErrors,
        issuerExpired: true,
      });
      return;
    }

    const childNotAfter = new Date(now);
    childNotAfter.setDate(childNotAfter.getDate() + validityDays);

    if (childNotAfter > issuerNotAfter) {
      validityCtrl.setErrors({
        ...currentErrors,
        issuerExceeded: true,
      });
      return;
    }

    validityCtrl.setErrors(
      Object.keys(currentErrors).length ? currentErrors : null,
    );
  }

  isKeyUsageSelected(value: string): boolean {
    return (this.issueForm.get('keyUsage')?.value ?? []).includes(value);
  }

  toggleKeyUsage(value: string, checked: boolean) {
    const current = (this.issueForm.get('keyUsage')?.value ?? []) as string[];

    const updated = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((x: string) => x !== value);

    this.issueForm.patchValue({ keyUsage: updated });
  }
  private buildSubjectDn(v: any): string {
    const parts: string[] = [];
    if (v.cn) parts.push(`CN=${v.cn}`);
    if (v.o) parts.push(`O=${v.o}`);
    if (v.c) parts.push(`C=${v.c}`);
    return parts.join(',');
  }

  private loadCaUsers() {
    this.loadingUsers = true;

    this.authService.getCaUsers().subscribe({
      next: (u) => {
        console.log('CA USERS RESPONSE:', u);
        console.log('TYPE OF RESPONSE:', typeof u);
        console.log('IS ARRAY:', Array.isArray(u));

        this.caUsers = u;
        console.log('CA USERS AFTER SET:', this.caUsers);

        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('ERROR LOADING CA USERS:', err);

        this.message = err?.error?.message || 'Error loading CA users';
        this.loadingUsers = false;
      },
    });
  }
  onKeyUsageChange(event: Event, value: string) {
    const input = event.target as HTMLInputElement | null;
    const checked = input?.checked ?? false;
    this.toggleKeyUsage(value, checked);
  }

  openIssueModal(userId: number) {
    this.selectedUserId = userId;

    this.issueForm.patchValue({
      type: 'INTERMEDIATE',
      issuerCertificateId: null,
      validityDays: 365,
      cn: `CA User ${userId}`,
      o: '',
      c: 'RS',
      pathLen: 0,
      keyUsage: ['KEY_CERT_SIGN', 'CRL_SIGN'],
    });

    this.showIssueModal = true;
  }

  closeIssueModal() {
    this.showIssueModal = false;
  }

  issueCertificate() {
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
    // Validacije po tipu:
    if (v.type !== 'ROOT' && !v.issuerCertificateId) {
      this.message =
        'Issuer certificate is required for INTERMEDIATE/END_ENTITY';
      return;
    }

    const req: IssueCertificateRequestDto = {
      ownerUserId: this.selectedUserId ?? null,

      type: v.type,
      issuerCertificateId: v.type === 'ROOT' ? null : v.issuerCertificateId,
      subjectDn: this.buildSubjectDn(v),
      validityDays: v.validityDays,

      isCa: v.type !== 'END_ENTITY',
      pathLen: v.type === 'END_ENTITY' ? null : (v.pathLen ?? null),

      keyUsage:
        v.type === 'END_ENTITY'
          ? ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT']
          : (v.keyUsage ?? ['KEY_CERT_SIGN', 'CRL_SIGN']),
      extendedKeyUsage: [],
    };

    this.certApi.issueCertificate(req).subscribe({
      next: (res) => {
        this.message = 'Certificate issued successfully';
        this.closeIssueModal();
        this.router.navigate(['/my-certificates']);
      },
      error: (err) => {
        console.log('ISSUE CERT ERROR:', err);
        console.log('ERR.ERROR:', err?.error);

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

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form.reset();
  }
  private pathLenValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    const num = Number(value);

    if (Number.isNaN(num)) {
      return { invalidNumber: true };
    }

    if (!Number.isInteger(num)) {
      return { notInteger: true };
    }

    if (num < 0) {
      return { min: true };
    }

    return null;
  }

  private validatePathLenAgainstIssuer() {
    const type = this.issueForm.get('type')?.value;
    const issuerId = this.issueForm.get('issuerCertificateId')?.value;
    const pathLenCtrl = this.issueForm.get('pathLen');

    if (!pathLenCtrl) return;

    const currentErrors = { ...(pathLenCtrl.errors || {}) };
    delete currentErrors['issuerPathLenExceeded'];

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

    if (childPathLen > issuerPathLen - 1) {
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

  create() {
    if (this.form.invalid) return;

    const data: RegisterRequest = this.form.value;

    this.authService.createCAUser(data).subscribe({
      next: (res) => {
        this.message = res.message || 'CA user created successfully!';
        setTimeout(() => {
          this.closeModal();
          this.message = '';
        }, 1500);
      },
      error: (err) => {
        this.message = err?.error?.message || 'Error creating CA user.';
      },
    });
    this.loadCaUsers();
  }

  //   toggleKeyUsage(value: string, event: any) {
  //     const usages = this.issueForm.value.keyUsage || [];

  //     if (event.target.checked) {
  //       usages.push(value);
  //     } else {
  //       const index = usages.indexOf(value);
  //       if (index > -1) usages.splice(index, 1);
  //     }

  //     this.issueForm.patchValue({ keyUsage: usages });
  //   }
}
