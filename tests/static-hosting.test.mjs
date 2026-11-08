import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
test('production hosting serves static assets without a Worker handler, database or cloud API uploads',async()=>{
  const config=await readFile('v3/web-cloud/wrangler.toml','utf8');
  assert.ok(config.includes('directory = "../public"'));assert.ok(!/^main\s*=/m.test(config));
  assert.ok(!config.includes('run_worker_first'));assert.ok(!config.includes('durable_objects'));
  for(const path of ['v3/web-cloud/_worker.js','web-chest-tracker/_worker.js'])await assert.rejects(access(path));
  for(const path of ['v3/public/app.js','v3/public/overlay.js','src/ChestCounter/WebDashboardServer.cs','src/ChestCounter/Program.cs']){
    const source=await readFile(path,'utf8');assert.ok(!source.includes('/api/sync'),path);assert.ok(!source.includes('SyncToCloudAsync'),path);
  }
});
