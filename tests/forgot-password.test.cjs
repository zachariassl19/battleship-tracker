const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html","utf8");
const script = (html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
const start = script.indexOf("async function resetSecret(){");
const end = script.indexOf("async function refreshEncrypted(){",start);
assert.ok(start !== -1 && end !== -1,"Recovery function must exist");
const resetCode = script.slice(start,end);

function makeFixture(){
  const nodes={
    resetPassword:{value:"En egen sterk passfrase!"},
    resetPasswordAgain:{value:"En egen sterk passfrase!"},
    resetConfirmation:{value:"NULLSTILL"},
    resetMessage:{textContent:""},
    confirmReset:{disabled:false}
  };
  const actions=[];
  const state = {
    authorized:true,resetExpectedSha:"original-sha",
    $:id=>nodes[id],readEncryptedRemote:async()=>({sha:"original-sha",data:{version:1}}),
    window:{HaldenSecretSync:{encrypt:async(map,password)=>({version:1,passwordLength:password.length,ships:map})}},
    encodeBase64:x=>"encoded:"+x,SECRET_API:"https://api.github.com/repos/example/battleship-tracker/contents/data/halden-ships.enc.json",
    api:async(method,url,body)=>{actions.push({method,url,body});return {content:{sha:"new-sha"}}},
    ships:{carrier:["A1"]},secretPassword:"",secretSha:"",secretUnlocked:false,secretExists:true,target:"ski",mode:"shots",
    selected:new Set(),rememberThisDevice:false,closeResetDialog:()=>{actions.push("closed")},
    render:()=>{},saveRemembered:async()=>{},toast:()=>{}
  };
  vm.runInNewContext(resetCode,state);
  return {state,nodes,actions}
}
test("can't reset encrypted ship map without explicit NULLSTILL confirmation",async()=>{
  const f=makeFixture();
  f.nodes.resetConfirmation.value="maybe";
  await f.state.resetSecret();
  assert.equal(f.actions.length,0);
  assert.match(f.nodes.resetMessage.textContent,/NULLSTILL/);
  assert.equal(f.state.ships.carrier[0],"A1");
});
test("does not reset on password mismatch or weak password",async()=>{
  const f=makeFixture();
  f.nodes.resetPasswordAgain.value="something else";
  await f.state.resetSecret();
  assert.equal(f.actions.length,0);
  assert.match(f.nodes.resetMessage.textContent,/ikke like/);
  f.nodes.resetPassword.value="short";
  f.nodes.resetPasswordAgain.value="short";
  await f.state.resetSecret();
  assert.equal(f.actions.length,0);
  assert.match(f.nodes.resetMessage.textContent,/12 tegn/);
});
test("reset changes encrypted private file only, and keeps public game intact",async()=>{
  const f=makeFixture();
  await f.state.resetSecret();
  assert.equal(f.actions[0].method,"PUT");
  assert.match(f.actions[0].url,/halden-ships.enc.json$/);
  assert.equal(f.actions[0].body.sha,"original-sha");
  assert.ok(!f.actions[0].body.content.includes("A1"),"no old positions in new ciphertext payload");
  assert.equal(f.state.secretUnlocked,true);
  assert.equal(f.state.secretSha,"new-sha");
  assert.equal(Object.keys(f.state.ships).length,0);
  assert.equal(f.state.target,"halden");
  assert.equal(f.state.mode,"ships");
  assert.equal(f.nodes.confirmReset.disabled,false);
});
test("rejects overwrite when another device updated private map",async()=>{
  const f=makeFixture();
  f.state.readEncryptedRemote=async()=>({sha:"changed-while-dialog-open",data:{version:1}});
  await f.state.resetSecret();
  assert.equal(f.actions.length,0);
  assert.equal(f.state.ships.carrier[0],"A1");
  assert.match(f.nodes.resetMessage.textContent,/endret seg/);
});
test("forgot password visible only after private map exists",()=>{
  assert.match(script,/\$\("forgotSecret"\)\.classList\.toggle\("hidden",!secretExists\)/);
  assert.match(html,/Skriv NULLSTILL for å bekrefte/);
  assert.match(html,/Registrerte skudd, bom og statistikk blir ikke slettet/);
});
