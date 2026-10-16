import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {getAccessUser} from './access-auth';
import {isSameOriginMutation} from './staff-policy';
import {getStaffRole} from './staff-membership';
export async function staffIdentity(){
 const user=await getAccessUser();
 const role=await getStaffRole(env.DB,user?.email);
 return {user,allowed:role!==null,role};
}
export async function requireStaff(){
 const {user,allowed,role}=await staffIdentity();
 if(!user||!allowed)redirect('/staff/access');
 return {...user!,role:role!};
}
export async function staffApiGuard(req?:Request){
 const {user,allowed,role}=await staffIdentity();
 if(!user)return Response.json({error:'Debes iniciar sesión.',code:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!allowed)return Response.json({error:'Tu cuenta no tiene acceso al staff.',code:'FORBIDDEN'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(req&&role==='viewer'&&!['GET','HEAD','OPTIONS'].includes(req.method))return Response.json({error:'Tu cuenta tiene permiso de solo lectura.',code:'READ_ONLY'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(req&&!isSameOriginMutation(req))return Response.json({error:'Origen no permitido.'},{status:403});
 return null;
}
