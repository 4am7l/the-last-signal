// Bundled HYG v4.1 bright-star subset, David Nash, CC BY-SA 4.0.
// https://github.com/astronexus/HYG-Database
// Real J2000 coordinates, sorted by magnitude; no random invented sources.
self.onmessage=async()=>{
 try{
  const response=await fetch('/stars-hyg-bright.json');
  if(!response.ok)throw Error('Bright-star catalogue unavailable');
  const data=await response.json();
  const records=data.stars as number[][];
  if(!Array.isArray(records)||records.length<1000)throw Error('Incomplete bright-star catalogue');
  const count=Math.min(6000,records.length);
  const position=new Float32Array(count*3),magnitude=new Float32Array(count),temperature=new Float32Array(count);
  const eps=23.43928*Math.PI/180;
  for(let i=0;i<count;i++){
   const [ra,dec,mag,ci]=records[i];
   if(![ra,dec,mag,ci].every(Number.isFinite))throw Error('Invalid star record');
   const x=Math.cos(dec)*Math.cos(ra),y=Math.cos(dec)*Math.sin(ra),z=Math.sin(dec);
   const ye=y*Math.cos(eps)+z*Math.sin(eps),ze=-y*Math.sin(eps)+z*Math.cos(eps);
   position.set([x,ze,-ye],i*3);magnitude[i]=mag;
   const bv=Math.max(-.4,Math.min(2,ci));temperature[i]=4600*(1/(.92*bv+1.7)+1/(.92*bv+.62));
  }
  self.postMessage({position,magnitude,temperature,count},{transfer:[position.buffer,magnitude.buffer,temperature.buffer]});
 }catch(error){self.postMessage({error:error instanceof Error?error.message:'Catalogue unavailable'});}
};
export {};
