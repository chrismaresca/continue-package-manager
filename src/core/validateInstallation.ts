import fs from "fs";
import path from "path";

interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validates the installation of a package by checking the existence of the package directory,
 * the presence of the `package.json` file, and the entry point specified within `package.json`.
 *
 * @param packageName The name of the package being validated.
 * @param version The version of the package being validated.
 * @param installPath The installation path where the package is installed.
 * @returns An object containing a boolean indicating whether the installation is valid and a message.
 */
export const validateInstallation = (
  packageName: string,
  version: string,
  installPath: string
): ValidationResult => {
  const packagePath = path.join(installPath);

  // Check if the package directory exists in node modules
  if (!fs.existsSync(packagePath)) {
    const message = `\n\nValidation failed: Directory for ${packageName}@${version} does not exist.`;
    console.log(message);
    return { valid: false, message };
  }

  // Attempt to read the package.json to find the entry point
  const packageJsonPath = path.join(packagePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    const message = `\n\nValidation failed: package.json for ${packageName}@${version} is missing.`;
    console.error(message);
    return { valid: false, message };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const entryFile = packageJson.main
    ? path.join(packagePath, packageJson.main)
    : path.join(packagePath, "index.js");

  // Check if the entry file exists
  if (!fs.existsSync(entryFile)) {
    let message;
    if (packageJson.main) {
      message = `\n\nWarning: Entry point ${packageJson.main} for ${packageName}@${version} is missing.`;
    } else {
      message = `\n\nWarning: No explicit entry point defined for ${packageName}@${version}, and fallback "index.js" is missing.`;
    }
    console.warn(message);
    return { valid: true, message };
  } else {
    const message = `Entry point ${packageJson.main || "index.js"} for ${packageName}@${version} found.`;
    console.log(message);
    return { valid: true, message };
  }
};
