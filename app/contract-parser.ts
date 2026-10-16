import {matchPackage,type ServicePackage} from './package-match';
export type ContractDraft=Record<string,string>;
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const blank=(s:string)=>!s.replace(/[_\s.·…-]/g,'');
function dateValue(input:string){
 const s=normalized(input),numeric=s.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/),iso=s.match(/\b\d{4}-\d{2}-\d{2}\b/);
 const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
 const named=s.match(/\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de(?:l)?\s+)?(\d{4})\b/);
 const value=iso?.[0]||(numeric?`${numeric[3]}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`:named?`${named[3]}-${String(months.indexOf(named[2])+1).padStart(2,'0')}-${named[1].padStart(2,'0')}`:'');
 const parsed=new Date(value+'T12:00:00Z');return value&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:'';
}
function timeValue(input:string,inheritedMeridiem=''){
 const m=normalized(input).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?(?:\s*(?:h|hrs|horas))?\s*$/);if(!m)return '';
 let hour=Number(m[1]);const meridiem=m[3]||inheritedMeridiem;if(meridiem){if(hour<1||hour>12)return '';hour=hour%12+(meridiem.startsWith('p')?12:0);}const minutes=Number(m[2]||0);
 return hour<24&&minutes<60?`${String(hour).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`:'';
}
function moneyValue(input:string){
 const clean=input.replace(/\bMXN\b/gi,'').replace(/\$/g,'').trim();if(blank(clean))return '';
 const m=clean.match(/^([\d]+(?:[,.]\d{3})*(?:\.\d{1,2})?|\d+,\d{1,2})(?=\s|$|[.;])/);if(!m)return '';
 const n=m[1].includes('.')?m[1].replace(/,/g,''):/,\d{1,2}$/.test(m[1])?m[1].replace(',','.'):m[1].replace(/,/g,'');return Number.isFinite(Number(n))?String(Number(n)):'';
}
export function parseContract(text:string,packages:ServicePackage[]=[]){
 if(text.trim().startsWith('%PDF-'))throw Error('Eso es código binario de un PDF. Selecciona el archivo PDF original para leerlo.');
 text=text.replace(/\r/g,'').replace(/\u00a0/g,' ');const plain=normalized(text),draft:ContractDraft={type:'EVENTO PRIVADO'},warnings:string[]=[];
 const found=new Set<string>(),positions:Record<string,number>={};
 function put(key:string,value:string,position=0){value=value.replace(/^[_\s]+|[_\s]+$/g,'').replace(/\.+$/,'').trim();if(blank(value))return;draft[key]=value;found.add(key);positions[key]=position;}
 // Only the heading is eligible for customer/location data. Clauses and signatures
 // must not turn the provider's address or a signatory into the customer.
 const cutoff=plain.search(/(?:edwin\s+aaron|el\s+arrendador.{0,50}manifiesta|\bestipulan\b|\bclausulas\b)/);
 const heading=text.slice(0,cutoff<0?text.length:cutoff),headingPlain=normalized(heading);
 const labels:Record<string,string>={package:'(?:servicio o paquete contratado|paquete(?: contratado)?|servicio contratado)',address:'(?:domicilio (?:del |de la )?(?:evento|servicio)|lugar (?:del )?evento|direccion (?:del )?evento)',date:'(?:fecha (?:del |de )?(?:evento|servicio)|fecha de inicio)',endDate:'fecha (?:de )?(?:termino|fin|finalizacion)',range:'horario',start:'(?:hora (?:de )?(?:inicio|comienzo)|horario de inicio|inicio (?:del )?evento)',end:'(?:hora (?:de )?(?:termino|fin|finalizacion)|horario de termino)',type:'tipo de evento',phone:'(?:telefono(?: de contacto)?|celular|tel\.)',client:'(?:nombre (?:del |de la |de )?(?:cliente|contratante|arrendatario)|cliente|contratante|arrendatario)',clientAddress:'domicilio (?:del |de la |de )?(?:cliente|contratante|arrendatario)',equipment:'(?:equipo(?: acordado| contratado| incluido)?|servicios incluidos)'};
 const expression=new RegExp('(?:'+Object.values(labels).join('|')+')\\s*[:=]|(?<![a-z0-9])tel\\.\\s*:?','gi');const matches=[...headingPlain.matchAll(expression)];
 for(let i=0;i<matches.length;i++){
  const m=matches[i],label=m[0].replace(/\s*[:=]$/,'').trim();const key=Object.keys(labels).find(k=>new RegExp('^'+labels[k]+'$','i').test(label));if(!key)continue;
  const value=heading.slice(m.index!+m[0].length,matches[i+1]?.index??heading.length).trim();
  // Do not consume other paragraphs or the next field when a line is blank.
  if(blank(value))continue;const lines=value.split('\n').map(s=>s.trim()).filter(Boolean);let candidate=lines[0]||'';
  if(blank(candidate))continue;
  if(key==='equipment')candidate=lines.filter(s=>!/^(?:pagina|¡buscanos|guadalajara|contrato de)/i.test(s)).join('\n');
  if(key==='date'||key==='endDate'){const parsed=dateValue(candidate);if(parsed)put(key,parsed,m.index);continue;}
  if(key==='start'||key==='end'){const parsed=timeValue(candidate.replace(/[.;]$/,''));if(parsed)put(key,parsed,m.index);continue;}
  if(key==='range'){
   const range=normalized(candidate).replace(/[–—]/g,'-').replace(/\bde\s+/,'').replace(/\s+(?:a|hasta)\s+/,' - ').replace(/[.;]$/,'').trim().split(/\s*-\s*/);
   if(range.length===2){const start=timeValue(range[0]),end=timeValue(range[1]);if(start&&end){put('start',start,m.index);put('end',end,m.index);}}
   if(!draft.start||!draft.end)warnings.push('Revisa el horario: usa inicio y término completos, por ejemplo 20:00 a 01:00.');continue;
  }
  if(key==='phone'){candidate=candidate.replace(/[_.]/g,'').trim();if(!/^\+?[\d()\s-]{7,25}$/.test(candidate))continue;}
  if(key==='client'||key==='clientAddress'){if(/(?:arrendador|manifiesta|estipulan|facebook)/i.test(candidate)||candidate.length>200)continue;}
  put(key,candidate,m.index);
 }
 // Explicit financial labels can be side by side on the final page.
 const amountLabels=[...plain.matchAll(/\b(anticipo|deposito|pagado|restan|saldo pendiente|total contratado|importe total|costo total|precio total|total)\s*(?:[:=]\s*)?\$?\s*/g)];
 for(let i=0;i<amountLabels.length;i++){
  const m=amountLabels[i],key=/restan|saldo/.test(m[1])?'contractBalance':/anticipo|deposito|pagado/.test(m[1])?'deposit':'total';
  const candidate=text.slice(m.index!+m[0].length,amountLabels[i+1]?.index??text.length).split('\n')[0];const amount=moneyValue(candidate);if(amount)put(key,amount,m.index);
 }
 const extra=plain.match(/costo adicional\s+de\s*\$([^\n]*?)\s*mxn\s+por\s+hora/);if(extra){const amount=moneyValue(text.slice(extra.index!+extra[0].indexOf('$')+1,extra.index!+extra[0].indexOf('$')+1+extra[1].length));if(amount)put('extraRate',amount,extra.index);}
 const totalClause=plain.match(/(?:pagar\s+la\s+can\s*(?:ti\s*)?dad\s+de|pagar\s+la\s+cantidad\s+de)\s*:\s*\$([^\n]*?)\s*mxn/);if(totalClause){const amount=moneyValue(totalClause[1]);if(amount)put('total',amount,totalClause.index);}
 // Preserve labelled generic imports supported before the DJ TZ template.
 for(const [key,label]of Object.entries({extraRate:'(?:hora extra(?: o fraccion)?|costo por hora extra)'})){const m=plain.match(new RegExp('(?:^|\\n)'+label+'\\s*:\\s*([^\\n]+)'));if(m){const value=moneyValue(m[1]);if(value)put(key,value,m.index);}}
 const observations=plain.match(/observaciones\s*y\/o\s*servicios\s+adicionales\s*:/);if(observations){const start=observations.index!+observations[0].length;const stop=plain.slice(start).search(/\banticipo\b|manifiestan su conformidad|\barrendador\b|\barrendatario\b/);const body=text.slice(start,stop<0?text.length:start+stop).split('\n').filter(s=>!blank(s));const safe:string[]=[],privateLines:string[]=[];for(const line of body){if(/\$|\bmxn\b|\b(?:precio|costo|importe|saldo|anticipo)\b/i.test(line))privateLines.push(line);else safe.push(line);}if(safe.length)put('extras',safe.join('\n'),start);if(privateLines.length)put('notes',privateLines.join('\n'),start);}
 const chargeLines=text.split('\n').filter(line=>/extras?\s+por\s+ubicaci[oó]n\s*=/i.test(line));if(chargeLines.length){draft.notes=[draft.notes,...chargeLines.filter(line=>!draft.notes?.includes(line))].filter(Boolean).join('\n');found.add('notes');warnings.push('El cargo extra por ubicación queda en notas de administración; confirma si ya está incluido en el total.');}
 if(draft.deposit&&draft.contractBalance&&!draft.total){put('total',String(Number(draft.deposit)+Number(draft.contractBalance)));warnings.push('El total se calculó como anticipo + saldo etiquetados; confirma que incluya los cargos adicionales.');}
 if(draft.deposit&&draft.contractBalance&&draft.total&&Math.abs(Number(draft.deposit)+Number(draft.contractBalance)-Number(draft.total))>0.01)warnings.push('Anticipo y saldo no coinciden con el total: revisa los importes antes de guardar.');
 if(/(?:^|\n)\s*\d[\d,.]*\s+\d[\d,.]*\s*(?:\n|$)/.test(text))warnings.push('Hay importes separados de sus etiquetas. No se asignan automáticamente a anticipo o saldo.');
 if(draft.date&&draft.start&&draft.end&&!draft.endDate){const day=new Date(draft.date+'T12:00:00Z');if(draft.end<=draft.start)day.setUTCDate(day.getUTCDate()+1);put('endDate',day.toISOString().slice(0,10));warnings.push('La fecha de término se dedujo del horario; confírmala, especialmente si el evento cruza medianoche.');}
 if(draft.package){const name=normalized(draft.package).replace(/^paquete\s+/,'').trim();const p=packages.find(p=>normalized(p.name)===name);if(p){put('packageId',p.id,positions.package);if(!draft.equipment)draft.equipment=p.equipment;}else warnings.push('Selecciona el paquete vigente que corresponde al servicio del contrato.');}
 if(draft.equipment){const match=matchPackage(packages,draft.packageId||'',[draft.equipment,draft.extras].filter(Boolean).join('\n'));if(match.packageId){draft.packageId=match.packageId;draft.name=match.name;draft.packageMode=match.mode;found.add('packageId');}}
 delete draft.package;
 const template=/servicio o paquete contratado/.test(plain);const groups:Record<string,string[]>={client:['client','phone','clientAddress'],service:['package','equipment'],venue:['type','address','date','start','endDate','end'],financial:['total','deposit','extraRate']};
 draft.contractSectionOrder=template?'service,venue,client,financial':Object.keys(groups).sort((a,b)=>Math.min(...groups[a].map(k=>positions[k]??Infinity))-Math.min(...groups[b].map(k=>positions[k]??Infinity))).join(',');
 const missing=['client','address','date','endDate','start','end','packageId'].filter(k=>!draft[k]);
 return {draft,found:[...found].filter(k=>k in draft),missing,warnings};
}