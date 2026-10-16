'use client';
import {Check,AudioLines,HelpCircle} from 'lucide-react';
type Option={id:string;name:string;capacity?:string|number};
export default function PackageBubbles({packages,value,onChange,required=false,allowHelp=false,name='package',label='Selecciona tu paquete'}:{packages:Option[];value:string;onChange:(id:string)=>void;required?:boolean;allowHelp?:boolean;name?:string;label?:string}){
 const options=allowHelp?[{id:'',name:'Ayúdame a elegir'},...packages]:packages;
 return <fieldset className="package-bubbles"><legend>{label}{required?' *':''}</legend><div className="package-bubble-options">{options.map(p=><label key={p.id} className={'package-bubble '+(value===p.id?'is-selected':'')}><input type="radio" name={name} value={p.id} required={required} checked={value===p.id} onChange={()=>onChange(p.id)}/><span className="bubble-icon">{value===p.id?<Check size={16}/>:p.id?<AudioLines size={16}/>:<HelpCircle size={16}/>}</span><span className="bubble-name">{p.name}</span></label>)}</div><small className="bubble-hint">{value?'Paquete seleccionado: '+(packages.find(p=>p.id===value)?.name||''):'Selecciona una opción para continuar.'}</small></fieldset>
}
