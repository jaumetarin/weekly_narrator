import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type Repository = {
  repositoryId: number | null;
  githubRepoId: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  url: string;
  isActive: boolean;
};

type SyncRepositoryItem = {
  githubRepoId: number;
  name: string;
  fullName: string;
};

@Injectable({
  providedIn: 'root',
})
export class RepositoriesService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getRepositories() {
    return this.http.get<Repository[]>(`${this.baseUrl}/github/repos`);
  }

  syncRepositories(repositories: SyncRepositoryItem[]) {
    return this.http.post(`${this.baseUrl}/github/repos/sync`, {
      repositories,
    });
  }
}
