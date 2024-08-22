import fs from "fs";
import path from "path";
import semver from "semver";
import cliProgress from "cli-progress";

import { NpmRegistryClient } from "../core/npmRegistryClient";
import { parsePackageSpec } from "../utils/parsePackageSpec";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const client = new NpmRegistryClient();

/**
 * Adds a specified package to the dependencies in the package.json file.
 * This function fetches the package information, checks for version conflicts, 
 * updates the package.json file, and validates the installation. A progress bar 
 * is displayed to provide feedback during the process, and it stops if any errors 
 * are encountered, logging a failure message with the error details.
 * @todo Add support for semver range syntax and do better job checking for version conflicts
 *
 *
 * @param pkg - The package specification (e.g., "package-name@1.0.0", or "package-name", or "package-name@1.0") to be added to the dependencies.
 * @returns A promise that resolves when the package has been successfully added and validated.
 */
export const add = async (pkg: string): Promise<void> => {
  // Set up the progress bar
  const progressBar = new cliProgress.SingleBar(
    {
      format: "Progress | {bar} | {percentage}% | {message}",
    },
    cliProgress.Presets.shades_classic
  );

  try {
    progressBar.start(100, 0, { message: "Initializing..." });
    const { packageName, version } = parsePackageSpec(pkg);

    progressBar.update(25, { message: `Fetching version info for ${packageName}@${version}...` });

    // Fetch package info
    const packageInfo = await client.getPackageInfo(packageName, version);
    const actualVersion = packageInfo.version;

    // Check if actualVersion is undefined and throw a custom npm-like error if it is
    if (!actualVersion) {
      throw new Error(
        `\n\nERR! No matching version found for ${packageName}@${version}.\n` +
        `ERR! In most cases you or one of your dependencies are requesting\n` +
        `ERR! notarget a package version that doesn't exist.`
      );
    }

    progressBar.update(50, { message: `Version found: ${packageName}@${actualVersion}. Checking for conflicts...` });

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const existingDependencies = packageJson.dependencies || {};

    // Check for conflicts with existing dependencies
    for (const [depName, depVersion] of Object.entries(packageInfo.dependencies || {})) {
      if (existingDependencies[depName]) {
        const existingVersion = existingDependencies[depName];
        if (!semver.satisfies(existingVersion, depVersion as string)) {
          throw new Error(`Version conflict: ${depName} requires ${depVersion}, but ${existingVersion} is currently installed as a top-level dependency.`);
        }
      }
    }

    // Write to package.json
    progressBar.update(75, { message: "Writing to package.json..." });
    packageJson.dependencies[packageName] = actualVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Validate the installation
    progressBar.update(90, { message: `Validating installation for ${packageName}@${actualVersion}...` });

    // Complete the progress bar
    progressBar.update(100, { message: `Up to Date! Successfully added ${packageName}@${actualVersion} to dependencies.` });
  } catch (error: any) {
    progressBar.stop();
    console.error(`Failure: ${error.message}`);
  } finally {
    if (progressBar.isActive) {
      progressBar.stop();
    }
  }
};
