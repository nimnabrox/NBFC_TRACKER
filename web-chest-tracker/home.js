import { languages, resolveLanguage, setLanguage, locale, t } from './i18n.js';
import { mountLanguagePicker } from './controls.js';
import { displayVersion } from './version.js';
const $=id=>document.getElementById(id);
for(const [code,label] of languages){const option=document.createElement('option');option.value=code;option.textContent=label;$('language').append(option);}
mountLanguagePicker();
function render(){
  document.querySelectorAll('.version').forEach(el=>{el.textContent=displayVersion;});
  document.querySelectorAll('[data-example-count]').forEach(el=>{el.textContent=new Intl.NumberFormat(locale).format(Number(el.dataset.exampleCount));});
}
document.addEventListener('languagechange',render);
$('language').onchange=async event=>{await setLanguage(event.target.value);const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(null,'',url);};
let saved;try{saved=localStorage.getItem('nbfc_language');}catch{}
await setLanguage(resolveLanguage(new URLSearchParams(location.search).get('lang')||saved||navigator.language));
$('language').value=locale;render();
let timer;
$('creatorCode').onclick=async()=>{
  try{await navigator.clipboard.writeText('NIMNABRO');$('toast').textContent=t('copied');}
  catch{$('toast').textContent='NIMNABRO';}
  $('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>{$('toast').hidden=true;},3000);
};
window.addEventListener('pagehide',()=>clearTimeout(timer));
