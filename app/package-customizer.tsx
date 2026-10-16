'use client';
import {useState} from 'react';
import {equipmentLines,matchPackage,type ServicePackage} from './package-match';
export default function PackageCustomizer({packages,baseId,value,onChange,additionalEquipment='',onUseFixed}:{packages:ServicePackage[];baseId:string;value:string;onChange:(equipment:string)=>void;additionalEquipment?:string;onUseFixed?:()=>void}){
 const [item,setItem]=useState('');const base=packages.find(p=>p.id===baseId);if(!base)return null;
 const lines=equipmentLines(value);const match=matchPackage(packages,baseId,[value,additionalEquipment].filter(Boolean).join('\n'));
 return <section className="package-customizer"><div className="package-config-title"><h3>{match.name}</h3><span className="badge">{match.mode==='fixed'?'Fijo':'Personalizado'}</span></div>
 <p>Agrega o retira equipo. Si coincide exactamente con otro paquete, cambia a su nombre; si quedan diferencias, se indica como personalizado.</p>
 <button type="button" className="outline" onClick={()=>onUseFixed?onUseFixed():onChange(base.equipment)}>Usar paquete fijo: {base.name}</button>
 <ul>{lines.map((line,i)=><li key={i}><span>{line}</span><button type="button" aria-label={`Retirar ${line}`} onClick={()=>onChange(lines.filter((_,index)=>index!==i).join('\n'))}>Retirar</button></li>)}</ul>
 <div className="equipment-add"><input aria-label="Equipo o servicio adicional" placeholder="Ej. 1 bajo de 18 pulgadas" maxLength={250} value={item} onChange={e=>setItem(e.target.value)}/><button type="button" className="outline" disabled={!item.trim()} onClick={()=>{onChange([...lines,item.trim()].join('\n'));setItem('');}}>Agregar artículo</button></div>
 <details><summary>Editar la lista completa</summary><label>Un artículo por línea<textarea value={value} maxLength={15000} onChange={e=>onChange(e.target.value)}/></label></details></section>;
}
