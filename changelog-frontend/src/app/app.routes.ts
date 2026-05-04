import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { RepositoriesComponent } from './repositories/repositories.component';
import { ChangelogsComponent } from './changelogs/changelogs.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: 'repositories',
    component: RepositoriesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'changelogs',
    component: ChangelogsComponent,
    canActivate: [authGuard],
  },
];
