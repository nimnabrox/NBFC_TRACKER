import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { version, displayVersion, compareVersions } from '../v3/public/version.js';
test('one version source controls native build, website, package and release metadata', async () => {
  const central=(await readFile('VERSION','utf8')).trim();
  assert.equal(version,central); assert.equal(displayVersion,'v'+central);
  assert.equal(JSON.parse(await readFile('package.json','utf8')).version,central);
  assert.equal(JSON.parse(await readFile('package-lock.json','utf8')).version,central);
  assert.equal(JSON.parse(await readFile('v3/public/version.json','utf8')).displayVersion,displayVersion);
  for(const page of ['index.html','app.html','modern.html']){
    const html=await readFile('v3/public/'+page,'utf8');
    for(const [,text] of html.matchAll(/class="version">([^<]+)/g))assert.equal(text,displayVersion);
    assert.ok(html.includes('sub_confirmation=1'));
    assert.ok(html.includes('data-i18n="useCode"'));
  }
  const props=await readFile('Directory.Build.props','utf8');assert.ok(props.includes('VERSION'));
  const project=await readFile('src/ChestCounter/ChestCounter.csproj','utf8');assert.ok(!project.includes('<Version>'));
});
test('version comparison handles equal, newer and older patch/minor versions',()=>{
  assert.equal(compareVersions('0.1.0','0.1.0'),0); assert.equal(compareVersions('0.1.1','0.1.0'),1);
  assert.equal(compareVersions('v0.10.0','0.9.9'),1);assert.equal(compareVersions('0.0.9','0.1.0'),-1);
  assert.throws(()=>compareVersions('bad','0.1.0'));
});
