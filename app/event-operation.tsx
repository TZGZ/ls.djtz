'use client';
import {useState} from 'react';
import {operationStages,paymentReports,closingStates} from './event-utils';
export default function EventOperation({record,canEdit,onSaved}:{record:any;canEdit:boolean;onSaved:(record:any)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[hours,setHours]=useState('1');
 async function report(field:string,value:string){setBusy(true);setError('');try{
  const r=await fetch('/api/event-operation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:record.id,version:record.version,field,value,extraHours:Number(hours)})});
  const data=await r.json() as {error?:string;record:any};if(!r.ok)throw Error(data.error||'No se pudo guardar.');onSaved(data.record);
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="operation-panel"><h3>Operación del evento</h3>{error&&<p role="alert" className="error">{error}</p>}
 <p>Último estado: <b>{record.operationStage||'Sin reportar'}</b></p><div className="operation-buttons">{operationStages.map(stage=><button type="button" className={'outline '+(record.operationStage===stage?'chosen':'')} key={stage} disabled={!canEdit||busy} onClick={()=>report('operationStage',stage)}>{stage}</button>)}</div>
 <label>Reporte del pago<select value={record.paymentReport||'Sin informar'} disabled={!canEdit||busy} onChange={e=>report('paymentReport',e.target.value)}>{paymentReports.map(s=><option key={s}>{s}</option>)}</select></label><small>Es un reporte del equipo. No modifica los importes registrados por administración.</small>
 <label>Horas extra previstas<input type="number" min="0.5" max="24" step="0.5" value={hours} disabled={!canEdit||busy} onChange={e=>setHours(e.target.value)}/></label>
 <div className="operation-buttons">{closingStates.map(state=><button type="button" key={state} disabled={!canEdit||busy} className={'outline '+(record.closingState===state?'chosen':'')} onClick={()=>report('closingState',state)}>{state}</button>)}</div>
 {record.closingState&&<p>{record.closingState}{record.extraHours?` · ${record.extraHours} horas extra previstas`:''}</p>}
 <details><summary>Historial de reportes</summary>{[...(record.operationHistory||[])].reverse().map((h:any,i:number)=><p key={i}>{new Date(h.at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})} · {h.value}{h.extraHours?` (${h.extraHours} h)`:''}</p>)}</details></section>;
}
