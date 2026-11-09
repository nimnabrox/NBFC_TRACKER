import test from 'node:test';
import assert from 'node:assert/strict';
import {previewValues,advancePreview} from '../v3/public/preview.js';
import {readFile} from 'node:fs/promises';
test('homepage preview changes total, session and last match consistently without changing real tracker data',async()=>{
  let before=previewValues();
  for(let i=0;i<20;i++){
    const next=advancePreview();assert.ok(next.lastMatch>=3&&next.lastMatch<=16);
    assert.equal(next.total-before.total,next.lastMatch);assert.equal(next.session-before.session,next.lastMatch);before=next;
  }
  for(const file of ['app.js','overlay.js'])assert.ok(!(await readFile('v3/public/'+file,'utf8')).includes("'./preview.js'"));
});
