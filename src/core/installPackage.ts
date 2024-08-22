import fs from "fs";
import path from "path";
import semver from "semver";
import { getVersionFromPackageJson } from "../utils/versionUtils";
import { NpmRegistryClient } from "./npmRegistryClient";
import { validateInstallation } from "./validateInstallation";

const installPackage = async (client: NpmRegistryClient, packageName: string, version: string, nodeModulesPath: string) => {
  if (packageName.startsWith("@")) {
    console.warn(`Skipping installation for scoped package: ${packageName}@${version}`);
    return;
  }

  const installPath = path.join(nodeModulesPath, packageName);

  if (fs.existsSync(installPath)) {
    const installedVersion = await getVersionFromPackageJson(installPath);
    if (installedVersion && !semver.satisfies(installedVersion, version)) {
      console.warn(`Version conflict detected for ${packageName}: ${installedVersion} is installed, but ${version} is required.`);
      // Log the conflict here
      console.log(`Conflict: ${packageName}@${installedVersion} <---> ${packageName}@${version}`);
    } else {
      console.log(`${packageName}@${installedVersion} is already installed and satisfies the required version.`);
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
