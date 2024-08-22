import fs from "fs";
import path from "path";
import semver from "semver";
import { getVersionFromPackageJson } from "../utils/versionUtils";
import { NpmRegistryClient } from "./npmRegistryClient";
import { validateInstallation } from "./validateInstallation";

/**
 * Installs a specific package version into the node_modules directory.
 * This function checks for version conflicts, installs the package if necessary,
 * and validates the installation. It also handles scoped packages and logs any issues.
 *
 * @param client - The NpmRegistryClient instance used to fetch package information and download the package.
 * @param packageName - The name of the package to be installed.
 * @param version - The version string of the package to be installed.
 * @param nodeModulesPath - The path to the node_modules directory where the package should be installed.
 * @returns A promise that resolves when the package installation and validation are complete.
 */
const installPackage = async (client: NpmRegistryClient, packageName: string, version: string, nodeModulesPath: string) => {
  //   Ignoring scoped packages as they were giving me issues with the NpmRegistryClient.
  if (packageName.startsWith("@")) {
    console.warn(`Skipping installation for scoped package: ${packageName}@${version}`);
    return;
  }

  const installPath = path.join(nodeModulesPath, packageName);

  // Check for conflicts within the current package installation.
  if (fs.existsSync(installPath)) {
    const installedVersion = await getVersionFromPackageJson(installPath);

    // Log if the version installed is different from the requested version.
    if (installedVersion && !semver.satisfies(installedVersion, version)) {
      console.warn(`Version mismatch for ${packageName}: Installed version is ${installedVersion}, but version ${version} was requested.`);
      console.log(`Mismatch: ${packageName}@${installedVersion} installed, but ${packageName}@${version} requested.`);
    } else {
      console.log(`${packageName}@${installedVersion} is already installed and satisfies the requested version ${version}.`);
      return;
    }
  } else {
    console.log(`Installing ${packageName}@${version}...`);
    await client.downloadTarball(packageName, version, installPath);
  }
  
  // Validate the installation after attempting to install the package
  const { valid, message } = validateInstallation(packageName, version, installPath);
  if (!valid) {
    console.error(`Installation validation failed for ${packageName}@${version}. Message: ${message}`);
  } else {
    console.log(`Installation validated successfully for ${packageName}@${version}. Message: ${message}`);
  }
};

export default installPackage;
