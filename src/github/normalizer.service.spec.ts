import { NormalizerService } from './normalizer.service';

describe('NormalizerService', () => {
  let service: NormalizerService;

  beforeEach(() => {
    service = new NormalizerService();
  });

  describe('normalizeCommits', () => {
    it('should normalize commits into a common activity structure', () => {
      const commits = [
        {
          sha: 'abc123',
          message: 'feat: add GitHub OAuth',
          authorName: 'Jaume',
          authorDate: '2026-05-01T10:00:00.000Z',
          url: 'https://github.com/test/repo/commit/abc123',
          changedFiles: [
            {
              filename: 'src/auth/auth.service.ts',
              status: 'modified',
            },
          ],
        },
      ];

      const result = service.normalizeCommits(commits);

      expect(result).toEqual([
        {
          type: 'commit',
          title: 'feat: add GitHub OAuth',
          authorName: 'Jaume',
          occurredAt: '2026-05-01T10:00:00.000Z',
          url: 'https://github.com/test/repo/commit/abc123',
          changedFiles: [
            {
              filename: 'src/auth/auth.service.ts',
              status: 'modified',
            },
          ],
        },
      ]);
    });

    it('should clean commit titles and author names', () => {
      const commits = [
        {
          sha: 'abc123',
          message: '   feat: add GitHub OAuth   ',
          authorName: '   Jaume   ',
          authorDate: '2026-05-01T10:00:00.000Z',
          url: 'https://github.com/test/repo/commit/abc123',
          changedFiles: [],
        },
      ];

      const result = service.normalizeCommits(commits);

      expect(result[0].title).toBe('feat: add GitHub OAuth');
      expect(result[0].authorName).toBe('Jaume');
    });

    it('should use a fallback title when commit message is empty', () => {
      const commits = [
        {
          sha: 'abc123',
          message: '   ',
          authorName: 'Jaume',
          authorDate: '2026-05-01T10:00:00.000Z',
          url: 'https://github.com/test/repo/commit/abc123',
          changedFiles: [],
        },
      ];

      const result = service.normalizeCommits(commits);

      expect(result[0].title).toBe('Commit without message');
    });
  });

  describe('normalizePullRequests', () => {
    it('should normalize merged pull requests into a common activity structure', () => {
      const pullRequests = [
        {
          id: 1,
          title: 'feat: add changelog generation',
          authorName: 'Jaume',
          state: 'closed',
          mergedAt: '2026-05-02T15:00:00.000Z',
          url: 'https://github.com/test/repo/pull/1',
          changedFiles: [
            {
              filename: 'src/changelog/changelog.service.ts',
              status: 'modified',
            },
          ],
        },
      ];

      const result = service.normalizePullRequests(pullRequests);

      expect(result).toEqual([
        {
          type: 'pull_request',
          title: 'feat: add changelog generation',
          authorName: 'Jaume',
          occurredAt: '2026-05-02T15:00:00.000Z',
          url: 'https://github.com/test/repo/pull/1',
          changedFiles: [
            {
              filename: 'src/changelog/changelog.service.ts',
              status: 'modified',
            },
          ],
        },
      ]);
    });

    it('should ignore pull requests without mergedAt', () => {
      const pullRequests = [
        {
          id: 1,
          title: 'draft: work in progress',
          authorName: 'Jaume',
          state: 'open',
          mergedAt: null,
          url: 'https://github.com/test/repo/pull/1',
          changedFiles: [],
        },
      ];

      const result = service.normalizePullRequests(pullRequests);

      expect(result).toEqual([]);
    });

    it('should clean pull request titles and author names', () => {
      const pullRequests = [
        {
          id: 1,
          title: '   feat: add weekly scheduler   ',
          authorName: '   Jaume   ',
          state: 'closed',
          mergedAt: '2026-05-02T15:00:00.000Z',
          url: 'https://github.com/test/repo/pull/1',
          changedFiles: [],
        },
      ];

      const result = service.normalizePullRequests(pullRequests);

      expect(result[0].title).toBe('feat: add weekly scheduler');
      expect(result[0].authorName).toBe('Jaume');
    });

    it('should use a fallback title when pull request title is empty', () => {
      const pullRequests = [
        {
          id: 1,
          title: '   ',
          authorName: 'Jaume',
          state: 'closed',
          mergedAt: '2026-05-02T15:00:00.000Z',
          url: 'https://github.com/test/repo/pull/1',
          changedFiles: [],
        },
      ];

      const result = service.normalizePullRequests(pullRequests);

      expect(result[0].title).toBe('Pull request without title');
    });
  });
});
