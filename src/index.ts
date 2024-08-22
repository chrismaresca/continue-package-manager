import { program } from "commander";

// Add and Install imports
import { add } from "./commands/add";
import { install } from "./commands/install";

/**
 * Adds the dependency to the “dependencies” object in package.json
 *
 * Argument <package>: A "name@version" string as defined [here](https://github.com/npm/node-semver#versions)
 */
program
  .command("add <package>")
  .description("Add a package")
  .action((pkg) => {
    add(pkg).catch((err) => {
      console.error(`Failed to add package: ${err.message}`);
      process.exit(1);
    });
  });

/**
 * Resolves the full dependency list from package.json and downloads all of the required packages to the “node_modules” folder
 *
 * This command has no arguments
 */
program
  .command("install")
  .description("Install dependencies")
  .action(async () => {
    install().catch((err) => {
      console.error(`Failed to install packages: ${err.message}`);
      process.exit(1);
    });
  });

program.parse(process.argv);
