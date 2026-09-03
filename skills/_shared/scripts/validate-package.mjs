#!/usr/bin/env node
import { accessSync, constants, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../..", import.meta.url).pathname;
const failures = [];
const skillDirs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name);
const read = (path) => readFileSync(path, "utf8");
const add = (message) => failures.push(message);
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const validName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

for (const dir of skillDirs) {
  const path = join(root, dir);
  const skillPath = join(path, "SKILL.md");
  if (!existsSync(skillPath)) { add(`${dir}: missing SKILL.md`); continue; }
  const skill = read(skillPath);
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) add(`${dir}: missing YAML frontmatter`);
  const metadata = frontmatter?.[1] ?? "";
  if (!validName.test(dir) || dir.length > 64) add(`${dir}: invalid skill directory name`);
  if (!new RegExp(`^name:\\s*${escaped(dir)}\\s*$`, "m").test(metadata)) add(`${dir}: name does not match directory`);
  if (!/^description:\s*\S+/m.test(metadata)) add(`${dir}: missing description`);
  if (/TODO|TBD|<replace|your-api-key|sk-[A-Za-z0-9]/i.test(skill)) add(`${dir}: unfinished or credential-like text in SKILL.md`);
  if (!existsSync(join(path, "agents", "openai.yaml"))) add(`${dir}: missing agents/openai.yaml`);
  else {
    const agentYaml = read(join(path, "agents", "openai.yaml"));
    for (const key of ["display_name:", "short_description:", "default_prompt:"]) {
      if (!agentYaml.includes(key)) add(`${dir}: agents/openai.yaml missing ${key}`);
    }
  }
  const links = [...skill.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]).filter((link) => !/^[a-z]+:/i.test(link));
  for (const link of links) {
    const target = link.split("#", 1)[0];
    if (target && !existsSync(join(path, target)) && !existsSync(join(root, target))) add(`${dir}: broken resource link ${link}`);
  }
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const child = join(current, entry.name);
      if (entry.name === ".git") continue;
      if (entry.isDirectory()) walk(child);
      else if (/\.(md|yaml|yml|json|mjs|js|py|sh|ts)$/.test(entry.name)) {
        const body = read(child);
        if (/OPENAI_API_KEY\s*=|CLIENT_SECRET\s*=|BEGIN (RSA|OPENSSH|PRIVATE) KEY|token\s*[:=]\s*[A-Za-z0-9_-]{24,}/i.test(body)) add(`${relative(root, child)}: credential-like content`);
        if (/(^|\/)(scripts)\//.test(relative(path, child)) && /\.(mjs|js|py|sh)$/.test(entry.name)) {
          try { accessSync(child, constants.X_OK); } catch { add(`${relative(root, child)}: script is not executable`); }
        }
      }
    }
  };
  walk(path);
}

if (failures.length) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "passed", skills: skillDirs.length, checked_at: new Date().toISOString() }, null, 2));
