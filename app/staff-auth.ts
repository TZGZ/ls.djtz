import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {getAccessUser} from './access-auth';
import {isStaffEmail,isSameOriginMutation} from './staff-policy';
export async function staffIdentity(){
 const user=await getAccessUser();
 const allowed=isStaffEmail(user?.email,(env as unknown as {STAFF_ALLOWED_EMAILS?:string}).STAFF_ALLOWED_EMAILS);
 return {user,allowed};
}
export async function requireStaff(){
 const {user,allowed}=await staffIdentity();
 if(!user||!allowed)redirect('/staff/access');
 return user!;
}
export async function staffApiGuard(req?:Request){
 const {user,allowed}=await staffIdentity();
 if(!user)return Response.json({error:'Debes iniciar sesión.',code:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!allowed)return Response.json({error:'Tu cuenta no tiene acceso al staff.',code:'FORBIDDEN'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(req&&!isSameOriginMutation(req))return Response.json({error:'Origen no permitido.'},{status:403});
 return null;
}
