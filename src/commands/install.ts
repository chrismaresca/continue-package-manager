import fs from "fs";
import path from "path";

// Models for Graphs
import { DependencyMap, InstalledMap } from "../models/graphInterface";

// Client
import { NpmRegistryClient } from "../core/npmRegistryClient";

// Resolve Dependencies
import resolveDependencies from "../core/resolveDependencies";

/**
 * Installs all top-level dependencies and their sub-dependencies listed in the package.json file.
 * This function reads the package.json, recursively resolves all dependencies and their dependencies,
 * and installs them into a custom node_modules directory. It handles the creation of the node_modules
 * directory if it doesn't exist and ensures that all dependencies, including nested ones, are installed.
 * Any issues encountered during the installation process are logged appropriately.
 *
 * @returns A promise that resolves when all dependencies and their sub-dependencies have been successfully installed.
 */

export const install = async (): Promise<void> => {
  const client = new NpmRegistryClient();

  const packageJsonPath = path.join(process.cwd(), "package.json");
  const nodeModulesPath = path.join(process.cwd(), "copy_node_modules");

  if (!fs.existsSync(packageJsonPath)) {
    console.error("No package.json found in the current directory.");
    process.exit(1);
  }

  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const topLevelDependencies: DependencyMap = packageJson.dependencies || {};

  // Map to track installed packages
  const installedMap: InstalledMap = {};

  // Set to track already checked dependencies
  const checkedDependencies: Set<string> = new Set();

  // Install top-level dependencies
  for (const [packageName, version] of Object.entries(topLevelDependencies)) {
    await resolveDependencies(client, packageName, version, nodeModulesPath, installedMap, checkedDependencies);
  }

  console.log("All dependencies installed successfully.");
};
