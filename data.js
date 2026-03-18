const DATA_KEY='dashboardAtivaData';
function loadData(){const r=localStorage.getItem(DATA_KEY);return r?JSON.parse(r):[]}
function saveData(d){localStorage.setItem(DATA_KEY,JSON.stringify(d))}
function addEntry(e){const d=loadData();e.id=Date.now()+'_'+Math.random().toString(36).substr(2,5);d.push(e);saveData(d);return e}
function removeEntry(id){saveData(loadData().filter(d=>d.id!==id))}
function getByCategory(c){return loadData().filter(d=>d.categoria===c)}

function initTestData(){
  if(loadData().length>0)return;
  saveData([
    {id:'t1',data:'2026-03-01',categoria:'Clientes',tipo:'Faturamento',nome:'Empresa Alpha LTDA',descricao:'Venda de materiais elétricos',valor:15200},
    {id:'t2',data:'2026-03-05',categoria:'Clientes',tipo:'Faturamento',nome:'Comércio Beta ME',descricao:'Revenda de iluminação LED',valor:8750.5},
    {id:'t3',data:'2026-03-10',categoria:'Clientes',tipo:'Faturamento',nome:'Construtora Gama S.A.',descricao:'Projeto completo de fiação',valor:32000},
    {id:'t4',data:'2026-03-12',categoria:'Clientes',tipo:'Faturamento',nome:'Distribuidora Delta',descricao:'Lote de cabos e conectores',valor:5430},
    {id:'t5',data:'2026-03-15',categoria:'Clientes',tipo:'Faturamento',nome:'Empresa Alpha LTDA',descricao:'Manutenção preventiva',valor:4800},
    {id:'t6',data:'2026-03-17',categoria:'Clientes',tipo:'Faturamento',nome:'TechSol Engenharia',descricao:'Instalação elétrica industrial',valor:18500},
    {id:'t7',data:'2026-03-18',categoria:'Clientes',tipo:'Faturamento',nome:'Comércio Beta ME',descricao:'Lâmpadas e luminárias',valor:6200},
    {id:'t8',data:'2026-03-01',categoria:'Funcionários',tipo:'Despesa',nome:'Macai',descricao:'Salário mensal',valor:3500},
    {id:'t9',data:'2026-03-01',categoria:'Funcionários',tipo:'Despesa',nome:'Hamilton',descricao:'Salário mensal',valor:4200},
    {id:'t10',data:'2026-03-01',categoria:'Funcionários',tipo:'Despesa',nome:'Joice',descricao:'Salário mensal',valor:3800},
    {id:'t11',data:'2026-03-01',categoria:'Funcionários',tipo:'Despesa',nome:'Peninha',descricao:'Salário mensal',valor:3200},
    {id:'t12',data:'2026-03-05',categoria:'Funcionários',tipo:'Faturamento',nome:'Binladem',descricao:'Comissão venda externa',valor:1200},
    {id:'t13',data:'2026-03-05',categoria:'Funcionários',tipo:'Despesa',nome:'Baixinho',descricao:'Salário mensal',valor:3000},
    {id:'t14',data:'2026-03-10',categoria:'Funcionários',tipo:'Faturamento',nome:'Macai',descricao:'Comissão instalação',valor:950},
    {id:'t15',data:'2026-03-15',categoria:'Funcionários',tipo:'Faturamento',nome:'Hamilton',descricao:'Bônus meta atingida',valor:2100},
    {id:'t16',data:'2026-03-02',categoria:'Outros',tipo:'Despesa',nome:'Aluguel Galpão',descricao:'Aluguel do galpão principal',valor:6500},
    {id:'t17',data:'2026-03-03',categoria:'Outros',tipo:'Despesa',nome:'Conta de Energia',descricao:'Fatura mensal',valor:1850.75},
    {id:'t18',data:'2026-03-08',categoria:'Outros',tipo:'Faturamento',nome:'Venda de Sucata',descricao:'Material reciclável',valor:2300},
    {id:'t19',data:'2026-03-14',categoria:'Outros',tipo:'Despesa',nome:'Manutenção Veículos',descricao:'Troca de óleo e pneus',valor:4100},
    {id:'t20',data:'2026-03-18',categoria:'Outros',tipo:'Despesa',nome:'Material Escritório',descricao:'Papelaria e suprimentos',valor:680}
  ]);
}

// === FILTROS ===
function filterByPeriod(data,period){
  const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const toStr=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayStr=toStr(today);
  switch(period){
    case 'day':return data.filter(d=>d.data===todayStr);
    case 'week':
      const ws=new Date(today);const dow=ws.getDay();ws.setDate(ws.getDate()-(dow===0?6:dow-1));
      const wsStr=toStr(ws);return data.filter(d=>d.data>=wsStr&&d.data<=todayStr);
    case 'month':
      const ms=toStr(new Date(today.getFullYear(),today.getMonth(),1));
      return data.filter(d=>d.data>=ms&&d.data<=todayStr);
    default:return data;
  }
}

function getPrevPeriodData(data,period){
  const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const toStr=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  switch(period){
    case 'week':
      const ws=new Date(today);const dow=ws.getDay();ws.setDate(ws.getDate()-(dow===0?6:dow-1));
      const pe=new Date(ws);pe.setDate(pe.getDate()-1);const ps=new Date(pe);ps.setDate(ps.getDate()-6);
      return data.filter(d=>d.data>=toStr(ps)&&d.data<=toStr(pe));
    case 'month':
      const lme=new Date(today.getFullYear(),today.getMonth(),0);
      const lms=new Date(today.getFullYear(),today.getMonth()-1,1);
      return data.filter(d=>d.data>=toStr(lms)&&d.data<=toStr(lme));
    default:return[];
  }
}

function sumByType(data,tipo){return data.filter(d=>d.tipo===tipo).reduce((s,d)=>s+d.valor,0)}
function calcGrowth(cur,prev){if(prev===0)return cur>0?100:0;return((cur-prev)/prev*100)}

function getTimeSeries(data){
  const g={};data.forEach(d=>{if(!g[d.data])g[d.data]={f:0,d:0};d.tipo==='Faturamento'?g[d.data].f+=d.valor:g[d.data].d+=d.valor});
  const dates=Object.keys(g).sort();
  return{labels:dates.map(formatDateShort),faturamento:dates.map(d=>g[d].f),despesa:dates.map(d=>g[d].d)}
}

function getProfitSeries(data){
  const g={};data.forEach(d=>{if(!g[d.data])g[d.data]={f:0,d:0};d.tipo==='Faturamento'?g[d.data].f+=d.valor:g[d.data].d+=d.valor});
  const dates=Object.keys(g).sort();
  return{
    labels:dates.map(formatDateShort),
    lucro:dates.map(d=>g[d].f-g[d].d),
    margem:dates.map(d=>g[d].f>0?((g[d].f-g[d].d)/g[d].f*100):0)
  }
}

function getTopClients(data,n=5){
  const g={};data.filter(d=>d.categoria==='Clientes'&&d.tipo==='Faturamento').forEach(d=>{g[d.nome]=(g[d.nome]||0)+d.valor});
  return Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,n)
}

function getDistinctNames(data,cat){return[...new Set(data.filter(d=>d.categoria===cat).map(d=>d.nome))]}

function getEmployeeData(data,tipo){
  const nomes=['Macai','Hamilton','Joice','Peninha','Binladem','Baixinho'];
  const g={};nomes.forEach(n=>g[n]=0);
  data.filter(d=>d.categoria==='Funcionários'&&d.tipo===tipo).forEach(d=>{g[d.nome]=(g[d.nome]||0)+d.valor});
  return{names:nomes,values:nomes.map(n=>g[n])}
}

function getEmployeeOrders(data){
  const nomes=['Macai','Hamilton','Joice','Peninha','Binladem','Baixinho'];
  const g={};nomes.forEach(n=>g[n]=0);
  data.filter(d=>d.categoria==='Funcionários'&&d.tipo==='Faturamento').forEach(d=>{g[d.nome]=(g[d.nome]||0)+1});
  return{names:nomes,values:nomes.map(n=>g[n])}
}

function getOrdersSeries(data){
  const g={};data.filter(d=>d.categoria==='Clientes').forEach(d=>{g[d.data]=(g[d.data]||0)+1});
  const dates=Object.keys(g).sort();
  return{labels:dates.map(formatDateShort),values:dates.map(d=>g[d])}
}

function generateSummary(data){
  const rev=sumByType(data,'Faturamento'),exp=sumByType(data,'Despesa'),profit=rev-exp;
  const margin=rev>0?(profit/rev*100):0;const orders=data.filter(d=>d.categoria==='Clientes').length;
  const clients=getDistinctNames(data,'Clientes').length;
  let mood=margin>30?'excelente':margin>15?'positivo':margin>0?'moderado':'preocupante';
  return `A empresa apresenta desempenho <strong>${mood}</strong> com margem de lucro de <strong>${margin.toFixed(1)}%</strong>. `+
    `Faturamento de <strong>${formatCurrency(rev)}</strong> contra <strong>${formatCurrency(exp)}</strong> em despesas, `+
    `resultando em lucro de <strong>${formatCurrency(profit)}</strong>. `+
    `São <strong>${orders}</strong> pedidos de <strong>${clients}</strong> clientes ativos no período.`;
}

// === UTILITÁRIOS ===
function formatCurrency(v){return parseFloat(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function formatDateShort(s){const p=s.split('-');return p[2]+'/'+p[1]}
function formatDateFull(s){const p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0]}

function showToast(msg,type='success'){
  const old=document.querySelector('.toast');if(old)old.remove();
  const t=document.createElement('div');t.className='toast';
  const ic=type==='success'?'fa-circle-check':type==='warning'?'fa-triangle-exclamation':'fa-circle-xmark';
  t.innerHTML=`<i class="fa-solid ${ic}"></i> ${msg}`;document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400)},3000)
}

// === EXPORT/IMPORT CSV ===
function exportCSV(cat){
  const data=cat?getByCategory(cat):loadData();
  if(!data.length){showToast('Nenhum dado para exportar!','warning');return}
  const h=['Data','Categoria','Tipo','Nome','Descrição','Valor'];
  let csv='\uFEFF'+h.join(';')+'\n';
  data.forEach(d=>{csv+=[d.data,d.categoria,d.tipo,d.nome,d.descricao||'',d.valor].map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')+'\n'});
  const b=new Blob([csv],{type:'text/csv;charset=utf-8;'});const u=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=u;a.download=`dados_${cat||'todos'}_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(u);
  showToast('CSV exportado com sucesso!')
}

function importCSV(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=e=>{
      try{
        const lines=e.target.result.split('\n').filter(l=>l.trim());if(lines.length<2){reject('Arquivo vazio.');return}
        const sep=lines[0].includes(';')?';':',';const imp=[];
        for(let i=1;i<lines.length;i++){
          const c=lines[i].split(sep).map(x=>x.replace(/^"|"$/g,'').trim());if(c.length<6)continue;
          imp.push({id:Date.now()+'_'+i+'_'+Math.random().toString(36).substr(2,3),data:c[0],categoria:c[1],tipo:c[2],nome:c[3],descricao:c[4]||'',valor:parseFloat(c[5].replace(',','.'))||0})
        }
        const d=loadData();d.push(...imp);saveData(d);resolve(imp.length)
      }catch(err){reject('Erro: '+err.message)}
    };r.onerror=()=>reject('Erro ao ler arquivo.');r.readAsText(file,'UTF-8')
  })
}

document.addEventListener('DOMContentLoaded',initTestData);
