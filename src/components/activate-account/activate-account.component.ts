import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.css']
})
export class ActivateAccountComponent implements OnInit {

  loading = true;
  success = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    //console.log('token', token)
    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Nevažeći aktivacioni link.';
      return;
    }

    this.auth.activate(token).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.success;
        this.message = res.message;

        if (res.success) {
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      },
      error: () => {
        this.loading = false;
        this.success = false;
        this.message = 'Greška pri aktivaciji.';
      }
    });
  }
}