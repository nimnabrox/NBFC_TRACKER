// Keep the API key in the caller's environment or an external, untracked .env file.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
async function main(){
const args=process.argv.slice(2);
function option(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const path=resolve(option('--file','dist/release/NBFC.TRACKER.exe'));
const envPath=option('--env-file');
let key=process.env.VIRUSTOTAL_API_KEY||process.env.VT_API_KEY;
if(!key&&envPath){
  const env=await readFile(envPath,'utf8');
  for(const line of env.split(/\r?\n/)){
    const match=line.match(/^\s*(?:export\s+)?(?:VIRUSTOTAL_API_KEY|VT_API_KEY|VIRUS_TOTAL_API_KEY|API_KEY)\s*=\s*(.*?)\s*$/i);
    if(match){key=match[1].replace(/^['"]|['"]$/g,'');break;}
  }
  if(!key&&/^[a-f0-9]{64}$/i.test(env.trim()))key=env.trim();
}
if(!key)throw new Error('Set VIRUSTOTAL_API_KEY or provide --env-file; never pass a key as a command argument.');
const bytes=await readFile(path),sha256=createHash('sha256').update(bytes).digest('hex');
const reportUrl='https://www.virustotal.com/gui/file/'+sha256;
let lastRequest=0;
async function api(path,options={}){
  const delay=16000-(Date.now()-lastRequest);if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
  const url=new URL(path,'https://www.virustotal.com/api/v3/');
  if(url.protocol!=='https:'||!['www.virustotal.com','virustotal.com'].includes(url.hostname))throw new Error('Unexpected scan API host');
  lastRequest=Date.now();
  const response=await fetch(url,{...options,redirect:'error',headers:{'x-apikey':key,...options.headers},signal:AbortSignal.timeout(180000)});
  if(response.status===404)return null;
  if(!response.ok)throw new Error('VirusTotal HTTP '+response.status+'; no scan result was accepted.');
  return response.json();
}
const out=resolve(option('--output','dist/virustotal-report.json'));
await mkdir(resolve(out,'..'),{recursive:true});
async function save(attributes,status){
  const stats=attributes.last_analysis_stats||attributes.stats||{};
  const results=attributes.last_analysis_results||attributes.results||{};
  const result={schemaVersion:1,fileName:'NBFC.TRACKER.exe',version:(await readFile('VERSION','utf8')).trim(),sha256,size:(await stat(path)).size,
    status,checkedAt:new Date().toISOString(),analysisDate:attributes.last_analysis_date?new Date(attributes.last_analysis_date*1000).toISOString():null,
    reportUrl,stats,detections:Object.entries(results).filter(([,r])=>['malicious','suspicious'].includes(r.category)).map(([engine,r])=>({engine,category:r.category,result:r.result})),
    notice:'Results apply only to this SHA-256 and scan date. They are not a guarantee of safety.'};
  await writeFile(out,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({sha256,status,stats,detections:result.detections,reportUrl,output:out}));
  return result;
}
const known=await api('files/'+sha256);
if(known?.data?.attributes?.last_analysis_stats){await save(known.data.attributes,'completed');return;}
if(!args.includes('--upload')){console.log(JSON.stringify({sha256,status:'not_found',reportUrl}));process.exitCode=2;return;}
const destination=bytes.length>32*1024*1024?(await api('files/upload_url'))?.data:'https://www.virustotal.com/api/v3/files';
if(!destination)throw new Error('No large-file upload endpoint returned');
const body=new FormData();body.append('file',new Blob([bytes]),'NBFC.TRACKER.exe');
const submitted=await api(destination,{method:'POST',body});
const id=submitted?.data?.id;if(!id)throw new Error('No analysis ID returned');
await writeFile(out+'.pending',JSON.stringify({sha256,id,reportUrl})+'\n');
console.log(JSON.stringify({sha256,status:'submitted',reportUrl}));
const deadline=Date.now()+15*60*1000;
while(Date.now()<deadline){
  await new Promise(resolve=>setTimeout(resolve,20000));
  const analysis=await api('analyses/'+encodeURIComponent(id));
  const attributes=analysis?.data?.attributes||{};
  if(attributes.status==='completed'){
    const final=await api('files/'+sha256);await save(final?.data?.attributes||attributes,'completed');return;
  }
  console.log('VirusTotal analysis '+(attributes.status||'queued'));
}
console.log(JSON.stringify({sha256,status:'pending',reportUrl}));
process.exitCode=3;

}
await main();
