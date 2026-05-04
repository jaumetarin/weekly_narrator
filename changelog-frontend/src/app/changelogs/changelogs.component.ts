import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { DatePipe } from '@angular/common';
import {
  ChangelogItem,
  ChangelogResponse,
  ChangelogsService,
} from '../core/services/changelogs.service';
import {
  Repository,
  RepositoriesService,
} from '../core/services/repositories.service';

@Component({
  selector: 'app-changelogs',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './changelogs.component.html',
  styleUrl: './changelogs.component.css',
})
export class ChangelogsComponent implements OnInit {
  changelogs: ChangelogItem[] = [];
  activeRepositories: Repository[] = [];
  isLoading = true;
  isGenerating = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly changelogsService: ChangelogsService,
    private readonly repositoriesService: RepositoriesService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.repositoriesService.getRepositories().subscribe({
      next: (repositories) => {
        this.activeRepositories = repositories.filter(
          (repository) => repository.isActive && repository.repositoryId !== null,
        );

        this.changelogsService.getChangelogs().subscribe({
          next: (response: ChangelogResponse) => {
            this.changelogs = response.items;
            this.isLoading = false;
          },
          error: () => {
            this.errorMessage =
              'No se pudieron cargar los changelogs. Inténtalo de nuevo.';
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.errorMessage =
          'No se pudieron cargar los repositorios monitorizados.';
        this.isLoading = false;
      },
    });
  }

  generateForRepository(repository: Repository) {
    if (!repository.repositoryId) {
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.changelogsService.generateChangelog(repository.repositoryId).subscribe({
      next: () => {
       this.successMessage =
         `La generación para ${repository.name} se ha puesto en cola. ` +
         'Recarga la lista en unos segundos para ver el nuevo changelog.';
        this.isGenerating = false;
      },
      error: () => {
        this.errorMessage =
          'No se pudo lanzar la generación del changelog. Inténtalo de nuevo.';
        this.isGenerating = false;
      },
    });
  }
  refreshChangelogs() {
   this.loadData();
  }
  
  logout() {
  this.authService.clearToken();
  this.router.navigate(['/login']);
}

}
