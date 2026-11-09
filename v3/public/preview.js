// Marketing demo only. Never imported by the real dashboard or OBS overlay.
const random=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
let state={total:random(2200,8500),session:random(80,240),lastMatch:random(4,16)};
export function previewValues(){return {...state};}
export function advancePreview(){const opened=random(3,16);state={total:state.total+opened,session:state.session+opened,lastMatch:opened};return previewValues();}
