#!/usr/bin/env node
const [, , skill = "ambios-governed-delivery", mode = "standard"] = process.argv;
const now = new Date().toISOString();
console.log(JSON.stringify({schema_version:"1.0",skill,mode,started_at:now,completed_at:null,phases:[],findings:[],claims:[],limitations:[]},null,2));
