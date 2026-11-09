import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
test('scan link reports detections rather than claiming safety and never accepts an arbitrary report URL',async()=>{
  const win=new Window({url:'https://example.test/'});win.document.write('<a id="securityReport" hidden></a><p id="securitySummary" hidden></p>');
  const previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),previousFetch=Object.getOwnPropertyDescriptor(globalThis,'fetch');
  const previousEvent=Object.getOwnPropertyDescriptor(globalThis,'CustomEvent');Object.defineProperty(globalThis,'CustomEvent',{value:win.CustomEvent,configurable:true});
  Object.defineProperty(globalThis,'document',{value:win.document,configurable:true});
  const hash='a'.repeat(64);
  Object.defineProperty(globalThis,'fetch',{value:async value=>String(value).includes('/locales/')?new Response(await readFile(new URL(value),'utf8')):Response.json({status:'completed',sha256:hash,reportUrl:'https://untrusted.invalid/',stats:{malicious:1,suspicious:0,undetected:70,timeout:1,'type-unsupported':5}}),configurable:true});
  try{
    const {setLanguage}=await import('../v3/public/i18n.js');await setLanguage('en');
    const report=await import('../v3/public/security.js?security-test');await report.loadScanReport();
    const link=win.document.getElementById('securityReport');assert.equal(link.hidden,false);assert.equal(link.dataset.flagged,'1');
    const summary=win.document.getElementById('securitySummary').textContent;assert.ok(summary.includes('1 malicious'));assert.ok(summary.includes('1 timed out'));assert.ok(summary.includes('5 unsupported'));
    assert.equal(link.href,'https://www.virustotal.com/gui/file/'+hash);assert.ok(!/safe|clean|100%/i.test(link.textContent));
    for(const file of ['home.js','security.js','security.json'])assert.ok(!(await readFile('v3/public/'+file,'utf8')).includes('x-apikey'));
  }finally{
    await win.happyDOM.close();if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else delete globalThis.document;
    if(previousFetch)Object.defineProperty(globalThis,'fetch',previousFetch);else delete globalThis.fetch;
    if(previousEvent)Object.defineProperty(globalThis,'CustomEvent',previousEvent);else delete globalThis.CustomEvent;
  }
});
