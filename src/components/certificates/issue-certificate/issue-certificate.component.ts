import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-issue-certificate',
  standalone: true,
  imports: [],
  templateUrl: './issue-certificate.component.html',
  styleUrl: './issue-certificate.component.css',
})
export class IssueCertificateComponent {
  private route = inject(ActivatedRoute);
  certType = this.route.snapshot.data['certType'];
}
