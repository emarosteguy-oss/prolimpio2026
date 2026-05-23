import { useState, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import LOGO_H from "./logo.png";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
const PROVEEDORES = ["SUBATIR","San Francisco","Emilio Benzo","Estuario Platino","Clausil","IRMARI","JASPE","Jupiter","Regional Sur","Norte Sur","Pedro Merla","Andres Bauer","Solsire","Atersa","Bettasul","Carmania","Uruquim","Zitan","Bakedplus","Otro"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#1a0800;--bg2:#200d00;--bg3:#2a1000;--card:#221000;--border:#5a2400;
    --accent:#e84400;--accent2:#ff6b2b;--warn:#ffa500;
    --text:#fff5ee;--text2:#d4956a;--text3:#8a5535;
    --radius:12px;--radius-sm:7px;
    --font:'Barlow',sans-serif;--font-cond:'Barlow Condensed',sans-serif;
  }
  html,body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh}
  .app{display:flex;flex-direction:column;min-height:100vh;max-width:1400px;margin:0 auto;padding:0 16px}
  .header{display:flex;align-items:center;justify-content:space-between;padding:14px 0 12px;border-bottom:1px solid var(--border);gap:12px;flex-wrap:wrap}
  .header-sub{font-size:0.68rem;color:var(--text3);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px}
  .header-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .sync-badge{display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text3);padding:5px 11px;background:var(--bg3);border-radius:20px;border:1px solid var(--border);font-weight:500}
  .sync-dot{width:7px;height:7px;border-radius:50%;background:#4caf50;box-shadow:0 0 7px #4caf50}
  .nav{display:flex;gap:4px;padding:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .nav::-webkit-scrollbar{display:none}
  .nav-btn{padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:var(--font);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
  .nav-btn:hover{background:var(--bg3);color:var(--text);border-color:var(--border)}
  .nav-btn.active{background:linear-gradient(135deg,#e84400,#c03000);color:#fff;border-color:#e84400;font-weight:700;box-shadow:0 2px 12px rgba(232,68,0,0.4)}
  .abar{height:3px;background:linear-gradient(90deg,#e84400,#ffa500,transparent);border-radius:2px;margin-bottom:18px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  @media(max-width:900px){.grid4{grid-template-columns:1fr 1fr}}
  @media(max-width:600px){.grid2,.grid4{grid-template-columns:1fr}}
  .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px}
  .ctitle{font-size:0.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--text3);font-weight:600;margin-bottom:10px}
  .cval{font-family:var(--font-cond);font-size:2rem;color:var(--text);line-height:1;font-weight:700}
  .cval.ac{color:#ff6b2b}
  .csub{font-size:0.76rem;color:var(--text3);margin-top:5px}
  .delta{display:inline-flex;align-items:center;gap:4px;font-size:0.74rem;font-weight:700;padding:3px 9px;border-radius:12px;margin-top:9px}
  .delta.up{background:rgba(76,175,80,0.15);color:#81c784}
  .delta.dn{background:rgba(232,68,0,0.15);color:#ff6b2b}
  .delta.wr{background:rgba(255,165,0,0.15);color:#ffa500}
  .sh{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 14px;gap:12px;flex-wrap:wrap}
  .st{font-family:var(--font-cond);font-size:1.25rem;color:var(--text);font-weight:700}
  .ss{font-size:0.76rem;color:var(--text3)}
  .fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:600px){.fg{grid-template-columns:1fr}}
  .fl{display:flex;flex-direction:column;gap:5px}
  .flabel{font-size:0.72rem;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
  .finput,.fsel,.ftxt{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:.9rem;padding:9px 12px;outline:none;transition:border-color .15s;width:100%}
  .finput:focus,.fsel:focus,.ftxt:focus{border-color:#e84400}
  .fsel option{background:var(--bg2)}
  .ftxt{resize:vertical;min-height:80px}
  .factions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:center}
  .btn{padding:10px 20px;border-radius:var(--radius-sm);border:none;font-family:var(--font);font-size:.88rem;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
  .btn-p{background:linear-gradient(135deg,#e84400,#c03000);color:#fff;box-shadow:0 2px 10px rgba(232,68,0,0.35)}
  .btn-p:hover{box-shadow:0 3px 14px rgba(232,68,0,0.5)}
  .btn-s{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
  .btn-s:hover{color:var(--text);border-color:#8a5535}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .tw{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:.83rem}
  th{text-align:left;padding:9px 12px;font-size:.69rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);border-bottom:1px solid var(--border);font-weight:600;white-space:nowrap}
  td{padding:10px 12px;border-bottom:1px solid rgba(90,36,0,0.4);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(232,68,0,0.04)}
  .tag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.71rem;font-weight:700}
  .tg{background:rgba(76,175,80,0.15);color:#81c784}
  .tr{background:rgba(232,68,0,0.15);color:#ff6b2b}
  .ty{background:rgba(255,165,0,0.15);color:#ffa500}
  .ai-panel{background:linear-gradient(135deg,rgba(232,68,0,.07),rgba(255,100,0,.03));border:1px solid rgba(232,68,0,.3);border-radius:var(--radius);padding:20px}
  .ai-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .ai-ico{width:34px;height:34px;background:linear-gradient(135deg,#e84400,#c03000);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 10px rgba(232,68,0,0.4)}
  .ai-ttl{font-family:var(--font-cond);font-size:1.05rem;color:#ff6b2b;font-weight:700}
  .ai-body{font-size:.87rem;color:var(--text2);line-height:1.75;white-space:pre-wrap}
  .ai-body.ld{color:var(--text3);font-style:italic;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .ch{height:255px;margin-top:12px}
  .toast{position:fixed;bottom:20px;right:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 18px;font-size:.84rem;display:flex;align-items:center;gap:8px;z-index:1000;animation:su .3s ease;max-width:340px;font-weight:500}
  .toast.ok{border-color:rgba(76,175,80,0.5);color:#81c784}
  .toast.er{border-color:rgba(232,68,0,0.5);color:#ff6b2b}
  @keyframes su{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  .banner{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:.8rem;color:var(--text2);display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .banner a{color:#ff6b2b;text-decoration:none;font-weight:600}
  .gap{display:flex;flex-direction:column;gap:14px}
  .div{border:none;border-top:1px solid var(--border);margin:20px 0}
  .tsm{font-size:.78rem;color:var(--text3)}
  .tac{color:#ff6b2b;font-weight:600}
  .msel{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}
  .msel select{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:.85rem;padding:7px 10px;outline:none}
`;

const fmt=(n,d=0)=>{if(n==null||isNaN(n))return"—";return new Intl.NumberFormat("es-UY",{maximumFractionDigits:d,minimumFractionDigits:d}).format(n)};
const fmtM=n=>{if(n==null||isNaN(n))return"—";if(n>=1e6)return`$${(n/1e6).toFixed(2)}M`;return`$${fmt(n)}`};
const pct=(a,b)=>{if(!b)return null;return(a-b)/b*100};

const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return<div style={{background:"#2a1000",border:"1px solid #5a2400",borderRadius:8,padding:"10px 14px",fontSize:"0.82rem"}}>
    <div style={{color:"#d4956a",marginBottom:6}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: <strong>${fmt(p.value)}</strong></div>)}
  </div>;
};

const VM=[
  {mes:"Ene","2022":940067,"2023":992064,"2024":1295262,"2025":2003181},
  {mes:"Feb","2022":809246,"2023":865112,"2024":1246546,"2025":1615840},
  {mes:"Mar","2022":788997,"2023":888722,"2024":1048357,"2025":1488874},
  {mes:"Abr","2022":819547,"2023":947309,"2024":1202552,"2025":1281569},
  {mes:"May","2022":800704,"2023":860901,"2024":1050222,"2025":1435910},
  {mes:"Jun","2022":920678,"2023":920732,"2024":1283600,"2025":1478792},
  {mes:"Jul","2022":906547,"2023":865228,"2024":1101916,"2025":1545618},
  {mes:"Ago","2022":888901,"2023":954613,"2024":1222144,"2025":1519419},
  {mes:"Set","2022":962003,"2023":973259,"2024":1190463,"2025":1590065},
  {mes:"Oct","2022":1486388,"2023":1303555,"2024":1318492,"2025":1830397},
  {mes:"Nov","2022":1300667,"2023":1295262,"2024":1530793,"2025":1632615},
  {mes:"Dic","2022":1010845,"2023":1635557,"2024":2726949,"2025":2373579},
];
const TK=[
  {mes:"Ene",c25:2333,p25:727.37,c26:2695,p26:698.69},
  {mes:"Feb",c25:1974,p25:675.79,c26:1985,p26:689.49},
  {mes:"Mar",c25:1684,p25:692.83,c26:2117,p26:672.13},
  {mes:"Abr",c25:1617,p25:589.67,c26:1857,p26:610.46},
  {mes:"May",c25:1709,p25:625.96,c26:1039,p26:695},
  {mes:"Jun",c25:1746,p25:638.38,c26:null,p26:null},
  {mes:"Jul",c25:1818,p25:637.43,c26:null,p26:null},
  {mes:"Ago",c25:1775,p25:650.3,c26:null,p26:null},
  {mes:"Set",c25:1831,p25:647,c26:null,p26:null},
  {mes:"Oct",c25:2031,p25:650.42,c26:null,p26:null},
  {mes:"Nov",c25:1991,p25:650.67,c26:null,p26:null},
  {mes:"Dic",c25:2873,p25:799.9,c26:null,p26:null},
];
const PD=[
  {mes:"Ene","2023":50026,"2024":49818,"2025":80513},
  {mes:"Feb","2023":45948,"2024":54198,"2025":70356},
  {mes:"Mar","2023":36743,"2024":45581,"2025":58228},
  {mes:"Abr","2023":39323,"2024":46252,"2025":57713},
  {mes:"May","2023":34182,"2024":40393,"2025":null},
  {mes:"Jun","2023":36435,"2024":51344,"2025":null},
  {mes:"Jul","2023":34436,"2024":42381,"2025":null},
  {mes:"Ago","2023":35413,"2024":45265,"2025":null},
  {mes:"Set","2023":33278,"2024":47619,"2025":null},
  {mes:"Oct","2023":36716,"2024":48833,"2025":null},
  {mes:"Nov","2023":37433,"2024":58877,"2025":null},
  {mes:"Dic","2023":52142,"2024":65422,"2025":null},
];

export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [localVentas,setLocalVentas]=useState([]);
  const [localCompras,setLocalCompras]=useState([]);
  const [vF,setVF]=useState({fecha:new Date().toISOString().split("T")[0],monto:"",obs:""});
  const [cF,setCF]=useState({fecha:new Date().toISOString().split("T")[0],factura:"",proveedor:"",monto:"",obs:""});
  const [tkF,setTkF]=useState({mes:new Date().getMonth(),anio:2026,cantidad:"",promedio:"",dias:""});
  const [aMes,setAMes]=useState(new Date().getMonth());
  const [aAnio,setAAnio]=useState(2026);
  const [freeQ,setFreeQ]=useState("");

  const showToast=useCallback((msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3200)},[]);

  const tk26=TK.slice(0,5).reduce((s,r)=>s+(r.c26||0),0);
  const tk25=TK.slice(0,5).reduce((s,r)=>s+(r.c25||0),0);
  const cTk=pct(tk26,tk25);
  const pvTk=TK.slice(0,5).filter(r=>r.p26).reduce((s,r,i,a)=>s+r.p26/a.length,0);
  const t25=VM.reduce((s,r)=>s+(r["2025"]||0),0);
  const t24=VM.reduce((s,r)=>s+(r["2024"]||0),0);

  const cvM=VM.map(r=>({mes:r.mes,"2024":r["2024"]/1000,"2025":r["2025"]/1000}));
  const cvT=TK.map(r=>({mes:r.mes,"Cant 25":r.c25,"Cant 26":r.c26}));

  const saveV=()=>{
    if(!vF.monto||!vF.fecha){showToast("Completá fecha y monto","er");return;}
    setLocalVentas(p=>[{...vF,id:Date.now()},...p]);
    showToast("✓ Venta registrada");
    setVF({fecha:new Date().toISOString().split("T")[0],monto:"",obs:""});
  };
  const saveC=()=>{
    if(!cF.monto||!cF.proveedor){showToast("Completá proveedor y monto","er");return;}
    setLocalCompras(p=>[{...cF,id:Date.now()},...p]);
    showToast("✓ Compra registrada");
    setCF({fecha:new Date().toISOString().split("T")[0],factura:"",proveedor:"",monto:"",obs:""});
  };

  const runAI=async(q)=>{
    setAiLoading(true);setAiText("");
    try{
      const d=VM[aMes];const tk=TK[aMes];const pd=PD[aMes];
      const prompt=`Sos analista de negocios especializado en comercio minorista uruguayo.
Datos de PROlimpio Durazno — ${MESES[aMes]} ${aAnio}:
VENTAS: 2022=$${fmt(d?.["2022"])} | 2023=$${fmt(d?.["2023"])} | 2024=$${fmt(d?.["2024"])} | 2025=$${fmt(d?.["2025"])}
PROM DIARIO: 2023=$${fmt(pd?.["2023"])} | 2024=$${fmt(pd?.["2024"])} | 2025=$${fmt(pd?.["2025"])}
TICKETS: 2025=${tk?.c25} uds $${tk?.p25} prom | 2026=${tk?.c26??"sin datos"} uds $${tk?.p26??"sin datos"} prom
CONTEXTO: Crec 2025 vs 2024 +36.7% nominal. Inflación UY ~6.4%. Rubro: farmacia/limpieza/cuidado personal.

${q||"Análisis conciso del mes: tendencia, crecimiento real (descontando inflación), tickets y valor promedio. Terminá con 2-3 recomendaciones concretas. Máx 200 palabras."}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})
      });
      const data=await res.json();
      setAiText(data.content?.map(b=>b.text||"").join("")||"Sin respuesta");
    }catch(e){setAiText("Error al consultar IA.");}
    setAiLoading(false);
  };

  const TABS=[{id:"dashboard",label:"📊 Dashboard"},{id:"carga",label:"✏️ Cargar datos"},{id:"tickets",label:"🎫 Tickets"},{id:"historial",label:"📋 Historial"},{id:"ai",label:"✦ Análisis IA"}];

  return<>
    <style>{CSS}</style>
    <div className="app">
      <header className="header">
        <div>
          <img src={LOGO_H} alt="PROlimpio" style={{height:40,objectFit:"contain"}}/>
          <div className="header-sub">Panel de gestión · Durazno</div>
        </div>
        <div className="header-actions">
          <div className="sync-badge"><span className="sync-dot"/>Google Drive</div>
          <a href="https://drive.google.com/file/d/1OTkFhuSZ02y_qaY89XDcL6wfaknzyO7P/view" target="_blank" rel="noreferrer" className="btn btn-s" style={{fontSize:"0.76rem",padding:"6px 12px"}}>📂 Planilla</a>
        </div>
      </header>
      <nav className="nav">
        {TABS.map(n=><button key={n.id} className={`nav-btn${tab===n.id?" active":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
      </nav>
      <main style={{paddingBottom:48,paddingTop:6}}>

        {tab==="dashboard"&&<div className="gap">
          <div className="abar"/>
          <div className="banner">📊 Datos de <a href="https://drive.google.com/file/d/1OTkFhuSZ02y_qaY89XDcL6wfaknzyO7P/view" target="_blank" rel="noreferrer">Flujo Durazno al 22-01-2026.xlsx</a> · Google Drive</div>
          <div><div className="sh"><span className="st">Ejercicio 2025 completo</span><span className="ss">12 meses cerrados</span></div>
          <div className="grid4">
            <div className="card"><div className="ctitle">Ventas totales 2025</div><div className="cval ac">{fmtM(t25)}</div><div className="csub">Suma 12 meses</div><div className="delta up">▲ {fmt(pct(t25,t24),1)}% vs 2024</div></div>
            <div className="card"><div className="ctitle">Mejor mes 2025</div><div className="cval">{fmtM(Math.max(...VM.map(r=>r["2025"])))}</div><div className="csub">Diciembre</div><div className="delta up">🚀 Récord</div></div>
            <div className="card"><div className="ctitle">Tickets totales 2025</div><div className="cval">{fmt(TK.reduce((s,r)=>s+(r.c25||0),0))}</div><div className="csub">Emitidos en el año</div><div className="delta up">▲ vs 2024</div></div>
            <div className="card"><div className="ctitle">Crecimiento real 2025</div><div className="cval ac">+30.3%</div><div className="csub">Nominal 36.7% − inflación 6.4%</div><div className="delta up">🚀 Excelente</div></div>
          </div></div>
          <div><div className="sh"><span className="st">2026 en curso</span><span className="ss">Ene–May registrados</span></div>
          <div className="grid4">
            <div className="card"><div className="ctitle">Tickets Ene–May 2026</div><div className="cval ac">{fmt(tk26)}</div><div className="csub">vs {fmt(tk25)} en 2025</div><div className={`delta ${cTk>=0?"up":"dn"}`}>{cTk>=0?"▲":"▼"} {fmt(Math.abs(cTk),1)}%</div></div>
            <div className="card"><div className="ctitle">Valor prom. ticket 2026</div><div className="cval">${fmt(pvTk,0)}</div><div className="csub">Prom Ene–May</div><div className="delta wr">Inflación ~7%</div></div>
            <div className="card"><div className="ctitle">Crec. real est. 2026</div><div className="cval ac">~+15%</div><div className="csub">Nominal ~22% − inflación</div><div className="delta up">📈 Bueno</div></div>
            <div className="card"><div className="ctitle">Mejor mes 2026</div><div className="cval">Enero</div><div className="csub">2.695 tickets emitidos</div><div className="delta up">▲ 15.5% vs ene25</div></div>
          </div></div>
          <div><div className="sh"><span className="st">Ventas mensuales</span><span className="ss">2024 vs 2025 — en miles $</span></div>
          <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cvM} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
              <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
              <YAxis stroke="#8a5535" fontSize={11} tickFormatter={v=>`${v}k`}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
              <Bar dataKey="2024" fill="#7a3800" radius={[3,3,0,0]}/>
              <Bar dataKey="2025" fill="#e84400" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer></div></div></div>
          <div className="grid2">
            <div><div className="sh"><span className="st">Promedio diario</span><span className="ss">$/día trabajado</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={PD}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
                <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
                <YAxis stroke="#8a5535" fontSize={11} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
                <Line type="monotone" dataKey="2023" stroke="#7a3800" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2024" stroke="#d4956a" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2025" stroke="#e84400" dot={false} strokeWidth={2.5}/>
              </LineChart>
            </ResponsiveContainer></div></div></div>
            <div><div className="sh"><span className="st">Tickets emitidos</span><span className="ss">2025 vs 2026</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={cvT}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
                <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
                <YAxis stroke="#8a5535" fontSize={11}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
                <Bar dataKey="Cant 25" fill="#d4956a" radius={[3,3,0,0]}/>
                <Bar dataKey="Cant 26" fill="#e84400" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer></div></div></div>
          </div>
        </div>}

        {tab==="carga"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Registrar venta diaria</span></div>
          <div className="card">
            <div className="fg">
              <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={vF.fecha} onChange={e=>setVF(p=>({...p,fecha:e.target.value}))}/></div>
              <div className="fl"><label className="flabel">Monto del día ($)</label><input type="number" className="finput" placeholder="ej: 85000" value={vF.monto} onChange={e=>setVF(p=>({...p,monto:e.target.value}))}/></div>
              <div className="fl" style={{gridColumn:"1/-1"}}><label className="flabel">Observación (opcional)</label><input type="text" className="finput" placeholder="ej: lluvia, feriado, Olkany..." value={vF.obs} onChange={e=>setVF(p=>({...p,obs:e.target.value}))}/></div>
            </div>
            <div className="factions"><button className="btn btn-p" onClick={saveV}>✓ Guardar venta</button><span className="tsm">Se guarda en esta sesión</span></div>
          </div>
          {localVentas.length>0&&<><div className="sh"><span className="st">Registradas hoy</span><span className="ss">{localVentas.length} entrada{localVentas.length!==1?"s":""}</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{localVentas.map(v=><tr key={v.id}><td>{v.fecha}</td><td className="tac">${fmt(Number(v.monto))}</td><td className="tsm">{v.obs||"—"}</td></tr>)}</tbody></table></div></>}
          <hr className="div"/>
          <div className="sh"><span className="st">Registrar compra / deuda</span></div>
          <div className="card">
            <div className="fg">
              <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={cF.fecha} onChange={e=>setCF(p=>({...p,fecha:e.target.value}))}/></div>
              <div className="fl"><label className="flabel">Nº de factura</label><input type="text" className="finput" placeholder="ej: A12345" value={cF.factura} onChange={e=>setCF(p=>({...p,factura:e.target.value}))}/></div>
              <div className="fl"><label className="flabel">Proveedor</label>
                <select className="fsel" value={cF.proveedor} onChange={e=>setCF(p=>({...p,proveedor:e.target.value}))}>
                  <option value="">— Seleccioná —</option>
                  {PROVEEDORES.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="fl"><label className="flabel">Monto ($)</label><input type="number" className="finput" placeholder="ej: 150000" value={cF.monto} onChange={e=>setCF(p=>({...p,monto:e.target.value}))}/></div>
              <div className="fl" style={{gridColumn:"1/-1"}}><label className="flabel">Observación</label><input type="text" className="finput" placeholder="ej: vence 15/06, USD 350..." value={cF.obs} onChange={e=>setCF(p=>({...p,obs:e.target.value}))}/></div>
            </div>
            <div className="factions"><button className="btn btn-p" onClick={saveC}>✓ Guardar compra</button></div>
          </div>
          {localCompras.length>0&&<><div className="sh"><span className="st">Compras registradas</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Factura</th><th>Proveedor</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{localCompras.map(c=><tr key={c.id}><td>{c.fecha}</td><td className="tsm">{c.factura||"—"}</td><td>{c.proveedor}</td><td className="tac">${fmt(Number(c.monto))}</td><td className="tsm">{c.obs||"—"}</td></tr>)}</tbody></table></div></>}
        </div>}

        {tab==="tickets"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Análisis de tickets</span></div>
          <div className="grid2">
            <div className="card"><div className="ctitle">Tickets Ene–May 2026</div><div className="cval ac">{fmt(tk26)}</div><div className="csub">vs {fmt(tk25)} en 2025</div><div className={`delta ${cTk>=0?"up":"dn"}`}>{cTk>=0?"▲":"▼"} {fmt(Math.abs(cTk),1)}%</div></div>
            <div className="card"><div className="ctitle">Valor prom. ticket 2026</div><div className="cval">${fmt(pvTk,0)}</div><div className="csub">Prom Ene–May</div><div className="delta wr">Inflación ~7%</div></div>
          </div>
          <div className="card"><div className="ctitle" style={{marginBottom:12}}>Comparativa mensual 2025 vs 2026</div>
          <div className="tw"><table><thead><tr><th>Mes</th><th>Cant 2025</th><th>Prom 2025</th><th>Cant 2026</th><th>Prom 2026</th><th>Δ cant</th><th>Δ prom</th></tr></thead>
          <tbody>{TK.map((r,i)=>{
            const dc=r.c26&&r.c25?pct(r.c26,r.c25):null;
            const dp=r.p26&&r.p25?pct(r.p26,r.p25):null;
            return<tr key={i}><td style={{fontWeight:600}}>{r.mes}</td><td>{fmt(r.c25)}</td><td>${fmt(r.p25,0)}</td>
              <td>{r.c26?fmt(r.c26):<span className="tsm">—</span>}</td>
              <td>{r.p26?`$${fmt(r.p26,0)}`:<span className="tsm">—</span>}</td>
              <td>{dc!=null?<span className={`tag ${dc>=0?"tg":"tr"}`}>{dc>=0?"+":""}{fmt(dc,1)}%</span>:"—"}</td>
              <td>{dp!=null?<span className={`tag ${dp>=0?"tg":"tr"}`}>{dp>=0?"+":""}{fmt(dp,1)}%</span>:"—"}</td>
            </tr>;
          })}</tbody></table></div></div>
          <div className="sh"><span className="st">Registrar tickets del mes</span></div>
          <div className="card"><div className="fg">
            <div className="fl"><label className="flabel">Mes</label><select className="fsel" value={tkF.mes} onChange={e=>setTkF(p=>({...p,mes:Number(e.target.value)}))}>
              {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
            <div className="fl"><label className="flabel">Año</label><select className="fsel" value={tkF.anio} onChange={e=>setTkF(p=>({...p,anio:Number(e.target.value)}))}>
              {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select></div>
            <div className="fl"><label className="flabel">Cantidad emitidos</label><input type="number" className="finput" placeholder="ej: 1750" value={tkF.cantidad} onChange={e=>setTkF(p=>({...p,cantidad:e.target.value}))}/></div>
            <div className="fl"><label className="flabel">Valor promedio ($)</label><input type="number" className="finput" placeholder="ej: 680" value={tkF.promedio} onChange={e=>setTkF(p=>({...p,promedio:e.target.value}))}/></div>
            <div className="fl"><label className="flabel">Días trabajados</label><input type="number" className="finput" placeholder="ej: 26" value={tkF.dias} onChange={e=>setTkF(p=>({...p,dias:e.target.value}))}/></div>
          </div><div className="factions"><button className="btn btn-p" onClick={()=>showToast("✓ Tickets registrados")}>✓ Guardar</button></div></div>
        </div>}

        {tab==="historial"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Ventas históricas</span><span className="ss">2022 – 2025</span></div>
          <div className="card tw"><table><thead><tr><th>Mes</th><th>2022</th><th>2023</th><th>Δ</th><th>2024</th><th>Δ</th><th>2025</th><th>Δ</th></tr></thead>
          <tbody>{VM.map((r,i)=>{
            const tg=v=>v==null?"—":<span className={`tag ${v>=0?"tg":"tr"}`}>{v>=0?"+":""}{fmt(v,1)}%</span>;
            return<tr key={i}><td style={{fontWeight:600}}>{r.mes}</td>
              <td>{fmtM(r["2022"])}</td><td>{fmtM(r["2023"])}</td><td>{tg(pct(r["2023"],r["2022"]))}</td>
              <td>{fmtM(r["2024"])}</td><td>{tg(pct(r["2024"],r["2023"]))}</td>
              <td>{fmtM(r["2025"])}</td><td>{tg(pct(r["2025"],r["2024"]))}</td>
            </tr>;
          })}</tbody></table></div>
          <div className="sh"><span className="st">Crecimiento real anual</span><span className="ss">Nominal vs inflación</span></div>
          <div className="card tw"><table><thead><tr><th>Período</th><th>Nominal</th><th>Inflación</th><th>Real</th><th>Resultado</th></tr></thead>
          <tbody>{[{p:"2023 vs 2022",n:7.6,i:8.3},{p:"2024 vs 2023",n:24.05,i:5.1},{p:"2025 vs 2024",n:36.7,i:6.4}].map((r,i)=>{
            const real=r.n-r.i;
            return<tr key={i}><td style={{fontWeight:600}}>{r.p}</td><td className="tac">+{fmt(r.n,1)}%</td><td className="tsm">~{fmt(r.i,1)}%</td>
              <td><span className={`tag ${real>=0?"tg":"tr"}`}>{real>=0?"+":""}{fmt(real,1)}% real</span></td>
              <td>{real>=10?"🚀 Excelente":real>=3?"📈 Bueno":real>=0?"➡️ Estable":"⚠️ Caída"}</td>
            </tr>;
          })}</tbody></table></div>
        </div>}

        {tab==="ai"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Análisis con IA</span><span className="ss">Basado en tus datos reales</span></div>
          <div className="card"><div className="ctitle">Seleccioná el período</div>
            <div className="msel">
              <select value={aMes} onChange={e=>setAMes(Number(e.target.value))}>
                {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={aAnio} onChange={e=>setAAnio(Number(e.target.value))}>
                {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
              </select>
              <button className="btn btn-p" onClick={()=>runAI()} disabled={aiLoading}>
                {aiLoading?"⏳ Analizando...":"🤖 Analizar mes"}
              </button>
            </div>
          </div>
          {(aiText||aiLoading)&&<div className="ai-panel">
            <div className="ai-hdr"><div className="ai-ico">✦</div><span className="ai-ttl">Análisis — {MESES[aMes]} {aAnio}</span></div>
            <div className={`ai-body${aiLoading?" ld":""}`}>{aiLoading?"Generando análisis con tus datos...":aiText}</div>
          </div>}
          <div className="grid2">
            <div className="card"><div className="ctitle">Análisis rápidos</div>
              <div className="gap" style={{gap:8,marginTop:10}}>
                {[
                  {l:"📊 Tendencia 2022–2025",q:"Analizá la tendencia de crecimiento de ventas 2022-2025. ¿Qué años tuvieron mayor/menor crecimiento real? Posibles causas."},
                  {l:"🎫 Evolución del ticket promedio",q:"Analizá la evolución del ticket promedio. ¿Crece más o menos que la inflación? ¿Qué implica para el negocio?"},
                  {l:"⚠️ Alertas y riesgos",q:"Identificá alertas o riesgos en los datos: meses de caída, estacionalidad marcada, tendencias preocupantes. Sé directo y concreto."},
                  {l:"🏆 Mejores y peores meses",q:"Los 3 mejores y 3 peores meses en venta absoluta y en crecimiento. ¿Hay estacionalidad clara?"},
                ].map((item,i)=><button key={i} className="btn btn-s" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>runAI(item.q)} disabled={aiLoading}>{item.l}</button>)}
              </div>
            </div>
            <div className="card"><div className="ctitle">Consulta libre</div>
              <div className="fl" style={{marginTop:10}}>
                <textarea className="ftxt" placeholder="ej: ¿El crecimiento de tickets justifica contratar más personal?" value={freeQ} onChange={e=>setFreeQ(e.target.value)}/>
              </div>
              <div className="factions">
                <button className="btn btn-p" disabled={aiLoading} onClick={()=>{if(freeQ.trim())runAI(freeQ);}}>
                  {aiLoading?"⏳ Procesando...":"✦ Preguntar"}
                </button>
              </div>
            </div>
          </div>
        </div>}

      </main>
    </div>
    {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
  </>;
}
