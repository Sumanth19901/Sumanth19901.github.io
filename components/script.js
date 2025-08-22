// ---------- Utilities ----------
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const fmtDate = (s) => new Date(s).toLocaleString();

// Graceful status chip
function statusChip(s){
  const map = { completed:'ok', running:'warn', queued:'neutral', failed:'bad' };
  return `<span class="chip ${map[s]||''}">${s}</span>`;
}

// In-file mock data (used if API fails)
const FALLBACK = {
  backends: [
    {name:'ibm_oslo', num_qubits:7, queue_depth:12, status:'online'},
    {name:'ibm_perth', num_qubits:7, queue_depth:3, status:'online'},
    {name:'ibm_torino', num_qubits:127, queue_depth:28, status:'online'},
    {name:'simulator_statevector', num_qubits:32, queue_depth:0, status:'online'}
  ],
  jobs: [
    {id:'J-001', backend:'ibm_oslo', status:'queued', shots:1024, submitted_at:'2025-08-18T10:12:00Z'},
    {id:'J-002', backend:'ibm_perth', status:'running', shots:4096, submitted_at:'2025-08-18T11:03:25Z'},
    {id:'J-003', backend:'ibm_torino', status:'completed', shots:2048, submitted_at:'2025-08-18T12:45:10Z'},
    {id:'J-004', backend:'simulator_statevector', status:'completed', shots:0, submitted_at:'2025-08-18T13:01:44Z'}
  ]
};

let DATA = { backends:[], jobs:[] };
let SORT = { key:'submitted_at', dir:'desc' };
let chart;

function setMsg(t){ $('#msg').textContent = t || ''; }
function apiBase(){ return $('#apiUrl').value.replace(/\/$/,''); }

async function fetchJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(r.status+': '+url);
  return r.json();
}

async function loadData(){
  try{
    const base = apiBase();
    const [backs, jobs] = await Promise.all([
      fetchJSON(base+'/backends'),
      fetchJSON(base+'/jobs')
    ]);
    DATA.backends = backs; DATA.jobs = jobs;
    setMsg('Loaded from API');
  }catch(e){
    console.warn('API failed, using fallback:', e.message);
    DATA = structuredClone(FALLBACK);
    setMsg('Using embedded mock data');
  }
}

function populateFilters(){
  const sel = $('#backend');
  const opts = ['<option value="">All backends</option>']
    .concat(DATA.backends.map(b=>`<option>${b.name}</option>`));
  sel.innerHTML = opts.join('');
}

function applyFilters(){
  const backend = $('#backend').value;
  const status  = $('#status').value;
  const search  = $('#search').value.trim().toLowerCase();
  let rows = [...DATA.jobs];
  if(backend) rows = rows.filter(j=>j.backend===backend);
  if(status)  rows = rows.filter(j=>j.status===status);
  if(search)  rows = rows.filter(j=> j.id.toLowerCase().includes(search) );

  // Sorting
  rows.sort((a,b)=>{
    const k = SORT.key; const dir = SORT.dir==='asc'?1:-1;
    const av = a[k], bv = b[k];
    if(k==='shots') return (av-bv)*dir;
    if(k==='submitted_at') return (new Date(av)-new Date(bv))*dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  // KPIs
  $('#k_total').textContent = rows.length;
  $('#k_queued').textContent = rows.filter(x=>x.status==='queued').length;
  $('#k_running').textContent = rows.filter(x=>x.status==='running').length;
  $('#k_completed').textContent = rows.filter(x=>x.status==='completed').length;

  // Table
  $('#tbody').innerHTML = rows.map(j=>`
    <tr>
      <td>${j.id}</td>
      <td>${j.backend}</td>
      <td>${statusChip(j.status)}</td>
      <td class="right">${j.shots}</td>
      <td>${fmtDate(j.submitted_at)}</td>
    </tr>`).join('');

  drawBackends();
  drawChart();
}

function drawBackends(){
  const el = $('#backendList');
  el.innerHTML = DATA.backends.map(b=>{
    const depth = Number(b.queue_depth||0);
    const pct = Math.max(2, Math.min(100, (depth/30)*100));
    const state = b.status==='online'? 'ok' : 'bad';
    return `<div class="backend">
      <span class="chip ${state}">${b.status}</span>
      <strong>${b.name}</strong>
      <div class="bar" title="Queue depth: ${depth}"><span style="width:${pct}%"></span></div>
      <span class="muted">${b.num_qubits} qubits</span>
    </div>`;
  }).join('');
}

function drawChart(){
  const c = $('#statusChart');
  const counts = ['queued','running','completed','failed']
    .map(s => DATA.jobs.filter(j=>j.status===s).length);
  const data = {
    labels:['Queued','Running','Completed','Failed'],
    datasets:[{ label:'Jobs', data:counts }]
  };
  if(chart){ chart.destroy(); }
  chart = new Chart(c, { type:'bar', data,
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{ display:false } }, y:{ ticks:{ precision:0 } } }
    }
  });
}

function bind(){
  $('#backend').addEventListener('change', applyFilters);
  $('#status').addEventListener('change', applyFilters);
  $('#search').addEventListener('input', applyFilters);
  $('#refresh').addEventListener('click', async()=>{
    setMsg('Refreshing…'); 
    await loadData(); 
    populateFilters(); 
    applyFilters();
  });

  // Sorting
  $$('#jobsTable th').forEach(th=>{
    th.style.cursor='pointer';
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort; // id, backend, status, shots, submitted_at
      SORT.key = key;
      SORT.dir = (SORT.dir==='asc'?'desc':'asc');
      applyFilters();
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    if(e.key==='/' && !e.metaKey && !e.ctrlKey){ e.preventDefault(); $('#search').focus(); }
    if(e.key==='r' && !e.metaKey && !e.ctrlKey){ e.preventDefault(); $('#refresh').click(); }
  });

  // Theme toggle
  $('#theme').addEventListener('click', ()=>{
    const root = document.documentElement;
    const isLight = root.classList.toggle('light');
    localStorage.setItem('theme', isLight?'light':'dark');
    applyFilters();
  });

  // Load persisted theme
  if(localStorage.getItem('theme')==='light') document.documentElement.classList.add('light');

  // Auto refresh
  setInterval(async()=>{ await loadData(); applyFilters(); }, 30000);
}

(async function init(){
  bind();
  await loadData();
  populateFilters();
  applyFilters();
})();
