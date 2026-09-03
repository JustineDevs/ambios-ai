#!/usr/bin/env node
import {existsSync,readdirSync} from "node:fs";
import {join} from "node:path";
const root=process.argv[2]||"apps/web/src/app"; const routes=[];
const walk=(dir,prefix="")=>{if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p,`${prefix}/${e.name}`);else if(/^page\.(tsx?|jsx?)$/.test(e.name))routes.push(prefix||"/");}};
if(!existsSync(root)){console.error(JSON.stringify({status:"failed",root,error:"route root does not exist"},null,2));process.exit(1);}
walk(root); console.log(JSON.stringify({status:"passed",root,routes:[...new Set(routes)].sort()},null,2));
