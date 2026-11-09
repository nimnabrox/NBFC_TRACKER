import { t } from './i18n.js';
let report;
export function renderScanReport(){
  const anchor=document.getElementById('securityReport');
  if(!anchor||report?.status!=='completed'||!/^[a-f0-9]{64}$/.test(report.sha256||''))return;
  const flagged=(report.stats?.malicious||0)+(report.stats?.suspicious||0);
  const engines=Object.values(report.stats||{}).reduce((sum,value)=>sum+(Number.isInteger(value)?value:0),0);
  anchor.hidden=false;
  anchor.href='https://www.virustotal.com/gui/file/'+report.sha256;
  anchor.textContent=t('scanReport')+` · ${flagged}/${engines}`;
  anchor.dataset.flagged=String(flagged);
}
export async function loadScanReport(){
  try{const response=await fetch(new URL('./security.json',import.meta.url),{cache:'no-store'});if(response.ok){report=await response.json();renderScanReport();}}catch{}
}
