export async function readJson(req:Request,limit=45000):Promise<unknown>{
 if(Number(req.headers.get('content-length'))>limit)throw Error('Solicitud demasiado grande.');
 const reader=req.body?.getReader();if(!reader)throw Error('Solicitud vacía.');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Solicitud demasiado grande.');}chunks.push(value);}
 const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(data));
}
