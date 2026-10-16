import {matchPackage,type ServicePackage} from './package-match';
export type ContractDraft=Record<string,string>;
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseContract(text:string,packages:ServicePackage[]=[]){
 if(text.trim().startsWith('%PDF-'))throw Error('Eso es código binario de un PDF. Selecciona el archivo PDF original para leerlo.');
 const lines=text.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 const draft:ContractDraft={type:'EVENTO PRIVADO'};const found:string[]=[];const positions:Record<string,number>={};
 const labels:Record<string,string>={client:'(?:nombre (?:del |de la )?(?:cliente|contratante|arrendatario)|cliente|contratante|arrendatario)',phone:'(?:telefono|tel[eé]fono de contacto|celular)',clientAddress:'(?:domicilio (?:del |de la )?(?:cliente|contratante|arrendatario))',address:'(?:domicilio (?:del |de la )?(?:evento|servicio)|lugar (?:del )?evento|direccion (?:del )?evento)',date:'(?:fecha (?:del |de )?(?:evento|servicio)|fecha de inicio)',endDate:'(?:fecha (?:de )?(?:termino|fin|finalizacion))',start:'(?:hora (?:de )?(?:inicio|comienzo)|horario de inicio|inicio (?:del )?evento)',end:'(?:hora (?:de )?(?:termino|fin|finalizacion)|horario de termino)',type:'(?:tipo de evento)',total:'(?:total(?: contratado)?|importe total|costo total|precio total)',deposit:'(?:anticipo|deposito|pagado)',extraRate:'(?:hora extra(?: o fraccion)?|costo por hora extra)',equipment:'(?:equipo(?: acordado| contratado| incluido)?|servicios incluidos)',package:'(?:paquete(?: contratado)?|servicio contratado)'};
 for(const [field,label] of Object.entries(labels)){
  for(let i=0;i<lines.length;i++){
   const line=normalized(lines[i]);const match=line.match(new RegExp('^'+label+'\\s*(?:[:=]|[-–]\\s)\\s*(.*)$','i'));
   const standalone=line.match(new RegExp('^'+label+'\\s*:?[ _]*$','i'));
   if(!match&&!standalone)continue;
   const separator=lines[i].search(/[:=]|[-–]\s/);let value=separator<0?'':lines[i].slice(separator+1).trim();
   if(!value&&i+1<lines.length&&!/[:=]/.test(lines[i+1]))value=lines[i+1];
   if(!value||/^[_\s.]+$/.test(value))break;
   if(field==='equipment')for(let j=i+1;j<lines.length;j++){if(!/^(?:[-•*]\s*|\d+\s+\D)/.test(lines[j])||/[:=]/.test(lines[j]))break;value+='\n'+lines[j].replace(/^[-•*]\s*/,'');}
   draft[field]=value;positions[field]=i;found.push(field);break;
  }
 }
 for(const field of ['date','endDate'])if(draft[field]){
  const input=normalized(draft[field]);const numeric=input.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);const iso=input.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const named=input.match(/\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de(?:l)?\s+)?(\d{4})\b/);
  const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const value=iso?.[0]||(numeric?`${numeric[3]}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`:named?`${named[3]}-${String(months.indexOf(named[2])+1).padStart(2,'0')}-${named[1].padStart(2,'0')}`:'');
  const parsed=new Date(value+'T12:00:00Z');if(value&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value)draft[field]=value;else delete draft[field];
 }
 for(const field of ['start','end'])if(draft[field]){const m=normalized(draft[field]).match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/);if(m){let h=Number(m[1]);if(m[3])h=h%12+(m[3].startsWith('p')?12:0);const min=Number(m[2]||0);if(h<24&&min<60)draft[field]=`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;else delete draft[field];}else delete draft[field];}
 for(const field of ['total','deposit','extraRate'])if(draft[field]){const m=draft[field].replace(/,/g,'').match(/\d+(?:\.\d{1,2})?/);if(m)draft[field]=m[0];else delete draft[field];}
 if(draft.package){const name=normalized(draft.package).replace(/^paquete\s+/,'').trim();const p=packages.find(p=>normalized(p.name)===name);if(p){draft.packageId=p.id;if(!draft.equipment)draft.equipment=p.equipment;}}
 if(draft.equipment){const match=matchPackage(packages,draft.packageId||'',draft.equipment);if(match.packageId){draft.packageId=match.packageId;draft.name=match.name;draft.packageMode=match.mode;}}
 delete draft.package;
 const groups:Record<string,string[]>={client:['client','phone','clientAddress'],service:['package','equipment'],venue:['type','address','date','start','endDate','end'],financial:['total','deposit','extraRate']};
 draft.contractSectionOrder=Object.keys(groups).sort((a,b)=>Math.min(...groups[a].map(k=>positions[k]??Infinity))-Math.min(...groups[b].map(k=>positions[k]??Infinity))).join(',');
 return {draft,found:found.filter(k=>k in draft),missing:['client','address','date','endDate','start','end','packageId'].filter(k=>!draft[k])};
}
