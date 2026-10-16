import {createRemoteJWKSet,jwtVerify, type JWTVerifyGetKey} from 'jose';
const keys=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export type AccessUser={userId:string;email:string;displayName:string};
export async function verifyAccessToken(token:string|undefined|null,team:string|undefined,aud:string|undefined,key?:JWTVerifyGetKey):Promise<AccessUser|null>{
 if(!token||!team||!aud||aud.includes('REEMPLAZAR')||!/^([a-z0-9-]+)\.cloudflareaccess\.com$/.test(team)||team.startsWith('REEMPLAZAR'))return null;
 try{
  const issuer=`https://${team}`;
  if(!key&&!keys.has(issuer))keys.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
  const {payload}=await jwtVerify(token,key??keys.get(issuer)!,{issuer,audience:aud,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email'],clockTolerance:5});
  if(typeof payload.email!=='string'||!payload.email.includes('@')||typeof payload.sub!=='string')return null;
  return {userId:payload.sub,email:payload.email,displayName:typeof payload.name==='string'?payload.name:payload.email};
 }catch{return null;}
}
