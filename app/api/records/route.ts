import {env} from 'cloudflare:workers';
import {staffApiGuard,staffIdentity} from '../../staff-auth';
import {staffRecord,editableEventFields,eventSchedule,eventEndDate} from '../../event-utils';
import {matchPackage,type ServicePackage} from '../../package-match';
import {readJson} from '../../request-json';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 const denied=await staffApiGuard();if(denied)return denied;
 const identity=await staffIdentity();if(!identity.allowed)return Response.json({error:'Acceso retirado.'},{status:403,headers});
 const result=await env.DB.prepare("SELECT * FROM records WHERE kind != 'system'").all();
 return Response.json(result.results.map((x:any)=>staffRecord({...JSON.parse(x.data),id:x.id,kind:x.kind,version:x.version},identity.role==='admin')),{headers});
}
export async function POST(req:Request){
 const denied=await staffApiGuard(req);if(denied)return denied;
 const identity=await staffIdentity();if(!identity.allowed||identity.role==='viewer')return Response.json({error:'No tienes permiso de edición.'},{status:403,headers});
 const admin=identity.role==='admin';
 try{
  const body=await readJson(req) as {record?:any;remove?:boolean};const input=body?.record;
  if(!input||!['event','staff','package'].includes(input.kind)||typeof input.id!=='string'||input.id.length>128)throw Error('Registro inválido.');
  const stored=await env.DB.prepare('SELECT id,kind,data,version FROM records WHERE id=?').bind(input.id).first<{id:string;kind:string;data:string;version:number}>();
  if(stored&&(stored.kind!==input.kind||stored.version!==input.version))throw Error('El registro cambió. Actualiza la página.');
  if(!stored&&input.version)throw Error('El registro ya no existe.');
  if(body.remove){
   if(!stored)throw Error('El registro ya no existe.');
   if(input.kind!=='event'){const used=await env.DB.prepare("SELECT data FROM records WHERE kind='event'").all();if(used.results.some((x:any)=>{const e=JSON.parse(x.data);return e.packageId===input.id||e.staff?.includes(input.id);}))throw Error('Este registro está asignado a un evento. Retira la asignación primero.');}
   const result=await env.DB.prepare('DELETE FROM records WHERE id=? AND version=?').bind(input.id,stored.version).run();if(!result.meta.changes)throw Error('El registro cambió. Actualiza la página.');return Response.json({ok:true},{headers});
  }
  const previous=stored?JSON.parse(stored.data):{};
  let record={...previous,...input};
  if(!admin){
   const permitted=input.kind==='event'?editableEventFields:input.kind==='package'?['name','capacity','hours','equipment','tag','image','order']:['name','role','phone','notes'];
   record={...previous,id:input.id,kind:input.kind,...Object.fromEntries(permitted.filter(k=>k in input).map(k=>[k,input[k]]))};
   if(!stored&&input.kind==='event')Object.assign(record,{total:null,deposit:0,extraRate:0});
   if(!stored&&input.kind==='package')Object.assign(record,{total:'',extraRate:''});
  }
  if(record.kind==='event'){
   record.endDate=eventEndDate(record.date,record.start,record.end);
   if(!record.client||!record.date||!record.endDate||!record.start||!record.end||!record.address||!record.packageId)throw Error('Completa cliente, lugar, fecha, horario y paquete.');
   const begin=Date.parse(record.date+'T'+record.start),end=Date.parse(record.endDate+'T'+record.end);if(!Number.isFinite(begin)||!Number.isFinite(end)||end<=begin)throw Error('El término debe ser posterior al inicio.');
   if(admin&&(record.total===''||record.total==null))throw Error('Define el total cotizado antes de guardar.');
   if(record.total!=null&&record.total!==''&&([record.total,record.deposit,record.extraRate].some(x=>!Number.isFinite(Number(x||0))||Number(x)<0)||Number(record.deposit)>Number(record.total)))throw Error('Revisa los importes y el anticipo.');
   if(admin&&record.contractBalance!=null&&record.contractBalance!==''&&(!Number.isFinite(Number(record.contractBalance))||Number(record.contractBalance)<0||Math.abs(Number(record.total)-Number(record.deposit||0)-Number(record.contractBalance))>0.01))throw Error('El importe de Restan debe coincidir con el total menos el anticipo. Revisa los importes del contrato.');
   const rows=await env.DB.prepare('SELECT id,kind,data FROM records').all();
   const packages=rows.results.filter((x:any)=>x.kind==='package').map((x:any)=>({...JSON.parse(x.data),id:x.id})) as ServicePackage[];
   const selected=packages.find(p=>p.id===record.packageId);if(!selected)throw Error('Selecciona un paquete vigente.');
   if(!Array.isArray(record.staff)||record.staff.length===0||record.staff.some((id:unknown)=>typeof id!=='string'||!rows.results.some((x:any)=>x.id===id&&x.kind==='staff')))throw Error('Selecciona al menos un integrante del personal vigente antes de guardar.');
   if(record.status!=='Cancelado')for(const x of rows.results as any[]){if(x.kind!=='event'||x.id===record.id)continue;const e=JSON.parse(x.data);if(e.status!=='Cancelado'&&begin<Date.parse(e.endDate+'T'+e.end)&&end>Date.parse(e.date+'T'+e.start)&&record.staff.some((id:string)=>e.staff?.includes(id)))throw Error('Personal ocupado en el evento: '+e.name);}
   const match=matchPackage(packages,selected.id,[record.equipment,record.extras].filter(Boolean).join('\n'));
   record.packageId=match.packageId;record.name=match.name;record.packageMode=match.mode;
   record.type=String(record.type||'').trim()||'EVENTO PRIVADO';
   record.warehouseArrival=record.warehouseArrival||eventSchedule(record.date,record.start,3);
   record.venueArrival=record.venueArrival||eventSchedule(record.date,record.start,1);
   // Reports are changed through the narrow operation endpoint, not whole-record edits.
   for(const key of ['operationStage','operationAt','paymentReport','closingState','extraHours','operationHistory']){if(key in previous)record[key]=previous[key];else delete record[key];}
  }
  if(typeof record.name!=='string'||!record.name.trim()||JSON.stringify(record).length>40000)throw Error('Revisa el nombre y el tamaño del registro.');
  if(record.kind==='package'&&[record.total,record.extraRate].some(x=>!Number.isFinite(Number(x||0))||Number(x)<0))throw Error('Tarifas inválidas.');
  const data=JSON.stringify(record);
  if(stored){const result=await env.DB.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND version=?').bind(data,input.id,stored.version).run();if(!result.meta.changes)throw Error('El registro cambió. Actualiza antes de guardar.');}
  else await env.DB.prepare('INSERT INTO records (id,kind,data,version) VALUES (?,?,?,1)').bind(input.id,input.kind,data).run();
  return Response.json({ok:true},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'No se pudo guardar.'},{status:400,headers});}
}
