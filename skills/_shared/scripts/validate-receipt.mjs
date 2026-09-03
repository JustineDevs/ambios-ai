#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
const path = process.argv[2];
if (!path || !existsSync(path)) { console.error(JSON.stringify({status:"failed", error:"usage: node validate-receipt.mjs <receipt.json>"})); process.exit(1); }
let data;
try { data = JSON.parse(readFileSync(path, "utf8")); } catch (error) { console.error(JSON.stringify({status:"failed", error:String(error)})); process.exit(1); }
const required = ["schema_version", "skill", "mode", "phases", "findings", "claims", "limitations"];
const failures = required.filter((key) => !(key in data)).map((key) => `missing ${key}`);
if (data.schema_version !== "1.0") failures.push("schema_version must be 1.0");
if (!Array.isArray(data.phases) || !Array.isArray(data.findings) || !Array.isArray(data.claims) || !Array.isArray(data.limitations)) failures.push("phases/findings/claims/limitations must be arrays");
for (const [index, finding] of (data.findings || []).entries()) {
  if (!finding.id || !finding.status || !Array.isArray(finding.proof)) failures.push(`finding[${index}] needs id, status, and proof[]`);
  if (["verified", "implemented"].includes(finding.status) && finding.proof.length === 0) failures.push(`finding[${index}] claims completion without proof`);
}
console.log(JSON.stringify({status:failures.length?"failed":"passed", failures}, null, 2));
process.exit(failures.length ? 1 : 0);
