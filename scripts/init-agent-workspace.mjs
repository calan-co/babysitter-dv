#!/usr/bin/env node
import { process as installBabysitterDv } from "../blueprints/babysitter-dv/install-process.js";

function parse(argv) {
  const options = { dir: process.cwd(), json: false, dryRun: false, yes: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") options.dir = argv[++i];
    else if (arg === "--json") options.json = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes") options.yes = true;
    else if (arg === "--force") options.force = true;
    else throw new Error(`unknown option ${arg}`);
  }
  return options;
}

function print(result, json) {
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(`${result.status}: ${result.files.join(", ")}`);
}

try {
  const options = parse(process.argv.slice(2));
  const result = await installBabysitterDv({
    dir: options.dir,
    dryRun: options.dryRun,
    yes: options.yes,
    force: options.force,
  });
  print(result, options.json);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
