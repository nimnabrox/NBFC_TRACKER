import { t } from './i18n.js';
let report;
export function renderScanReport(){
  const anchor=document.getElementById('securityReport');
  if(!anchor||report?.status!=='completed'||!/^[a-f0-9]{64}$/.test(report.sha256||''))return;
  const flagged=(report.stats?.malicious||0)+(report.stats?.suspicious||0);
  anchor.hidden=false;
  anchor.href='https://www.virustotal.com/gui/file/'+report.sha256;
  anchor.textContent=t('scanReport');
  anchor.dataset.flagged=String(flagged);
  const summary=document.getElementById('securitySummary');
  if(summary){summary.hidden=false;summary.textContent=t('scanSummary',{malicious:report.stats?.malicious||0,suspicious:report.stats?.suspicious||0,undetected:report.stats?.undetected||0,timeout:(report.stats?.timeout||0)+(report.stats?.['confirmed-timeout']||0),unsupported:report.stats?.['type-unsupported']||0});}
}
export async function loadScanReport(){
  try{const response=await fetch(new URL('./security.json',import.meta.url),{cache:'no-store'});if(response.ok){report=await response.json();renderScanReport();}}catch{}
}
