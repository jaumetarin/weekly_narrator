import { Injectable } from '@nestjs/common';

export type NormalizedActivity = {
  type: 'commit' | 'pull_request';
  title: string;
  authorName: string | null;
  occurredAt: string | null;
  url: string;
  changedFiles: Array<{
    filename: string;
    status: string;
  }>;
};

@Injectable()
export class NormalizerService {
  normalizeCommits(
    commits: Array<{
      sha: string;
      message: string;
      authorName: string | null;
      authorDate: string | null;
      url: string;
      changedFiles: Array<{
        filename: string;
        status: string;
      }>;
    }>,
  ): NormalizedActivity[] {
    return commits.map((commit) => ({
      type: 'commit',
      title: commit.message,
      authorName: commit.authorName,
      occurredAt: commit.authorDate,
      url: commit.url,
      changedFiles: commit.changedFiles,
    }));
  }

  normalizePullRequests(
    pullRequests: Array<{
      id: number;
      title: string;
      authorName: string | null;
      state: string;
      mergedAt: string | null;
      url: string;
      changedFiles: Array<{
        filename: string;
        status: string;
      }>;
    }>,
  ): NormalizedActivity[] {
    return pullRequests.map((pullRequest) => ({
      type: 'pull_request',
      title: pullRequest.title,
      authorName: pullRequest.authorName,
      occurredAt: pullRequest.mergedAt,
      url: pullRequest.url,
      changedFiles: pullRequest.changedFiles,
    }));
  }
}
