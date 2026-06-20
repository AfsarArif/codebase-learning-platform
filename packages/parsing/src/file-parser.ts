/**
 * File parsing and filtering utilities for repository ingestion.
 * Handles file tree walking, ignore patterns, language detection, and chunking.
 */

export interface FileEntry {
  path: string;
  language: string | null;
  sizeBytes: number;
  isBinary: boolean;
  isIgnored: boolean;
}

export interface ParsedFile extends FileEntry {
  content: string;
  hash: string;
}

export interface CodeChunk {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  type: 'imports' | 'exports' | 'function' | 'class' | 'config' | 'comment' | 'other';
}

// Directories and patterns to always ignore
const ALWAYS_IGNORE = [
  'node_modules',
  '.git',
  '__pycache__',
  '.venv',
  'venv',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.cache',
  'coverage',
  '.nyc_output',
  '.idea',
  '.vscode',
];

// Binary file extensions to skip
const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.bmp',
  '.tiff',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.mkv',
  '.webm',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.jar',
  '.war',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.wasm',
  '.class',
  '.pyc',
  '.pyo',
  '.o',
  '.obj',
  '.a',
  '.lib',
]);

// Language detection by extension
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.pyi': 'python',
  '.pyx': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.elm': 'elm',
  '.lua': 'lua',
  '.r': 'r',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.ps1': 'powershell',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.json': 'json',
  '.xml': 'xml',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.toml': 'toml',
  '.ini': 'ini',
  '.cfg': 'ini',
  '.env': 'dotenv',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.html': 'html',
  '.htm': 'html',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.astro': 'astro',
  '.prisma': 'prisma',
  '.tf': 'terraform',
  '.hcl': 'terraform',
  '.dockerfile': 'dockerfile',
  '.makefile': 'makefile',
  '.cmake': 'cmake',
};

export class FileParser {
  /**
   * Check if a file path should be ignored.
   */
  static shouldIgnore(path: string, additionalIgnores: string[] = []): boolean {
    const segments = path.split('/');

    // Check against always-ignore patterns at any depth
    for (const segment of segments) {
      if (ALWAYS_IGNORE.includes(segment)) return true;
      if (additionalIgnores.includes(segment)) return true;
    }

    // Check if it's a hidden file
    const basename = segments[segments.length - 1];
    if (basename?.startsWith('.') && basename !== '.env.example') return true;

    // Check against generated/vendored patterns
    if (path.includes('generated/') || path.includes('vendor/') || path.includes('vendored/')) {
      return true;
    }

    return false;
  }

  /**
   * Detect the programming language of a file based on its extension.
   */
  static detectLanguage(filePath: string): string | null {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

    if (LANGUAGE_MAP[ext]) {
      return LANGUAGE_MAP[ext];
    }

    // Special cases for filenames without extensions
    const basename = filePath.split('/').pop()?.toLowerCase() ?? '';
    if (basename === 'dockerfile') return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    if (basename === 'jenkinsfile') return 'groovy';
    if (basename === 'vagrantfile') return 'ruby';
    if (basename === 'gemfile' || basename === 'rakefile') return 'ruby';

    return null;
  }

  /**
   * Check if a file has a binary extension.
   */
  static isBinaryExtension(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return BINARY_EXTENSIONS.has(ext);
  }

  /**
   * Filter a list of file paths, removing ignored and binary files.
   */
  static filterFiles(paths: string[], additionalIgnores: string[] = []): string[] {
    return paths.filter(
      (path) => !this.shouldIgnore(path, additionalIgnores) && !this.isBinaryExtension(path),
    );
  }

  /**
   * Get the size-based chunking strategy for a file.
   * Files under 4000 chars → single chunk
   * Files under 16000 chars → split by major sections (imports, exports, then by function/class)
   * Larger files → chunk by function/class boundaries, ~4000 chars each
   */
  static getChunkStrategy(fileSizeBytes: number): 'single' | 'sections' | 'functions' {
    const estimatedChars = fileSizeBytes; // rough estimate
    if (estimatedChars < 4000) return 'single';
    if (estimatedChars < 16000) return 'sections';
    return 'functions';
  }

  /**
   * Chunk file content by logical boundaries.
   */
  static chunkContent(filePath: string, content: string): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];

    // Extract imports section (first block of import/include statements)
    const importEndIndex = lines.findIndex(
      (line, i) =>
        i > 5 &&
        !line.trim().startsWith('import') &&
        !line.trim().startsWith('from') &&
        !line.trim().startsWith('#include') &&
        !line.trim().startsWith('require') &&
        !line.trim().startsWith('use ') &&
        line.trim() !== '',
    );

    if (importEndIndex > 0) {
      chunks.push({
        filePath,
        startLine: 1,
        endLine: importEndIndex,
        content: lines.slice(0, importEndIndex).join('\n'),
        type: 'imports',
      });
    }

    // Find exports section (end of file)
    const exportStartIndex = lines.findIndex(
      (line, i) =>
        i > lines.length - 20 &&
        (line.trim().startsWith('export ') ||
          line.trim().startsWith('module.exports') ||
          line.trim() === 'export {'),
    );

    if (exportStartIndex > 0 && exportStartIndex > importEndIndex) {
      chunks.push({
        filePath,
        startLine: exportStartIndex + 1,
        endLine: lines.length,
        content: lines.slice(exportStartIndex).join('\n'),
        type: 'exports',
      });
    }

    // Chunk remaining body by function/class boundaries
    let currentStart = importEndIndex > 0 ? importEndIndex : 0;
    const bodyEnd = exportStartIndex > 0 ? exportStartIndex : lines.length;
    let currentChunk: string[] = [];
    let currentLine = currentStart + 1;

    for (let i = currentStart; i < bodyEnd; i++) {
      const line = lines[i] ?? '';
      const isBoundary =
        /^\s*(export\s+)?(async\s+)?function\s+\w/.test(line) ||
        /^\s*(export\s+)?(abstract\s+)?class\s+\w/.test(line) ||
        /^\s*(export\s+)?interface\s+\w/.test(line) ||
        /^\s*(export\s+)?const\s+\w+\s*=/.test(line) ||
        /^\s*\/\*\*/.test(line);

      if (isBoundary && currentChunk.length > 0) {
        chunks.push({
          filePath,
          startLine: currentLine,
          endLine: i,
          content: currentChunk.join('\n'),
          type: 'function',
        });
        currentChunk = [];
        currentLine = i + 1;
      }

      currentChunk.push(line);
    }

    // Add remaining content
    if (currentChunk.length > 0) {
      chunks.push({
        filePath,
        startLine: currentLine,
        endLine: lines.length,
        content: currentChunk.join('\n'),
        type: 'other',
      });
    }

    return chunks.length > 0 ? chunks : [{ filePath, startLine: 1, endLine: lines.length, content, type: 'other' }];
  }
}
