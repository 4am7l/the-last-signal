const ASSETS:Record<string,string>={
 moon:'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4_uint.tif',
 mars:'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megr90n000cb.img',
 label:'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megr90n000cb.lbl'
};
export async function onRequestGet({request}:{request:Request}){
 const key=new URL(request.url).searchParams.get('asset')??'',url=ASSETS[key];
 if(!url)return new Response('Unknown dataset',{status:400});
 try{const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error();const bytes=await response.arrayBuffer();if(bytes.byteLength>5000000)throw Error();
 return new Response(bytes,{headers:{'Content-Type':key==='label'?'text/plain':'application/octet-stream','Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Dataset unavailable',{status:503});}
}
