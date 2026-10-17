import {eventEndDate} from './event-utils';

type EventRecord={date?:string;endDate?:string;start?:string;end?:string;status?:string;closingState?:string;extraHours?:number;operationHistory?:unknown[];[key:string]:unknown};
// Guadalajara uses UTC-06:00. Never interpret service hours in the Worker/browser timezone.
export function serviceEndsAt(record:EventRecord){
 const inferred=eventEndDate(record.date||'',record.start||'',record.end||'');
 if(!inferred)return NaN;
 const endDate=record.endDate&&record.endDate>=inferred?record.endDate:inferred;
 const end=Date.parse(`${endDate}T${record.end}:00-06:00`);
 const extra=record.closingState==='Habrá horas extra'?Number(record.extraHours||0):0;
 if(!Number.isFinite(extra)||extra<0||extra>24)return NaN;
 return end+extra*3600000;
}

export async function completeExpiredEvents(db:D1Database,now=Date.now()){
 const rows=await db.prepare("SELECT id,data,version FROM records WHERE kind='event' AND json_extract(data,'$.status') IN ('Confirmado','En preparación')").all<{id:string;data:string;version:number}>();
 let completed=0;
 for(const row of rows.results){
  const record=JSON.parse(row.data) as EventRecord;
  if(!(serviceEndsAt(record)<=now))continue;
  const at=new Date(now).toISOString();
  record.status='Finalizado';record.closingState='Finalizado';record.operationAt=at;
  record.operationHistory=[...(record.operationHistory||[]),{field:'closingState',value:'Finalizado',at,by:'Sistema automático',automatic:true,extraHours:record.extraHours||0}].slice(-60);
  const result=await db.prepare("UPDATE records SET data=?,version=version+1 WHERE id=? AND kind='event' AND version=?").bind(JSON.stringify(record),row.id,row.version).run();
  // A simultaneous edit/report wins; the next scheduled run reads its new service hours.
  completed+=Number(result.meta.changes||0);
 }
 return completed;
}
