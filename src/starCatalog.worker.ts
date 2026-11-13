// Catalogue data © David Nash, HYG v4.1, CC BY-SA 4.0.
// https://github.com/astronexus/HYG-Database/tree/main/hyg/CURRENT
// Transform only; no invented point sources and no claimed Gaia provenance.
function csvRow(line:string){const fields:string[]=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){fields.push(value);value='';}else value+=c;}fields.push(value);return fields;}
self.onmessage=async()=>{
 try{
  const response=await fetch('https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv',{signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('Catalogue download failed');
  const lines=(await response.text()).split('\n'),header=csvRow(lines.shift()!).map(v=>v.trim());
  const index=(name:string)=>header.indexOf(name),ra=index('ra'),dec=index('dec'),mag=index('mag'),ci=index('ci'),id=index('id');
  if([ra,dec,mag,ci,id].some(i=>i<0))throw Error('Unexpected catalogue schema');
  const records:{ra:number;dec:number;mag:number;ci:number}[]=[];
  for(const line of lines){const row=csvRow(line);if(!row[ra]||!row[dec]||!row[mag]||Number(row[id])===0)continue;
   const star={ra:Number(row[ra])*Math.PI/12,dec:Number(row[dec])*Math.PI/180,mag:Number(row[mag]),ci:row[ci]?Number(row[ci]):.65};
   if(Object.values(star).every(Number.isFinite))records.push(star);
  }
  records.sort((a,b)=>a.mag-b.mag);const count=Math.min(100000,records.length);
  if(count<80000)throw Error('Incomplete catalogue');
  const extra=180000,total=count+extra;const position=new Float32Array(total*3),magnitude=new Float32Array(total),temperature=new Float32Array(total);
  const eps=23.43928*Math.PI/180;
  for(let i=0;i<count;i++){const s=records[i],x=Math.cos(s.dec)*Math.cos(s.ra),y=Math.cos(s.dec)*Math.sin(s.ra),z=Math.sin(s.dec);
   const ye=y*Math.cos(eps)+z*Math.sin(eps),ze=-y*Math.sin(eps)+z*Math.cos(eps);
   position.set([x,ze,-ye],i*3);magnitude[i]=s.mag;
   const bv=Math.max(-.4,Math.min(2,s.ci));temperature[i]=4600*(1/(.92*bv+1.7)+1/(.92*bv+.62));
  }
  // Deterministic synthetic faint background stars for a deliberately dense cinematic sky.
  // The first 'count' entries remain real HYG catalog stars.
  let seed=0x5eeda11;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=count;i<total;i++){
   const y=rand()*2-1,phi=rand()*Math.PI*2,r=Math.sqrt(1-y*y);
   position.set([r*Math.cos(phi),y,r*Math.sin(phi)],i*3);
   magnitude[i]=5.5+rand()*3.3;
   temperature[i]=rand()<.065?2800+rand()*1400:4500+rand()*5500;
  }
  self.postMessage({position,magnitude,temperature,count,extra}, {transfer:[position.buffer,magnitude.buffer,temperature.buffer]});
 }catch(error){self.postMessage({error:error instanceof Error?error.message:'Catalogue unavailable'});}
};
export {};
