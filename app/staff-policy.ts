// Authorization is separate from authentication; deny access if no allowlist exists.
export function isStaffEmail(email:string|undefined,allowlist:string|undefined){
 if(!email||!allowlist)return false;
 const allowed=allowlist.split(/[\n,;]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
 return allowed.includes(email.trim().toLowerCase());
}
export function isSameOriginMutation(req:Request){
 const origin=req.headers.get('origin');
 if(origin!==new URL(req.url).origin)return false;
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return false;
 return req.headers.get('sec-fetch-site')!=='cross-site';
}
