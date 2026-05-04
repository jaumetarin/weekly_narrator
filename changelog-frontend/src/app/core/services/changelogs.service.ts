import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type ChangelogItem = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  repository: {
    id: number;
    name: string;
    fullName: string;
  };
};

export type ChangelogResponse = {
  items: ChangelogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class ChangelogsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getChangelogs(page = 1, limit = 10) {
    return this.http.get<ChangelogResponse>(
      `${this.baseUrl}/changelogs?page=${page}&limit=${limit}`,
    );
  }

  generateChangelog(repositoryId: number) {
    return this.http.post(
      `${this.baseUrl}/changelogs/generate/${repositoryId}`,
      {},
    );
  }
}
