import { env } from "cloudflare:workers";
import {staffApiGuard} from "../../staff-auth";
export const dynamic="force-dynamic";
export async function GET() { const denied=await staffApiGuard();if(denied)return denied; const r=await env.DB!.prepare("SELECT * FROM records WHERE kind != 'system'").all(); return Response.json(r.results.map((x:any)=>({...JSON.parse(x.data),id:x.id,kind:x.kind,version:x.version})),{headers:{"Cache-Control":"no-store"}}); }
export async function POST(req:Request) {
 const denied=await staffApiGuard(req);if(denied)return denied;
 try {const {record:r,remove}=await req.json() as any;
 if(!r || !["event","staff","package"].includes(r.kind) || typeof r.id!=="string")throw Error("Registro inválido");
 if(remove){const used=await env.DB!.prepare("SELECT data FROM records WHERE kind='event'").all();if(r.kind!=="event"&&used.results.some((x:any)=>{const e=JSON.parse(x.data);return e.packageId===r.id||e.staff?.includes(r.id)}))throw Error("Este registro está asignado a un evento. Retira la asignación primero.");const del=await env.DB!.prepare("DELETE FROM records WHERE id=? AND version=?").bind(r.id,r.version).run();if(!del.meta.changes)throw Error("El registro cambió. Actualiza la página.");return Response.json({ok:true});}
 if(typeof r.name!=="string"||!r.name.trim()||JSON.stringify(r).length>40000)throw Error("Revisa el nombre y el tamaño del registro");
 if(r.kind==='event'){
 if(!r.client||!r.date||!r.endDate||!r.start||!r.end||!r.address||!r.packageId)throw Error("Completa los datos obligatorios del evento");
 const start=Date.parse(r.date+'T'+r.start),end=Date.parse(r.endDate+'T'+r.end);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error("El término debe ser posterior al inicio");
 if(r.total===''||r.total==null)throw Error('Define el total cotizado antes de guardar el evento');
 if([r.total,r.deposit,r.extraRate].some(x=>!Number.isFinite(Number(x))||Number(x)<0)||Number(r.deposit)>Number(r.total))throw Error("Revisa los importes y el anticipo");
 const rows=await env.DB!.prepare("SELECT id,kind,data FROM records").all();if(!rows.results.some((x:any)=>x.id===r.packageId&&x.kind==='package'))throw Error("Selecciona un paquete vigente");
 if(!Array.isArray(r.staff)||r.staff.some((id:string)=>!rows.results.some((x:any)=>x.id===id&&x.kind==='staff')))throw Error("Selecciona personal vigente");
 if(r.status!=='Cancelado')for(const x of rows.results as any[]){if(x.kind!=='event'||x.id===r.id)continue;const e=JSON.parse(x.data);if(e.status==='Cancelado')continue;if(start<Date.parse(e.endDate+'T'+e.end)&&end>Date.parse(e.date+'T'+e.start)&&r.staff.some((id:string)=>e.staff.includes(id)))throw Error('Personal ocupado en el evento: '+e.name);}
 }
 if(r.kind==='package'&&[r.total,r.extraRate].some(x=>!Number.isFinite(Number(x))||Number(x)<0))throw Error("Tarifas inválidas");
 const data=JSON.stringify(r);if(r.version){const out=await env.DB!.prepare("UPDATE records SET data=?,version=version+1 WHERE id=? AND version=?").bind(data,r.id,r.version).run();if(!out.meta.changes)throw Error("El registro cambió. Actualiza antes de guardar.");}else await env.DB!.prepare("INSERT INTO records (id,kind,data,version) VALUES (?,?,?,1)").bind(r.id,r.kind,data).run();return Response.json({ok:true});
 }catch(e){return Response.json({error:e instanceof Error?e.message:"No se pudo guardar"},{status:400});}
}
