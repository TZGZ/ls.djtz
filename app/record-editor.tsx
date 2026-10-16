'use client';
import {useState} from 'react';
import {X} from 'lucide-react';
import PackageBubbles from './package-bubbles';
import PackageCustomizer from './package-customizer';
import ContractImport from './contract-import';
import {matchPackage} from './package-match';
import {eventSchedule} from './event-utils';
export default function RecordEditor({record:r,onChange,packages,staff,admin,busy,error,onClose,onSave}:{record:any;onChange:(r:any)=>void;packages:any[];staff:any[];admin:boolean;busy:boolean;error:string;onClose:()=>void;onSave:(r:any,remove?:boolean)=>void}){
 const [imported,setImported]=useState(false),[importBusy,setImportBusy]=useState(false);const event=r.kind==='event';
 const match=event?matchPackage(packages,r.packageId||'',[r.equipment,r.extras].filter(Boolean).join('\n')):null;
 function patch(values:any){const next={...r,...values};if(event&&('date'in values||'start'in values)){next.warehouseArrival=eventSchedule(next.date,next.start,3);next.venueArrival=eventSchedule(next.date,next.start,1);}onChange(next);}
 const field=(key:string,label:string,type='text',required=false)=><label>{label}{type==='textarea'?<textarea value={r[key]??''} maxLength={15000} onChange={e=>patch({[key]:e.target.value})}/>:<input type={type} required={required} value={r[key]??''} min={type==='number'?0:undefined} step={type==='number'?'0.01':undefined} onChange={e=>patch({[key]:e.target.value})}/>}</label>;
 const balance=r.total==null||r.total===''?'Por confirmar':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(r.total)-Number(r.deposit||0));
 const defaultOrder=['service','venue','client','financial','observations','settlement'];
 const savedOrder:string[]=[];
 const order=[...new Set([...savedOrder,...defaultOrder])];
 const eventSections=[{key:'client',title:'Datos del contratante',content:<>{field('client','Nombre del cliente *','text',true)}{field('clientAddress','Domicilio del cliente')}</>},
{key:'service',title:'Servicio contratado',content:<><div className="span2"><PackageBubbles packages={packages} value={r.packageId||''} required name="event-package" label="Paquete" onChange={id=>{const p=packages.find(p=>p.id===id);patch({packageId:id,equipment:p?.equipment||'',packageMode:'fixed',...(admin?{total:imported?r.total:(p?.total??''),extraRate:imported?r.extraRate:(p?.extraRate??'')}:{})});}}/>{!packages.length&&<p>Primero registra un paquete.</p>}</div>
 <label className="span2">Nombre del evento (según el paquete)<input readOnly value={r.packageId?match?.name||'':''}/></label>
 <div className="span2"><PackageCustomizer packages={packages} baseId={r.packageId} value={r.equipment||''} additionalEquipment={r.extras||''} onUseFixed={()=>patch({equipment:packages.find(p=>p.id===r.packageId)?.equipment||'',extras:'',packageMode:'fixed'})} onChange={equipment=>patch({equipment,packageMode:'custom'})}/></div></>},
{key:'venue',title:'Lugar, fecha y horario',content:<>{field('address','Domicilio del evento *','text',true)}{field('date','Fecha de inicio *','date',true)}{field('start','Hora de inicio *','time',true)}{field('endDate','Fecha de término *','date',true)}{field('end','Hora de término *','time',true)}{field('type','Tipo de evento')}{field('phone','Teléfono','tel')}</>},
{key:'financial',title:'Importes del contrato',content:<>{field('extraRate','Hora extra o fracción (MXN)','number')}{field('total','Total contratado (MXN) *','number',true)}</>},{key:'observations',title:'Observaciones y servicios adicionales',content:<>{field('extras','Servicios adicionales','textarea')}{admin&&field('notes','Notas de administración','textarea')}</>},{key:'settlement',title:'Anticipo y saldo',content:<>{field('deposit','Anticipo / pagado (MXN)','number')}{field('contractBalance','Restan según el contrato (MXN)','number')}<div className="balance"><span>Saldo pendiente</span><strong>{balance}</strong></div></>}].filter(section=>!['financial','settlement'].includes(section.key)||admin).sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));
 return <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-label={event?'Ficha del evento':'Editar registro'}><div className="modal-head"><div><div className="kicker">{event?'FICHA DE CONTRATACIÓN':'CONFIGURACIÓN'}</div><h2>{r.version?'Editar':'Nuevo'} {event?'evento':r.kind==='staff'?'integrante':'paquete'}</h2></div><button type="button" aria-label="Cerrar" onClick={onClose}><X/></button></div>
 <form onSubmit={e=>{e.preventDefault();if(importBusy||(event&&!(r.staff||[]).length))return;onSave(event?{...r,name:match!.name,packageId:match!.packageId,packageMode:match!.mode}:r);}}>
 {error&&<div className="error" role="alert">{error}</div>}<fieldset className="form-grid" disabled={busy||importBusy}>
 {event?<>
 <ContractImport onBusyChange={setImportBusy} packages={packages} onImport={draft=>{const values={...draft};for(const key of ['client','phone','clientAddress','address','date','endDate','start','end','packageId','equipment','extras'])values[key]=draft[key]||'';if(admin){for(const key of ['total','deposit','extraRate','contractBalance','notes'])values[key]=draft[key]||'';}else{for(const key of ['total','deposit','extraRate','contractBalance','notes'])delete values[key];}patch(values);setImported(true);}}/>
 {imported&&<p className="form-note span2">Borrador importado. Confirma nombres, lugar, fechas, horario, equipo y personal antes de guardar. Los campos vacíos necesitan revisión.</p>}
 {eventSections.map((section,index)=><section key={section.key} className="span2 form-grid contract-section"><h3 className="span2 form-section">{String(index+1).padStart(2,'0')} / {section.title}</h3>{section.content}</section>)}
 <h3 className="span2 form-section">Adicionales / Coordinación del equipo</h3>
 <label>Estado del evento<select value={r.status||'Cotización'} onChange={e=>patch({status:e.target.value})}>{['Cotización','Confirmado','En preparación','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}</select></label>
 {field('warehouseArrival','Llegada a bodega (base: 3 horas antes)','datetime-local')}{field('venueArrival','Llegada al lugar (base: 1 hora antes)','datetime-local')}
 <p className="form-note span2">Horarios de Guadalajara. Las llegadas se recalculan al cambiar el inicio; puedes ajustarlas. Para eventos nocturnos revisa el día de término.</p>
 <div className="staff-picker span2"><h3>Personal asignado *</h3>{staff.length?staff.map(s=><label key={s.id}><input type="checkbox" checked={(r.staff||[]).includes(s.id)} onChange={e=>patch({staff:e.target.checked?[...(r.staff||[]),s.id]:(r.staff||[]).filter((id:string)=>id!==s.id)})}/><span>{s.name}<small>{s.role}</small></span></label>):<p>Registra al personal antes de guardar el evento.</p>}</div>
 {field('program','Programa del evento / horarios','textarea')}
 </>:<>{field('name','Nombre *','text',true)}{r.kind==='staff'?<>{field('role','Función *','text',true)}{field('phone','Teléfono','tel')}{field('notes','Notas','textarea')}</>:<>{admin&&field('total','Precio de referencia (MXN)','number')}{field('capacity','Capacidad recomendada','number')}{field('hours','Horas de servicio','number')}{field('tag','Etiqueta')}{admin&&field('extraRate','Hora extra (MXN)','number')}{field('equipment','Equipo y servicio incluido (un artículo por línea)','textarea')}</>}</>}
 </fieldset><div className="modal-actions">{r.version&&<button type="button" className="danger" disabled={busy} onClick={()=>{if(confirm('¿Eliminar este registro?'))onSave(r,true);}}>Eliminar</button>}<button type="button" className="outline" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy||importBusy||(event&&!(r.staff||[]).length)}>{busy?'Guardando…':'Guardar cambios'}</button></div>{event&&!(r.staff||[]).length&&<p className="form-note">Selecciona al staff antes de guardar.</p>}
 </form></section></div>;
}
