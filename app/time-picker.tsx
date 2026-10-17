'use client';
export default function TimePicker({label,value,onChange,required=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean}){
 const valid=/^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');
 const hour=valid?Number(value.slice(0,2)):18,minute=valid?value.slice(3):'00';
 const period=hour>=12?'PM':'AM';
 function update(h:string,m:string,p:string){onChange(`${String(Number(h)%12+(p==='PM'?12:0)).padStart(2,'0')}:${m}`);}
 return <fieldset className="time-picker"><legend>{label}</legend><div>
 <select aria-label={`${label}: hora`} required={required} value={valid?String(hour%12||12):''} onChange={e=>update(e.target.value,minute,period)}><option value="" disabled>Hora</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
 <span>:</span><select aria-label={`${label}: minutos`} required={required} value={valid?minute:''} onChange={e=>update(String(hour%12||12),e.target.value,period)}><option value="" disabled>Min.</option>{Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=><option key={m}>{m}</option>)}</select>
 <select aria-label={`${label}: AM/PM`} value={period} onChange={e=>{if(valid)update(String(hour%12||12),minute,e.target.value);else update('6','00',e.target.value);}}><option>AM</option><option>PM</option></select>
 </div></fieldset>;
}
