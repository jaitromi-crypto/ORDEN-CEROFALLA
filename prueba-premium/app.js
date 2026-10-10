const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB='CF_OT_PREVIEW_V1', COUNTER='CF_OT_PREVIEW_COUNTER_V1'; let data=null, timer=null;
const IDB_NAME='CF_OT_PREVIEW_DB_V1',IDB_STORE='orders';
const SUPABASE_URL='https://hypzysgjpsgmzkztytsq.supabase.co';
const SUPABASE_KEY='sb_publishable_8Ql_sMjbEAuYwbyoBQzZIA_LS7fJOq7';
async function cloudRequest(path,options={}){const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',...(options.headers||{})};const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...options,headers});if(!r.ok)throw new Error('Supabase '+r.status+': '+await r.text());if(r.status===204)return null;const t=await r.text();return t?JSON.parse(t):null}
async function cloudPut(order){return null}
async function cloudGet(ot){return null}
async function cloudList(){return []}
async function cloudDelete(ot){return null}
async function syncLocalToCloud(){return;let db={};try{db=JSON.parse(localStorage.getItem(DB)||'{}')}catch(e){}for(const x of Object.values(db)){try{const full=await idbGet(x.ot)||x;await cloudPut(full)}catch(e){console.warn('Sincronización pendiente',x.ot,e)}}}
function idbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(IDB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE,{keyPath:'ot'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function idbPut(order){const db=await idbOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(JSON.parse(JSON.stringify(order)));tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function idbGet(ot){const db=await idbOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readonly'),r=tx.objectStore(IDB_STORE).get(ot);r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>{db.close();reject(r.error)}})}
async function idbDelete(ot){const db=await idbOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).delete(ot);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
function liteOrder(order){const x=JSON.parse(JSON.stringify(order));x.photos=[];(x.hallazgos||[]).forEach(h=>h.photos=[]);if(x.aceptacion)x.aceptacion.firma='';return x}
async function migrateLegacy(){let db={};try{db=JSON.parse(localStorage.getItem(DB)||'{}')}catch(e){}for(const x of Object.values(db)){try{const old=await idbGet(x.ot);if(!old)await idbPut(x)}catch(e){console.error('Migración OT',x.ot,e)}}}
const ids=['cliente','rut','telefono','email','marca','modelo','ano','patente','vin','km','bencina','solicitados','conclusiones','obs','estado'];
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()};
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CL');
function nextNumber(){let n=Number(localStorage.getItem(COUNTER)||0)+1;localStorage.setItem(COUNTER,n);return 'OT-'+String(n).padStart(6,'0')}
function fresh(){return{ot:nextNumber(),fecha:today(),estado:'Recepcionado',photos:[],hallazgos:[],items:[],cliente:'',rut:'',telefono:'',email:'',marca:'',modelo:'',ano:'',patente:'',vin:'',km:'',bencina:'1/2',solicitados:'',conclusiones:'',obs:'',aceptacion:{nombre:'',rut:'',aceptado:false,fechaHora:'',firma:''}}}
function collect(){ids.forEach(id=>data[id]=$('#'+id).value)}
function schedule(){clearTimeout(timer);timer=setTimeout(save,350)}
async function save(){if(!data)return false;collect();try{await idbPut(data);const db=JSON.parse(localStorage.getItem(DB)||'{}'),lite=liteOrder(data);db[data.ot]=lite;localStorage.setItem(DB,JSON.stringify(db));localStorage.setItem('CF_OT_PREVIEW_ACTIVE',data.ot);$('#otBadge').textContent=data.ot;try{await cloudPut(data)}catch(e){console.warn('Guardado local OK; nube pendiente',e)}return true}catch(e){console.error(e);alert('No se pudo guardar la OT en el historial del dispositivo. Los datos siguen abiertos en pantalla.');return false}}
function fill(){ $('#ot').value=data.ot;$('#fecha').value=data.fecha;ids.forEach(id=>$('#'+id).value=data[id]??'');data.aceptacion=data.aceptacion||{nombre:'',rut:'',aceptado:false,fechaHora:'',firma:''};$('#aceptaNombre').value=data.aceptacion.nombre||data.cliente||'';$('#aceptaRut').value=data.aceptacion.rut||data.rut||'';$('#aceptaCheck').checked=!!data.aceptacion.aceptado;updateAcceptStamp();renderPhotos();renderHallazgos();renderItems();$('#otBadge').textContent=data.ot;setTimeout(drawSavedSignature,0)}
async function newOT(){if(data)await save();data=fresh();fill();await save()}
ids.forEach(id=>$('#'+id).addEventListener('input',schedule));
function compress(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let w=im.width,h=im.height,m=1100;if(Math.max(w,h)>m){let q=m/Math.max(w,h);w*=q;h*=q}let c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);res(c.toDataURL('image/jpeg',.68))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function addPhotos(files){for(const f of files){try{data.photos.push(await compress(f))}catch(e){alert('No se pudo cargar '+f.name)}}renderPhotos();save()}
$('#camera').onchange=e=>addPhotos(e.target.files);$('#gallery').onchange=e=>addPhotos(e.target.files);
function renderPhotos(){$('#photos').innerHTML='';data.photos.forEach((src,i)=>{let d=document.createElement('div');d.className='photo';d.innerHTML=`<img src="${src}"><button>✕</button>`;d.querySelector('button').onclick=()=>{data.photos.splice(i,1);renderPhotos();save()};$('#photos').append(d)});$('#photoCount').textContent=data.photos.length+' foto'+(data.photos.length===1?'':'s')+(data.photos.length<6?' · faltan '+(6-data.photos.length)+' para 6':' · ✓ registro mínimo completo')}
function addHallazgo(){data.hallazgos.push({texto:'',informado:false,autorizacion:'Pendiente',photos:[]});renderHallazgos();save()}
async function addHallazgoPhotos(i,files){let h=data.hallazgos[i];h.photos=h.photos||[];for(const f of files){try{h.photos.push(await compress(f))}catch(e){alert('No se pudo cargar '+f.name)}}renderHallazgos();save()}
function renderHallazgos(){$('#hallazgos').innerHTML='';data.hallazgos.forEach((h,i)=>{h.photos=h.photos||[];let d=document.createElement('div');d.className='hallazgo';d.innerHTML=`<textarea rows="3" placeholder="Detalle del hallazgo...">${h.texto||''}</textarea><div class="checks"><label><input type="checkbox" ${h.informado?'checked':''}> Informado al cliente</label><label>Autorización <select><option>Pendiente</option><option>Autorizado</option><option>No autorizado</option></select></label></div><div class="photoBtns"><label class="btn mini">📷 Evidencia<input class="hcam" type="file" accept="image/*" capture="environment" hidden></label><label class="btn secondary mini">🖼️ Galería<input class="hgal" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple hidden></label></div><div class="photos hphotos"></div><button class="delHall">Eliminar hallazgo</button>`;let ta=d.querySelector('textarea'),ch=d.querySelector('.checks input'),sel=d.querySelector('select');sel.value=h.autorizacion;ta.oninput=()=>{h.texto=ta.value;schedule()};ch.onchange=()=>{h.informado=ch.checked;save()};sel.onchange=()=>{h.autorizacion=sel.value;save()};d.querySelector('.hcam').onchange=e=>addHallazgoPhotos(i,e.target.files);d.querySelector('.hgal').onchange=e=>addHallazgoPhotos(i,e.target.files);let ph=d.querySelector('.hphotos');h.photos.forEach((src,j)=>{let p=document.createElement('div');p.className='photo';p.innerHTML=`<img src="${src}"><button>✕</button>`;p.querySelector('button').onclick=()=>{h.photos.splice(j,1);renderHallazgos();save()};ph.append(p)});d.querySelector('.delHall').onclick=()=>{data.hallazgos.splice(i,1);renderHallazgos();save()};$('#hallazgos').append(d)})}
$('#addHallazgo').onclick=addHallazgo;
function addItem(){data.items.push({tipo:'Repuesto',desc:'',cant:1,unit:0});renderItems();save()}
function renderItems(){let b=$('#items');b.innerHTML='';let total=0;data.items.forEach((it,i)=>{let tr=document.createElement('tr'),t=(Number(it.cant)||0)*(Number(it.unit)||0);total+=t;tr.innerHTML=`<td><select><option>Repuesto</option><option>Insumo</option><option>Mano de obra</option></select></td><td><input value="${esc(it.desc)}"></td><td><input inputmode="decimal" value="${it.cant}"></td><td><input inputmode="numeric" value="${it.unit}"></td><td><b>${money(t)}</b></td><td><button>✕</button></td>`;let a=tr.querySelectorAll('select,input');a[0].value=it.tipo;a[0].onchange=()=>{it.tipo=a[0].value;save()};a[1].oninput=()=>{it.desc=a[1].value;schedule()};a[2].oninput=()=>{it.cant=a[2].value;updateTotals();schedule()};a[2].onblur=renderItems;a[3].oninput=()=>{it.unit=a[3].value;updateTotals();schedule()};a[3].onblur=renderItems;tr.querySelector('button').onclick=()=>{data.items.splice(i,1);renderItems();save()};b.append(tr)});updateTotals()}
function updateTotals(){const neto=data.items.reduce((s,it)=>s+(Number(it.cant)||0)*(Number(it.unit)||0),0);$('#netoTotal').textContent=money(neto);const iva=Math.round(neto*.19);$('#ivaTotal').textContent=money(iva);$('#granTotal').textContent=money(neto+iva)}
function esc(s){return String(s||'').replace(/"/g,'&quot;')}
$('#addItem').onclick=addItem;$('#save').onclick=async()=>{if(await save())alert('OT guardada en el historial del dispositivo.')}
$('#newOT').onclick=()=>{if(confirm('¿Crear una nueva Orden de Trabajo?'))newOT()};
$('#history').onclick=async()=>{await save();let rows=[];try{rows=await cloudList()}catch(e){console.warn('Historial nube no disponible',e);let db={};try{db=JSON.parse(localStorage.getItem(DB)||'{}')}catch(_e){}rows=Object.values(db).reverse().map(datos=>({ot:datos.ot,datos}))}let list=$('#histList');list.innerHTML='';rows.forEach(row=>{let x=row.datos||row,d=document.createElement('div');d.className='histRow';d.innerHTML=`<div class="histOpen"><b>${x.ot}</b> · ${x.fecha}<br>${x.patente||'Sin patente'} · ${x.marca||''} ${x.modelo||''}<br><small>${x.cliente||'Sin cliente'} · ${x.estado}</small></div><button class="histDelete" type="button">Eliminar</button>`;d.querySelector('.histOpen').onclick=async()=>{try{data=await cloudGet(x.ot)||await idbGet(x.ot)||x}catch(e){console.error(e);data=x}await idbPut(data);localStorage.setItem('CF_OT_PREVIEW_ACTIVE',x.ot);fill();$('#histDlg').close()};d.querySelector('.histDelete').onclick=async e=>{e.stopPropagation();if(!confirm('¿Eliminar definitivamente '+x.ot+' del historial compartido?'))return;try{await cloudDelete(x.ot);await idbDelete(x.ot)}catch(err){console.error(err);alert('No se pudo eliminar la OT.');return}let db={};try{db=JSON.parse(localStorage.getItem(DB)||'{}')}catch(_e){}delete db[x.ot];localStorage.setItem(DB,JSON.stringify(db));if(localStorage.getItem('CF_OT_PREVIEW_ACTIVE')===x.ot)localStorage.removeItem('CF_OT_PREVIEW_ACTIVE');d.remove()};list.append(d)});$('#histDlg').showModal()};$('#closeHist').onclick=()=>$('#histDlg').close();
const firma=$('#firma'),fctx=firma.getContext('2d');let drawing=false;
function firmaPos(e){const r=firma.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*firma.width/r.width,y:(p.clientY-r.top)*firma.height/r.height}}
function startFirma(e){e.preventDefault();drawing=true;let p=firmaPos(e);fctx.beginPath();fctx.moveTo(p.x,p.y)}
function moveFirma(e){if(!drawing)return;e.preventDefault();let p=firmaPos(e);fctx.lineWidth=4;fctx.lineCap='round';fctx.strokeStyle='#111';fctx.lineTo(p.x,p.y);fctx.stroke()}
function endFirma(){if(!drawing)return;drawing=false;data.aceptacion.firma=firma.toDataURL('image/png');save()}
firma.addEventListener('pointerdown',startFirma);firma.addEventListener('pointermove',moveFirma);window.addEventListener('pointerup',endFirma);
function drawSavedSignature(){fctx.clearRect(0,0,firma.width,firma.height);if(data?.aceptacion?.firma){let im=new Image();im.onload=()=>fctx.drawImage(im,0,0,firma.width,firma.height);im.src=data.aceptacion.firma}}
function updateAcceptStamp(){let a=data.aceptacion||{};$('#acceptStamp').textContent=a.aceptado?('Aceptada · '+a.fechaHora):'Pendiente de aceptación';$('#acceptStamp').classList.toggle('ok',!!a.aceptado)}
$('#aceptaNombre').oninput=()=>{data.aceptacion.nombre=$('#aceptaNombre').value;schedule()};$('#aceptaRut').oninput=()=>{data.aceptacion.rut=$('#aceptaRut').value;schedule()};
$('#aceptaCheck').onchange=()=>{data.aceptacion.aceptado=$('#aceptaCheck').checked;if(!data.aceptacion.aceptado)data.aceptacion.fechaHora='';save();updateAcceptStamp()};
$('#clearFirma').onclick=()=>{fctx.clearRect(0,0,firma.width,firma.height);data.aceptacion.firma='';save()};
$('#confirmAcepta').onclick=()=>{data.aceptacion.nombre=$('#aceptaNombre').value.trim();data.aceptacion.rut=$('#aceptaRut').value.trim();if(!data.aceptacion.nombre||!data.aceptacion.rut){alert('Completa nombre y RUT de quien acepta.');return}if(!data.aceptacion.firma){alert('Falta la firma del cliente.');return}$('#aceptaCheck').checked=true;data.aceptacion.aceptado=true;data.aceptacion.fechaHora=new Date().toLocaleString('es-CL');save();updateAcceptStamp();alert('Aceptación registrada en la OT.')};
// PDF CERO FALLA Premium: diseño independiente del almacenamiento de órdenes.
function pdfHeader(doc,title){
 const pw=doc.internal.pageSize.getWidth();
 doc.setFillColor(12,13,16);doc.rect(0,0,pw,30,'F');
 doc.setFillColor(205,24,34);doc.rect(0,30,pw,2,'F');
 doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('CERO FALLA',14,14);
 doc.setFontSize(8);doc.text('ESPECIALISTA AUTOMOTRIZ',14,21);
 doc.setFontSize(9);doc.text(String(data.ot||''),pw-14,13,{align:'right'});
 doc.setFont('helvetica','normal');doc.text(String(data.fecha||''),pw-14,20,{align:'right'});
 doc.setTextColor(20);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text(title,14,42);
}
function pdfFooter(doc){
 const n=doc.internal.getNumberOfPages();
 for(let p=1;p<=n;p++){doc.setPage(p);doc.setDrawColor(215);doc.line(14,281,196,281);
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(90);
 doc.text('CERO FALLA  |  +56 9 6925 1525  |  cerofalla.automotriz@gmail.com',14,287);
 doc.text(p+' / '+n,196,287,{align:'right'});doc.setTextColor(20);}
}
function pdfInfo(doc,y){
 const left=14,w=88,gap=6,right=left+w+gap;
 const field=(label,value,x,yy,max=79)=>{doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(110);doc.text(label.toUpperCase(),x,yy);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(25);const lines=doc.splitTextToSize(String(value??'-')||'-',max);doc.text(lines.slice(0,2),x,yy+4);};
 const card=(x,title)=>{doc.setFillColor(246,247,249);doc.roundedRect(x,y,w,46,2,2,'F');doc.setFillColor(190,22,32);doc.rect(x,y,2,46,'F');doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(25);doc.text(title,x+6,y+7);};
 card(left,'CLIENTE');card(right,'VEHÍCULO');
 field('Nombre',data.cliente,left+6,y+13);field('RUT',data.rut,left+6,y+26,38);field('Teléfono',data.telefono,left+49,y+26,31);field('Email',data.email,left+6,y+38);
 field('Marca / modelo / año',[data.marca,data.modelo,data.ano].filter(Boolean).join(' '),right+6,y+13);
 field('Patente',data.patente,right+6,y+26,34);field('Kilometraje',data.km,right+49,y+26,30);
 field('VIN',data.vin,right+6,y+38);
 doc.setTextColor(20);return y+53;
}
function pdfSection(doc,title,y){
 doc.setFillColor(24,26,30);doc.roundedRect(14,y,182,9,1,1,'F');doc.setFillColor(210,25,35);doc.rect(14,y,3,9,'F');
 doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(title,20,y+6);doc.setTextColor(20);return y+14;
}
function pdfNewPage(doc){doc.addPage();pdfHeader(doc,doc._cfTitle||'ORDEN DE TRABAJO');return 49;}
function pdfEnsure(doc,y,height){return y+height>277?pdfNewPage(doc):y;}
function pdfParagraph(doc,value,y){
 doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(25);
 const lines=doc.splitTextToSize(String(value||'Sin detalle.'),180);
 for(let i=0;i<lines.length;i+=42){const part=lines.slice(i,i+42);y=pdfEnsure(doc,y,part.length*5+3);doc.text(part,15,y);y+=part.length*5+3;}return y+3;
}
function pdfPhoto(doc,src,x,y,w=86,h=58){
 // jsPDF puede leer dimensiones reales desde el archivo, sin estirar la foto.
 const info=doc.getImageProperties(src),iw=info.width,ih=info.height;
 if(!iw||!ih)throw Error('Imagen sin dimensiones');
 const scale=Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;
 doc.setFillColor(245,245,245);doc.roundedRect(x,y,w,h,1.5,1.5,'F');
 doc.addImage(src,info.fileType||'JPEG',x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function pdfPhotos(doc,photos,y){
 const arr=Array.isArray(photos)?photos:[];
 for(let i=0;i<arr.length;i+=2){y=pdfEnsure(doc,y,66);
 for(let j=0;j<2&&i+j<arr.length;j++){try{pdfPhoto(doc,arr[i+j],15+j*94,y);}catch(err){doc.setFontSize(8);doc.text('Fotografía no disponible',17+j*94,y+12);console.warn('Foto PDF',err);}}
 y+=65;}return y;
}
function openPdf(doc){const blob=doc.output('blob'),url=URL.createObjectURL(blob);let w=window.open(url,'_blank');if(!w){const a=document.createElement('a');a.href=url;a.target='_blank';a.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}
function makeOtPdf(){
 save();const {jsPDF}=window.jspdf,doc=new jsPDF();doc._cfTitle='ORDEN DE TRABAJO';pdfHeader(doc,doc._cfTitle);
 let y=pdfInfo(doc,49);y=pdfEnsure(doc,y,19);y=pdfSection(doc,'ESTADO DE LA ORDEN',y);y=pdfParagraph(doc,data.estado,y);
 if(data.photos?.length){y=pdfEnsure(doc,y,81);y=pdfSection(doc,'REGISTRO FOTOGRÁFICO DE RECEPCIÓN',y);y=pdfPhotos(doc,data.photos,y);}
 y=pdfEnsure(doc,y,28);y=pdfSection(doc,'TRABAJOS SOLICITADOS POR EL CLIENTE',y);y=pdfParagraph(doc,data.solicitados,y);
 if(data.hallazgos?.length){for(let i=0;i<data.hallazgos.length;i++){const h=data.hallazgos[i];y=pdfEnsure(doc,y,35);y=pdfSection(doc,'HALLAZGO / TRABAJO ADICIONAL '+(i+1),y);y=pdfParagraph(doc,(h.texto||'Sin detalle')+' | '+(h.informado?'Informado':'No informado')+' | '+(h.autorizacion||''),y);y=pdfPhotos(doc,h.photos,y);}}
 y=pdfEnsure(doc,y,27);y=pdfSection(doc,'CONCLUSIONES',y);y=pdfParagraph(doc,data.conclusiones,y);
 if(data.aceptacion?.aceptado){y=pdfEnsure(doc,y,55);y=pdfSection(doc,'ACEPTACIÓN DEL CLIENTE',y);y=pdfParagraph(doc,'Aceptada por: '+data.aceptacion.nombre+' | RUT: '+data.aceptacion.rut+' | Fecha: '+data.aceptacion.fechaHora,y);y=pdfParagraph(doc,'Declara haber recibido la información de esta Orden de Trabajo y autoriza los trabajos indicados como aceptados.',y);if(data.aceptacion.firma){y=pdfEnsure(doc,y,36);try{pdfPhoto(doc,data.aceptacion.firma,15,y,75,29);y+=34}catch(e){console.warn(e)}}}
 if(data.obs){y=pdfEnsure(doc,y,25);y=pdfSection(doc,'OBSERVACIONES FINALES',y);y=pdfParagraph(doc,data.obs,y);}
 pdfFooter(doc);return doc;
}
function makeCuentaPdf(){
 save();const {jsPDF}=window.jspdf,doc=new jsPDF(),L=14,R=196;doc._cfTitle='LIQUIDACIÓN';pdfHeader(doc,doc._cfTitle);let y=pdfInfo(doc,49);
 const txt=(s,x,yy,size=10,bold=false,align='left')=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(25);doc.text(String(s??''),x,yy,{align})};
 const x=[L,38,111,130,158,R];
 const headings=()=>{doc.setFillColor(24,26,30);doc.rect(L,y-5,R-L,10,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('TIPO',x[0]+2,y+1);doc.text('DESCRIPCIÓN',x[1],y+1);doc.text('CANT.',x[2],y+1,{align:'right'});doc.text('UNITARIO',x[4],y+1,{align:'right'});doc.text('NETO',x[5]-2,y+1,{align:'right'});doc.setTextColor(25);y+=11;};
 y+=4;headings();let neto=0;
 if(!data.items?.length){txt('Sin ítems cargados.',L,y);y+=9;}
 for(const it of (data.items||[])){const t=(+it.cant||0)*(+it.unit||0);neto+=t;doc.setFontSize(9);const desc=doc.splitTextToSize(String(it.desc||''),68);const h=Math.max(9,desc.length*4.5+4);if(y+h>270){y=pdfNewPage(doc);headings();}
 txt(it.tipo,L,y,9);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(desc,x[1],y);txt(it.cant,x[2],y,9,false,'right');txt(money(it.unit),x[4],y,9,false,'right');txt(money(t),x[5],y,9,true,'right');y+=h;doc.setDrawColor(225);doc.line(L,y-3,R,y-3);}
 y=pdfEnsure(doc,y,35);y+=6;const iva=Math.round(neto*.19);
 txt('Neto total',151,y,10,true,'right');txt(money(neto),R,y,10,true,'right');y+=8;
 txt('IVA 19%',151,y,10,true,'right');txt(money(iva),R,y,10,true,'right');y+=9;
 doc.setDrawColor(190,20,28);doc.line(128,y-5,R,y-5);txt('TOTAL',151,y,14,true,'right');txt(money(neto+iva),R,y,14,true,'right');
 pdfFooter(doc);return doc;
}
$('#pdf').onclick=()=>{try{openPdf(makeOtPdf())}catch(e){console.error(e);alert('No se pudo generar el informe OT. '+e.message)}};
$('#cuentaPdf').onclick=()=>{try{openPdf(makeCuentaPdf())}catch(e){console.error(e);alert('No se pudo generar la cuenta. '+e.message)}};
(async()=>{await migrateLegacy();await syncLocalToCloud();const active=localStorage.getItem('CF_OT_PREVIEW_ACTIVE');if(active){try{data=await cloudGet(active)||await idbGet(active)}catch(e){console.error(e);try{data=await idbGet(active)}catch(_e){}}}if(!data){let db={};try{db=JSON.parse(localStorage.getItem(DB)||'{}')}catch(e){};if(active&&db[active])data=db[active]}if(!data)data=fresh();fill();if(!active)await save();
 const key='CF_COT_TO_OT_PREVIEW_V1',raw=localStorage.getItem(key);
 if(raw){try{
  const cot=JSON.parse(raw);
  if(cot.origen&&confirm('Cotización '+cot.origen+' aprobada. ¿Crear una nueva OT de prueba con sus datos y valores?')){
   await save();
   const nueva=fresh();
   for(const k of ['cliente','rut','telefono','email','marca','modelo','ano','patente','vin','km','solicitados','obs'])nueva[k]=String(cot[k]||'');
   nueva.items=Array.isArray(cot.items)?cot.items.map(it=>({tipo:it.tipo==='Mano de obra'?'Mano de obra':it.tipo==='Insumo'?'Insumo':'Repuesto',desc:String(it.desc||''),cant:Number(it.cant)||0,unit:Number(it.unit)||0})):[];
   data=nueva;fill();await save();
   alert('OT DE PRUEBA '+data.ot+' creada desde '+cot.origen+'. Verifica los datos y la liquidación.');
  }
 }catch(e){console.error(e);alert('No se pudo importar la cotización de prueba.')}finally{localStorage.removeItem(key)}
 }
})();

// Compartir PDF mediante la hoja nativa del dispositivo. No envía datos sin confirmación.
async function compartirDocumento(tipo){
 $('#envioDlg').close();
 try{
  const doc=tipo==='ot'?makeOtPdf():makeCuentaPdf();
  const nombre=(tipo==='ot'?'OT':'Liquidacion')+'_'+String(data.ot||'Cero_Falla').replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';
  const archivo=new File([doc.output('blob')],nombre,{type:'application/pdf'});
  const asunto=(tipo==='ot'?'Orden de Trabajo':'Liquidación')+' CERO FALLA '+(data.ot||'');
  if(navigator.canShare&&navigator.canShare({files:[archivo]})&&navigator.share){
   await navigator.share({files:[archivo],title:asunto,text:'Adjunto documento CERO FALLA para '+(data.cliente||'cliente')+'.'});
   return;
  }
  // En equipos sin soporte de archivos compartidos, descargamos y explicamos el límite.
  doc.save(nombre);
  alert('Este navegador no permite adjuntar PDF directamente a WhatsApp o correo. Se descargó '+nombre+' para que puedas adjuntarlo. Prueba Compartir desde Chrome en Android.');
 }catch(e){if(e.name!=='AbortError'){console.error(e);alert('No fue posible compartir el documento: '+e.message)}}
}
$('#compartirOt').onclick=()=>compartirDocumento('ot');
$('#compartirLiquidacion').onclick=()=>compartirDocumento('liquidacion');

$('#enviarDocumento').onclick=()=>$('#envioDlg').showModal();
$('#cerrarEnvio').onclick=()=>$('#envioDlg').close();
