import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/services/auth.service';
import { passwordStrength } from 'src/utils/password-strength.util';


@Component({
selector: 'app-register',
standalone: true,
imports: [CommonModule, ReactiveFormsModule],
templateUrl: './register.component.html',
styleUrls: ['./register.component.css']
})
export class RegisterComponent {


registerForm: FormGroup;
strength = 0;
successMessage = '';
errorMessage = '';
constructor(private fb: FormBuilder, private authService: AuthService) {
this.registerForm = this.fb.group({
name: ['', Validators.required],
surname: ['', Validators.required],
email: ['', [Validators.required, Validators.email]],
organization: [''],
password: ['', [Validators.required, Validators.minLength(8)]],
confirmPassword: ['', Validators.required]
});
}


onPasswordInput() {
this.strength = passwordStrength(this.registerForm.value.password);
}


submit() {
if (this.registerForm.invalid) return;


if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
this.errorMessage = 'Lozinke se ne poklapaju';
return;
}


this.authService.register(this.registerForm.value).subscribe({
next: () => {
this.successMessage = 'Registracija uspešna. Proverite email radi aktivacije naloga.';
this.errorMessage = '';
this.registerForm.reset();
},
error: err => {
this.errorMessage = err?.error?.message || 'Greška pri registraciji';
}
});
}
}