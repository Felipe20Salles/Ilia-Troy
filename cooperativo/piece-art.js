// Arte de uma peça só, para as ordens "Encaixem a peça X": recorta o tabuleiro pelas linhas de corte
// pretas da própria arte. O contorno aproximado do território só limita o recorte, para não vazar.
(function(root){
  const SRC='assets/tabuleiro-principal-final.webp',cache={};
  // Etiquetas impressas na arte (% do tabuleiro): ficam sempre dentro da peça, mesmo coladas no corte.
  const LABELS={M3:[19,19.6],M4:[31.8,19.6],M1:[48,18],M5:[67.4,19.6],M2:[78.8,18.8],P3:[15.3,37],P7:[35,37],P4:[47.7,37],B5:[65.6,37.9],B3:[79.7,37],P1:[12.2,55],P6:[22.8,54.6],C2:[39,56.5],C1:[64.3,56.5],B1:[79.3,56.6],B4:[93.6,56.5],A1:[10.6,69.8],A2:[31,72.7],P2:[48.2,72.7],P5:[65.6,74.4],B2:[89.3,71.4],N1:[10.6,93],N2:[30.5,93.5],N3:[48,93.4],N4:[70,93.5],N5:[89.5,93.3]};
  let board=null,boardReady=null;
  function loadBoard(){if(boardReady)return boardReady;boardReady=new Promise((ok,fail)=>{const im=new Image();im.onload=()=>{board=im;ok(im);};im.onerror=fail;im.src=SRC;});return boardReady;}
  function cut(zone){
    const r=root.TroyTerritory?.[zone];if(!r||!board)return null;
    const W=board.naturalWidth,H=board.naturalHeight,pts=r.polygon.split(' ').map(p=>p.split(',').map(Number)).map(([x,y])=>[x/100*W,y/100*H]);
    const pad=W*.035,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    const x0=Math.max(0,Math.floor(Math.min(...xs)-pad)),y0=Math.max(0,Math.floor(Math.min(...ys)-pad)),x1=Math.min(W,Math.ceil(Math.max(...xs)+pad)),y1=Math.min(H,Math.ceil(Math.max(...ys)+pad)),w=x1-x0,h=y1-y0;
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});
    // Área permitida: o contorno aproximado, alargado.
    g.fillStyle='#fff';g.strokeStyle='#fff';g.lineJoin='round';g.lineWidth=pad*1.4;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x-x0,y-y0):g.moveTo(x-x0,y-y0));g.closePath();g.fill();g.stroke();
    const allowed=g.getImageData(0,0,w,h).data;
    // Miolo: o contorno aproximado encolhido. O que está nele é sempre da peça (rochas escuras, etiqueta).
    g.clearRect(0,0,w,h);g.fillStyle='#fff';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x-x0,y-y0):g.moveTo(x-x0,y-y0));g.closePath();g.fill();
    g.globalCompositeOperation='destination-out';g.lineWidth=pad*1.6;g.stroke();g.globalCompositeOperation='source-over';
    const core=g.getImageData(0,0,w,h).data;
    g.clearRect(0,0,w,h);g.drawImage(board,x0,y0,w,h,0,0,w,h);const img=g.getImageData(0,0,w,h),px=img.data,N=w*h;
    const dark=new Uint8Array(N);for(let i=0;i<N;i++){const a=px[4*i],b=px[4*i+1],c=px[4*i+2],mx=Math.max(a,b,c);dark[i]=mx<60&&mx-Math.min(a,b,c)<22?1:0;}
    // Engrossa as linhas de corte para fechar pequenas falhas.
    const wall=new Uint8Array(N),R=3;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!dark[y*w+x])continue;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h)wall[yy*w+xx]=1;}}
    const ok=i=>allowed[4*i+3]>0&&!wall[i];
    // Semente: o ponto de âncora da peça, ou o ponto livre mais próximo dele.
    const ax=Math.round(r.x/100*W-x0),ay=Math.round(r.y/100*H-y0);let seed=-1;
    for(let k=0;k<80&&seed<0;k++)for(let dy=-k;dy<=k&&seed<0;dy++)for(let dx=-k;dx<=k;dx++){const x=ax+dx,y=ay+dy;if(x>=0&&y>=0&&x<w&&y<h&&ok(y*w+x)){seed=y*w+x;break;}}
    if(seed<0)return null;
    const inside=new Uint8Array(N),st=[seed];inside[seed]=1;
    while(st.length){const i=st.pop(),x=i%w;for(const j of [i-1,i+1,i-w,i+w]){if(j<0||j>=N||inside[j])continue;if((j===i-1&&x===0)||(j===i+1&&x===w-1))continue;if(!ok(j))continue;inside[j]=1;st.push(j);}}
    const lb=LABELS[zone];if(lb){const cx=lb[0]/100*W-x0,cy=lb[1]/100*H-y0,hw=W*.021,hh=H*.016;for(let yy=Math.max(0,Math.floor(cy-hh));yy<Math.min(h,cy+hh);yy++)for(let xx=Math.max(0,Math.floor(cx-hw));xx<Math.min(w,cx+hw);xx++)inside[yy*w+xx]=1;}
    // Rochas escuras e a etiqueta da peça ficam dentro dela: preenche tudo o que não toca a borda do recorte.
    const outside=new Uint8Array(N),os=[];for(let x=0;x<w;x++){os.push(x,(h-1)*w+x);}for(let y=0;y<h;y++){os.push(y*w,y*w+w-1);}
    for(const i of os){if(!inside[i]&&!outside[i]){outside[i]=1;}}const q=os.filter(i=>outside[i]);
    while(q.length){const i=q.pop(),x=i%w;for(const j of [i-1,i+1,i-w,i+w]){if(j<0||j>=N||outside[j]||inside[j]||core[4*j+3]>0)continue;if((j===i-1&&x===0)||(j===i+1&&x===w-1))continue;outside[j]=1;q.push(j);}}
    for(let i=0;i<N;i++)if(!outside[i])inside[i]=1;
    // Devolve a borda: alarga a peça até cobrir a linha de corte que a contorna.
    const keep=new Uint8Array(N),B=R+3;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!inside[y*w+x])continue;for(let dy=-B;dy<=B;dy++)for(let dx=-B;dx<=B;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&dx*dx+dy*dy<=B*B)keep[yy*w+xx]=1;}}
    let minX=w,minY=h,maxX=0,maxY=0;for(let i=0;i<N;i++){if(!keep[i]){px[4*i+3]=0;continue;}const x=i%w,y=(i/w)|0;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
    g.putImageData(img,0,0);
    const out=document.createElement('canvas');out.width=maxX-minX+1;out.height=maxY-minY+1;out.getContext('2d').drawImage(cv,minX,minY,out.width,out.height,0,0,out.width,out.height);
    return out.toDataURL('image/webp',.9);
  }
  // Marca a imagem; o recorte é feito uma vez por peça e preenchido assim que o tabuleiro carrega.
  function pieceArt(zone){return `<img class="piece-art" data-piece="${zone}" alt="Peça ${zone}" ${cache[zone]?`src="${cache[zone]}"`:''}>`;}
  function hydrate(scope=document){
    const imgs=[...scope.querySelectorAll('img.piece-art:not([src])')];if(!imgs.length)return;
    loadBoard().then(()=>{for(const im of imgs){const z=im.dataset.piece;if(!(z in cache))cache[z]=cut(z)||'';if(cache[z])im.src=cache[z];}}).catch(()=>{});
  }
  root.TroyPieceArt={pieceArt,hydrate};
})(typeof globalThis!=='undefined'?globalThis:this);
