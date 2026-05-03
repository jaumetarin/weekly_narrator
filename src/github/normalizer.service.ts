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
  private normalizeText(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeTitle(value: string | null | undefined, fallback: string) {
    return this.normalizeText(value) ?? fallback;
  }

  private normalizeAuthorName(value: string | null | undefined) {
    return this.normalizeText(value);
  }

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
      title: this.normalizeTitle(commit.message, 'Commit without message'),
      authorName: this.normalizeAuthorName(commit.authorName),
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
    return pullRequests
      .filter((pullRequest) => pullRequest.mergedAt)
      .map((pullRequest) => ({
        type: 'pull_request',
        title: this.normalizeTitle(
          pullRequest.title,
          'Pull request without title',
        ),
        authorName: this.normalizeAuthorName(pullRequest.authorName),
        occurredAt: pullRequest.mergedAt,
        url: pullRequest.url,
        changedFiles: pullRequest.changedFiles,
      }));
  }
}
