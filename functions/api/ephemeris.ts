// Cloudflare Pages Function. Fixed upstream, bounded dates, no user-provided URLs.
export async function onRequestGet({request}:{request:Request}):Promise<Response>{
 const date=new URL(request.url).searchParams.get('date')??'';
 const epoch=Date.parse(date+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date||date<'1800-01-01'||date>'2050-12-31')
  return Response.json({error:'Expected date YYYY-MM-DD, 1800–2050'},{status:400});
 try{
  const positions:Record<string,number[]>={};
  // JPL requests are deliberately serial; respect SSD API fair-use policy.
  for(const [body,id] of [['earth','399'],['moon','301'],['mars','499']]){
   const query=new URLSearchParams({format:'json',COMMAND:"'"+id+"'",OBJ_DATA:"'NO'",MAKE_EPHEM:"'YES'",EPHEM_TYPE:"'VECTORS'",CENTER:"'500@10'",TLIST:"'"+(epoch/86400000+2440587.5)+"'",TLIST_TYPE:"'JD'",TIME_TYPE:"'UT'",REF_PLANE:"'ECLIPTIC'",REF_SYSTEM:"'ICRF'",OUT_UNITS:"'KM-S'",VEC_TABLE:"'1'",CSV_FORMAT:"'YES'",VEC_CORR:"'NONE'"});
   const response=await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?'+query,{signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error('Horizons unavailable');
   const json=await response.json() as {result?:string;error?:string};
   const line=json.result?.split('$$SOE')[1]?.split('$$EOE')[0]?.trim().split('\n')[0];
   const fields=line?.split(',').map(s=>s.trim());
   const v=fields?.slice(2,5).map(Number);
   if(json.error||!v||v.length!==3||!v.every(Number.isFinite)||Math.hypot(...v)<1e8)throw new Error('Invalid Horizons response');
   positions[body]=[v[0],v[2],-v[1]];
  }
  return Response.json({epoch,source:'JPL Horizons',...positions},{headers:{'Cache-Control':'public, max-age=86400'}});
 }catch{return Response.json({error:'Horizons unavailable; use labelled approximation'},{status:503});}
}
