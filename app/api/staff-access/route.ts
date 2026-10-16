import {env} from 'cloudflare:workers';
import {getAccessUser} from '../../access-auth';
import {isSameOriginMutation} from '../../staff-policy';
import {ADMIN_EMAIL,isStaffAdmin,normalizeEmail,validMemberEmail} from '../../staff-membership';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function guard(req?:Request){
 const user=await getAccessUser();
 if(!user)return Response.json({error:'Debes iniciar sesión.'},{status:401,headers});
 if(!isStaffAdmin(user.email))return Response.json({error:'Solo la cuenta administradora puede gestionar accesos.'},{status:403,headers});
 if(req&&!isSameOriginMutation(req))return Response.json({error:'Origen no permitido.'},{status:403,headers});
 return null;
}
export async function GET(){
 const denied=await guard();if(denied)return denied;
 const result=await env.DB.prepare('SELECT email, granted_by, granted_at FROM staff_access ORDER BY email').all();
 return Response.json({admin:ADMIN_EMAIL,members:result.results},{headers});
}
export async function POST(req:Request){
 const denied=await guard(req);if(denied)return denied;
 if(Number(req.headers.get('content-length'))>2048)return Response.json({error:'Solicitud demasiado grande.'},{status:413,headers});
 let body: {email?:unknown;action?:unknown};
 try {
  const reader=req.body?.getReader();if(!reader)throw Error();
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw Error();}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  body=JSON.parse(new TextDecoder().decode(bytes));if(!body||typeof body!=='object')throw Error();
 }
 catch{return Response.json({error:'Solicitud inválida.'},{status:400,headers});}
 if(!validMemberEmail(body.email)||!['grant','revoke'].includes(String(body.action)))return Response.json({error:'Revisa el correo y la acción.'},{status:400,headers});
 const email=normalizeEmail(body.email);
 if(isStaffAdmin(email))return Response.json({error:'La cuenta administradora está protegida y conserva su acceso.'},{status:400,headers});
 if(body.action==='grant')await env.DB.prepare('INSERT INTO staff_access (email,granted_by) VALUES (?,?) ON CONFLICT(email) DO NOTHING').bind(email,ADMIN_EMAIL).run();
 else await env.DB.prepare('DELETE FROM staff_access WHERE email = ?').bind(email).run();
 return Response.json({ok:true},{headers});
}
