#!/usr/bin/env node
import {existsSync,readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
const root=process.argv[2]||"."; const hits=[]; const failures=[];
const walk=(dir)=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(["node_modules",".next",".git","coverage"].includes(e.name))continue;if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|mjs)$/.test(e.name)){const source=readFileSync(p,"utf8");if(/(app|route|router|hono|openapi|fetch\s*\(|axios)/i.test(source))hits.push(p);}}};
if(!existsSync(root)){console.error(JSON.stringify({status:"failed",error:"root does not exist"}));process.exit(1);} walk(root); console.log(JSON.stringify({status:"passed",root,candidate_files:hits.length,files:hits},null,2));
