import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
let sequence=0;
async function scenario({cache=null,legacyCache=null,url='https://example.test/overlay'}={}){
  const win=new Window({url,settings:{disableJavaScriptEvaluation:true,disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
  win.document.write(await readFile('v3/public/overlay.html','utf8'));
  const key='nbfc_overlay_v2_local';if(cache)win.localStorage.setItem(key,JSON.stringify(cache));
  if(legacyCache)win.localStorage.setItem('nbfc_overlay_v1_alice',JSON.stringify(legacyCache));
  const originals=new Map();function install(name,value){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
  for(const name of ['window','document','navigator','location','localStorage'])install(name,name==='window'?win:win[name]);
  let tick,native=null;const calls=[];
  install('fetch',async value=>{
    const url=new URL(value);calls.push(url.href);
    if(url.protocol==='file:')return new Response(await readFile(url,'utf8'));
    assert.equal(url.origin,'http://localhost:5088','Polling must stay on this PC');
    assert.equal(url.pathname,'/api/live');
    if(!native)throw new Error('offline');return Response.json(native);
  });
  install('setInterval',callback=>{tick=callback;return 1;});install('clearInterval',()=>{});
  await import('../v3/public/overlay.js?test='+sequence++);
  return {win,key,calls,setNative:value=>{native=value;},poll:()=>tick(),saved:()=>JSON.parse(win.localStorage.getItem(key)),
    close:async()=>{win.dispatchEvent(new win.Event('pagehide'));await win.happyDOM.close();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}};
}
test('one existing OBS URL follows saved appearance, language and active-profile changes without reload or cloud polling',async()=>{
  const url='https://example.test/overlay?room=alice&lang=en&label=Old&last=1';
  const s=await scenario({url});
  try{
    const $=id=>s.win.document.getElementById(id);
    s.setNative({room:'alice',player:'Alice',total:4084,lastMatch:12,uiLanguage:'en',overlayOptions:{showLabel:true,label:'<b>Chests opened</b>',showLastMatch:true}});await s.poll();
    assert.equal($('total').textContent,'4,084');assert.equal($('overlayLast').textContent,'+12');
    assert.equal($('overlayCaption').textContent,'<b>Chests opened</b>');assert.equal($('overlayCaption').children.length,0);
    s.setNative({room:'bob',player:'Bob',total:7,lastMatch:3,uiLanguage:'ar',overlayOptions:{showLabel:false,label:'',showLastMatch:false}});await s.poll();
    assert.equal($('total').textContent,new Intl.NumberFormat('ar').format(7));assert.ok($('overlayCaption').hidden);assert.ok($('overlayLast').hidden);
    assert.equal(s.win.document.documentElement.dir,'rtl');assert.equal(s.win.location.href,url);
    for(const code of ['id','de','en','es','es-419','fr','it','pl','pt-BR','vi','tr','ru','ar','th','ja','zh-Hans','zh-Hant','ko']){
      s.setNative({player:'Bob',total:8,lastMatch:2,uiLanguage:code,overlayOptions:{showLabel:true,label:'',showLastMatch:true}});await s.poll();
      const dict=JSON.parse(await readFile('v3/public/locales/'+code+'.json','utf8'));
      assert.equal($('overlayCaption').textContent,dict.overlayDefaultLabel,code);
      assert.equal(s.win.document.documentElement.lang,code);assert.equal(s.win.location.href,url);
    }
    assert.ok(!s.calls.some(value=>value.includes('/api/sync')));
  }finally{await s.close();}
});
test('OBS migrates previous caches and keeps count and appearance across app closure, empty responses and source reloads',async()=>{
  let saved;
  const s=await scenario({url:'https://example.test/overlay?room=alice',legacyCache:{total:4084,lastMatch:12,updatedAt:1000}});
  try{
    const $=id=>s.win.document.getElementById(id);
    assert.equal($('total').textContent,'4,084');assert.ok($('overlayCaption').hidden);assert.ok($('overlayLast').hidden);
    s.setNative({player:'Alice',total:4092,lastMatch:8,uiLanguage:'en',overlayOptions:{showLabel:true,label:'Opened',showLastMatch:true}});await s.poll();
    s.setNative({player:'',total:0,lastMatch:0});await s.poll();assert.equal($('total').textContent,'4,092','Empty state cannot reset a count');
    s.setNative(null);await s.poll();assert.equal($('overlayCaption').textContent,'Opened');assert.equal($('overlayLast').textContent,'+8');saved=s.saved();
  }finally{await s.close();}
  const reloaded=await scenario({cache:saved});
  try{
    assert.equal(reloaded.win.document.getElementById('total').textContent,'4,092');assert.equal(reloaded.win.document.getElementById('overlayCaption').textContent,'Opened');
    reloaded.setNative({player:'Alice',total:0,lastMatch:0});await reloaded.poll();assert.equal(reloaded.win.document.getElementById('total').textContent,'0');assert.equal(reloaded.saved().total,0);
  }finally{await reloaded.close();}
});
