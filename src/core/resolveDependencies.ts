import semver from "semver";

import { parseVersion } from "../utils/versionUtils";
import { InstalledMap } from "../models/graphInterface";

import installPackage from "./installPackage";
import { NpmRegistryClient } from "./npmRegistryClient";

/**
 * Resolves and installs the dependencies for a given package recursively.
 * This function handles version conflicts, detects circular dependencies,
 * and logs any issues encountered during the resolution process.
 *
 * @param client - The NpmRegistryClient instance used to fetch package information.
 * @param packageName - The name of the package for which dependencies are being resolved.
 * @param version - The version string of the package being resolved.
 * @param nodeModulesPath - The path to the node_modules directory where packages are installed.
 * @param installedMap - A map tracking installed packages and their versions.
 * @param dependencyStack - A stack used to detect and log circular dependencies.
 * @returns A promise that resolves when all dependencies have been processed.
 */
const resolveDependencies = async (client: NpmRegistryClient, packageName: string, version: string, nodeModulesPath: string, installedMap: InstalledMap, checkedDependencies: Set<string> = new Set(), dependencyStack: string[] = []) => {
  //   Parse the exact version from potential semver derivatives (i.e. '^7.4.3')
  const exactVersion = parseVersion(version);

  if (!exactVersion) {
    console.warn("Version cannot be detected.");
    return;
  }

  // Detect and log circular dependencies.
  //   Attempted to look through the dependency stack for a given package to find duplicate.
  if (dependencyStack.includes(packageName)) {
    const circularPath = [...dependencyStack, packageName].join(" → ");
    console.error(`Circular dependency detected: ${circularPath}`);
    return;
  }

  const packageInfo = await client.getPackageInfo(packageName, exactVersion);

  // Install the package if not already installed or if the version doesn't match
  await installPackage(client, packageName, exactVersion, nodeModulesPath);

  // Update the installed map with the new version (top-level only)
  if (!dependencyStack.length) {
    installedMap[packageName] = exactVersion;
  }
  
  const dependencies = packageInfo.dependencies || {};

  for (const [depName, depVersion] of Object.entries(dependencies)) {
    const dependencyKey = `${depName}@${depVersion}`;
    if (checkedDependencies.has(dependencyKey)) {
      console.log(`Skipping already checked dependency: ${dependencyKey}`);
      continue;
    }
    checkedDependencies.add(dependencyKey);
    if (installedMap[depName]) {
      if (!semver.satisfies(installedMap[depName], depVersion as string)) {
        console.warn(`Version conflict detected: ${depName}@${depVersion} required, but ${installedMap[depName]} is installed.`);
        console.log(`Conflict: ${depName}@${installedMap[depName]} <---> ${depName}@${depVersion}`);

        // Push the current package onto the stack
        dependencyStack.push(packageName);

        // Resolve by installing the conflicting dependency in a nested node_modules
        // const nestedNodeModulesPath = path.join(nodeModulesPath, packageName, "node_modules");
        // await resolveDependencies(client, depName, depVersion as string, nestedNodeModulesPath, installedMap, checkedDependencies, [...dependencyStack]);
      }
    } else {
      await resolveDependencies(client, depName, depVersion as string, nodeModulesPath, installedMap, checkedDependencies, [...dependencyStack]);
    }
  }

  // Pop the current package from the stack
  dependencyStack.pop();
};

export default resolveDependencies;
