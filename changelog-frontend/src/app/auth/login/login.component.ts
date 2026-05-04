import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  backendAuthUrl: string;

  constructor(private readonly authService: AuthService) {
    this.backendAuthUrl = this.authService.getBackendAuthUrl();
  }
}
