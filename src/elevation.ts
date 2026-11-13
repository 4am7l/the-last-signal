export type ElevationGrid={width:number;height:number;metres:Float32Array;longitudeOrigin:number;source:string};
export function decodeLola(buffer:ArrayBuffer):ElevationGrid{
 const view=new DataView(buffer),little=view.getUint16(0,false)===0x4949;
 if(view.getUint16(0,false)!==0x4949&&view.getUint16(0,false)!==0x4d4d)throw Error('Not TIFF');
 if(view.getUint16(2,little)!==42)throw Error('Unsupported TIFF');
 const offset=view.getUint32(4,little),count=view.getUint16(offset,little),tags=new Map<number,number[]>();
 for(let i=0;i<count;i++){const p=offset+2+i*12,tag=view.getUint16(p,little),type=view.getUint16(p+2,little),n=view.getUint32(p+4,little);
  if(type!==3&&type!==4)continue;const size=type===3?2:4,base=n*size<=4?p+8:view.getUint32(p+8,little),values:number[]=[];
  if(n>100000||base+n*size>buffer.byteLength)throw Error('Invalid TIFF bounds');
  for(let j=0;j<n;j++)values.push(size===2?view.getUint16(base+j*size,little):view.getUint32(base+j*size,little));tags.set(tag,values);
 }
 const get=(tag:number,fallback:number)=>tags.get(tag)?.[0]??fallback;
 const width=get(256,0),height=get(257,0);
 if(width!==1440||height!==720||get(258,0)!==16||get(259,1)!==1||get(277,1)!==1||get(339,1)!==1||get(274,1)!==1)throw Error('Unexpected LOLA format');
 const offsets=tags.get(273),counts=tags.get(279);if(!offsets||!counts||offsets.length!==counts.length)throw Error('Missing strips');
 const metres=new Float32Array(width*height);let k=0;
 for(let i=0;i<offsets.length;i++){if(offsets[i]+counts[i]>buffer.byteLength)throw Error('Invalid strip');for(let b=0;b<counts[i];b+=2){if(k>=metres.length)throw Error('Excess samples');metres[k++]=view.getUint16(offsets[i]+b,little)*.5-10000;}}
 if(k!==metres.length)throw Error('Incomplete DEM');
 return {width,height,metres,longitudeOrigin:-180,source:'NASA LOLA · 4 px/degree'};
}
export function decodeMola(buffer:ArrayBuffer,label:string):ElevationGrid{
 const field=(key:string)=>label.match(new RegExp('(?:^|\\n)\\s*'+key+'\\s*=\\s*([^\\r\\n]+)'))?.[1]?.trim();
 const width=Number(field('LINE_SAMPLES')),height=Number(field('LINES')),bits=Number(field('SAMPLE_BITS'));
 const sample=field('SAMPLE_TYPE'),offset=Number(field('OFFSET')?.split(/\s/)[0]),scale=Number(field('SCALING_FACTOR')?.split(/\s/)[0]);
 if(width!==1440||height!==720||bits!==16||sample!=='MSB_INTEGER'||!Number.isFinite(offset)||!Number.isFinite(scale)||buffer.byteLength!==width*height*2)throw Error('Unsupported MOLA label');
 const data=new DataView(buffer),metres=new Float32Array(width*height);
 // MEGR is planetary radius, in metres, not areoid-relative topography.
 for(let i=0;i<metres.length;i++){const radius=data.getInt16(i*2,false)*scale+offset;if(radius<3300000||radius>3450000)throw Error('Invalid MOLA radius');metres[i]=radius-3389500;}
 return {width,height,metres,longitudeOrigin:0,source:'NASA MGS/MOLA MEGR · 4 px/degree'};
}
export function elevationAt(grid:ElevationGrid,latitude:number,longitude:number){
 const x=(((longitude-grid.longitudeOrigin)%360+360)%360)/360*grid.width-.5;
 const y=Math.max(0,Math.min(grid.height-1,(90-latitude)/180*grid.height-.5));
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const at=(a:number,b:number)=>grid.metres[Math.min(grid.height-1,b)*grid.width+(a%grid.width+grid.width)%grid.width];
 const top=at(ix,iy)*(1-fx)+at(ix+1,iy)*fx,bottom=at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx;
 return top*(1-fy)+bottom*fy;
}
