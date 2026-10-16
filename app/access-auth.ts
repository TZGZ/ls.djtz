import {headers} from 'next/headers';
import {env} from 'cloudflare:workers';
import {verifyAccessToken} from './access-token';
export async function getAccessUser(){
 const h=await headers();
 const cookie=h.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
 return verifyAccessToken(h.get('Cf-Access-Jwt-Assertion')??cookie,env.ACCESS_TEAM_DOMAIN,env.ACCESS_AUD);
}
export function accessSignInPath(_returnTo='/staff'){return '/staff';}
export function accessSignOutPath(_returnTo='/'){return '/cdn-cgi/access/logout';}
