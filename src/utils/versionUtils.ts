import fs from "fs";
import path from "path";
import semver from "semver";

/**
 * Gets the version for a package from that particular packages' package.json file
 * @param installPath - The installation path for this particular package (i.e. ../copy_node_modules/axios)
 * @returns The version listed in package.json
 */
export const getVersionFromPackageJson = async (installPath: string): Promise<string | null> => {
  try {
    const packageJsonPath = path.join(installPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      return packageJson.version || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to read package.json in ${installPath}:`, error);
    return null;
  }
};

/**
 * Parses the version string to handle different semver range specifiers.
 * @param version - The version string from package.json (e.g., "^1.7.4", "~1.7.4", "1.7.4").
 * @returns The exact version, the latest version, or null if the version cannot be resolved.
 */
export const parseVersion = (version: string): string | null => {
  const parsedVersion = semver.validRange(version);
  if (!parsedVersion) {
    console.error(`Invalid version: ${version}`);
    return null;
  }
  const minVersion = semver.minVersion(parsedVersion)?.version;
  if (!minVersion) {
    console.error(`Unable to resolve version for: ${version}`);
    return null;
  }
  return minVersion;
};
