export function radialGroundSampler(positions:ArrayLike<number>,radii:number[],sectors:number,unit:number,fallback:(x:number,z:number)=>number){
 const columns=sectors+1;
 return (x:number,z:number)=>{
  const px=x*unit,pz=z*unit,distance=Math.hypot(px,pz);
  if(distance>radii[radii.length-1])return fallback(x,z);
  let low=0,high=radii.length-1;
  while(high-low>1){const mid=(low+high)>>1;if(radii[mid]>distance)high=mid;else low=mid;}
  const angle=(Math.atan2(pz,px)+Math.PI*2)%(Math.PI*2);
  const sector=Math.floor(angle/(Math.PI*2)*sectors);
  for(const rowOffset of [0,-1,1,-2,2]){
   const row=low+rowOffset;if(row<0||row>=radii.length-1)continue;
   for(const offset of [0,-1,1]){
    const column=(sector+offset+sectors)%sectors,k=row*columns+column;
    for(const [ia,ib,ic] of [[k,k+1,k+columns],[k+1,k+columns+1,k+columns]]){
     const a=ia*3,b=ib*3,c=ic*3;
     const ax=positions[a],az=positions[a+2],bx=positions[b],bz=positions[b+2],cx=positions[c],cz=positions[c+2];
     const determinant=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
     if(Math.abs(determinant)<1.e-30)continue;
     const wa=((bz-cz)*(px-cx)+(cx-bx)*(pz-cz))/determinant;
     const wb=((cz-az)*(px-cx)+(ax-cx)*(pz-cz))/determinant,wc=1-wa-wb;
     if(wa>=-1.e-6&&wb>=-1.e-6&&wc>=-1.e-6)return wa*positions[a+1]+wb*positions[b+1]+wc*positions[c+1];
    }
   }
  }
  return fallback(x,z);
 };
}
