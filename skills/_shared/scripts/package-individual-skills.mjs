#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const repositoryRoot = resolve(new URL("../../..", import.meta.url).pathname);
const skillsRoot = join(repositoryRoot, "skills");
const outputRoot = resolve(process.argv[2] || join(repositoryRoot, "artifacts", "individual-skills"));
const skills = [
  "ambios-api-contract-roast",
  "ambios-governed-delivery",
  "ambios-release-evidence",
  "ambios-ui-truthful-state",
];

mkdirSync(outputRoot, { recursive: true });
const stageRoot = mkdtempSync(join(tmpdir(), "ambios-skill-packages-"));
const shared = {
  "package-contract.md": readFileSync(join(skillsRoot, "_shared", "package-contract.md"), "utf8"),
  "verification-protocol.md": readFileSync(join(skillsRoot, "_shared", "references", "verification-protocol.md"), "utf8"),
};

for (const skill of skills) {
  const source = join(skillsRoot, skill);
  const packageRoot = join(stageRoot, skill);
  const archive = join(outputRoot, `${skill}.zip`);
  if (!existsSync(source)) throw new Error(`Missing skill source: ${source}`);
  if (existsSync(archive)) throw new Error(`Refusing to overwrite existing archive: ${archive}`);
  cpSync(source, packageRoot, { recursive: true });
  const skillPath = join(packageRoot, "SKILL.md");
  writeFileSync(skillPath, readFileSync(skillPath, "utf8")
    .replaceAll("../_shared/package-contract.md", "references/package-contract.md")
    .replaceAll("../_shared/references/verification-protocol.md", "references/verification-protocol.md"));
  const references = join(packageRoot, "references");
  mkdirSync(references, { recursive: true });
  writeFileSync(join(references, "package-contract.md"), shared["package-contract.md"]);
  writeFileSync(join(references, "verification-protocol.md"), shared["verification-protocol.md"]);
  execFileSync("zip", ["-qr", archive, skill], { cwd: stageRoot, stdio: "inherit" });
}

console.log(JSON.stringify({ status: "passed", output: outputRoot, skills }, null, 2));
