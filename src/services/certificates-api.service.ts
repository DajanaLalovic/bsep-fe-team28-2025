import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CertificateType = 'ROOT' | 'INTERMEDIATE' | 'END_ENTITY';

export interface CertificateListDto {
  id: number;
  type: CertificateType;
  serialNumber: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  revoked: boolean;
  issuerCertificateId: number | null;
}

export interface IssueCertificateResponseDto {
  id: number;
  serialNumber: string;
  subjectDn: string;
  issuerDn: string;
  notBefore: string;
  notAfter: string;
  certificatePem: string;
}
export interface IssueCertificateRequestDto {
  ownerUserId?: number | null;
  type: CertificateType;
  issuerCertificateId: number | null; // null za ROOT
  subjectDn: string; // "CN=..., O=..., C=RS"
  validityDays: number;
  isCa: boolean;
  pathLen: number | null;
  keyUsage: string[]; // ["KEY_CERT_SIGN","CRL_SIGN"]
}

@Injectable({ providedIn: 'root' })
export class CertificateApiService {
  private baseUrl = 'https://localhost:8443/api/certificates';
  constructor(private http: HttpClient) {}

  getCertificates(): Observable<CertificateListDto[]> {
    return this.http.get<CertificateListDto[]>(this.baseUrl);
  }
  getIssuers(): Observable<CertificateListDto[]> {
    return this.http.get<CertificateListDto[]>(`${this.baseUrl}/issuers`);
  }
  revokeCertificate(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/revoke`, { reason });
  }
  issueCertificate(
    req: IssueCertificateRequestDto,
  ): Observable<IssueCertificateResponseDto> {
    return this.http.post<IssueCertificateResponseDto>(
      `${this.baseUrl}/issue`,
      req,
    );
  }

  issueFromCsr(
    csrFile: File,
    issuerCertificateId: number,
    validityDays: number,
  ): Observable<IssueCertificateResponseDto> {
    const fd = new FormData();
    fd.append('csrFile', csrFile);
    fd.append('issuerCertificateId', String(issuerCertificateId));
    fd.append('validityDays', String(validityDays));
    return this.http.post<IssueCertificateResponseDto>(
      `${this.baseUrl}/issue-csr`,
      fd,
    );
  }

  downloadPem(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download.pem/${id}`, {
      responseType: 'blob',
    });
  }

  downloadDer(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download.der/${id}`, {
      responseType: 'blob',
    });
  }
}
