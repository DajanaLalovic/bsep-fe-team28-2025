import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { concatMap } from 'rxjs';
import { SessionService } from 'src/services/session.service';
import { Session } from 'src/services/session.service';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  imports: [DatePipe, CommonModule],
  standalone:true,
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit {

  sessions: Session[] = [];
  loading = false;
  error = '';
  currentJti = '';

  constructor(private sessionService: SessionService) {}

    ngOnInit(): void {
    this.extractCurrentJti();
    this.loadSessions();
  }

  extractCurrentJti() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      // JWT format: header.payload.signature
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      this.currentJti = decodedPayload.jti; // uzmi JTI trenutnog tokena
    } catch (e) {
      console.error('Failed to decode JWT', e);
    }
  }
}

  loadSessions() {
    this.loading = true;
    this.sessionService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load sessions';
        this.loading = false;
      }
    });
  }

//   revoke(jti: string) {
//     this.sessionService.revokeSession(jti).subscribe({
//       next: () => this.loadSessions(),
//       error: () => alert('Failed to revoke session')
//     });
//   }
// revoke(jti: string) {
//   this.sessionService.revokeSession(jti).subscribe({
//     next: () => {
//       // Čim revoke uspe, refetch
//       this.sessionService.getSessions().subscribe({
//         next: (updatedSessions) => this.sessions = updatedSessions,
//         error: () => alert('Failed to load sessions')
//       });
//     },
//     error: () => alert('Failed to revoke session')
//   });
// }
// revoke(jti: string) {
//   this.sessionService.revokeSession(jti).subscribe({
//     next: (res: any) => {
//       // res.message sadrži poruku sa backend-a
//       console.log(res.message);
//       // odmah refetch
//       this.sessionService.getSessions().subscribe({
//         next: (updatedSessions) => this.sessions = updatedSessions,
//        // error: () => alert('Failed to load sessions')
//       });
//     },
//     error: (err) => {
//       // sad ovo će se pozvati samo za HTTP 400/500
//       alert(err.error?.message || 'Failed to revoke session');
//     }
//   });
// }

revoke(jti: string) {
  const isCurrent = jti === this.currentJti;
  const obs = isCurrent
    ? this.sessionService.revokeCurrentSession(jti)
    : this.sessionService.revokeSession(jti);

  obs.subscribe({
    next: (res: any) => {
      console.log(res.message);
      this.loadSessions(); // odmah refetch
    },
    error: (err) => {
      alert(err.error?.message || 'Failed to revoke session');
    }
  });
}
  revokeAll() {
    for (let session of this.sessions) {
      if (session.jti !== 'current-session-jti') { // zameni stvarnim jti trenutne sesije
        this.revoke(session.jti);
      }
    }
  }
}