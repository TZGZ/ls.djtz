import {env} from 'cloudflare:workers';
import {catalog} from './catalog';
// Only published service fields leave this server module. No customer/staff data.
export function publicPackage(p:any){return {id:p.id,name:p.name,total:'',capacity:p.capacity,hours:p.hours,equipment:p.equipment,tag:p.tag,image:p.image,order:p.order};}
export async function publicPackages(){
 const rows=await env.DB!.prepare("SELECT id,data FROM records WHERE kind='package'").all();
 const marker=await env.DB!.prepare("SELECT id FROM records WHERE id='catalog-import-canva-2026-10'").first();
 const saved=rows.results.map((x:any)=>publicPackage({...JSON.parse(x.data),id:x.id}));
 if(marker)return saved;
 return [...saved,...catalog.filter(p=>!saved.some(s=>s.id===p.id||s.name.toLowerCase()===p.name.toLowerCase())).map(publicPackage)];
}
