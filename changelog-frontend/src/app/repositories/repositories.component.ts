import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Repository, RepositoriesService } from '../core/services/repositories.service';

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css',
})

export class RepositoriesComponent implements OnInit {
  repositories: Repository[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.loadRepositories();
  }

  loadRepositories() {
    this.isLoading = true;
    this.errorMessage = '';

    this.repositoriesService.getRepositories().subscribe({
      next: (repositories) => {
        this.repositories = repositories;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage =
          'No se pudieron cargar los repositorios. Vuelve a iniciar sesión o inténtalo de nuevo.';
        this.isLoading = false;
      },
    });
  }

  toggleRepository(repository: Repository) {
    repository.isActive = !repository.isActive;
  }

  saveSelection() {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const selectedRepositories = this.repositories
      .filter((repository) => repository.isActive)
      .map((repository) => ({
        githubRepoId: repository.githubRepoId,
        name: repository.name,
        fullName: repository.fullName,
      }));

    this.repositoriesService.syncRepositories(selectedRepositories).subscribe({
      next: () => {
        this.successMessage = 'Selección guardada correctamente.';
        this.isSaving = false;
        this.loadRepositories();
      },
      error: () => {
        this.errorMessage =
          'No se pudo guardar la selección de repositorios. Inténtalo de nuevo.';
        this.isSaving = false;
      },
    });
  }
  logout() {
  this.authService.clearToken();
  this.router.navigate(['/login']);
}

}
