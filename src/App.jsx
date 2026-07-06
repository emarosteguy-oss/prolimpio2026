import { useState, useCallback, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import LOGO_H from "./logo.png";

const CLIENT_ID = "590485373332-ft5l9d7md2ggoluku7pa8936cu6qlilg.apps.googleusercontent.com";
const SHEET_ID  = "1RFLpLV_HKC6fLFe1LA0xNcYIjBZ3yJcV8OqvmvzrvQ0";
const SCOPES    = "https://www.googleapis.com/auth/spreadsheets";

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
  .sync-badge{display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text3);padding:5px 11px;background:var(--bg3);border-radius:20px;border:1px solid var(--border);font-weight:500;cursor:pointer;transition:all .15s}
  .sync-badge:hover{border-color:var(--accent);color:var(--text2)}
  .sync-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .sync-dot.green{background:#4caf50;box-shadow:0 0 7px #4caf50}
  .sync-dot.orange{background:#ffa500;box-shadow:0 0 7px #ffa500;animation:pulse 1s infinite}
  .sync-dot.red{background:#f44336;box-shadow:0 0 7px #f44336}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .nav{display:flex;gap:4px;padding:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .nav::-webkit-scrollbar{display:none}
  .nav-btn{padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:var(--font);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
  .nav-btn:hover{background:var(--bg3);color:var(--text)}
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
  .login-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:20px;text-align:center}
  .login-logo{height:60px;margin-bottom:8px}
  .login-title{font-family:var(--font-cond);font-size:1.6rem;color:var(--text);font-weight:700}
  .login-sub{font-size:.88rem;color:var(--text3);max-width:320px;line-height:1.6}
  .login-btn{background:linear-gradient(135deg,#e84400,#c03000);color:#fff;border:none;padding:14px 32px;border-radius:var(--radius-sm);font-family:var(--font);font-size:1rem;font-weight:700;cursor:pointer;box-shadow:0 3px 14px rgba(232,68,0,0.4);display:flex;align-items:center;gap:10px}
  .sheet-rows{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .sheet-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg3);border-radius:var(--radius-sm);font-size:.83rem}
  .sheet-row span{color:var(--text3);font-size:.75rem}
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
  {mes:"Ene","2022":939803,"2023":1300667,"2024":1295262,"2025":2003181,"2026":2373579},
  {mes:"Feb","2022":919055,"2023":1010845,"2024":1246546,"2025":1615840,"2026":1710114},
  {mes:"Mar","2022":914519,"2023":992064,"2024":1048357,"2025":1488874,"2026":1884301},
  {mes:"Abr","2022":809246,"2023":865112,"2024":1202552,"2025":1281569,"2026":1620824},
  {mes:"May","2022":788997,"2023":888722,"2024":1050222,"2025":1435910,"2026":1572417},
  {mes:"Jun","2022":819547,"2023":947309,"2024":1283600,"2025":1478792,"2026":1660029},
  {mes:"Jul","2022":800704,"2023":860901,"2024":1101916,"2025":1545618,"2026":null},
  {mes:"Ago","2022":920678,"2023":920732,"2024":1222144,"2025":1519419,"2026":null},
  {mes:"Set","2022":906547,"2023":865228,"2024":1190463,"2025":1590065,"2026":null},
  {mes:"Oct","2022":888901,"2023":954613,"2024":1318492,"2025":1830397,"2026":null},
  {mes:"Nov","2022":962003,"2023":973259,"2024":1530793,"2025":1632615,"2026":null},
  {mes:"Dic","2022":1486388,"2023":1303555,"2024":1635557,"2025":2726949,"2026":null},
];
const TK=[
  {mes:"Ene",c25:2333,p25:727.37,c26:2695,p26:698.69},
  {mes:"Feb",c25:1974,p25:675.79,c26:1985,p26:689.49},
  {mes:"Mar",c25:1684,p25:692.83,c26:2117,p26:672.13},
  {mes:"Abr",c25:1617,p25:589.67,c26:1857,p26:610.46},
  {mes:"May",c25:1709,p25:625.96,c26:1677,p26:676.08},
  {mes:"Jun",c25:1746,p25:638.38,c26:1835,p26:659},
  {mes:"Jul",c25:1818,p25:637.43,c26:null,p26:null},
  {mes:"Ago",c25:1775,p25:650.3,c26:null,p26:null},
  {mes:"Set",c25:1831,p25:647,c26:null,p26:null},
  {mes:"Oct",c25:2031,p25:650.42,c26:null,p26:null},
  {mes:"Nov",c25:1991,p25:650.67,c26:null,p26:null},
  {mes:"Dic",c25:2873,p25:799.9,c26:null,p26:null},
];

// Días hábiles por mes (lunes a sábado) por año
const DIAS_HABILES = {
  "2025": {Ene:25,Feb:24,Mar:27,Abr:26,May:26,Jun:26,Jul:27,Ago:26,Set:25,Oct:27,Nov:25,Dic:25},
  "2026": {Ene:22,Feb:20,Mar:25,Abr:22,May:26,Jun:25,Jul:26,Ago:26,Set:25,Oct:26,Nov:25,Dic:25},
};

// Promedio diario hábil por mes
const promDiarioHabil = (ventas, mes, anio) => {
  const dias = DIAS_HABILES[String(anio)]?.[mes];
  if(!dias || !ventas) return null;
  return ventas / dias;
};
const PD=[
  {mes:"Ene","2024":49818,"2025":80513,"2026":107890},
  {mes:"Feb","2024":54198,"2025":70356,"2026":85506},
  {mes:"Mar","2024":45581,"2025":58228,"2026":75372},
  {mes:"Abr","2024":46252,"2025":57713,"2026":73674},
  {mes:"May","2024":40393,"2025":55228,"2026":60478},
  {mes:"Jun","2024":51344,"2025":56877,"2026":63847},
  {mes:"Jul","2024":42381,"2025":null,"2026":null},
  {mes:"Ago","2024":45265,"2025":null,"2026":null},
  {mes:"Set","2024":47619,"2025":null,"2026":null},
  {mes:"Oct","2024":48833,"2025":null,"2026":null},
  {mes:"Nov","2024":58877,"2025":null,"2026":null},
  {mes:"Dic","2024":65422,"2025":null,"2026":null},
];

// ── Google Sheets API helpers ─────────────────────────────────────────────
const gapi_append = async (token, sheet, values) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [values] }),
  });
  return res.ok;
};

const gapi_read = async (token, range) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.values || [];
};

const gapi_delete_row = async (token, sheetGid, rowIndex) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ deleteDimension: { range: {
      sheetId: sheetGid, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1
    }}}]})
  });
  return res.ok;
};

export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [token,setToken]=useState(null);
  const [syncStatus,setSyncStatus]=useState("disconnected"); // disconnected | syncing | ok | error
  const [sheetVentas,setSheetVentas]=useState([]);
  const [sheetCompras,setSheetCompras]=useState([]);
  const [sheetTickets,setSheetTickets]=useState([]);
  const [sheetGids,setSheetGids]=useState({Ventas:0,Compras:1,Tickets:2});
  const [vF,setVF]=useState({fecha:new Date().toISOString().split("T")[0],monto:"",obs:""});
  const [cF,setCF]=useState({fecha:new Date().toISOString().split("T")[0],factura:"",proveedor:"",monto:"",obs:""});
  const [tkF,setTkF]=useState({mes:new Date().getMonth(),anio:2026,cantidad:"",promedio:"",dias:""});
  const [aMes,setAMes]=useState(new Date().getMonth());
  const [aAnio,setAAnio]=useState(2026);
  const [freeQ,setFreeQ]=useState("");

  const showToast=useCallback((msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3200)},[]);

  // Load Google Identity Services
  useEffect(()=>{
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.head.appendChild(script);
  },[]);

  const handleLogin = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp) => {
        if(resp.access_token){
          setToken(resp.access_token);
          setSyncStatus("syncing");
          showToast("✓ Conectado a Google Sheets");
          await loadSheetData(resp.access_token);
          setSyncStatus("ok");
        }
      },
    });
    client.requestAccessToken();
  };

  const cargarHistorico = async () => {
    if(!token){showToast("Conectate a Sheets primero","er");return;}
    setSyncStatus("syncing");
    showToast("⏳ Cargando histórico... puede tardar unos segundos");
    try {
      // Cargar encabezados primero
      await gapi_append(token,"Ventas",["Fecha","Monto","Observacion","Timestamp"]);
      await gapi_append(token,"Compras",["Fecha","Factura","Proveedor","Monto","Observacion","Timestamp"]);
      await gapi_append(token,"Tickets",["Mes","Anio","Cantidad","Promedio","Dias","Timestamp"]);

      // Cargar ventas mensuales históricas 2022-2025
      const ventasHist = [
        ["Ene","2022",940067,"","Histórico"],["Feb","2022",809246,"","Histórico"],["Mar","2022",788997,"","Histórico"],
        ["Abr","2022",819547,"","Histórico"],["May","2022",800704,"","Histórico"],["Jun","2022",920678,"","Histórico"],
        ["Jul","2022",906547,"","Histórico"],["Ago","2022",888901,"","Histórico"],["Set","2022",962003,"","Histórico"],
        ["Oct","2022",1486388,"","Histórico"],["Nov","2022",1300667,"","Histórico"],["Dic","2022",1010845,"","Histórico"],
        ["Ene","2023",992064,"","Histórico"],["Feb","2023",865112,"","Histórico"],["Mar","2023",888722,"","Histórico"],
        ["Abr","2023",947309,"","Histórico"],["May","2023",860901,"","Histórico"],["Jun","2023",920732,"","Histórico"],
        ["Jul","2023",865228,"","Histórico"],["Ago","2023",954613,"","Histórico"],["Set","2023",973259,"","Histórico"],
        ["Oct","2023",1303555,"","Histórico"],["Nov","2023",1295262,"","Histórico"],["Dic","2023",1635557,"","Histórico"],
        ["Ene","2024",1295262,"","Histórico"],["Feb","2024",1246546,"","Histórico"],["Mar","2024",1048357,"","Histórico"],
        ["Abr","2024",1202552,"","Histórico"],["May","2024",1050222,"","Histórico"],["Jun","2024",1283600,"","Histórico"],
        ["Jul","2024",1101916,"","Histórico"],["Ago","2024",1222144,"","Histórico"],["Set","2024",1190463,"","Histórico"],
        ["Oct","2024",1318492,"","Histórico"],["Nov","2024",1530793,"","Histórico"],["Dic","2024",2726949,"","Histórico"],
        ["Ene","2025",2003181,"","Histórico"],["Feb","2025",1615840,"","Histórico"],["Mar","2025",1488874,"","Histórico"],
        ["Abr","2025",1281569,"","Histórico"],["May","2025",1435910,"","Histórico"],["Jun","2025",1478792,"","Histórico"],
        ["Jul","2025",1545618,"","Histórico"],["Ago","2025",1519419,"","Histórico"],["Set","2025",1590065,"","Histórico"],
        ["Oct","2025",1830397,"","Histórico"],["Nov","2025",1632615,"","Histórico"],["Dic","2025",2373579,"","Histórico"],
      ];

      // Cargar tickets históricos 2025
      const ticketsHist = [
        ["Ene","2023",1858,632,null],["Feb","2023",1448,583.09,null],["Mar","2023",1516,555.7,null],
        ["Abr","2023",1260,576.39,null],["May","2023",1201,609.97,null],["Jun","2023",1348,557.41,null],
        ["Jul","2023",1226,575.08,null],["Ago","2023",1223,577.22,null],["Set","2023",1287,555.83,null],
        ["Oct","2023",1324,552.97,null],["Nov","2023",1339,621.22,null],["Dic","2023",1673,638.92,null],
        ["Ene","2024",1754,651.1,null],["Feb","2024",1533,645.62,null],["Mar","2024",1349,654.14,null],
        ["Abr","2024",1501,604.18,null],["May","2024",1391,603.96,null],["Jun","2024",1712,602.28,null],
        ["Jul","2024",1489,581.13,null],["Ago","2024",1584,598.19,null],["Set","2024",1583,608.19,null],
        ["Oct","2024",1666,581.9,null],["Nov","2024",1846,655.48,null],["Dic","2024",2033,675.9,null],
        ["Ene","2025",2333,727.37,null],["Feb","2025",1974,675.79,null],["Mar","2025",1684,692.83,null],
        ["Abr","2025",1617,589.67,null],["May","2025",1709,625.96,null],["Jun","2025",1746,638.38,null],
        ["Jul","2025",1818,637.43,null],["Ago","2025",1775,650.3,null],["Set","2025",1831,647,null],
        ["Oct","2025",2031,650.42,null],["Nov","2025",1991,650.67,null],["Dic","2025",2873,799.9,null],
        ["Ene","2026",2695,698.69,null],["Feb","2026",1985,689.49,null],["Mar","2026",2117,672.13,null],
        ["Abr","2026",1857,610.46,null],["May","2026",1039,695,null],
      ];

      // Cargar compras históricas 2025 (principales)
      const comprasHist = [
        ["Ene-2025","","SUBATIR",850000,"Histórico"],
        ["Ene-2025","","San Francisco",320000,"Histórico"],
        ["Feb-2025","","SUBATIR",780000,"Histórico"],
        ["Feb-2025","","Emilio Benzo",210000,"Histórico"],
        ["Mar-2025","","SUBATIR",820000,"Histórico"],
        ["Mar-2025","","IRMARI",180000,"Histórico"],
        ["Abr-2025","","SUBATIR",750000,"Histórico"],
        ["May-2025","","SUBATIR",800000,"Histórico"],
        ["May-2025","","Jupiter",150000,"Histórico"],
        ["Jun-2025","","SUBATIR",810000,"Histórico"],
        ["Jul-2025","","SUBATIR",790000,"Histórico"],
        ["Ago-2025","","SUBATIR",830000,"Histórico"],
        ["Set-2025","","SUBATIR",860000,"Histórico"],
        ["Oct-2025","","SUBATIR",920000,"Histórico"],
        ["Nov-2025","","SUBATIR",880000,"Histórico"],
        ["Dic-2025","","SUBATIR",1100000,"Histórico"],
      ];
      for(const row of comprasHist){
        await gapi_append(token,"Compras",[row[0],row[1],row[2],row[3],row[4],"historico"]);
        await new Promise(r=>setTimeout(r,150));
      }

      // Upload in batches to avoid rate limits
      for(const row of ventasHist){
        await gapi_append(token,"Ventas",[row[0]+"-"+row[1],row[2],row[4],"historico"]);
        await new Promise(r=>setTimeout(r,150));
      }
      for(const row of ticketsHist){
        await gapi_append(token,"Tickets",[row[0],row[1],row[2],row[3],row[4]||"","historico"]);
        await new Promise(r=>setTimeout(r,150));
      }

      setSyncStatus("ok");
      showToast("✓ Histórico cargado en Google Sheets");
      await loadSheetData(token);
    } catch(e){
      console.error(e);
      setSyncStatus("error");
      showToast("Error al cargar histórico","er");
    }
  };

  const loadSheetData = async (tk) => {
    try {
      // Fetch sheet metadata to get real gids
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`;
      const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${tk}` } });
      if(metaRes.ok){
        const meta = await metaRes.json();
        const gids = {};
        (meta.sheets||[]).forEach(s=>{ gids[s.properties.title] = s.properties.sheetId; });
        setSheetGids(gids);
      }
      const [v,c,t] = await Promise.all([
        gapi_read(tk, "Ventas!A2:D200"),
        gapi_read(tk, "Compras!A2:F200"),
        gapi_read(tk, "Tickets!A2:F200"),
      ]);
      setSheetVentas(v.map(r=>({fecha:r[0],monto:r[1],obs:r[2]})).filter(r=>r.fecha));
      setSheetCompras(c.map(r=>({fecha:r[0],factura:r[1],proveedor:r[2],monto:r[3],obs:r[4]})).filter(r=>r.fecha));
      setSheetTickets(t.map(r=>({mes:r[0],anio:r[1],cantidad:r[2],promedio:r[3],dias:r[4]})).filter(r=>r.mes));
    } catch(e){ setSyncStatus("error"); }
  };

  const deleteRow = async (sheet, rowIndex) => {
    if(!token){showToast("Conectate a Sheets primero","er");return;}
    if(!window.confirm("¿Borrar este registro?")) return;
    setSyncStatus("syncing");
    const gid = sheetGids[sheet] ?? 0;
    const ok = await gapi_delete_row(token, gid, rowIndex + 1); // +1 for header
    if(ok){
      showToast("✓ Registro eliminado");
      setSyncStatus("ok");
      await loadSheetData(token);
    } else {
      showToast("Error al eliminar","er");
      setSyncStatus("error");
    }
  };

  const saveVenta = async () => {
    if(!vF.monto||!vF.fecha){showToast("Completá fecha y monto","er");return;}
    if(token){
      setSyncStatus("syncing");
      const ok = await gapi_append(token,"Ventas",[vF.fecha,vF.monto,vF.obs,new Date().toISOString()]);
      if(ok){
        showToast("✓ Venta guardada en Google Sheets");
        setSyncStatus("ok");
        await loadSheetData(token);
      } else {
        showToast("Error al guardar en Sheets","er");
        setSyncStatus("error");
      }
    } else {
      showToast("Conectate a Google Sheets primero","er");
    }
    setVF({fecha:new Date().toISOString().split("T")[0],monto:"",obs:""});
  };

  const saveCompra = async () => {
    if(!cF.monto||!cF.proveedor){showToast("Completá proveedor y monto","er");return;}
    if(token){
      setSyncStatus("syncing");
      const ok = await gapi_append(token,"Compras",[String(cF.fecha),String(cF.factura||""),String(cF.proveedor),String(cF.monto),String(cF.obs||""),new Date().toISOString()]);
      if(ok){
        showToast("✓ Compra guardada en Google Sheets");
        setSyncStatus("ok");
        await loadSheetData(token);
      } else {
        showToast("Error al guardar","er");
        setSyncStatus("error");
      }
    } else {
      showToast("Conectate a Google Sheets primero","er");
    }
    setCF({fecha:new Date().toISOString().split("T")[0],factura:"",proveedor:"",monto:"",obs:""});
  };

  const saveTicket = async () => {
    if(!tkF.cantidad||!tkF.promedio){showToast("Completá cantidad y promedio","er");return;}
    if(token){
      setSyncStatus("syncing");
      const ok = await gapi_append(token,"Tickets",[MESES[tkF.mes],tkF.anio,tkF.cantidad,tkF.promedio,tkF.dias,new Date().toISOString()]);
      if(ok){
        showToast("✓ Tickets guardados en Google Sheets");
        setSyncStatus("ok");
        await loadSheetData(token);
      } else {
        showToast("Error al guardar","er");
        setSyncStatus("error");
      }
    } else {
      showToast("Conectate a Google Sheets primero","er");
    }
  };

  const syncDot = syncStatus==="ok"?"green":syncStatus==="syncing"?"orange":"red";
  const syncLabel = syncStatus==="ok"?"Sheets conectado":syncStatus==="syncing"?"Sincronizando...":syncStatus==="disconnected"?"Conectar Sheets":"Error de sync";

  const tk26=TK.slice(0,5).reduce((s,r)=>s+(r.c26||0),0);
  const tk25=TK.slice(0,5).reduce((s,r)=>s+(r.c25||0),0);
  const cTk=pct(tk26,tk25);
  const pvTk=TK.slice(0,5).filter(r=>r.p26).reduce((s,r,i,a)=>s+r.p26/a.length,0);
  const t25=VM.reduce((s,r)=>s+(r["2025"]||0),0);
  const t24=VM.reduce((s,r)=>s+(r["2024"]||0),0);
  // Real 2026 data from Excel
  const real26EneAbr = 2373579+1710114+1884301+1620824+1304108;
  const real25EneAbr = 2003181+1615840+1488874+1281569+1435910+1478792;
  const crec26real = pct(real26EneAbr, real25EneAbr);
  // Also include new daily sales loaded from sheets
  const sheetVentasTotal = sheetVentas.filter(v=>v.fecha&&v.fecha.startsWith("2026")&&!isNaN(Number(v.monto))).reduce((s,v)=>s+Number(v.monto),0);
  const cvM=VM.map(r=>({mes:r.mes,"2024":r["2024"]/1000,"2025":r["2025"]/1000,"2026":r["2026"]?r["2026"]/1000:undefined}));
  const cvT=TK.map(r=>({mes:r.mes,"Cant 25":r.c25,"Cant 26":r.c26}));

  const runAI=async(q)=>{
    setAiLoading(true);setAiText("");
    try{
      const d=VM[aMes];const tk=TK[aMes];const pd=PD[aMes];
      const prompt=`Sos analista de negocios especializado en comercio minorista uruguayo.
Datos de PROlimpio Durazno — ${MESES[aMes]} ${aAnio}:
VENTAS: 2022=$${fmt(d?.["2022"])} | 2023=$${fmt(d?.["2023"])} | 2024=$${fmt(d?.["2024"])} | 2025=$${fmt(d?.["2025"])}
PROM DIARIO: 2023=$${fmt(pd?.["2023"])} | 2024=$${fmt(pd?.["2024"])} | 2025=$${fmt(pd?.["2025"])}
TICKETS: 2025=${tk?.c25} uds $${tk?.p25} prom | 2026=${tk?.c26??"sin datos"} uds $${tk?.p26??"sin datos"} prom
VENTAS NUEVAS REGISTRADAS: ${sheetVentas.length} registros en Sheets
COMPRAS REGISTRADAS: ${sheetCompras.length} registros en Sheets
CONTEXTO: Crec 2025 vs 2024 +36.7% nominal. Inflación UY ~6.4%. Farmacia/limpieza/cuidado personal.

${q||"Análisis conciso del mes: tendencia, crecimiento real descontando inflación, tickets y valor promedio. Terminá con 2-3 recomendaciones concretas. Máx 200 palabras."}

INSTRUCCIONES IMPORTANTES:
- Respondé SIEMPRE en español rioplatense
- NO muestres razonamiento interno ni cálculos intermedios
- Respondé directo con el análisis final
- Formato: párrafos cortos, sin listas largas
- Máximo 200 palabras`;
      const OR_KEY = "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";
      const MODELS = [
        "mistralai/mistral-7b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free",
        "huggingfaceh4/zephyr-7b-beta:free",
        "openchat/openchat-7b:free",
        "gryphe/mythomist-7b:free",
      ];
      let txt = null;
      let lastErr = "";
      for(const model of MODELS){
        try{
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions",{
            method:"POST",
            headers:{
              "Content-Type":"application/json",
              "Authorization":`Bearer ${OR_KEY}`,
              "HTTP-Referer":"https://emarosteguy-oss.github.io",
              "X-Title":"PROlimpio Durazno"
            },
            body:JSON.stringify({model,messages:[{role:"user",content:prompt}],max_tokens:1024})
          });
          if(!res.ok){ const e=await res.json(); lastErr=`${model}: ${e?.error?.message||res.status}`; continue; }
          const data = await res.json();
          txt = data?.choices?.[0]?.message?.content;
          if(txt) break;
        }catch(e){ lastErr=`${model}: ${e.message}`; }
      }
      if(txt){ setAiText(txt); }
      else { setAiText("No se pudo obtener respuesta de ningún modelo.\nÚltimo error: "+lastErr); }
    }catch(e){ setAiText("Error de red: "+e.message); }
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
          <div className="sync-badge" onClick={!token?handleLogin:()=>loadSheetData(token)}>
            <span className={`sync-dot ${syncDot}`}/>
            {syncLabel}
          </div>
        </div>
      </header>
      <nav className="nav">
        {TABS.map(n=><button key={n.id} className={`nav-btn${tab===n.id?" active":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
      </nav>
      <main style={{paddingBottom:48,paddingTop:6}}>

        {tab==="dashboard"&&<div className="gap">
          <div className="abar"/>
          {!token&&<div className="banner">🔗 <span>Tocá <strong style={{color:"#ff6b2b",cursor:"pointer"}} onClick={handleLogin}>"Conectar Sheets"</strong> arriba para sincronizar datos con Google Sheets</span></div>}
          {token&&sheetVentas.length<10&&<div className="banner">📥 <span>El Sheet está casi vacío. <strong style={{color:"#ff6b2b",cursor:"pointer"}} onClick={cargarHistorico}>Tocá acá para cargar todos los datos históricos 2022–2025</strong> de una sola vez.</span></div>}
          <div><div className="sh"><span className="st">Ejercicio 2025 completo</span><span className="ss">12 meses cerrados</span></div>
          <div className="grid4">
            <div className="card"><div className="ctitle">Ventas totales 2025</div><div className="cval ac">{fmtM(t25)}</div><div className="csub">Suma 12 meses</div><div className="delta up">▲ {fmt(pct(t25,t24),1)}% vs 2024</div></div>
            <div className="card"><div className="ctitle">Mejor mes 2025</div><div className="cval">{fmtM(Math.max(...VM.map(r=>r["2025"])))}</div><div className="csub">Diciembre</div><div className="delta up">🚀 Récord</div></div>
            <div className="card"><div className="ctitle">Tickets totales 2025</div><div className="cval">{fmt(TK.reduce((s,r)=>s+(r.c25||0),0))}</div><div className="csub">Emitidos en el año</div><div className="delta up">▲ vs 2024</div></div>
            <div className="card"><div className="ctitle">Crecimiento real 2025</div><div className="cval ac">+30.3%</div><div className="csub">Nominal 36.7% − infl. 6.4%</div><div className="delta up">🚀 Excelente</div></div>
          </div></div>
          <div>
            <div className="sh"><span className="st">Comparativa 2026 vs 2025</span><span className="ss">Ene–May disponibles</span></div>
            <div className="grid4">
              {[
                {mes:"Ene",v25:2003181,v26:2373579,tk25:2333,tk26:2695},
                {mes:"Feb",v25:1615840,v26:1710114,tk25:1974,tk26:1985},
                {mes:"Mar",v25:1488874,v26:1884301,tk25:1684,tk26:2117},
                {mes:"Abr",v25:1281569,v26:1620824,tk25:1617,tk26:1857},
                {mes:"May",v25:1435910,v26:1572417,tk25:1709,tk26:1677},
                {mes:"Jun",v25:1478792,v26:1660029,tk25:1746,tk26:1835},
              ].map((r,i)=>{
                const crecV = r.v26?((r.v26-r.v25)/r.v25*100):null;
                const crecTk = ((r.tk26-r.tk25)/r.tk25*100);
                return <div key={i} className="card">
                  <div className="ctitle">{r.mes} 2026</div>
                  <div className="cval ac" style={{fontSize:"1.3rem"}}>{r.v26?fmtM(r.v26):`${fmt(r.tk26)} tk`}</div>
                  <div className="csub">{r.v26?`vs ${fmtM(r.v25)} en 2025`:`${fmt(r.tk25)} tickets en 2025`}</div>
                  <div className={`delta ${(crecV??crecTk)>=0?"up":"dn"}`}>
                    {(crecV??crecTk)>=0?"▲":"▼"} {fmt(Math.abs(crecV??crecTk),1)}% {r.v26?"ventas":"tickets"}
                  </div>
                </div>;
              })}
            </div>
          </div>

          <div>
            <div className="sh"><span className="st">Proyección 2026</span><span className="ss">Basada en crecimiento Ene–May vs 2025</span></div>
            <div className="grid4">
              {(()=>{
                // Datos reales 2026 de la planilla Excel
                const acum26_real = 2373579+1710114+1884301+1620824+1572417+1660029; // Ene-Jun reales cerrados
                const acum25_enemai = 2003181+1615840+1488874+1281569+1435910;
                const acum25_eneabr = 2003181+1615840+1488874+1281569+1435910+1478792;
                const crecReal = (acum26_real - acum25_eneabr) / acum25_eneabr;
                const total25 = 2003181+1615840+1488874+1281569+1435910+1478792+1545618+1519419+1590065+1830397+1632615+2726949;
                const proj_base = Math.round(total25 * (1 + crecReal));
                const proj_opt  = Math.round(total25 * (1 + crecReal + 0.05));
                const proj_pes  = Math.round(total25 * (1 + crecReal - 0.05));
                const acum26_enemai = acum26_real; // usamos real Ene-Abr
                return <>
                  <div className="card">
                    <div className="ctitle">Acumulado Ene–May 2026</div>
                    <div className="cval ac">{fmtM(acum26_enemai)}</div>
                    <div className="csub">vs {fmtM(acum25_enemai)} en 2025</div>
                    <div className="delta up">▲ ~14.7%</div>
                  </div>
                  <div className="card">
                    <div className="ctitle">Proyección base 2026</div>
                    <div className="cval">{fmtM(proj_base)}</div>
                    <div className="csub">Crec. ~14.7% vs 2025</div>
                    <div className="delta up">📈 Escenario base</div>
                  </div>
                  <div className="card">
                    <div className="ctitle">Escenario optimista</div>
                    <div className="cval ac">{fmtM(proj_opt)}</div>
                    <div className="csub">Crec. ~19.7% vs 2025</div>
                    <div className="delta up">🚀 Si mejora tendencia</div>
                  </div>
                  <div className="card">
                    <div className="ctitle">Escenario pesimista</div>
                    <div className="cval" style={{color:"#ffa500"}}>{fmtM(proj_pes)}</div>
                    <div className="csub">Crec. ~9.7% vs 2025</div>
                    <div className="delta wr">⚠️ Si desacelera</div>
                  </div>
                </>;
              })()}
            </div>
          </div>

          <div><div className="sh"><span className="st">Registros en Google Sheets</span><span className="ss">{token?"Datos en tiempo real":"Conectate para ver"}</span></div>
          <div className="grid4">
            <div className="card"><div className="ctitle">Ventas cargadas</div><div className="cval ac">{fmt(sheetVentas.length)}</div><div className="csub">Registros en Sheets</div></div>
            <div className="card"><div className="ctitle">Compras cargadas</div><div className="cval">{fmt(sheetCompras.length)}</div><div className="csub">Facturas registradas</div></div>
            <div className="card"><div className="ctitle">Tickets cargados</div><div className="cval">{fmt(sheetTickets.length)}</div><div className="csub">Períodos registrados</div></div>
            <div className="card"><div className="ctitle">Último registro</div><div className="cval" style={{fontSize:"1.2rem"}}>{sheetVentas[0]?.fecha||"—"}</div><div className="csub">Fecha última venta</div></div>
          </div></div>
          <div><div className="sh"><span className="st">Ventas mensuales</span><span className="ss">2024 vs 2025 — en miles $</span></div>
          <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cvM} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
              <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
              <YAxis stroke="#8a5535" fontSize={11} tickFormatter={v=>`${v}k`}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
              <Bar dataKey="2024" fill="#7a3800" radius={[3,3,0,0]}/>
              <Bar dataKey="2025" fill="#e84400" radius={[3,3,0,0]}/>
              <Bar dataKey="2026" fill="#ffb347" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer></div></div></div>
          <div className="grid2">
            <div><div className="sh"><span className="st">Promedio diario</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={PD}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
                <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
                <YAxis stroke="#8a5535" fontSize={11} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
                <Line type="monotone" dataKey="2024" stroke="#d4956a" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2025" stroke="#e84400" dot={false} strokeWidth={2.5}/>
                <Line type="monotone" dataKey="2026" stroke="#ffb347" dot={false} strokeWidth={2.5} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer></div></div></div>
            <div><div className="sh"><span className="st">Tickets emitidos</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={cvT}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1800"/>
                <XAxis dataKey="mes" stroke="#8a5535" fontSize={11}/>
                <YAxis stroke="#8a5535" fontSize={11}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.78rem",color:"#d4956a"}}/>
                <Bar dataKey="Cant 25" fill="#d4956a" radius={[3,3,0,0]}/>
                <Bar dataKey="Cant 26" fill="#e84400" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer></div></div></div>
          </div>
        </div>}

        {tab==="carga"&&<div className="gap">
          <div className="abar"/>
          {!token&&<div className="banner">🔗 <span>Para guardar datos en Google Sheets, <strong style={{color:"#ff6b2b",cursor:"pointer"}} onClick={handleLogin}>conectate primero</strong> tocando el botón arriba.</span></div>}
          <div className="sh"><span className="st">Registrar venta diaria</span></div>
          <div className="card">
            <div className="fg">
              <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={vF.fecha} onChange={e=>setVF(p=>({...p,fecha:e.target.value}))}/></div>
              <div className="fl"><label className="flabel">Monto del día ($)</label><input type="number" className="finput" placeholder="ej: 85000" value={vF.monto} onChange={e=>setVF(p=>({...p,monto:e.target.value}))}/></div>
              <div className="fl" style={{gridColumn:"1/-1"}}><label className="flabel">Observación (opcional)</label><input type="text" className="finput" placeholder="ej: lluvia, feriado, Olkany..." value={vF.obs} onChange={e=>setVF(p=>({...p,obs:e.target.value}))}/></div>
            </div>
            <div className="factions"><button className="btn btn-p" onClick={saveVenta}>✓ Guardar en Sheets</button><span className="tsm">{token?"Se guarda directo en tu Google Sheet":"Conectate a Sheets primero"}</span></div>
          </div>
          {sheetVentas.length>0&&<><div className="sh"><span className="st">Ventas en Google Sheets</span><span className="ss">{sheetVentas.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{sheetVentas.slice(0,20).map((v,i)=><tr key={i}><td>{v.fecha}</td><td className="tac">${fmt(Number(v.monto))}</td><td className="tsm">{v.obs||"—"}</td><td><button onClick={()=>deleteRow("Ventas",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#ff6b2b",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
          <hr className="div"/>
          <div className="sh"><span className="st">Ventas del mes en curso</span><span className="ss">Cargadas desde la app</span></div>
          {(()=>{
            const hoy = new Date();
            const mesActual = hoy.getMonth();
            const anioActual = hoy.getFullYear();
            const nombreMes = MESES[mesActual];
            const nombreMesCorto = nombreMes.slice(0,3);
            const ventasMesActual = sheetVentas.filter(v=>{
              if(!v.fecha||isNaN(Number(v.monto))||Number(v.monto)<=0) return false;
              const d = new Date(v.fecha+"T12:00:00");
              return d.getMonth()===mesActual && d.getFullYear()===anioActual;
            });
            const totalMes = ventasMesActual.reduce((s,v)=>s+Number(v.monto),0);
            const diasCargados = ventasMesActual.length;
            const promDiario = diasCargados>0?totalMes/diasCargados:0;
            const diasHabilesTotal = DIAS_HABILES[String(anioActual)]?.[nombreMesCorto]||26;
            const diasHabilesRestantes = Math.max(0, diasHabilesTotal - diasCargados);
            const proyeccion = totalMes + (promDiario * diasHabilesRestantes);
            const ventasMismoMesAnterior = VM.find(r=>r.mes===nombreMesCorto)?.[String(anioActual-1)];
            const diasHabilesAnterior = DIAS_HABILES[String(anioActual-1)]?.[nombreMesCorto]||26;
            const promDiarioAnterior = ventasMismoMesAnterior?ventasMismoMesAnterior/diasHabilesAnterior:null;
            const proyeccionVsAnterior = promDiarioAnterior?promDiarioAnterior*diasHabilesTotal:null;
            return <>
              <div className="grid4">
                <div className="card">
                  <div className="ctitle">Total cargado {nombreMes}</div>
                  <div className="cval ac">{totalMes>0?fmtM(totalMes):"Sin datos"}</div>
                  <div className="csub">{diasCargados} días registrados de {diasHabilesTotal} hábiles</div>
                </div>
                <div className="card">
                  <div className="ctitle">Prom. diario actual</div>
                  <div className="cval">{promDiario>0?fmtM(promDiario):"—"}</div>
                  <div className="csub">Promedio sobre días cargados</div>
                  {promDiarioAnterior&&promDiario>0&&<div className={`delta ${promDiario>=promDiarioAnterior?"up":"dn"}`}>
                    {promDiario>=promDiarioAnterior?"▲":"▼"} {fmt(Math.abs(pct(promDiario,promDiarioAnterior)),1)}% vs {anioActual-1}
                  </div>}
                </div>
                <div className="card">
                  <div className="ctitle">Proyección del mes</div>
                  <div className="cval ac">{proyeccion>0?fmtM(proyeccion):"—"}</div>
                  <div className="csub">{diasHabilesRestantes} días hábiles restantes</div>
                  {proyeccionVsAnterior&&proyeccion>0&&<div className={`delta ${proyeccion>=proyeccionVsAnterior?"up":"dn"}`}>
                    {proyeccion>=proyeccionVsAnterior?"▲":"▼"} {fmt(Math.abs(pct(proyeccion,proyeccionVsAnterior)),1)}% vs proy {anioActual-1}
                  </div>}
                </div>
                <div className="card">
                  <div className="ctitle">Prom. diario {anioActual-1}</div>
                  <div className="cval">{promDiarioAnterior?fmtM(promDiarioAnterior):"—"}</div>
                  <div className="csub">{nombreMes} {anioActual-1} · {diasHabilesAnterior} días hábiles</div>
                </div>
              </div>
              {ventasMesActual.length>0&&<div className="card tw" style={{marginTop:4}}>
                <table><thead><tr><th>Fecha</th><th>Monto</th><th>Obs.</th><th>vs promedio</th></tr></thead>
                <tbody>{[...ventasMesActual].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map((v,i)=>{
                  const diff = promDiario>0?((Number(v.monto)-promDiario)/promDiario*100):0;
                  return<tr key={i}>
                    <td>{v.fecha}</td>
                    <td className="tac">${fmt(Number(v.monto))}</td>
                    <td className="tsm">{v.obs||"—"}</td>
                    <td><span className={`tag ${diff>=0?"tg":"tr"}`}>{diff>=0?"+":""}{fmt(diff,1)}%</span></td>
                  </tr>;
                })}</tbody></table>
              </div>}
              {ventasMesActual.length===0&&token&&<div className="banner">📅 Cargá ventas de {nombreMes} {anioActual} arriba para ver la proyección del mes.</div>}
            </>;
          })()}
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
            <div className="factions"><button className="btn btn-p" onClick={saveCompra}>✓ Guardar en Sheets</button></div>
          </div>
          {sheetCompras.length>0&&<><div className="sh"><span className="st">Compras en Google Sheets</span><span className="ss">{sheetCompras.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Factura</th><th>Proveedor</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{sheetCompras.slice(0,20).map((c,i)=><tr key={i}><td>{c.fecha}</td><td className="tsm">{c.factura||"—"}</td><td>{c.proveedor}</td><td className="tac">${fmt(Number(c.monto))}</td><td className="tsm">{c.obs||"—"}</td><td><button onClick={()=>deleteRow("Compras",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#ff6b2b",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
        </div>}

        {tab==="tickets"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Análisis de tickets</span></div>
          <div className="grid2">
            <div className="card"><div className="ctitle">Tickets Ene–May 2026</div><div className="cval ac">{fmt(tk26)}</div><div className="csub">vs {fmt(tk25)} en 2025</div><div className={`delta ${cTk>=0?"up":"dn"}`}>{cTk>=0?"▲":"▼"} {fmt(Math.abs(cTk),1)}%</div></div>
            <div className="card"><div className="ctitle">Valor prom. ticket 2026</div><div className="cval">${fmt(pvTk,0)}</div><div className="csub">Prom Ene–May</div><div className="delta wr">Inflación ~7%</div></div>
          </div>
          <div className="card"><div className="ctitle" style={{marginBottom:12}}>Comparativa 2025 vs 2026</div>
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
          </div><div className="factions"><button className="btn btn-p" onClick={saveTicket}>✓ Guardar en Sheets</button></div></div>
          {sheetTickets.length>0&&<><div className="sh"><span className="st">Tickets en Google Sheets</span><span className="ss">{sheetTickets.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Mes</th><th>Año</th><th>Cantidad</th><th>Prom $</th><th>Días</th></tr></thead>
          <tbody>{sheetTickets.map((t,i)=><tr key={i}><td>{t.mes}</td><td>{t.anio}</td><td>{fmt(Number(t.cantidad))}</td><td>${fmt(Number(t.promedio),0)}</td><td>{t.dias||"—"}</td><td><button onClick={()=>deleteRow("Tickets",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#ff6b2b",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
        </div>}

        {tab==="historial"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Ventas históricas</span><span className="ss">2022–2025</span>
            {token&&<button className="btn btn-p" style={{fontSize:"0.8rem",padding:"7px 14px"}} onClick={cargarHistorico}>📥 Cargar histórico a Sheets</button>}
          </div>
          <div className="card tw"><table><thead><tr><th>Mes</th><th>2022</th><th>2023</th><th>Δ</th><th>2024</th><th>Δ</th><th>2025</th><th>Δ</th><th>2026</th><th>Δ</th></tr></thead>
          <tbody>{VM.map((r,i)=>{
            const tg=v=>v==null?"—":<span className={`tag ${v>=0?"tg":"tr"}`}>{v>=0?"+":""}{fmt(v,1)}%</span>;
            return<tr key={i}><td style={{fontWeight:600}}>{r.mes}</td>
              <td>{fmtM(r["2022"])}</td><td>{fmtM(r["2023"])}</td><td>{tg(pct(r["2023"],r["2022"]))}</td>
              <td>{fmtM(r["2024"])}</td><td>{tg(pct(r["2024"],r["2023"]))}</td>
              <td>{fmtM(r["2025"])}</td><td>{tg(pct(r["2025"],r["2024"]))}</td>
              <td>{r["2026"]?fmtM(r["2026"]):<span className="tsm">—</span>}</td>
              <td>{r["2026"]?tg(pct(r["2026"],r["2025"])):"—"}</td>
            </tr>;
          })}</tbody></table></div>
          <div className="sh"><span className="st">Crecimiento real anual</span></div>
          <div className="card tw">
            <div className="tsm" style={{padding:"8px 12px 4px",color:"#8a5535"}}>Inflación según datos oficiales INE Uruguay</div>
            <table><thead><tr><th>Período</th><th>Crec. nominal</th><th>Inflación real INE</th><th>Crec. real</th><th>Resultado</th></tr></thead>
          <tbody>{[
            {p:"2022 vs 2021",n:11.2,i:9.95,src:"INE 2022"},
            {p:"2023 vs 2022",n:7.6,i:8.26,src:"INE 2023"},
            {p:"2024 vs 2023",n:24.05,i:5.11,src:"INE 2024"},
            {p:"2025 vs 2024",n:36.7,i:6.36,src:"INE 2025"},
            {p:"2026 vs 2025 (Ene–May)",n:null,i:null,src:"En curso"},
          ].map((r,i)=>{
            if(r.n===null) return <tr key={i}>
              <td style={{fontWeight:600}}>{r.p}</td>
              <td><span className="tag ty">En curso</span></td>
              <td className="tsm">~5–7% est.</td>
              <td><span className="tag ty">Calculando...</span></td>
              <td>📊 Año en curso</td>
            </tr>;
            const real=r.n-r.i;
            return<tr key={i}><td style={{fontWeight:600}}>{r.p}</td>
              <td className="tac">+{fmt(r.n,1)}%</td>
              <td className="tsm">{fmt(r.i,2)}% <span style={{color:"#5a2400",fontSize:"0.68rem"}}>({r.src})</span></td>
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
            <div className={`ai-body${aiLoading?" ld":""}`}>{aiLoading?"Generando análisis...":aiText}</div>
          </div>}
          <div className="grid2">
            <div className="card"><div className="ctitle">Análisis rápidos</div>
              <div className="gap" style={{gap:8,marginTop:10}}>
                {[
                  {l:"📊 Tendencia 2022–2026",q:"Usando los datos de ventas mensuales de PROlimpio Durazno, analizá la tendencia de crecimiento 2022 a 2026. Identificá años de mayor y menor crecimiento real (descontando inflación) y posibles causas. Incluí datos de 2026 si están disponibles. Máx 200 palabras."},
                  {l:"🎫 Evolución del ticket promedio",q:"Analizá la evolución del ticket promedio de PROlimpio Durazno desde 2023 a 2026. ¿Crece más o menos que la inflación real de Uruguay (7.3% en 2022, 8.3% en 2023, 5.1% en 2024, 6.4% en 2025)? ¿Qué implica para el negocio? Máx 200 palabras."},
                  {l:"⚠️ Alertas y riesgos",q:"Analizá los datos de PROlimpio Durazno e identificá alertas y riesgos concretos: meses con caída, estacionalidad marcada, tendencias preocupantes en tickets o ventas. Sé directo. Máx 200 palabras."},
                  {l:"🏆 Mejores y peores meses",q:"Identificá los 3 mejores y 3 peores meses de PROlimpio Durazno en términos de venta mensual total y en crecimiento interanual. ¿Hay estacionalidad clara? ¿Qué explica los picos? Máx 200 palabras."},
                ].map((item,i)=><button key={i} className="btn btn-s" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>{setAMes(new Date().getMonth());runAI(item.q);}} disabled={aiLoading}>{item.l}</button>)}
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
