const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html=fs.readFileSync("index.html","utf8");
const script=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
function fn(name,next){
 const start=script.indexOf((name.startsWith("async")?"async ":"")+"function "+name.replace(/^async /,"")+"(");
 assert.ok(start>=0,"Missing "+name);
 const end=script.indexOf(next,start+10);
 assert.ok(end>start,"Missing next boundary");
 return script.slice(start,end);
}
function node(){
 return {
   disabled:false,textContent:"",classList:{values:{},toggle(k,on){this.values[k]=on},add(k){this.values[k]=true}},
   listeners:{},addEventListener(event,fn){this.listeners[event]=fn}
 };
}
test("mobile quick action controls exist and are wired up",()=>{
 const controls=[...html.matchAll(/data-shot="(hit|miss|sunk|clear)"/g)].map(x=>x[1]);
 for(const name of ["hit","miss","sunk","clear"])assert.equal(controls.filter(x=>x===name).length,2);
 assert.match(script,/document\.querySelectorAll\("\[data-shot\]"\)\.forEach/);
 assert.match(script,/\$\("boardActions"\)\.classList\.toggle\("hidden",!authorized\|\|mode!=="shots"\)/);
});
test("ship placement button opens unlock rather than staying disabled",async()=>{
 const code=fn("switchMode","function planned(");
 let target="ski",mode="shots",secretUnlocked=false,clears=0,renders=0,unlocks=0;
 const selected={clear(){clears++}};
 const impl=new Function("env",code+
   "\nreturn async function run(){await switchMode('ships'); return {target,mode}};");
 // Inject closure values from a test-created lexical scope.
 const runner=new Function("selected","render","inspectSecret",
   "let target='ski',mode='shots',secretUnlocked=false;\n"+code+
   "\nreturn {switchMode,get(){return {target,mode}}};"
 )(selected,()=>{renders++},async()=>{unlocks++});
 await runner.switchMode("ships");
 assert.deepEqual(runner.get(),{target:"halden",mode:"shots"});
 assert.equal(unlocks,1);
 assert.ok(renders>0);
 assert.ok(clears>0);
});
test("board action controls visibly update selected coordinate",()=>{
 assert.match(script,/boardActionHint/);
 assert.match(html,/<div id="boardActions"[\s\S]*?data-shot="hit"/);
});
