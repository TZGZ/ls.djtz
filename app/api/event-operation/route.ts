import {env} from 'cloudflare:workers';
import {staffApiGuard,staffIdentity} from '../../staff-auth';
import {operationStages,paymentReports,closingStates,staffRecord} from '../../event-utils';
import {readJson} from '../../request-json';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(req:Request){
 const denied=await staffApiGuard(req);if(denied)return denied;
 const {user,role}=await staffIdentity();if(!user||!role||role==='viewer')return Response.json({error:'No tienes permiso de edición.'},{status:403,headers});
 try{
  const body=await readJson(req,3000) as {id:string;version:number;field:string;value:string;extraHours?:number};
  if(typeof body.id!=='string'||!Number.isInteger(body.version))throw Error('Evento inválido.');
  const options:Record<string,readonly string[]>={operationStage:operationStages,paymentReport:paymentReports,closingState:closingStates};
  if(!options[body.field]?.includes(body.value))throw Error('Reporte inválido.');
  if(body.field==='closingState'&&body.value==='Habrá horas extra'&&(!Number.isFinite(body.extraHours)||Number(body.extraHours)<=0||Number(body.extraHours)>24))throw Error('Indica las horas extra previstas (mayor que cero, hasta 24).');
  const stored=await env.DB.prepare("SELECT data,version FROM records WHERE id=? AND kind='event'").bind(body.id).first<{data:string;version:number}>();
  if(!stored||stored.version!==body.version)return Response.json({error:'El evento cambió. Actualízalo antes de reportar.'},{status:409,headers});
  const record=JSON.parse(stored.data);const at=new Date().toISOString();
  record[body.field]=body.value;record.operationAt=at;
  if(body.field==='closingState')record.extraHours=body.value==='Habrá horas extra'?Number(body.extraHours):0;
  if(body.field==='closingState'&&body.value==='Finalizado')record.status='Finalizado';
  record.operationHistory=[...(record.operationHistory||[]),{field:body.field,value:body.value,at,by:user.email,extraHours:body.field==='closingState'?record.extraHours:undefined}].slice(-60);
  const result=await env.DB.prepare("UPDATE records SET data=?,version=version+1 WHERE id=? AND kind='event' AND version=?").bind(JSON.stringify(record),body.id,body.version).run();
  if(!result.meta.changes)return Response.json({error:'El evento cambió. Actualiza y reintenta.'},{status:409,headers});
  return Response.json({record:staffRecord({...record,id:body.id,kind:'event',version:body.version+1},role==='admin')},{headers});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'No se pudo guardar el reporte.'},{status:400,headers});}
}
