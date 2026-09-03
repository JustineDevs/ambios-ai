#!/usr/bin/env node
import {existsSync,readFileSync} from "node:fs";
const path=process.argv[2]; if(!path||!existsSync(path)){console.error(JSON.stringify({status:"failed",error:"usage: node claim-check.mjs <receipt.json>"}));process.exit(1);}
let data; try { data=JSON.parse(readFileSync(path,"utf8")); } catch (error) { console.error(JSON.stringify({status:"failed",error:`invalid JSON: ${error.message}`})); process.exit(1); } const failures=[];
if (!Array.isArray(data.gates)) failures.push("gates must be an array");
if (!Array.isArray(data.claims)) failures.push("claims must be an array");
for(const [i,g] of (data.gates||[]).entries())if(!g.evidence?.length)failures.push(`gate[${i}] has no evidence`);
for(const [i,c] of (data.claims||[]).entries())if(c.status==="verified"&&!c.evidence?.length)failures.push(`claim[${i}] verified without evidence`);
console.log(JSON.stringify({status:failures.length?"failed":"passed",failures},null,2)); process.exit(failures.length?1:0);
