import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
let sequence=0;
async function scenario({room='alice',cache=null,label='',last=false}={}){
  const query=new URLSearchParams({room,lang:'en'});if(label)query.set('label',label);if(last)query.set('last','1');
  const win=new Window({url:'https://example.test/overlay?'+query,settings:{disableJavaScriptEvaluation:true,disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
  win.document.write(await readFile('v3/public/overlay.html','utf8'));
  const key='nbfc_overlay_v1_'+room.toLowerCase();if(cache)win.localStorage.setItem(key,JSON.stringify(cache));
  const originals=new Map();function install(name,value){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
  for(const name of ['window','document','navigator','location','localStorage'])install(name,name==='window'?win:win[name]);
  let tick,cloud=null,native=null;
  install('fetch',async url=>{const local=String(url).includes('localhost');const value=local?native:cloud;if(!value)throw new Error('offline');return Response.json(value);});
  install('setInterval',callback=>{tick=callback;return 1;});install('clearInterval',()=>{});
  await import('../v3/public/overlay.js?test='+sequence++);
  return {win,key,setCloud:value=>{cloud=value;},setNative:value=>{native=value;},poll:()=>tick(),saved:()=>JSON.parse(win.localStorage.getItem(key)),
    close:async()=>{win.dispatchEvent(new win.Event('pagehide'));await win.happyDOM.close();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}};
}
test('OBS keeps its saved total and last match across app closure, missing responses and reloads',async()=>{
  let saved;
  const first=await scenario({cache:{total:4084,lastMatch:12,updatedAt:1000},label:'<b>Chests opened</b>',last:true});
  try{
    const $=id=>first.win.document.getElementById(id);
    assert.equal($('total').textContent,'4,084');assert.equal($('overlayLast').textContent,'+12');
    assert.equal($('overlayCaption').textContent,'<b>Chests opened</b>');assert.equal($('overlayCaption').children.length,0);
    first.setCloud({room:'alice',player:'Alice',total:4092,lastMatch:8,updatedAt:2000});await first.poll();
    assert.equal($('total').textContent,'4,092');assert.equal($('overlayLast').textContent,'+8');
    first.setCloud({room:'alice',player:'',total:0,lastMatch:0,updatedAt:3000});await first.poll();assert.equal($('total').textContent,'4,092','Empty state cannot erase the last count');
    first.setCloud({room:'alice',player:'Alice',total:4000,lastMatch:4,updatedAt:1500});await first.poll();assert.equal($('total').textContent,'4,092','Stale cloud state cannot replace newer data');
    first.setCloud(null);await first.poll();assert.equal($('total').textContent,'4,092');saved=first.saved();assert.equal(saved.lastMatch,8);
  }finally{await first.close();}
  const reloaded=await scenario({cache:saved,last:true});
  try{assert.equal(reloaded.win.document.getElementById('total').textContent,'4,092');assert.equal(reloaded.win.document.getElementById('overlayLast').textContent,'+8');}
  finally{await reloaded.close();}
});
test('OBS defaults to the count only, isolates rooms and accepts an intentional real zero',async()=>{
  const s=await scenario({room:'bob'});
  try{
    const $=id=>s.win.document.getElementById(id);
    assert.equal($('total').textContent,'—');assert.ok($('overlayCaption').hidden);assert.ok($('overlayLast').hidden);
    s.setNative({room:'alice',player:'Alice',total:9999});await s.poll();assert.equal($('total').textContent,'—','Unrelated local account is ignored');
    s.setCloud({room:'bob',player:'Bob',total:7,lastMatch:7,updatedAt:4000});await s.poll();assert.equal($('total').textContent,'7');
    s.setCloud({room:'bob',player:'Bob',total:0,lastMatch:0,updatedAt:5000});await s.poll();assert.equal($('total').textContent,'0','A deliberate reset is distinct from an offline response');
    assert.equal(s.saved().total,0);
  }finally{await s.close();}
});
