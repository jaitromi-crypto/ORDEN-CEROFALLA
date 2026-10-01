const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB='CF_OT_V1', COUNTER='CF_OT_COUNTER_V1'; let data=null, timer=null;
const ids=['cliente','rut','telefono','email','marca','modelo','ano','patente','vin','km','bencina','solicitados','conclusiones','obs','estado'];
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()};
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CL');
function nextNumber(){let n=Number(localStorage.getItem(COUNTER)||0)+1;localStorage.setItem(COUNTER,n);return 'OT-'+String(n).padStart(6,'0')}
function fresh(){return{ot:nextNumber(),fecha:today(),estado:'Recepcionado',photos:[],hallazgos:[],items:[],cliente:'',rut:'',telefono:'',email:'',marca:'',modelo:'',ano:'',patente:'',vin:'',km:'',bencina:'1/2',solicitados:'',conclusiones:'',obs:''}}
function collect(){ids.forEach(id=>data[id]=$('#'+id).value)}
function schedule(){clearTimeout(timer);timer=setTimeout(save,350)}
function save(){if(!data)return;collect();const db=JSON.parse(localStorage.getItem(DB)||'{}');db[data.ot]=data;localStorage.setItem(DB,JSON.stringify(db));$('#otBadge').textContent=data.ot}
function fill(){ $('#ot').value=data.ot;$('#fecha').value=data.fecha;ids.forEach(id=>$('#'+id).value=data[id]??''); renderPhotos();renderHallazgos();renderItems();$('#otBadge').textContent=data.ot}
function newOT(){if(data)save();data=fresh();fill();save()}
ids.forEach(id=>$('#'+id).addEventListener('input',schedule));
function compress(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let w=im.width,h=im.height,m=1100;if(Math.max(w,h)>m){let q=m/Math.max(w,h);w*=q;h*=q}let c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);res(c.toDataURL('image/jpeg',.68))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function addPhotos(files){for(const f of files){try{data.photos.push(await compress(f))}catch(e){alert('No se pudo cargar '+f.name)}}renderPhotos();save()}
$('#camera').onchange=e=>addPhotos(e.target.files);$('#gallery').onchange=e=>addPhotos(e.target.files);
function renderPhotos(){$('#photos').innerHTML='';data.photos.forEach((src,i)=>{let d=document.createElement('div');d.className='photo';d.innerHTML=`<img src="${src}"><button>✕</button>`;d.querySelector('button').onclick=()=>{data.photos.splice(i,1);renderPhotos();save()};$('#photos').append(d)});$('#photoCount').textContent=data.photos.length+' foto'+(data.photos.length===1?'':'s')+(data.photos.length<6?' · faltan '+(6-data.photos.length)+' para 6':' · ✓ registro mínimo completo')}
function addHallazgo(){data.hallazgos.push({texto:'',informado:false,autorizacion:'Pendiente'});renderHallazgos();save()}
function renderHallazgos(){$('#hallazgos').innerHTML='';data.hallazgos.forEach((h,i)=>{let d=document.createElement('div');d.className='hallazgo';d.innerHTML=`<textarea rows="3" placeholder="Detalle del hallazgo...">${h.texto}</textarea><div class="checks"><label><input type="checkbox" ${h.informado?'checked':''}> Informado al cliente</label><label>Autorización <select><option>Pendiente</option><option>Autorizado</option><option>No autorizado</option></select></label><button>Eliminar</button></div>`;let ta=d.querySelector('textarea'),ch=d.querySelector('input'),sel=d.querySelector('select');sel.value=h.autorizacion;ta.oninput=()=>{h.texto=ta.value;schedule()};ch.onchange=()=>{h.informado=ch.checked;save()};sel.onchange=()=>{h.autorizacion=sel.value;save()};d.querySelector('button').onclick=()=>{data.hallazgos.splice(i,1);renderHallazgos();save()};$('#hallazgos').append(d)})}
$('#addHallazgo').onclick=addHallazgo;
function addItem(){data.items.push({tipo:'Repuesto / insumo',desc:'',cant:1,unit:0});renderItems();save()}
function renderItems(){let b=$('#items');b.innerHTML='';let total=0;data.items.forEach((it,i)=>{let tr=document.createElement('tr'),t=(Number(it.cant)||0)*(Number(it.unit)||0);total+=t;tr.innerHTML=`<td><select><option>Repuesto / insumo</option><option>Mano de obra</option></select></td><td><input value="${esc(it.desc)}"></td><td><input inputmode="decimal" value="${it.cant}"></td><td><input inputmode="numeric" value="${it.unit}"></td><td><b>${money(t)}</b></td><td><button>✕</button></td>`;let a=tr.querySelectorAll('select,input');a[0].value=it.tipo;a[0].onchange=()=>{it.tipo=a[0].value;save()};a[1].oninput=()=>{it.desc=a[1].value;schedule()};a[2].oninput=()=>{it.cant=a[2].value;renderItems();save()};a[3].oninput=()=>{it.unit=a[3].value;renderItems();save()};tr.querySelector('button').onclick=()=>{data.items.splice(i,1);renderItems();save()};b.append(tr)});$('#granTotal').textContent=money(total)}
function esc(s){return String(s||'').replace(/"/g,'&quot;')}
$('#addItem').onclick=addItem;$('#save').onclick=()=>{save();alert('OT guardada en este dispositivo.')};
$('#newOT').onclick=()=>{if(confirm('¿Crear una nueva Orden de Trabajo?'))newOT()};
$('#history').onclick=()=>{save();let db=JSON.parse(localStorage.getItem(DB)||'{}'),list=$('#histList');list.innerHTML='';Object.values(db).reverse().forEach(x=>{let d=document.createElement('div');d.className='histRow';d.innerHTML=`<b>${x.ot}</b> · ${x.fecha}<br>${x.patente||'Sin patente'} · ${x.marca||''} ${x.modelo||''}<br><small>${x.cliente||'Sin cliente'} · ${x.estado}</small>`;d.onclick=()=>{data=x;fill();$('#histDlg').close()};list.append(d)});$('#histDlg').showModal()};$('#closeHist').onclick=()=>$('#histDlg').close();
$('#pdf').onclick=()=>{save();const {jsPDF}=window.jspdf,doc=new jsPDF(),L=15,W=180;let y=16;
const line=(txt,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);let a=doc.splitTextToSize(String(txt||''),W);if(y+a.length*5>282){doc.addPage();y=16}doc.text(a,L,y);y+=a.length*5+2};
doc.setFillColor(10,10,10);doc.rect(0,0,210,28,'F');doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');doc.text('CERO FALLA',15,14);doc.setFontSize(9);doc.text('ESPECIALISTA AUTOMOTRIZ',15,21);doc.text(data.ot+'  |  '+data.fecha,145,16);doc.setTextColor(0);y=38;
line('ORDEN DE TRABAJO',16,true);line('Estado: '+data.estado,10,true);line('CLIENTE',12,true);line(`${data.cliente} | RUT: ${data.rut} | Tel: ${data.telefono} | ${data.email}`);
line('VEHÍCULO',12,true);line(`${data.marca} ${data.modelo} ${data.ano} | Patente: ${data.patente} | VIN: ${data.vin} | Km: ${data.km} | Combustible: ${data.bencina}`);
line('TRABAJOS SOLICITADOS',12,true);line(data.solicitados||'Sin detalle.');
if(data.hallazgos.length){line('HALLAZGOS / ADICIONALES',12,true);data.hallazgos.forEach((h,i)=>line(`${i+1}. ${h.texto} | ${h.informado?'Informado':'No informado'} | ${h.autorizacion}`))}
line('CONCLUSIONES',12,true);line(data.conclusiones||'Sin detalle.');
if(data.items.length){line('CUENTA',12,true);let total=0;data.items.forEach(it=>{let t=(+it.cant||0)*(+it.unit||0);total+=t;line(`${it.tipo}: ${it.desc} | ${it.cant} x ${money(it.unit)} = ${money(t)}`)});line('TOTAL: '+money(total),14,true)}
if(data.obs){line('OBSERVACIONES',12,true);line(data.obs)}
if(data.photos.length){line('REGISTRO FOTOGRÁFICO',12,true);for(let i=0;i<data.photos.length;i++){if(y+58>280){doc.addPage();y=16}try{doc.addImage(data.photos[i],'JPEG',15,y,82,55);if(i+1<data.photos.length){doc.addImage(data.photos[++i],'JPEG',105,y,82,55)}y+=60}catch(e){}}}
doc.save(`${data.ot}_${data.patente||'SIN-PATENTE'}.pdf`)};
data=fresh();fill();save();