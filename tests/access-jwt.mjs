import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
const source=ts.transpileModule(fs.readFileSync('app/access-token.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const tmp=new URL('../.access-test.mjs',import.meta.url);
fs.writeFileSync(tmp,source);
try{
 const {verifyAccessToken}=await import(tmp.href);
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const jwk=await exportJWK(publicKey);jwk.kid='test';
 const key=createLocalJWKSet({keys:[jwk]});
 const team='dj-test.cloudflareaccess.com',aud='test-audience';
 async function sign(overrides={}){
  return new SignJWT({email:'staff@example.com',...overrides}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('staff-id').setIssuedAt().setExpirationTime('1h').setIssuer(`https://${team}`).setAudience(aud).sign(privateKey);
 }
 const token=await sign();
 assert.equal((await verifyAccessToken(token,team,aud,key)).email,'staff@example.com');
 assert.equal(await verifyAccessToken(token,team,'other-aud',key),null);
 assert.equal(await verifyAccessToken(token,'other.cloudflareaccess.com',aud,key),null);
 assert.equal(await verifyAccessToken(token,undefined,aud,key),null);
 assert.equal(await verifyAccessToken('forged',team,aud,key),null);
 assert.equal(await verifyAccessToken(null,team,aud,key),null);
 const expired=await new SignJWT({email:'staff@example.com'}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('staff-id').setIssuedAt().setExpirationTime(Math.floor(Date.now()/1000)-60).setIssuer(`https://${team}`).setAudience(aud).sign(privateKey);
 assert.equal(await verifyAccessToken(expired,team,aud,key),null);
 const parts=token.split('.');parts[1]=Buffer.from(JSON.stringify({email:'attacker@example.com'})).toString('base64url');
 assert.equal(await verifyAccessToken(parts.join('.'),team,aud,key),null);
 assert.equal(await verifyAccessToken(await sign({email:null}),team,aud,key),null);
 console.log('PASS: signed Access JWT, invalid signature, expired token, issuer, audience, missing configuration and missing identity.');
}finally{fs.unlinkSync(tmp);}
