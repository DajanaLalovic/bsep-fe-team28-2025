import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, RegisterRequest } from 'src/services/auth.service';

@Component({
  selector: 'admin-pannel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {

  isAdmin = false;
  showModal = false;
  form!: FormGroup;
  message = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    this.isAdmin = payload.roles?.includes('ADMINISTRATOR');

    this.form = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      organization: ['', Validators.required]
    });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form.reset();
  }

 create() {
    if (this.form.invalid) return;

    const data: RegisterRequest = this.form.value;

    this.authService.createCAUser(data).subscribe({
      next: res => {
        this.message = res.message || "CA user created successfully!";
       setTimeout(() => {
        this.closeModal();
        this.message = '';
      }, 1500);
      },
      error: err => {
        this.message = err?.error?.message || "Error creating CA user.";
      }
    });
  }
}