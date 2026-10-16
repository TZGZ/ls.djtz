export type ServicePackage={id:string;name:string;equipment:string;[key:string]:unknown};
export const equipmentLines=(text:string)=>text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const key=(line:string)=>line.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,;:]/g,'').replace(/\s+/g,' ').trim();
function counts(text:string){const result=new Map<string,number>();for(const line of equipmentLines(text)){const k=key(line);result.set(k,(result.get(k)||0)+1);}return result;}
export function matchPackage(packages:ServicePackage[],baseId:string,equipment:string){
 const selected=counts(equipment);let best=packages.find(p=>p.id===baseId);let score=0;
 for(const p of packages){if(!p.equipment||/^(paquete\s+)?personalizado$/i.test(p.name.trim()))continue;
  const reference=counts(p.equipment);const keys=new Set([...selected.keys(),...reference.keys()]);let intersection=0,union=0;
  for(const k of keys){intersection+=Math.min(selected.get(k)||0,reference.get(k)||0);union+=Math.max(selected.get(k)||0,reference.get(k)||0);}
  const similarity=union?intersection/union:0;
  if(similarity===1)return {packageId:p.id,name:p.name,mode:'fixed' as const,similarity};
  if(similarity>score){score=similarity;best=p;}
 }
 return {packageId:best?.id||baseId,name:(best?.name||'Paquete')+' personalizado',mode:'custom' as const,similarity:score};
}
