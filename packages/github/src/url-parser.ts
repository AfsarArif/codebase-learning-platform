/**
 * GitHub URL parsing utilities.
 * Extracts owner, repo, branch, and path from GitHub URLs.
 *
 * Supported formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/path
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/blob/branch/path
 */

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch: string | null;
  path: string | null;
  urlType: 'repo' | 'tree' | 'blob';
  fullUrl: string;
}

export class GitHubUrlParser {
  private static readonly GITHUB_URL_REGEX =
    /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/(tree|blob)\/([a-zA-Z0-9._-]+)(?:\/(.+))?)?\/?$/;

  /**
   * Parse a GitHub URL into its components.
   * Returns null if the URL is not a valid GitHub repository URL.
   */
  static parse(url: string): ParsedGitHubUrl | null {
    const trimmed = url.trim().replace(/\/$/, '');
    const match = trimmed.match(this.GITHUB_URL_REGEX);

    if (!match) {
      return null;
    }

    const [, owner, repo, urlType, branch, path] = match;

    return {
      owner: owner!,
      repo: repo!,
      branch: branch ?? null,
      path: path ?? null,
      urlType: (urlType as 'repo' | 'tree' | 'blob') ?? 'repo',
      fullUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  /**
   * Validate if a string is a valid GitHub repository URL.
   */
  static isValid(url: string): boolean {
    return this.parse(url) !== null;
  }

  /**
   * Extract just the owner and repo from a URL.
   */
  static getOwnerRepo(url: string): { owner: string; repo: string } | null {
    const parsed = this.parse(url);
    if (!parsed) return null;
    return { owner: parsed.owner, repo: parsed.repo };
  }

  /**
   * Build a GitHub URL from owner and repo.
   */
  static buildUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}`;
  }

  /**
   * Build a GitHub clone URL.
   */
  static buildCloneUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}.git`;
  }

  /**
   * Build a GitHub archive URL for a specific branch.
   */
  static buildArchiveUrl(owner: string, repo: string, branch = 'main'): string {
    return `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
  }
}
