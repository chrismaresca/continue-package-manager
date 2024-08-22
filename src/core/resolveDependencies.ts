import semver from "semver";

import { parseVersion } from "../utils/versionUtils";
import { InstalledMap } from "../models/graphInterface";

import installPackage from "./installPackage";
import { NpmRegistryClient } from "./npmRegistryClient";
import exp from "constants";

const resolveDependencies = async (client: NpmRegistryClient, packageName: string, version: string, nodeModulesPath: string, installedMap: InstalledMap, dependencyStack: string[] = []) => {
  const exactVersion = parseVersion(version);

  if (!exactVersion) {
    console.warn("Version cannot be detected.");
    return;
  }

  // Detect and log circular dependencies
  if (dependencyStack.includes(packageName)) {
    const circularPath = [...dependencyStack, packageName].join(" → ");
    console.error(`Circular dependency detected: ${circularPath}`);
    return;
  }

  const packageInfo = await client.getPackageInfo(packageName, exactVersion);

  // Install the package if not already installed or if the version doesn't match
  await installPackage(client, packageName, exactVersion, nodeModulesPath);

  // Update the installed map with the new version
  installedMap[packageName] = exactVersion;

  // Push the current package onto the stack
  dependencyStack.push(packageName);

  const dependencies = packageInfo.dependencies || {};

  for (const [depName, depVersion] of Object.entries(dependencies)) {
    if (installedMap[depName]) {
      if (!semver.satisfies(installedMap[depName], depVersion as string)) {
        // Log the conflict with the graph format
        console.warn(`Version conflict detected: ${depName}@${depVersion} required, but ${installedMap[depName]} is installed.`);
        console.log(`Conflict: ${depName}@${installedMap[depName]} <---> ${depName}@${depVersion}`);
      }
    } else {
      await resolveDependencies(client, depName, depVersion as string, nodeModulesPath, installedMap, [...dependencyStack]);
    }
  }

  // Pop the current package from the stack
  dependencyStack.pop();
};

export default resolveDependencies;
