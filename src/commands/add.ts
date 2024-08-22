import fs from "fs";
import path from "path";
import semver from "semver";
import cliProgress from "cli-progress";

import { NpmRegistryClient } from "../core/npmRegistryClient";
import { parsePackageSpec } from "../utils/parsePackageSpec";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const client = new NpmRegistryClient();

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
          throw new Error(`Version conflict: ${depName} requires ${depVersion}, but ${existingVersion} is installed.`);
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
