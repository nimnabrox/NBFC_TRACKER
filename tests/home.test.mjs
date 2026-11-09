import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
test('download homepage supports every language, honest verification copy, working download/source links and no companion or cloud polling',async()=>{
  const html=await readFile('v3/public/index.html','utf8');
  const win=new Window({url:'https://nbfct.nimnabro.com/',settings:{disableJavaScriptEvaluation:true,disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
  win.document.write(html);
  const originals=new Map();function install(name,value){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
  for(const name of ['window','document','navigator','location','history','localStorage','CustomEvent'])install(name,name==='window'?win:win[name]);
  const calls=[];
  install('fetch',async value=>{const url=new URL(value);calls.push(url.href);assert.equal(url.protocol,'file:');return new Response(await readFile(url,'utf8'));});
  try{
    await import('../v3/public/home.js?home-test');
    const {languages,setLanguage}=await import('../v3/public/i18n.js');
    assert.equal(win.document.querySelectorAll('[role=option]').length,18);
    for(const[code]of languages){
      await setLanguage(code);
      const dict=JSON.parse(await readFile('v3/public/locales/'+code+'.json','utf8'));
      for(const el of win.document.querySelectorAll('[data-i18n]'))assert.equal(el.textContent,dict[el.dataset.i18n],code+'.'+el.dataset.i18n);
      assert.equal(win.document.documentElement.dir,code==='ar'?'rtl':'ltr');
    }
    await setLanguage('en');
    assert.match(win.document.querySelector('[data-i18n=homeIntro]').textContent,/Automatic/);
    assert.match(win.document.querySelector('[data-i18n=verifyBody]').textContent,/unsigned/);
    assert.ok(!/100% safe|virus.free|guaranteed safe/i.test(html));
    for(const el of win.document.querySelectorAll('.download-link'))assert.equal(el.href,'https://github.com/nimnabrox/NBFC_TRACKER/releases/latest/download/NBFC.TRACKER.exe');
    assert.ok(win.document.querySelector('a[href="dashboard"]'));
    assert.ok(win.document.querySelector('a[href$="/tree/main/src"]'));
    assert.ok(win.document.querySelector('a[href$="SHA256SUMS.txt"]'));
    const ids=[...win.document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);
    assert.ok(!calls.some(value=>value.includes('/api/')));
  }finally{win.dispatchEvent(new win.Event('pagehide'));await win.happyDOM.close();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
});

test('published preview artwork has a landscape 16:9 ratio',async()=>{
  const png=await readFile('v3/public/assets/nbfc-launch.png');
  assert.ok(Math.abs(png.readUInt32BE(16)/png.readUInt32BE(20)-16/9)<0.002);
});
