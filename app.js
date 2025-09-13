// ======= Datos base =======
const BASE_PRODUCTS = [
  {k:'pollo_entero', n:'Pollo entero', p:1.30, c:0.95},
  {k:'mitad_pollo', n:'Mitad de pollo', p:1.30, c:0.95},
  {k:'pechuga_con_ala', n:'Pechuga con ala', p:2.00, c:0.95},
  {k:'pechuga_sin_ala', n:'Pechuga entera sin ala', p:2.20, c:1.30},
  {k:'pechuga_fileteada', n:'Pechuga fileteada', p:2.50, c:1.30},
  {k:'pierna_pollo', n:'Pierna de pollo', p:1.30, c:0},
  {k:'higado_pollo_corazon', n:'Hígado de pollo con corazón', p:0.80, c:0.50},
  {k:'pata_pollo', n:'Pata de pollo', p:0.80, c:0.50},
  {k:'carne_res_entera_suave', n:'Carne de res entera suave', p:3.90, c:3.40},
  {k:'carne_res_fileteada_suave', n:'Carne de res fileteada suave', p:4.00, c:3.50},
  {k:'costilla_res', n:'Costilla de res', p:2.50, c:2.00},
  {k:'hueso_carnudo_res', n:'Hueso carnudo de res', p:1.20, c:0.80},
  {k:'chuleta_lomo', n:'Chuleta de lomo', p:3.00, c:2.20},
  {k:'chuleta_nuca', n:'Chuleta de nuca', p:2.90, c:2.15},
  {k:'costilla_chancho', n:'Costilla de chancho', p:3.20, c:2.70},
  {k:'carne_chancho_entera', n:'Carne de chancho entera', p:2.50, c:1.85},
  {k:'fritada_chancho', n:'Fritada de chancho', p:2.60, c:1.85},
  {k:'hueso_chancho', n:'Hueso de chancho', p:1.00, c:1.85},
];

const ls = {
  get(k, def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch{ return def; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },
};

// Inicialización (una sola vez)
function initIfNeeded(){
  if(!ls.get('inventory')){
    const inv = {}; BASE_PRODUCTS.forEach(x=>inv[x.k] = 10); // 10 lb c/u
    ls.set('inventory', inv);
  }
  if(!ls.get('prices')){
    const prices = {}; BASE_PRODUCTS.forEach(x=>prices[x.k] = x.p); ls.set('prices', prices);
  } else {
    const prices=ls.get('prices',{}); BASE_PRODUCTS.forEach(x=>{ if(prices[x.k]==null) prices[x.k]=x.p; }); ls.set('prices',prices);
  }
  if(!ls.get('costs')){
    const costs = {}; BASE_PRODUCTS.forEach(x=>costs[x.k] = x.c); ls.set('costs', costs);
  } else {
    const costs=ls.get('costs',{}); BASE_PRODUCTS.forEach(x=>{ if(costs[x.k]==null) costs[x.k]=x.c; }); ls.set('costs',costs);
  }
  if(!ls.get('clients')) ls.set('clients', []);
  if(!ls.get('sales')) ls.set('sales', []);
  if(!ls.get('creditNotes')) ls.set('creditNotes', []);
}

function fmt(n){ return '$' + (Number(n)||0).toFixed(2); }
function todayStr(){ const d=new Date(); return d.toISOString().slice(0,10); }

// ======= Navegación =======
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('main section').forEach(s=>s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab==='inventario') renderInventario();
    if(btn.dataset.tab==='clientes') renderClientes();
    if(btn.dataset.tab==='historial') { setHoy(); renderHistorial(); }
    if(btn.dataset.tab==='notas') { fillNCProducts(); renderNC(); }
  });
});

// ======= Facturación =======
let currentItems = [];

function fillProducts(){
  const sel=document.getElementById('selProd'); sel.innerHTML='';
  BASE_PRODUCTS.forEach(x=>{
    const opt=document.createElement('option'); opt.value=x.k; opt.textContent=x.n; sel.appendChild(opt);
  });
  const prices=ls.get('prices',{}), costs=ls.get('costs',{});
  document.getElementById('selProd').addEventListener('change',()=>{
    const k=document.getElementById('selProd').value;
    document.getElementById('inpPrecio').value = (prices[k]??0).toFixed(2);
    document.getElementById('inpCosto').value = (costs[k]??0).toFixed(2);
  });
  document.getElementById('selProd').dispatchEvent(new Event('change'));
}

function addItem(){
  const k=document.getElementById('selProd').value;
  const lb=parseFloat(document.getElementById('inpLb').value);
  const px=parseFloat(document.getElementById('inpPrecio').value);
  const cx=parseFloat(document.getElementById('inpCosto').value);
  if(!k||!(lb>0)||!(px>=0)||!(cx>=0)) return alert('Completa producto, libras y precios válidos.');
  const inv=ls.get('inventory',{});
  if((inv[k]||0) < lb) return alert('Stock insuficiente. Disponible: '+(inv[k]||0)+' lb');
  const exist=currentItems.find(it=>it.k===k);
  if(exist){ exist.lb += lb; exist.px = px; exist.cx = cx; }
  else currentItems.push({k, lb, px, cx});
  document.getElementById('inpLb').value='';
  renderItems();
}

function renderItems(){
  const tbody=document.querySelector('#tablaItems tbody'); tbody.innerHTML='';
  let total=0, tc=0;
  currentItems.forEach((it,i)=>{
    const name=BASE_PRODUCTS.find(p=>p.k===it.k)?.n||it.k;
    const sub=it.lb*it.px; const cost=it.lb*it.cx; const mg=sub-cost;
    total+=sub; tc+=cost;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${name}</td><td>${it.lb.toFixed(2)}</td><td>${fmt(it.px)}</td><td>${fmt(sub)}</td><td>${fmt(cost)}</td><td>${fmt(mg)}</td>
    <td><button class='btn ghost' data-i='${i}'>Quitar</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ currentItems.splice(b.dataset.i,1); renderItems(); }));
  document.getElementById('totalVenta').textContent=fmt(total);
}

function confirmSale(){
  if(currentItems.length===0) return alert('No hay ítems.');
  const nombre=document.getElementById('cliNombre').value?.trim();
  const cel=document.getElementById('cliCel').value?.trim();
  const dir=document.getElementById('cliDir').value?.trim();
  if(!nombre) return alert('Ingresa el nombre del cliente.');

  const inv=ls.get('inventory',{});
  for(const it of currentItems){ inv[it.k]=(inv[it.k]||0)-it.lb; }
  ls.set('inventory', inv);

  const sales=ls.get('sales',[]);
  const id = sales.length+1;
  const total = currentItems.reduce((a,b)=>a+b.lb*b.px,0);
  const costo = currentItems.reduce((a,b)=>a+b.lb*b.cx,0);
  const venta={ id, fecha:new Date().toISOString(), cliente:{nombre,cel,dir}, items:currentItems, total, costo, margen: total-costo, devuelto:0 };
  sales.push(venta); ls.set('sales', sales);

  currentItems=[]; renderItems(); renderInventario(); setHoy(); renderHistorial(); renderResumenDia();
  alert('Venta registrada #'+id+' por '+fmt(total));
}

function saveClientFromInvoice(){
  const nombre=document.getElementById('cliNombre').value?.trim();
  const cel=document.getElementById('cliCel').value?.trim();
  const dir=document.getElementById('cliDir').value?.trim();
  if(!nombre) return alert('Nombre requerido');
  const clients=ls.get('clients',[]);
  const ex=clients.findIndex(c=>c.nombre.toLowerCase()===nombre.toLowerCase());
  const obj={nombre,cel,dir, creado:new Date().toISOString()};
  if(ex>=0) clients[ex]=obj; else clients.push(obj);
  ls.set('clients', clients); renderClientes(); alert('Cliente guardado');
}

function findClient(){
  const nombre=document.getElementById('cliNombre').value?.trim();
  const dir=document.getElementById('cliDir').value?.trim();
  const cel=document.getElementById('cliCel').value?.trim();
  const clients=ls.get('clients',[]);
  if(!nombre && !dir && !cel){ return alert('Escribe nombre, dirección o celular para buscar.'); }
  const c=clients.find(x=>
    (nombre && x.nombre?.toLowerCase().includes(nombre.toLowerCase())) ||
    (dir && x.dir?.toLowerCase().includes(dir.toLowerCase())) ||
    (cel && x.cel?.toLowerCase().includes(cel.toLowerCase()))
  );
  if(!c) return alert('No se encontró.');
  document.getElementById('cliNombre').value=c.nombre||'';
  document.getElementById('cliCel').value=c.cel||'';
  document.getElementById('cliDir').value=c.dir||'';
}

// ======= Inventario =======
function renderInventario(){
  const tbody=document.querySelector('#tablaInv tbody'); tbody.innerHTML='';
  const inv=ls.get('inventory',{}), prices=ls.get('prices',{}), costs=ls.get('costs',{});
  BASE_PRODUCTS.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.n}</td>
      <td><input type='number' step='0.01' value='${(inv[p.k]||0).toFixed(2)}' data-k='${p.k}' class='invQty' title='Editar el stock total (lb)'/></td>
      <td><input type='number' step='0.01' value='${(prices[p.k]??p.p).toFixed(2)}' data-k='${p.k}' class='invPrice'/></td>
      <td><input type='number' step='0.01' value='${(costs[p.k]??p.c).toFixed(2)}' data-k='${p.k}' class='invCost'/></td>
      <td>
        <button class='btn ghost add5' data-k='${p.k}' title='+5 lb rápido'>+5 lb</button>
        <button class='btn ghost addX' data-k='${p.k}' title='Agregar ingreso a este producto'>Ingreso…</button>
      </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.invQty').forEach(inp=>inp.addEventListener('change',()=>{
    const inv=ls.get('inventory',{}); inv[inp.dataset.k]=parseFloat(inp.value)||0; ls.set('inventory',inv);
  }));
  tbody.querySelectorAll('.invPrice').forEach(inp=>inp.addEventListener('change',()=>{
    const prices=ls.get('prices',{}); prices[inp.dataset.k]=parseFloat(inp.value)||0; ls.set('prices',prices);
  }));
  tbody.querySelectorAll('.invCost').forEach(inp=>inp.addEventListener('change',()=>{
    const costs=ls.get('costs',{}); costs[inp.dataset.k]=parseFloat(inp.value)||0; ls.set('costs',costs);
  }));
  tbody.querySelectorAll('.add5').forEach(btn=>btn.addEventListener('click',()=>{
    const inv=ls.get('inventory',{}); inv[btn.dataset.k]=(inv[btn.dataset.k]||0)+5; ls.set('inventory',inv); renderInventario();
  }));
  tbody.querySelectorAll('.addX').forEach(btn=>btn.addEventListener('click',()=>{
    const add = parseFloat(prompt('¿Cuántas lb ingresarás a "'+(BASE_PRODUCTS.find(x=>x.k===btn.dataset.k)?.n)+'"?', '0'))||0;
    if(add>0){ const inv=ls.get('inventory',{}); inv[btn.dataset.k]=(inv[btn.dataset.k]||0)+add; ls.set('inventory',inv); renderInventario(); }
  }));
}

function registrarCompra(){
  const lbs=prompt('¿Cuántas lb ingresarás (para TODOS los productos)?', '0');
  if(lbs===null) return; const add=parseFloat(lbs)||0; if(add<=0) return;
  const inv=ls.get('inventory',{}); BASE_PRODUCTS.forEach(p=>inv[p.k]=(inv[p.k]||0)+add); ls.set('inventory',inv); renderInventario();
  alert('Compra registrada: +'+add+' lb en cada producto');
}

function reiniciar10(){
  if(!confirm('Esto pondrá 10 lb en todos los productos. ¿Continuar?')) return;
  const inv={}; BASE_PRODUCTS.forEach(p=>inv[p.k]=10); ls.set('inventory',inv); renderInventario();
}

// ======= Clientes =======
function renderClientes(){
  const tbody=document.querySelector('#tablaClientes tbody'); tbody.innerHTML='';
  const clients=ls.get('clients',[]);
  clients.forEach((c,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${c.nombre}</td><td>${c.cel||''}</td><td>${c.dir||''}</td>
      <td><button class='btn ghost' data-i='${i}'>Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    const clients=ls.get('clients',[]); clients.splice(b.dataset.i,1); ls.set('clients',clients); renderClientes();
  }));
}

function nuevoCliente(){
  const nombre=prompt('Nombre del cliente'); if(!nombre) return;
  const cel=prompt('Celular (opcional)')||'';
  const dir=prompt('Dirección (opcional)')||'';
  const clients=ls.get('clients',[]); clients.push({nombre,cel,dir,creado:new Date().toISOString()}); ls.set('clients',clients); renderClientes();
}

// ======= Historial =======
function setHoy(){ document.getElementById('filtroFecha').value=todayStr(); document.getElementById('hoyTag').textContent=todayStr(); }

function renderHistorial(){
  const tbody=document.querySelector('#tablaHist tbody'); tbody.innerHTML='';
  const fecha=document.getElementById('filtroFecha').value;
  const sales=ls.get('sales',[]).filter(s=>s.fecha.slice(0,10)===fecha);
  sales.forEach(s=>{
    const itTxt=s.items.map(i=>`${(i.lb).toFixed(2)}lb ${BASE_PRODUCTS.find(p=>p.k===i.k)?.n}`).join(', ');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${s.id}</td><td>${s.fecha.slice(0,19).replace('T',' ')}</td><td>${s.cliente?.nombre||''}</td><td>${itTxt}</td><td>${fmt(s.total)}</td><td>${fmt(s.costo)}</td><td>${fmt(s.margen)}</td><td>${fmt(s.devuelto||0)}</td>`;
    tbody.appendChild(tr);
  });
}

// Resumen del día
function renderResumenDia(){
  const fecha=todayStr();
  const sales=ls.get('sales',[]).filter(s=>s.fecha.slice(0,10)===fecha);
  const ingresos=sales.reduce((a,b)=>a+b.total,0);
  const costos=sales.reduce((a,b)=>a+b.costo,0);
  document.getElementById('resVentas').textContent=String(sales.length);
  document.getElementById('resIngresos').textContent=fmt(ingresos);
  document.getElementById('resCostos').textContent=fmt(costos);
  document.getElementById('resMargen').textContent=fmt(ingresos - costos);
}

// Exportaciones
function exportCSV(rows, filename){
  const esc = v => '"'+String(v).replaceAll('"','""')+'"';
  const csv = rows.map(r=>r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

function exportarDia(){
  const fecha=todayStr();
  const sales=ls.get('sales',[]).filter(s=>s.fecha.slice(0,10)===fecha);
  const rows=[["ID","Fecha","Cliente","Items","Total","Costo","Margen","Devuelto"]];
  sales.forEach(s=>{
    rows.push([
      s.id,
      s.fecha,
      s.cliente?.nombre||'',
      s.items.map(i=>`${i.lb.toFixed(2)}lb ${BASE_PRODUCTS.find(p=>p.k===i.k)?.n}`).join(' | '),
      s.total.toFixed(2), s.costo.toFixed(2), s.margen.toFixed(2), (s.devuelto||0).toFixed(2)
    ]);
  });
  exportCSV(rows, `ventas_${fecha}.csv`);
}

function exportarHistCSV(){
  const fecha=document.getElementById('filtroFecha').value;
  const sales=ls.get('sales',[]).filter(s=>s.fecha.slice(0,10)===fecha);
  const rows=[["ID","Fecha","Cliente","Items","Total","Costo","Margen","Devuelto"]];
  sales.forEach(s=>{
    rows.push([
      s.id, s.fecha, s.cliente?.nombre||'',
      s.items.map(i=>`${i.lb.toFixed(2)}lb ${BASE_PRODUCTS.find(p=>p.k===i.k)?.n}`).join(' | '),
      s.total.toFixed(2), s.costo.toFixed(2), s.margen.toFixed(2), (s.devuelto||0).toFixed(2)
    ]);
  });
  exportCSV(rows, `historial_${fecha}.csv`);
}

// ======= Notas de crédito =======
function fillNCProducts(){
  const sel=document.getElementById('ncProd'); sel.innerHTML='';
  BASE_PRODUCTS.forEach(x=>{ const o=document.createElement('option'); o.value=x.k; o.textContent=x.n; sel.appendChild(o); });
}

function crearNC(){
  const ventaId=parseInt(document.getElementById('ncVentaId').value);
  const prod=document.getElementById('ncProd').value;
  const lb=parseFloat(document.getElementById('ncLb').value);
  if(!(ventaId>0)&&!(lb>0)) return alert('Completa venta, producto y libras válidas.');
  const sales=ls.get('sales',[]);
  const s=sales.find(x=>x.id===ventaId); if(!s) return alert('Venta no encontrada');
  const item=s.items.find(i=>i.k===prod); if(!item) return alert('Ese producto no está en la venta');
  if(lb>item.lb) return alert('No puedes devolver más lb de las vendidas');

  const ajusteIngreso = lb*item.px;
  const ajusteCosto   = lb*item.cx;
  s.total -= ajusteIngreso; s.costo -= ajusteCosto; s.margen = s.total - s.costo; s.devuelto = (s.devuelto||0) + ajusteIngreso;
  item.lb -= lb;

  const inv=ls.get('inventory',{}); inv[prod]=(inv[prod]||0)+lb; ls.set('inventory',inv);

  ls.set('sales', sales);

  const notes=ls.get('creditNotes',[]);
  const id=notes.length+1; notes.push({id, fecha:new Date().toISOString(), ventaId, prod, lb, ajuste: -ajusteIngreso}); ls.set('creditNotes',notes);

  renderInventario(); renderHistorial(); renderNC(); renderResumenDia();
  alert('Nota de crédito creada. Venta #'+ventaId+' ajustada '+fmt(-ajusteIngreso));
}

function renderNC(){
  const tbody=document.querySelector('#tablaNC tbody'); tbody.innerHTML='';
  const notes=ls.get('creditNotes',[]);
  notes.forEach(n=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${n.id}</td><td>${n.fecha.slice(0,19).replace('T',' ')}</td><td>${n.ventaId}</td><td>${BASE_PRODUCTS.find(p=>p.k===n.prod)?.n}</td><td>${n.lb.toFixed(2)}</td><td>${fmt(n.ajuste)}</td>`;
    tbody.appendChild(tr);
  });
}

// ======= Listeners globales =======
document.getElementById('btnAgregar').addEventListener('click', addItem);
document.getElementById('btnVaciarItems').addEventListener('click', ()=>{ currentItems=[]; renderItems(); });
document.getElementById('btnConfirmarVenta').addEventListener('click', confirmSale);
document.getElementById('btnGuardarCliente').addEventListener('click', saveClientFromInvoice);
document.getElementById('btnBuscarCliente').addEventListener('click', findClient);

document.getElementById('btnCompra').addEventListener('click', registrarCompra);
document.getElementById('btnReiniciar10').addEventListener('click', reiniciar10);

document.getElementById('btnNuevoCliente').addEventListener('click', nuevoCliente);

document.getElementById('btnFiltrar').addEventListener('click', renderHistorial);
document.getElementById('btnHoy').addEventListener('click', ()=>{ setHoy(); renderHistorial(); });

document.getElementById('btnCrearNC').addEventListener('click', crearNC);

document.getElementById('btnExportCSV').addEventListener('click', exportarDia);
document.getElementById('btnExportHistCSV').addEventListener('click', exportarHistCSV);

document.getElementById('btnRefrescarResumen').addEventListener('click', renderResumenDia);

// ======= Start =======
initIfNeeded();
fillProducts();
fillNCProducts();
renderInventario();
renderClientes();
setHoy();
renderHistorial();
renderNC();
renderResumenDia();
