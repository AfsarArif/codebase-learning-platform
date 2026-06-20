/**
 * GitHub API client for fetching repository metadata and contents.
 * Supports both authenticated (OAuth/App) and unauthenticated requests.
 */

export interface GitHubRepoMetadata {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  visibility: 'public' | 'private';
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  size: number;
  cloneUrl: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubFileInfo {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  url?: string;
}

export interface GitHubContentResponse {
  path: string;
  content: string; // base64 encoded
  encoding: 'base64';
  sha: string;
  size: number;
}

export class GitHubApiClient {
  private readonly baseUrl = 'https://api.github.com';
  private token: string | null;

  constructor(token?: string) {
    this.token = token ?? null;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'codebase-learning-platform',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Fetch repository metadata from GitHub API.
   */
  async getRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      visibility: data.private ? 'private' : 'public',
      language: data.language,
      topics: data.topics ?? [],
      stars: data.stargazers_count,
      forks: data.forks_count,
      size: data.size,
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get the file tree of a repository at a specific branch/commit.
   */
  async getFileTree(
    owner: string,
    repo: string,
    branch = 'main',
    recursive = true,
  ): Promise<GitHubFileInfo[]> {
    // First, get the tree SHA for the branch
    const refResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers: this.headers },
    );

    if (!refResponse.ok) {
      throw new Error(`Failed to get branch ref: ${refResponse.status}`);
    }

    const refData = await refResponse.json();
    const treeSha = refData.object.sha;

    // Then get the recursive tree
    const params = new URLSearchParams({ recursive: recursive ? '1' : '0' });
    const treeResponse = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${treeSha}?${params}`,
      { headers: this.headers },
    );

    if (!treeResponse.ok) {
      throw new Error(`Failed to get file tree: ${treeResponse.status}`);
    }

    const treeData = await treeResponse.json();

    return treeData.tree.map((item: { path: string; type: string; size?: number; sha?: string; url?: string }) => ({
      path: item.path,
      type: item.type as 'file' | 'dir',
      size: item.size,
      sha: item.sha,
      url: item.url,
    }));
  }

  /**
   * Fetch the content of a specific file from the repository.
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<GitHubContentResponse> {
    let url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    if (ref) {
      url += `?ref=${ref}`;
    }

    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Download a repository archive (zip) for a given branch.
   * Returns the URL to download (requires token for private repos).
   */
  getArchiveUrl(owner: string, repo: string, branch = 'main'): string {
    return `${this.baseUrl}/repos/${owner}/${repo}/zipball/${branch}`;
  }

  /**
   * List accessible repositories for an authenticated user.
   */
  async listUserRepos(page = 1, perPage = 30): Promise<GitHubRepoMetadata[]> {
    if (!this.token) {
      throw new Error('Authentication required to list user repositories');
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: 'updated',
    });

    const response = await fetch(`${this.baseUrl}/user/repos?${params}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list repositories: ${response.status}`);
    }

    const data = await response.json();
    return data.map((repo: Record<string, unknown>) => ({
      id: repo.id,
      owner: (repo.owner as { login: string }).login,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      visibility: repo.private ? 'private' : 'public',
      language: repo.language,
      topics: repo.topics ?? [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: repo.size,
      cloneUrl: repo.clone_url,
      htmlUrl: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
    }));
  }

  /**
   * Check if a repository exists and is accessible.
   */
  async repoExists(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
