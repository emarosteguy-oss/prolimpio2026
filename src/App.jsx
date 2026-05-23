import { useState, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const LOGO_H = "data:image/png;base64,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";

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
