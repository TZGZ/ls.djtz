import {env} from 'cloudflare:workers';
import {staffApiGuard} from '../../../staff-auth';
import {catalog} from '../../../catalog';
export async function POST(req:Request){
 const denied=await staffApiGuard(req);if(denied)return denied;
 try {
 const marker='catalog-import-canva-2026-10';
 // Atomic, one-time import: preserve existing records, prices and later deletions.
 const queries=catalog.map(p=>env.DB!.prepare("INSERT OR IGNORE INTO records (id,kind,data,version) SELECT ?,?,?,1 WHERE NOT EXISTS (SELECT 1 FROM records WHERE id=?) AND NOT EXISTS (SELECT 1 FROM records WHERE kind='package' AND lower(json_extract(data,'$.name'))=lower(?))").bind(p.id,'package',JSON.stringify(p),marker,p.name));
 queries.push(env.DB!.prepare("INSERT OR IGNORE INTO records (id,kind,data,version) VALUES (?,'system','{}',1)").bind(marker));
 await env.DB!.batch(queries);return Response.json({ok:true});
 }catch{return Response.json({error:'No se pudo cargar el catálogo. Vuelve a intentar.'},{status:500});}
}
