import fs from "fs";
import path from "path";

// Models for Graphs
import { DependencyMap, InstalledMap } from "../models/graphInterface";

// Client
import { NpmRegistryClient } from "../core/npmRegistryClient";

// Resolve Dependencies
import resolveDependencies from "../core/resolveDependencies";

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

  // Install top-level dependencies
  for (const [packageName, version] of Object.entries(topLevelDependencies)) {
    await resolveDependencies(client, packageName, version, nodeModulesPath, installedMap);
  }

  console.log("All dependencies installed successfully.");
};
