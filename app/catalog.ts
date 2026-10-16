export type CatalogPackage={id:string;kind:string;name:string;total:number|string;extraRate:number|string;equipment:string;capacity:number|string;hours:number|string;tag:string;image:string;order:number;[key:string]:any};
const common=['5 horas de servicio','DJ profesional','Luces de iluminación LED'];
const dj='1 cabina para DJ';
const pro=['Luces de iluminación LED','4 cabezas robóticas de iluminación','2 bocinas de 15 pulgadas','2 bajos de 18 pulgadas','2 elevadores para bocina','2 micrófonos inalámbricos',dj];
function pack(id:string,name:string,capacity:number|string,items:string[],order:number,opts:Partial<CatalogPackage>={}):CatalogPackage{return {id:'catalogo-'+id,kind:'package',name,capacity,hours:5,total:'',extraRate:'',equipment:items.join('\n'),order,tag:'',image:'',...opts}}
export const catalog:CatalogPackage[]=[
pack('basico','Básico',50,[...common,'2 bocinas de 15 pulgadas','2 tripiés para bocina',dj],1),
pack('bass-plus','Bass Plus',100,[...common,'1 bocina de 15 pulgadas','1 bajo de 18 pulgadas','1 elevador para bocina',dj],2),
pack('intermedio','Intermedio',150,[...common,'2 bocinas de 15 pulgadas','1 bajo de 18 pulgadas','1 elevador para bocina','1 tripié para bocina',dj],3),
pack('bodas-xv',"Bodas y XV’s",250,['5 horas de servicio','DJ profesional',...pro,'1 máquina de humo'],4,{tag:'Más vendido',image:'/catalogo/bodas.jpg'}),
pack('completo-tv','Completo y TV',250,['5 horas de servicio','DJ profesional',...pro,'1 pantalla de 50 pulgadas o pantalla de proyección'],5),
pack('profesional-1','Profesional 1',300,['5 horas de servicio','DJ profesional',...pro,'3 columnas perimetrales','1 pantalla de 50 pulgadas','1 máquina de humo'],6,{tag:'Nuevo'}),
pack('profesional-2','Profesional 2',300,['5 horas de servicio','DJ profesional',...pro,'4 columnas perimetrales','4 pantallas de 50 pulgadas','1 máquina de humo','1 kit de animación','Pista de madera con cristal de 6 × 6 metros','2 arlequines animadores (presentación de 50 minutos)','1 pirotecnia para vals'],7,{total:'',tag:'Nuevo',image:'/catalogo/profesional.jpg'}),
pack('personalizado','Personalizado','',['Servicio y equipo a tu gusto, necesidad y presupuesto','Solicita una cotización por WhatsApp'],8,{hours:''})
];
export const complements=['Más iluminación LED, láser o luces robóticas','Pantalla de 50 pulgadas','Máquina de humo','Pantalla de proyección','Artículos de fiesta (dos artículos, sujetos a disponibilidad)'];
export const priceLabel=(p:{total?:any})=>p.total===''||p.total==null?'Solicitar cotización':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(p.total));
