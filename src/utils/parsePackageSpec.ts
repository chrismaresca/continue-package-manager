/* 
A parsing function for package names and versions.
*/
export const parsePackageSpec = (pkg: string): { packageName: string; version: string } => {
  /**
   * Parses the package specification string to extract the package name and version.
   * If the version is partially specified (MAOR.MINOR) (e.g., "1.7"), it appends ".0" to form "1.7.0".
   * If no version is specified, defaults to "latest".
   *
   * @param pkg The package specification string (e.g., "axios@1.7").
   * @returns An object containing the parsed package name and version.
   */
  const [packageName, versionSpec] = pkg.split("@");
  let version = versionSpec || "latest";


  //   Handle case where the PATCH is not defined
  if (version !== "latest" && /^[0-9]+\.[0-9]+$/.test(version)) {
    version += ".0";
  }

  return { packageName, version };
};
