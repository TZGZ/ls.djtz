import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export async function readContractFile(file:File,progress:(message:string)=>void){
 if(file.size>15*1024*1024)throw Error('El archivo debe pesar como máximo 15 MB.');
 if(/\.txt$/i.test(file.name))return (await file.text()).slice(0,100000);
 const isPdf=/\.pdf$/i.test(file.name);const isImage=/\.(png|jpe?g|webp)$/i.test(file.name);
 if(!isPdf&&!isImage)throw Error('Selecciona un PDF, una imagen JPG/PNG/WebP o un archivo de texto.');
 let ocr:Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>|undefined;
 async function recognize(image:File|HTMLCanvasElement){
  if(!ocr){progress('Preparando reconocimiento de texto…');const {createWorker}=await import('tesseract.js');ocr=await createWorker('spa',1,{logger:m=>{if(m.status==='recognizing text')progress(`Reconociendo texto: ${Math.round(m.progress*100)}%`);}});}
  return (await ocr.recognize(image)).data.text;
 }
 try{
  if(isImage)return await recognize(file);
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  let document;
  try{document=await task.promise;if(document.numPages>8)throw Error('Selecciona un contrato de hasta 8 páginas.');
   const pages:string[]=[];
   for(let n=1;n<=document.numPages;n++){
    progress(`Leyendo página ${n} de ${document.numPages}…`);const page=await document.getPage(n);const content=await page.getTextContent();
    let text='';let lastY:number|undefined;
    for(const item of content.items){if(!('str' in item))continue;const y=item.transform[5];if(lastY!==undefined&&Math.abs(y-lastY)>4)text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}
    if(text.replace(/\s/g,'').length<35){const view=page.getViewport({scale:1.8});if(view.width*view.height>16000000)throw Error('La página es demasiado grande para reconocerla.');const canvas=window.document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);try{await page.render({canvas,viewport:view}).promise;text=await recognize(canvas);}finally{canvas.width=canvas.height=0;}}
    pages.push(text);page.cleanup();
   }
   return pages.join('\n\n').slice(0,100000);
  }finally{await task.destroy();}
 }finally{await ocr?.terminate();}
}
