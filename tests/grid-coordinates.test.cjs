const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

function fakeElement() {
  return {
    children: [],
    listeners: {},
    classList: {add(){},toggle(){}},
    setAttribute(){},
    replaceChildren(){this.children=[]},
    append(x){this.children.push(x)},
    addEventListener(type, listener){this.listeners[type]=listener}
  };
}
test("all 120 board squares send their own coordinate on click", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const start = html.indexOf("function renderBoard(){");
  const end = html.indexOf("function renderFleet(){",start);
  assert.ok(start>0 && end>start, "board function must exist");
  const impl = html.slice(start,end);
  const elements = new Map();
  const $ = key => {
    if(!elements.has(key))elements.set(key,fakeElement());
    return elements.get(key);
  };
  const document = {createElement: fakeElement};
  const calls = [];
  const ROWS = "ABCDEFGHIJKL".split("");
  const game = {shots:{ski:{},halden:{}}};
  const render = new Function(
    "document","$","ROWS","target","game","ownShip","selected","authorized","busy","mode","secretUnlocked","choose",
    impl + "\nrenderBoard();"
  );
  render(document,$,ROWS,"halden",game,()=>false,new Set(),true,false,"shots",true,c=>calls.push(c));
  const buttons = $("board").children.filter(c=>c.type==="button");
  assert.equal(buttons.length,120,"exactly 120 clickable squares");
  const expected = ROWS.flatMap(row => Array.from({length:10},(_,i)=>row+(i+1)));
  buttons.forEach((b,i) => {
    assert.equal(b.title,expected[i],"visual coordinate at position "+i);
    b.listeners.click();
  });
  assert.deepEqual(calls,expected,"every visual square must pick the correct coordinate, not column 10");
});
