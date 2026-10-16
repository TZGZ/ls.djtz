export const operationStages=['En carga de equipo','En camino al evento','Llegada al evento','Montaje listo'] as const;
export const closingStates=['En curso','Finalizado','Habrá horas extra'] as const;
export const paymentReports=['Sin informar','Pagado','Pendiente de pago'] as const;
export function eventSchedule(date:string,start:string,hoursBefore:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(start))return '';
 const time=new Date(`${date}T${start}:00Z`);if(!Number.isFinite(time.getTime()))return '';
 return new Date(time.getTime()-hoursBefore*3600000).toISOString().slice(0,16);
}
export function pendingBalance(event:Record<string,unknown>){
 if(event.total==null||event.total==='')return null;
 return Math.max(0,Number(event.total)-Number(event.deposit||0));
}
// Allowlisted projections prevent financial fields and future private fields from
// reaching staff clients, including exports and the React payload.
const eventFields=['id','kind','name','version','client','phone','clientAddress','address','date','endDate','start','end','type','packageId','packageMode','equipment','staff','status','extras','program','warehouseArrival','venueArrival','operationStage','operationAt','paymentReport','closingState','extraHours','operationHistory','contractSectionOrder'];
const packageFields=['id','kind','name','version','capacity','hours','equipment','tag','image','order'];
const staffFields=['id','kind','name','version','role','phone'];
export function staffRecord(record:Record<string,unknown>,admin:boolean){
 if(admin)return record;
 const fields=record.kind==='event'?eventFields:record.kind==='package'?packageFields:staffFields;
 const projected=Object.fromEntries(fields.filter(k=>k in record).map(k=>[k,record[k]]));
 if(record.kind==='event')projected.balanceDue=pendingBalance(record);
 return projected;
}
export const editableEventFields=['client','phone','clientAddress','address','date','endDate','start','end','type','packageId','packageMode','equipment','staff','status','extras','program','warehouseArrival','venueArrival','contractSectionOrder'];
