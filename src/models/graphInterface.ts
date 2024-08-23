export interface DependencyMap {
  [packageName: string]: string;
}

/**
 * Represents a map of installed packages.
 * The key is the package name and the value is the package version.
 */
export interface InstalledMap {
  [packageName: string]: string;
}
