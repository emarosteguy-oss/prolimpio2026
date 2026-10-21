import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import LOGO_H from "./logo.png";

const CLIENT_ID = "590485373332-ft5l9d7md2ggoluku7pa8936cu6qlilg.apps.googleusercontent.com";
const SHEET_ID  = "1RFLpLV_HKC6fLFe1LA0xNcYIjBZ3yJcV8OqvmvzrvQ0";
const SHEET_CIERRES = "1Txwyn2fgzmrtqrsQCZOwMDbQjsQkmgxUetgJHcifgRg"; // planilla "PROlimpio Durazno – Cierres"
const SCOPES    = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email";
// Conexión con Google recordada en este equipo: el permiso dura ~1 hora; se guarda para no pedirlo en cada apertura
const TOK_KEY = "prolimpio_gtok";
const leerTok = () => { try{ const o=JSON.parse(localStorage.getItem(TOK_KEY)||"null"); if(o&&o.t&&o.exp>Date.now()+60000) return o; }catch(e){} return null; };
const guardarTok = (t,seg) => { try{ localStorage.setItem(TOK_KEY,JSON.stringify({t,exp:Date.now()+(Number(seg)||3600)*1000})); localStorage.setItem("prolimpio_conectado","1"); }catch(e){} };
const borrarTok = () => { try{ localStorage.removeItem(TOK_KEY); }catch(e){} };
const yaConecto = () => { try{ return localStorage.getItem("prolimpio_conectado")==="1"; }catch(e){ return false; } };

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
const PROVEEDORES = ["SUBATIR","San Francisco","Emilio Benzo","Estuario Platino","Clausil","IRMARI","JASPE","Jupiter","Regional Sur","Norte Sur","Pedro Merla","Andres Bauer","Solsire","Atersa","Bettasul","Carmania","Uruquim","Zitan","Bakedplus","Otro"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#FFF3E6;--bg2:#FFF8F0;--bg3:#FFFFFF;--card:#FFFFFF;--border:#F2C9A0;
    --accent:#E84400;--accent2:#C2410C;--warn:#B45309;
    --text:#1F0D05;--text2:#7A2E0A;--text3:#8A4A2A;
    --radius:12px;--radius-sm:7px;
    --font:'Barlow',sans-serif;--font-cond:'Barlow Condensed',sans-serif;
  }
  html,body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh;font-weight:500;-webkit-font-smoothing:antialiased}
  .app{display:flex;flex-direction:column;min-height:100vh;max-width:1400px;margin:0 auto;padding:0 16px}
  .header{display:flex;align-items:center;justify-content:space-between;padding:14px 0 12px;border-bottom:1px solid var(--border);gap:12px;flex-wrap:wrap}
  .header-sub{font-size:0.8rem;color:var(--text3);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px}
  .header-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .sync-badge{display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text3);padding:5px 11px;background:var(--bg3);border-radius:20px;border:1px solid var(--border);font-weight:500;cursor:pointer;transition:all .15s}
  .sync-badge:hover{border-color:var(--accent);color:var(--text2)}
  .sync-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .sync-dot.green{background:#16A34A;box-shadow:0 0 7px #16A34A}
  .sync-dot.orange{background:#ffa500;box-shadow:0 0 7px #ffa500;animation:pulse 1s infinite}
  .sync-dot.red{background:#DC2626;box-shadow:0 0 7px #DC2626}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .nav{display:flex;gap:4px;padding:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .nav::-webkit-scrollbar{display:none}
  .nav-btn{padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:#FFFFFF;color:var(--text2);font-family:var(--font);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
  .nav-btn:hover{background:#FFE8D6;color:var(--text)}
  .nav-btn.active{background:#E84400;color:#fff;border-color:#E84400;font-weight:700}
  .abar{height:3px;background:linear-gradient(90deg,#e84400,#ffa500,transparent);border-radius:2px;margin-bottom:18px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  @media(max-width:900px){.grid4{grid-template-columns:1fr 1fr}}
  @media(max-width:600px){.grid2,.grid4{grid-template-columns:1fr}}
  .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;box-shadow:0 1px 3px rgba(122,46,10,0.06)}
  .ctitle{font-size:0.84rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);font-weight:700;margin-bottom:10px}
  .cval{font-family:var(--font-cond);font-size:2rem;color:var(--text);line-height:1;font-weight:700}
  .cval.ac{color:#C2410C}
  .csub{font-size:0.92rem;color:var(--text3);font-weight:500;margin-top:5px}
  .delta{display:inline-flex;align-items:center;gap:4px;font-size:0.86rem;font-weight:700;padding:3px 9px;border-radius:12px;margin-top:9px}
  .delta.up{background:#E6F4EA;color:#14532D}
  .delta.dn{background:#FDE4E1;color:#B91C1C}
  .delta.wr{background:#FEF3C7;color:#92400E}
  .sh{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 14px;gap:12px;flex-wrap:wrap}
  .st{font-family:var(--font-cond);font-size:1.45rem;color:var(--text);font-weight:700}
  .ss{font-size:0.9rem;color:var(--text3)}
  .fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:600px){.fg{grid-template-columns:1fr}}
  .fl{display:flex;flex-direction:column;gap:5px}
  .flabel{font-size:0.84rem;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .finput,.fsel,.ftxt{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:1rem;padding:10px 12px;outline:none;transition:border-color .15s;width:100%}
  .finput:focus,.fsel:focus,.ftxt:focus{border-color:#e84400}
  .fsel option{background:var(--bg2)}
  .ftxt{resize:vertical;min-height:80px}
  .factions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:center}
  .btn{padding:10px 20px;border-radius:var(--radius-sm);border:none;font-family:var(--font);font-size:.88rem;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
  .btn-p{background:linear-gradient(135deg,#e84400,#c03000);color:#fff;box-shadow:0 2px 10px rgba(232,68,0,0.35)}
  .btn-p:hover{box-shadow:0 3px 14px rgba(232,68,0,0.5)}
  .btn-s{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
  .btn-s:hover{color:var(--text);border-color:#E84400}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .tw{overflow-x:auto}
  .tcomp th,.tcomp td{padding:8px 5px}
  .tcomp td{font-size:.88rem}
  .tcomp .tag{padding:2px 6px;white-space:nowrap}
  .thist th,.thist td{padding:7px 3px;font-size:.82rem}
  .thist th{font-size:.7rem;letter-spacing:0}
  .thist .tsm{font-size:.72rem}
  table{width:100%;border-collapse:collapse;font-size:.83rem}
  th{text-align:left;padding:10px 12px;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text2);border-bottom:1px solid var(--border);font-weight:700;white-space:nowrap}
  td{padding:11px 12px;font-size:.98rem;color:var(--text);border-bottom:1px solid #F6DCC2;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#FFF6EC}
  .tag{display:inline-block;padding:3px 9px;border-radius:10px;font-size:.86rem;font-weight:700}
  .tg{background:#E6F4EA;color:#14532D}
  .tr{background:#FDE4E1;color:#B91C1C}
  .ty{background:#FEF3C7;color:#92400E}
  .ai-panel{background:#FFF8F0;border:1px solid #F2C9A0;border-radius:var(--radius);padding:20px}
  .ai-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .ai-ico{width:34px;height:34px;background:linear-gradient(135deg,#e84400,#c03000);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 10px rgba(232,68,0,0.4)}
  .ai-ttl{font-family:var(--font-cond);font-size:1.15rem;color:#C2410C;font-weight:700}
  .ai-body{font-size:1rem;color:var(--text);line-height:1.7;white-space:pre-wrap}
  .ai-body.ld{color:var(--text3);font-style:italic;animation:pulse 1.5s infinite}
  .ch{height:255px;margin-top:12px}
  .toast{position:fixed;bottom:20px;right:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 18px;font-size:.84rem;display:flex;align-items:center;gap:8px;z-index:1000;animation:su .3s ease;max-width:340px;font-weight:500}
  .toast.ok{border-color:#86C99A;color:#14532D}
  .toast.er{border-color:#F3A99F;color:#B91C1C}
  @keyframes su{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  .banner{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;font-size:.95rem;color:var(--text);display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .banner a{color:#C2410C;text-decoration:none;font-weight:600}
  .gap{display:flex;flex-direction:column;gap:14px}
  .div{border:none;border-top:1px solid var(--border);margin:20px 0}
  .tsm{font-size:.9rem;color:var(--text3)}
  .tac{color:#C2410C;font-weight:700}
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

const cM=v=>{if(v==null||isNaN(v))return"—";const a=Math.abs(v),sg=v<0?"-":"";return a>=1e6?`${sg}$${fmt(a/1e6,2)}M`:`${sg}$${fmt(a/1e3,0)}k`;};
const fmt=(n,d=0)=>{if(n==null||isNaN(n))return"—";return new Intl.NumberFormat("es-UY",{maximumFractionDigits:d,minimumFractionDigits:d}).format(n)};
const fmtM=n=>{if(n==null||isNaN(n))return"—";if(n>=1e6)return`$${(n/1e6).toFixed(2)}M`;return`$${fmt(n)}`};
const pct=(a,b)=>{if(!b)return null;return(a-b)/b*100};

const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return<div style={{background:"#FFFFFF",border:"1px solid #F2C9A0",borderRadius:8,padding:"10px 14px",fontSize:"0.9rem",color:"#1F0D05"}}>
    <div style={{color:"#7A2E0A",marginBottom:6,fontWeight:700}}>{label}</div>
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
  {mes:"Jul","2022":800704,"2023":860901,"2024":1101916,"2025":1545618,"2026":1713093},
  {mes:"Ago","2022":920678,"2023":920732,"2024":1222144,"2025":1519419,"2026":1597281},
  {mes:"Set","2022":906547,"2023":865228,"2024":1190463,"2025":1590065,"2026":1910798},
  {mes:"Oct","2022":888901,"2023":954613,"2024":1318492,"2025":1830397,"2026":null},
  {mes:"Nov","2022":962003,"2023":973259,"2024":1530793,"2025":1632615,"2026":null},
  {mes:"Dic","2022":1486388,"2023":1303555,"2024":1635557,"2025":2726949,"2026":null},
];
// Ventas diarias del mes en curso según la planilla Excel (Ventas Diarias). Se muestran en Cargar datos junto con las cargadas en la app.
const VENTAS_DIA_PLANILLA = [
  {fecha:"2026-10-01",monto:66662},{fecha:"2026-10-02",monto:94263},{fecha:"2026-10-03",monto:28146,obs:"Mucha lluvia"},
  {fecha:"2026-10-05",monto:105429},{fecha:"2026-10-06",monto:84882},{fecha:"2026-10-07",monto:75023},{fecha:"2026-10-08",monto:82736},
  {fecha:"2026-10-09",monto:66603},{fecha:"2026-10-10",monto:52006},{fecha:"2026-10-12",monto:72210,obs:"Feriado (el local abre)"},{fecha:"2026-10-13",monto:72377},
  {fecha:"2026-10-14",monto:84240},{fecha:"2026-10-15",monto:77447},{fecha:"2026-10-16",monto:44850},{fecha:"2026-10-17",monto:58498},
];
const CUENTAS=["Santander","BROU","Efectivo de la caja","Otro (no sale del negocio)"];
// Retiros que Esteban contó por el chat (se suman a los de la hoja Retiros)
const RETIROS_CLAUDE = [
  {fecha:"2026-10-20",monto:738,tipo:"Personal",cuenta:"Santander",ts:"2026-10-20T20:00:00.000Z",obs:"Compra Banred San José (a confirmar)"},
  {fecha:"2026-10-19",monto:6212,tipo:"Personal",cuenta:"BROU",ts:"2026-10-19T18:00:00.000Z",obs:"Lojas Renner (a confirmar)"},
  {fecha:"2026-10-19",monto:4290,tipo:"Personal",cuenta:"BROU",ts:"2026-10-19T18:05:00.000Z",obs:"Zara (a confirmar)"},
  {fecha:"2026-10-01",monto:1227,tipo:"Personal",cuenta:"BROU",ts:"2026-10-01T15:00:00.000Z",obs:"Carnicería"},
  {fecha:"2026-10-12",monto:1306,tipo:"Personal",cuenta:"BROU",ts:"2026-10-12T15:00:00.000Z",obs:"Super Italia"},
  {fecha:"2026-10-12",monto:435,tipo:"Personal",cuenta:"BROU",ts:"2026-10-12T15:30:00.000Z",obs:"Panadería"},
  {fecha:"2026-10-13",monto:8164,tipo:"Personal",cuenta:"BROU",ts:"2026-10-13T19:00:00.000Z",obs:"Retiro del BROU"},
  {fecha:"2026-10-14",monto:1500,tipo:"Personal",cuenta:"BROU",ts:"2026-10-14T15:00:00.000Z",obs:"Transferencia, a confirmar"},
  {fecha:"2026-10-14",monto:750,tipo:"Personal",cuenta:"BROU",ts:"2026-10-15T00:30:00.000Z",obs:"Chivitería"},
  {fecha:"2026-10-15",monto:500,tipo:"Personal",cuenta:"BROU",ts:"2026-10-15T14:00:00.000Z",obs:"Retiro"},
  {fecha:"2026-10-13",monto:20953,tipo:"Pagos personales",cuenta:"BROU",ts:"2026-10-13T18:00:00.000Z",obs:"Desde BROU: UTE casa $7.479, VISA BBVA $10.715, Antel $1.648 y celulares $1.111"},
].map(r=>({...r,_claude:true}));
const PAGOS_CLAUDE = [
  {fecha:"2026-10-20",clave:"pend|2026-10|Cuota Candela (468 USD)|19617",concepto:"Cuota Candela (468 USD)",monto:19384,mes:"2026-10",ts:"2026-10-20T21:00:00.000Z",cuenta:"Santander"},
  {fecha:"2026-10-20",clave:"pend|2026-10|Jaspe|28812",concepto:"Jaspe",monto:28812,mes:"2026-10",ts:"2026-10-20T20:00:00.000Z",cuenta:"BROU"},
  {fecha:"2026-10-19",clave:"pend|2026-10|Solsire Sal (210 USD)|8505",concepto:"Solsire Sal (210 USD)",monto:9402,mes:"2026-10",ts:"2026-10-19T12:00:00.000Z",cuenta:"BROU",obs:"Pagado 19/10 desde BROU ($9.401,70 al tipo de cambio del día)"},
  {fecha:"2026-10-19",clave:"pend|2026-10|Unión Disprofarma|55046",concepto:"Unión Disprofarma",monto:55046,mes:"2026-10",ts:"2026-10-19T21:00:00.000Z",cuenta:"Santander"},
  {fecha:"2026-10-16",clave:"pend|2026-10|SUBATIR (llegó 26/08)|143420",concepto:"SUBATIR (llegó 26/08)",monto:143420,mes:"2026-10",ts:"2026-10-16T13:00:00.000Z",cuenta:"Santander"},
];
// Acreditaciones de tarjetas vistas en las capturas de los bancos (se suman a la hoja Depositos si no están)
const DEPOSITOS_CLAUDE = [
  {fecha:"2026-10-14",tipo:"Tarjetas",cuenta:"Santander",monto:30364,obs:"Abono pago a proveedores (captura)"},
  {fecha:"2026-10-15",tipo:"Tarjetas",cuenta:"Santander",monto:39052,obs:"Abono pago a proveedores (captura)"},
  {fecha:"2026-10-15",tipo:"Tarjetas",cuenta:"Santander",monto:349,obs:"Abono pago a proveedores (captura)"},
  {fecha:"2026-10-15",tipo:"Tarjetas",cuenta:"BROU",monto:2632,obs:"TRF pago a proveedores (captura, a confirmar)"},
  {fecha:"2026-10-16",tipo:"Tarjetas",cuenta:"Santander",monto:26918,obs:"Abono pago a proveedores (captura)"},
  {fecha:"2026-10-19",tipo:"Tarjetas",cuenta:"Santander",monto:40440,obs:"Abono pago a proveedores (captura, viernes y sábado)"},
  {fecha:"2026-10-19",tipo:"Tarjetas",cuenta:"Santander",monto:25303,obs:"Abono pago a proveedores (captura, viernes y sábado)"},
  {fecha:"2026-10-20",tipo:"Tarjetas",cuenta:"Santander",monto:28223,obs:"Abono pago a proveedores (captura)"},
  {fecha:"2026-10-20",tipo:"Tarjetas",cuenta:"Santander",monto:1067,obs:"Abono pago a proveedores (captura)"},
];
// Tickets del mes en curso (planilla "Analisis tickets")
const TK_CURSO = { mes:9, anio:2026, hasta:"12/10", cantidad:827, promedio:680.11, dias:10 };
const TK=[
  {mes:"Ene",c23:1858,p23:632,c24:1754,p24:651.1,c25:2333,p25:727,c26:2695,p26:699},
  {mes:"Feb",c23:1448,p23:583,c24:1533,p24:645.6,c25:1974,p25:676,c26:1985,p26:689},
  {mes:"Mar",c23:1516,p23:556,c24:1349,p24:654.1,c25:1684,p25:693,c26:2117,p26:672},
  {mes:"Abr",c23:1260,p23:576,c24:1501,p24:604.2,c25:1617,p25:590,c26:2042,p26:616},
  {mes:"May",c23:1201,p23:610,c24:1391,p24:604,c25:1709,p25:626,c26:1677,p26:676},
  {mes:"Jun",c23:1348,p23:557,c24:1712,p24:602.3,c25:1746,p25:638,c26:1835,p26:659},
  {mes:"Jul",c23:1226,p23:575,c24:1489,p24:581.1,c25:1818,p25:637,c26:1859,p26:662},
  {mes:"Ago",c23:1223,p23:577,c24:1584,p24:598.2,c25:1775,p25:650,c26:1787,p26:683.5},
  {mes:"Set",c23:1287,p23:556,c24:1583,p24:608.2,c25:1831,p25:647,c26:1937,p26:679.79},
  {mes:"Oct",c23:1324,p23:553,c24:1666,p24:581.9,c25:2031,p25:650,c26:null,p26:null},
  {mes:"Nov",c23:1339,p23:621,c24:1846,p24:655.5,c25:1991,p25:651,c26:null,p26:null},
  {mes:"Dic",c23:1673,p23:639,c24:2033,p24:675.9,c25:2873,p25:800,c26:null,p26:null},
];


// ── GASTOS REALES POR AÑO (extraídos de la planilla Excel) ──────────────────
const GASTOS = {
  alquiler: {
    "2022": [20000,20000,20000,20000,20000,20000,20000,20000,20000,20000,24525,24525],
    "2023": [24525,24525,24525,24525,24525,24525,24525,24525,24525,24525,26635,28845],
    "2024": [26635,26635,26635,26635,26635,26635,26635,26635,26635,26635,59931,59931],
    "2025": [59931,59931,59931,59931,59931,59931,59931,59931,59931,59931,62448,62448],
    "2026": [62448,62448,62448,62448,62448,62448,62448,62448,62448,null,null,null],
  },
  luz: {
    "2022": [11106,11096,11106,11106,11106,11106,11106,11106,11274,10562,10218,10218],
    "2023": [10218,12198,11418,10218,9079,10218,10218,12593,12593,12593,12593,10218],
    "2024": [9658,10218,10218,10218,10218,10218,10218,10218,10218,10218,10218,10218],
    "2025": [11544,11544,11544,11544,11544,11544,11544,11544,11544,11544,11544,11544],
    "2026": [11544,11544,11544,11544,11544,11544,11544,11544,11544,null,null,null],
  },
  empleados: {
    "2022": [121000,121000,121000,121000,121000,147204,134436,126849,126695,131905,147611,158000],
    "2023": [173000,113531,137425,134500,134500,137508,137941,146231,139487,143366,209347,197361],
    "2024": [185871,240134,145000,145000,150924,192424,155000,159639,265000,176900,179409,232849],
    "2025": [234500,180248,182632,223410,166084,220242,173481,223537,164223,164395,185792,229111],
    "2026": [208694,215225,188616,208520,201203,245906,230036,210474,193074,null,null,null],
  },
  publicidad: {
    "2022": [3828,9979,5732,0,0,0,5000,5000,5000,5000,5000,45000],
    "2023": [25000,25000,2018,58000,5000,27861,17835,0,5000,8839,29000,11500],
    "2024": [12000,18400,13300,16000,31250,31500,31500,31500,31500,31500,31500,31500],
    "2025": [31500,31500,31500,25000,25000,25000,25000,25000,25000,25000,25000,25000],
    "2026": [25000,25000,25000,25000,25000,25000,25000,25000,25000,null,null,null],
  },
  iva: {
    "2022": [0,0,0,0,0,0,0,0,0,0,0,0],
    "2023": [0,0,0,0,0,0,0,0,0,0,0,0],
    "2024": [0,0,0,22260,30000,39500,36000,33500,35000,13500,0,65000],
    "2025": [90000,172000,79851,115000,52000,90200,85333,42500,114000,24000,85500,91000],
    "2026": [252829,134500,47995,23060,59970,86939,96964,129267,71699,null,null,null],
  },
  otros: {
    "2022": [16223,55971,20000,20000,45000,30000,30000,53000,52309,38264,19956,62515],
    "2023": [52718,47258,35817,54781,64641,30000,50000,50000,40000,52000,50000,57000],
    "2024": [50000,50000,50000,50000,75000,75000,75000,75000,75000,75000,95000,55000],
    "2025": [55000,55000,55000,55000,55000,54755,55000,55000,55000,55000,55000,147400],
    "2026": [55000,55000,82777,55000,45000,45000,45000,45000,45000,null,null,null],
  },
};

// Helper para obtener gastos totales de un mes/año
const gastosMes = (yr, i) => {
  const sub = COMPRAS_SUBATIR[yr]?.[i] || 0;
  const est = COMPRAS_ESTUARIO[yr]?.[i] || 0;
  const jas = COMPRAS_JASPE[yr]?.[i] || 0;
  const alq = GASTOS.alquiler[yr]?.[i] || 0;
  const luz = GASTOS.luz[yr]?.[i] || 0;
  const emp = GASTOS.empleados[yr]?.[i] || 0;
  const pub = GASTOS.publicidad[yr]?.[i] || 0;
  const iva = GASTOS.iva[yr]?.[i] || 0;
  const ot = GASTOS.otros[yr]?.[i] || 0;
  const ban = comisionBanco(yr, i) || 0;
  return sub + est + jas + alq + luz + emp + pub + iva + ot + ban;
};

// Para compatibilidad con código existente - valores estáticos 2025
const GASTOS_2025 = {
  meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"],
  subatir:    [577448,675726,1072517,596520,479212,569920,449773,691744,493523,556379,730783,787248],
  proveedores:[342138,471956,396793,380810,344001,389208,428665,567687,629881,544982,520423,647040],
  empleados:  [234500,180248,182632,223410,166084,220242,173481,223537,164223,164395,185792,229111],
  alquiler:   [59931,59931,59931,59931,59931,59931,59931,59931,59931,59931,62448,62448],
  publicidad: [31500,31500,31500,25000,25000,25000,25000,25000,25000,25000,25000,25000],
  luz:        [11544,11544,11544,11544,11544,11544,11544,11544,11544,11544,11544,11544],
  iva:        [90000,172000,79851,115000,52000,90200,85333,42500,114000,24000,85500,91000],
  otros:      [55000,55000,55000,55000,55000,54755,55000,55000,55000,55000,55000,147400],
};

// ── COMPRAS POR PROVEEDOR (datos reales hoja Deudas) ─────────────────────────
const COMPRAS_SUBATIR = {
  "2022": [0,373421,734874,240629,282537,264063,292365,362998,325450,356159,360080,490777],
  "2023": [948760,560058,441516,367233,346636,388515,324461,411120,298430,309035,302344,488377],
  "2024": [406758,402779,428820,558450,427751,544331,384197,427456,401611,496743,549099,776782],
  "2025": [577448,721520,1072517,596520,479212,569920,449773,691744,493523,556379,730783,787248],
  "2026": [755308,1157578,731833,640830,441623,793483,634961,508406,578526,null,null,null],
};

const COMPRAS_ESTUARIO = {
  "2022": [0,0,45603,11089,64214,38130,33584,67086,33555,27888,49102,81532],
  "2023": [34170,57471,0,43915,39790,80358,49635,0,54434,57555,0,52110],
  "2024": [55514,59495,53182,26615,46402,59678,50733,60810,56226,30306,66185,54915],
  "2025": [54579,0,79219,63695,52261,52263,57568,67593,101014,54361,57148,100170],
  "2026": [64737,0,173369,0,82290,69675,61337,65323,120724,null,null,null],
};

const COMPRAS_JASPE = {
  "2022": [0,0,0,22013,0,12527,24152,0,7801,7529,18465,0],
  "2023": [22788,5767,0,17817,0,18641,9205,0,21906,10018,5067,12304],
  "2024": [9759,0,14112,19275,0,19237,18660,11649,32288,0,30395,28168],
  "2025": [0,39635,17574,16517,0,29337,22536,22394,26792,0,23091,35878],
  "2026": [0,28324,41868,28657,0,23941,25432,23617,24672,null,null,null],
};

// Condiciones de pago proveedores
const PLAZOS_PAGO = {
  "SUBATIR": 45,
  "Estuario Platino": 60,
  "JASPE": 45,
  "Bakedplus": 0,
  "Regional Sur": 0,
  "default": 30,
};

const totalGastosMes = (i) => {
  return (GASTOS_2025.subatir[i]||0) + (GASTOS_2025.proveedores[i]||0) +
    (GASTOS_2025.empleados[i]||0) + (GASTOS_2025.alquiler[i]||0) +
    (GASTOS_2025.publicidad[i]||0) + (GASTOS_2025.luz[i]||0) +
    (GASTOS_2025.iva[i]||0) + (GASTOS_2025.otros[i]||0);
};

// ── TOTAL GASTOS real por mes (hoja Deudas Generadas Proveedores, fila TOTAL GASTOS) ──
const TG_REAL = {
  "2022": [238982,775205,1193143,692859,727772,732185,668856,790835,761504,727297,766714,1088305],
  "2023": [1535712,1044481,832805,860646,785777,869277,832723,787241,742361,780125,850909,1086800],
  "2024": [973448,1023619,1003266,1187839,970046,1275942,1035468,1133196,1106098,1128463,1281170,1605037],
  "2025": [1399515,1618069,1812994,1404700,1153468,1345373,1236390,1613350,1476837,1383370,1618342,1968336],
  "2026": [1912797,2069130,1928542,1464980,1361222,1897317,1618555,1546198,1653958,null,null,null],
};

// ── Comisión de bancos por ventas con tarjeta (débito y crédito, Getnet) ─────
// No está en la planilla: se suma como gasto. Si la pestaña Caja tiene suficientes días medidos en el mes
// (vendido con tarjeta vs. acreditado), se usa la comisión real; si no, COM.pct % de las ventas totales.
const COM = { pct: 3, real: {} };
const comisionPorMes = (filas) => {
  const M={};
  filas.forEach(f=>{ if(!f.fecha) return; const k=String(f.fecha).slice(0,7); const m=(M[k]=M[k]||{tj:0,vend:0,cob:0,dias:0,cierres:0}); m.tj+=f.tarjetas||0; m.cierres++;
    if(f.tjAcred!=null&&f.tarjetas>0){ m.vend+=f.tarjetas; m.cob+=f.tjAcred; m.dias++; } });
  const out={};
  Object.entries(M).forEach(([k,m])=>{
    if(m.dias<8||m.vend<=0) return;
    const tasa=1-m.cob/m.vend; if(!(tasa>0&&tasa<0.1)) return;          // descarta mediciones absurdas
    const [y,mm]=k.split("-"); const dh=DIAS_HABILES[y]?.[MES3[Number(mm)-1]]||m.cierres;
    const esc=m.cierres<dh? dh/m.cierres : 1;                           // completa los días sin cierre cargado
    out[k]={tasa:tasa*100, monto:Math.round(tasa*m.tj*esc), dias:m.dias, cierres:m.cierres, tarjetas:m.tj};
  });
  return out;
};
const comisionBanco = (anio, i) => {
  const r=COM.real[`${anio}-${String(i+1).padStart(2,"0")}`];
  if(r) return r.monto;
  const v=VM[i]?.[String(anio)];
  return v==null?null:Math.round(v*COM.pct/100);
};
// % de las ventas que se va en comisiones (real si hay meses cerrados medidos, si no el configurado)
const comisionPctEfectiva = () => {
  let c=0,v=0; Object.keys(COM.real).forEach(k=>{const [y,mm]=k.split("-");const vv=VM[Number(mm)-1]?.[y];if(vv){c+=COM.real[k].monto;v+=vv;}});
  return v? c/v*100 : COM.pct;
};
const gastoTotal = (anio, i) => { const g=TG_REAL[anio]?.[i]; return g==null? null : g+(comisionBanco(anio,i)||0); };

// ── Pagos de deuda (préstamos familiares y créditos: ítems "crédito" / "Candela") ──
const DEUDA_PAGOS = {
  "2022": [66825,70875,8100,71588,61438,60300,20250,41500,41500,41500,0,40120],
  "2023": [0,20000,0,20000,0,20000,0,19300,35300,28350,28350,68000],
  "2024": [28000,28400,8100,44635,0,0,0,10000,0,0,8700,8700],
  "2025": [51034,0,0,0,0,0,90615,90144,89981,89981,89990,89700],
  "2026": [78828,82188,82188,82188,82188,73694,72963,72963,72609,null,null,null],
};

// ── Deudas pendientes según colores de la planilla (amarillo/rosado = proveedor sin pagar, violeta = cheque SUBATIR) ──
const PENDIENTES_FECHA = "19/10/2026";
const PENDIENTES = [
  {mes:"2026-10",prov:"SUBATIR (llegó 26/08)",monto:143420,tipo:"cheque"}, // la planilla decía 149.960; el cheque real fue 143.420 (cobrado 16/10)
  {mes:"2026-10",prov:"Cuota Candela (468 USD)",monto:19617,tipo:"credito"},
  {mes:"2026-10",prov:"Solsire Sal (210 USD)",monto:8505,tipo:"prov"},
  {mes:"2026-10",prov:"Unión Disprofarma",monto:55046,tipo:"prov"},
  {mes:"2026-10",prov:"Jaspe",monto:28812,tipo:"prov"},
  {mes:"2026-10",prov:"SUBATIR (llegó 02/09)",monto:130066,tipo:"cheque"},
  {mes:"2026-10",prov:"Jupiter",monto:3961,tipo:"prov"},
  {mes:"2026-10",prov:"Crédito Santander",monto:53348,tipo:"credito"},
  {mes:"2026-10",prov:"San Francisco",monto:59546,tipo:"prov"},
  {mes:"2026-10",prov:"Cameril",monto:55821,tipo:"prov"},
  {mes:"2026-10",prov:"Estuario Platino",monto:63600,tipo:"prov"},
  {mes:"2026-10",prov:"SUBATIR (llegó 09/09)",monto:135000,tipo:"cheque"},
  {mes:"2026-11",prov:"Parque Trébol",monto:16560,tipo:"prov"},
  {mes:"2026-11",prov:"SUBATIR (llegó 16/09)",monto:164237,tipo:"cheque"},
  {mes:"2026-11",prov:"Pedro Merla",monto:25108,tipo:"prov"},
  {mes:"2026-11",prov:"Atersa",monto:24520,tipo:"prov"},
  {mes:"2026-11",prov:"Solsire",monto:18516,tipo:"prov"},
  {mes:"2026-11",prov:"Aymi",monto:9934,tipo:"prov"},
  {mes:"2026-11",prov:"Palmisol",monto:17116,tipo:"prov"},
  {mes:"2026-11",prov:"Calusil",monto:14976,tipo:"prov"},
  {mes:"2026-11",prov:"Irmari (289,87 USD)",monto:11885,tipo:"prov"},
  {mes:"2026-11",prov:"Irmari",monto:11624,tipo:"prov"},
  {mes:"2026-11",prov:"SUBATIR (llegó 23/09)",monto:149691,tipo:"cheque"}, // planilla: "Mirar wasap, falta un cheque $19.303"
  {mes:"2026-11",prov:"Estuario Platino",monto:72156,tipo:"prov"},
  {mes:"2026-11",prov:"Cuota Candela (468 USD)",monto:19618,tipo:"credito"},
  {mes:"2026-11",prov:"SUBATIR",monto:193210,tipo:"cheque"},
  {mes:"2026-11",prov:"Estuario Platino",monto:72116,tipo:"prov"},
  {mes:"2026-11",prov:"Jaspe",monto:19768,tipo:"prov"},
  {mes:"2026-11",prov:"SUBATIR (pedido 12/10, 2.650 kg)",monto:171694,tipo:"cheque"},
  {mes:"2026-11",prov:"Andrés Bauer (527 USD)",monto:21344,tipo:"prov"},
  {mes:"2026-11",prov:"Crédito Santander",monto:53349,tipo:"credito"},
  {mes:"2026-11",prov:"Alido Valiero (1/2)",monto:27600,tipo:"prov"},
  {mes:"2026-12",prov:"Estuario Platino",monto:63310,tipo:"prov"},
  {mes:"2026-12",prov:"Cuota Candela (468 USD)",monto:19619,tipo:"credito"},
  {mes:"2026-12",prov:"Plazo fijo",monto:313000,tipo:"plazo"},
  {mes:"2026-12",prov:"Crédito Santander",monto:53350,tipo:"credito"},
  {mes:"2026-12",prov:"Alido Valiero (2/2)",monto:27600,tipo:"prov"},
  {mes:"2026-12",prov:"Enjoy vía SUBATIR — cheque 20/12 (1/3 de $287.456)",monto:95819,tipo:"cheque"},
  {mes:"2026-12",prov:"Intex vía SUBATIR — cheque 30/12 (1/3 de $383.340)",monto:127780,tipo:"cheque"},
  {mes:"2027-01",prov:"Enjoy vía SUBATIR — cheque 20/01 (2/3)",monto:95819,tipo:"cheque"},
  {mes:"2027-01",prov:"Intex vía SUBATIR — cheque 30/01 (2/3)",monto:127780,tipo:"cheque"},
  {mes:"2027-02",prov:"Enjoy vía SUBATIR — cheque 20/02 (3/3)",monto:95818,tipo:"cheque"},
  {mes:"2027-02",prov:"Intex vía SUBATIR — cheque 28/02 (3/3)",monto:127780,tipo:"cheque"}
];
// Gastos operativos ya programados en la planilla (TOTAL GASTOS sin cuotas de créditos). idx 9 = Oct-26
const COSTOS_PROGRAMADOS = {9:1805402, 10:1498968, 11:590720}; // planilla 19/10 sin cuotas de créditos; dic sin Intex (va aparte en COMPRAS_TEMPORADA, porque el costo estimado de dic supera lo programado)
// Compras de temporada (Intex y Enjoy, vía SUBATIR) que no están en la planilla o caen fuera de los meses programados: se suman a los costos del mes
const COMPRAS_TEMPORADA = {11:127780, 12:223599, 13:223598}; // dic: Intex 1/3 · ene y feb: Enjoy + Intex
// Mes en curso al último saldo cargado: lo ya vendido y lo ya pagado del mes están dentro del saldo bancario,
// así que la proyección del primer mes solo suma lo que falta vender y lo que falta pagar.
const MES_EN_CURSO = { idx:9, desde:"2026-10-19", diasYa:15, ventasMes:1064372, ventasYa:1028173, pagadoYa:1174649, retiradoYa:47303, candelaPagada:true }; // ventasYa: hasta 08/10 + efectivo 12/10 $16.000 + tarjetas 9-12/10 ≈ $93.052 + ANDA $1.761 + Santander +$40.000 (13–14/10) + tarjetas acreditadas 14/10 $30.363 (≈ $31.302 antes de comisión) + tarjetas 15/10 $39.051 (≈ $40.259) + buzonera Santander 14/10 $30.000 + abono $349 + BROU 15/10 $2.632 (tarjetas) y $13.000 (venta del 15/10 girada por el cliente) + buzonera 17.000 (15/10) + tarjetas 16/10 $26.918 (≈ $27.750) + buzonera 12.000 (cierre 16/10) + transferencia 17/10 $5.357 + buzonera 11.000 (cierre 17/10) + tarjetas vie/sáb $65.742 (≈ $67.775) + buzonera 22.000 (19/10) + tarjetas 20/10 $29.290 (≈ $30.196) ; pagadoYa: proveedores en verde $592.098 + alquiler + sueldos $140.460 + correcaminata $10.000 + proveedor contado $3.782 + BPS $76.051 + contador $9.000 + Cooperativa la Cruz $9.275 (BROU) + Alido Valiero $23.892 (Santander) + cheque clearing $143.420 (16/10, Santander) + OSE $3.129 (19/10, Santander, a confirmar si es del local) + Unión Disprofarma $55.046 + comisión $78 (19/10, Santander) + Antel $2.756 (20/10, débito Santander, a confirmar si es del local) + Solsire Sal $9.402 (19/10, BROU; los $1.814 de SUBATIR fueron un cobro que nos debían, ya están en el saldo); retiradoYa: carne $1.227 + Super Italia $1.306 + panadería $435 + pagos personales $20.953 + $8.164 (13/10, BROU) + $1.500 (14/10, BROU, a confirmar) + Xander Juli $1.228 (15/10, BROU) + chivitería $750 (14/10) + retiro $500 (15/10)
// Saldos bancarios reales informados (se usan si son más nuevos que el último guardado)
const SALDO_REF = { fecha:"2026-10-20", ts:"2026-10-21T02:42:00.000Z", brou:37203, santUyu:-417396, santUsd:-3.39, tc:41.42 }; // 23:42: Santander $ −398.012 − cuota Candela 468 USD pagada en pesos ($19.384); cuenta USD sin cambios // 20/10 23:36 reales (capturas). Santander: −423.274 + buzonera 26.000 (cierre 20/10 + $1.000 del 19/10) − compra Banred San José 738. BROU: 57.586 + 5.530 (TRF pago a proveedores, cobro a confirmar) + 2.899 (transferencia Liga, cierre 20/10) − Jaspe 28.812

// ── Stock valorizado a costo ─────────────────────────────────────────────────
const STOCK_HIST = [
  {fecha:"2025-10-02", valor:2866890, obs:"Valuación"},
  {fecha:"2026-01-01", valor:3343256, obs:"Valuación"},
  {fecha:"2026-10-02", valor:3890000, obs:"Valuación"},
];
const COMPRAS_PROM_MES = 1167190; // mercadería promedio por mes ene–set 2026, sin cuotas de créditos
const analizarStock = (lista) => {
  const L=[...lista].sort((a,b)=>a.fecha<b.fecha?-1:1);
  if(!L.length) return null;
  const ult=L[L.length-1]; const tU=new Date(ult.fecha+"T12:00:00").getTime();
  let hace=null,best=1e18;
  L.forEach(s=>{const d=Math.abs((tU-new Date(s.fecha+"T12:00:00").getTime())/864e5-365);if(d<45&&d<best){best=d;hace=s;}});
  const stockVar=hace?(ult.valor/hace.valor-1)*100:null;
  // ventas últimos 12 meses vs 12 anteriores (meses cerrados)
  const serie=[];["2022","2023","2024","2025","2026"].forEach(y=>VM.forEach(r=>{if(r[y]!=null)serie.push(r[y]);}));
  const u12=serie.slice(-12).reduce((s,x)=>s+x,0), p12=serie.slice(-24,-12).reduce((s,x)=>s+x,0);
  const ventasVar=p12?(u12/p12-1)*100:null;
  return {ult,hace,stockVar,ventasVar,cobertura:ult.valor/COMPRAS_PROM_MES,lista:L};
};

// ── Control diario: cierres, depósitos, pagos ───────────────────────────────
const hoyISO = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const FERIADOS_BANCO = new Set([
  "2026-01-01","2026-01-06","2026-02-16","2026-02-17","2026-04-02","2026-04-03","2026-05-01","2026-06-19","2026-07-18","2026-08-25","2026-10-12","2026-11-02","2026-12-25",
  "2027-01-01","2027-01-06","2027-02-08","2027-02-09","2027-03-25","2027-03-26","2027-05-01","2027-06-19","2027-07-18","2027-08-25","2027-10-12","2027-11-02","2027-12-25"]);
const isoDe = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const diaHabilBancoSig = (iso) => { const d=new Date(iso+"T12:00:00"); do { d.setDate(d.getDate()+1); } while(d.getDay()===0||d.getDay()===6||FERIADOS_BANCO.has(isoDe(d))); return isoDe(d); };
const DIAS_SEM = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const fCorta = iso => { const d=new Date(iso+"T12:00:00"); return `${DIAS_SEM[d.getDay()]} ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const COSTOS_FIJOS = [
  {nombre:"Alquiler", monto:62448},
  {nombre:"Luz", monto:11544},
  {nombre:"Sueldos y BPS", monto:215000},
  {nombre:"Publicidad", monto:25000},
  {nombre:"IVA", monto:100000},
  {nombre:"Otros gastos", monto:55000},
];
const COSTOS_FIJOS_MES = {
  "2026-10":[{nombre:"Alquiler",monto:62448,planilla:true},{nombre:"Luz",monto:11544},{nombre:"Sueldos",monto:140460,planilla:true},{nombre:"BPS (pagado 13/10, BROU)",monto:76051,planilla:true},{nombre:"Publicidad",monto:25000},{nombre:"IVA (DGI)",monto:117075},{nombre:"Contador (pagado 13/10, BROU)",monto:9000,planilla:true},{nombre:"Otros gastos (sin contador)",monto:36000},{nombre:"Correcaminata (pagada 02/10)",monto:10000,planilla:true},{nombre:"Correcaminata (pagada 20/10, efectivo de caja)",monto:5000,planilla:true}],
  "2026-11":[{nombre:"Alquiler",monto:65370},{nombre:"Luz",monto:11544},{nombre:"Sueldos y BPS",monto:220000},{nombre:"Publicidad",monto:25000},{nombre:"IVA",monto:90000},{nombre:"Otros gastos",monto:45000}],
  "2026-12":[{nombre:"Alquiler",monto:62448},{nombre:"Luz",monto:11544},{nombre:"Sueldos y BPS (con aguinaldo)",monto:260000},{nombre:"Publicidad",monto:25000},{nombre:"IVA",monto:70000},{nombre:"Otros gastos",monto:45000}],
};
const clavePend = p => `pend|${p.mes}|${p.prov}|${p.monto}`;
const claveFijo = (mes,n) => `fijo|${mes}|${n}`;
// Control: une cada día de venta con el depósito de efectivo del mismo día y la acreditación de tarjetas del día hábil bancario siguiente
const controlDiario = (cierres, depositos) => {
  const C=[...cierres].sort((a,b)=>a.fecha<b.fecha?-1:1);
  const depEf={}, depTj={};
  const desde=C.length?C[0].fecha:"", hasta=C.length?C[C.length-1].fecha:"";
  depositos.forEach(d=>{ if(d.tipo==="Efectivo"&&C.length&&(String(d.fecha)<desde||String(d.fecha)>diaHabilBancoSig(hasta))) return; const m=Number(d.monto)||0; if(d.tipo==="Efectivo") depEf[d.fecha]=(depEf[d.fecha]||0)+m; else depTj[d.fecha]=(depTj[d.fecha]||0)+m; });
  // agrupar tarjetas por fecha de acreditación esperada
  const porAcred={};
  C.forEach(c=>{ const f=diaHabilBancoSig(c.fecha); (porAcred[f]=porAcred[f]||[]).push(c); });
  const filas=C.map(c=>{
    const fa=diaHabilBancoSig(c.fecha); const grupo=porAcred[fa]; const totTj=grupo.reduce((s,x)=>s+x.tarjetas,0);
    const acred=depTj[fa]; const tjAcred = acred!=null && totTj>0 ? acred*c.tarjetas/totTj : null;
    const ventaTot=c.venta+(c.ventaErp||0);
    const efNeto=c.efectivo+(c.ventaErp||0)-(c.gastosEf||0);
    const ef=depEf[c.fecha]||0;
    const deposit=(tjAcred??0)+ef+(c.gastosEf||0);
    return {...c, fechaAcred:fa, acreditado:acred!=null, tjAcred, ventaTot, efNeto, efDep:ef, pct: ventaTot? deposit/ventaTot*100 : null, pendiente: acred==null && fa>hoyISO()};
  });
  const conAcred=filas.filter(f=>f.tjAcred!=null);
  const tjVend=conAcred.reduce((s,f)=>s+f.tarjetas,0), tjCob=conAcred.reduce((s,f)=>s+f.tjAcred,0);
  const efVendNeto=filas.reduce((s,f)=>s+f.efNeto,0), efDepTot=Object.values(depEf).reduce((s,x)=>s+x,0);
  return {filas, comision: tjVend&&conAcred.length>=5? (1-tjCob/tjVend)*100 : null, diasAcred:conAcred.length, tjVend, tjCob, efVendNeto, efDepTot, efPendiente: efVendNeto-efDepTot, desde, hasta};
};

// ── Cierre de caja con foto ──────────────────────────────────────────────────
const CIERRE_CAMPOS = [
  ["ventaPos","Venta total POS"],["efectivoPos","Efectivo POS"],["tarjetasPos","Tarjetas POS"],
  ["visa","Visa"],["mastercard","Mastercard"],["oca","OCA"],["maestro","Maestro"],["otrasTj","Otras tarjetas"],
  ["aperturaPos","Apertura caja POS"],["salidaPos","Salida de caja POS (pasa al ERP)"],["saldoSistema","Saldo efectivo según sistema"],
  ["efectivoContado","Efectivo contado (caja final)"],["diferencia","Diferencia de caja"],
  ["aperturaErp","Apertura caja ERP"],["ventasErp","Ventas contado en ERP (efectivo)"],["tarjetaErp","Ventas con tarjeta en ERP (POS manual)"],
  ["gastosEf","Gastos pagados en efectivo (ERP)"],["deposito","Depósito al banco"],["saldoErp","Saldo final caja ERP"],
];
// Cierres que Esteban mandó por el chat y leyó Claude (se suman a los de la planilla de cierres si esa fecha no está)
const CIERRES_CLAUDE = [
  {fecha:"2026-10-12",cajero:"Natalia Pereira",ventaPos:42633,efectivoPos:12756,tarjetasPos:29877,visa:9033,mastercard:20010,oca:null,maestro:null,otrasTj:834,aperturaPos:9839,salidaPos:13000,saldoSistema:9595,efectivoContado:9593,diferencia:-2,aperturaErp:18050,ventasErp:3409,tarjetaErp:5835,gastosEf:0,deposito:16000,saldoErp:18459,credito:0,transferencia:0,gastosDetalle:"",obs:"Leído por Claude (chat)",ts:"2026-10-12T21:30:00.000Z"},
  {fecha:"2026-10-13",cajero:"Valentina Preza",ventaPos:50346,efectivoPos:22446,tarjetasPos:27900,visa:11651,mastercard:14505,oca:null,maestro:null,otrasTj:1744,aperturaPos:9593,salidaPos:21000,saldoSistema:11039,efectivoContado:11034,diferencia:-5,aperturaErp:18459,ventasErp:19750,tarjetaErp:0,gastosEf:330,deposito:40000,saldoErp:18879,credito:0,transferencia:0,gastosDetalle:"San Roque $330",obs:"Leído por Claude (chat). Cabal $1.744 en otras. ERP: devoluciones $7.520 y $279 descontadas",ts:"2026-10-13T21:10:00.000Z"},
].map((c,i)=>({...c,_i:"c"+i,_claude:true}));
// Correcciones a cierres guardados con algún número mal leído (se aplican al leer la planilla de cierres)
const CIERRES_CORREC = {
  "2026-10-16": {tarjetaErp:null},   // la lectura repitió las tarjetas del POS
  "2026-10-20": {tarjetaErp:null, gastosEf:6456, gastosDetalle:"Encomiendas del Litoral 400 y 470; Impacto Carrera 5.000 (correcaminata); Estela Elgues 319; Laurenza Dupont 267"}, // tarjetaErp tomó el saldo de caja ERP; total real del día $108.737 (Macrosoft)
};
const textoGastos = g => Array.isArray(g) ? g.map(x=> x&&typeof x==="object" ? [x.concepto||x.detalle||x.descripcion||x.nombre||"", x.monto??x.importe??""].join(" ").trim() : String(x)).join("; ") : (g&&typeof g==="object" ? Object.values(g).join(" ") : String(g||""));
const CIERRE_VACIO = () => ({fecha:hoyISO(),cajero:"",credito:"",transferencia:"",gastosDetalle:"",obs:"",...Object.fromEntries(CIERRE_CAMPOS.map(([k])=>[k,""]))});
const nC = v => (v===""||v==null||isNaN(Number(v))) ? null : Number(v);
const chequearCierre = (c) => {
  const v=k=>nC(c[k]); const ok=(a,b)=>Math.abs(a-b)<=1; const R=[];
  if(v("ventaPos")!=null&&v("efectivoPos")!=null&&v("tarjetasPos")!=null)
    R.push({ok:ok(v("efectivoPos")+v("tarjetasPos"),v("ventaPos")),txt:"Efectivo + tarjetas = venta total POS",campos:["ventaPos","efectivoPos","tarjetasPos"]});
  const marcas=["visa","mastercard","oca","maestro","otrasTj"].map(v).filter(x=>x!=null);
  if(marcas.length&&v("tarjetasPos")!=null) R.push({ok:ok(marcas.reduce((s,x)=>s+x,0),v("tarjetasPos")),txt:"Suma de tarjetas por marca = tarjetas POS",campos:["visa","mastercard","oca","maestro","otrasTj","tarjetasPos"]});
  if(v("aperturaPos")!=null&&v("efectivoPos")!=null&&v("salidaPos")!=null&&v("saldoSistema")!=null)
    R.push({ok:ok(v("aperturaPos")+v("efectivoPos")-v("salidaPos"),v("saldoSistema")),txt:"Apertura + efectivo − salida = saldo del sistema",campos:["aperturaPos","efectivoPos","salidaPos","saldoSistema"]});
  if(v("efectivoContado")!=null&&v("saldoSistema")!=null&&v("diferencia")!=null)
    R.push({ok:ok(v("efectivoContado")-v("saldoSistema"),v("diferencia")),txt:"Efectivo contado − saldo del sistema = diferencia",campos:["efectivoContado","saldoSistema","diferencia"]});
  if(["aperturaErp","ventasErp","salidaPos","gastosEf","deposito","saldoErp"].every(k=>v(k)!=null))
    if(v("tarjetaErp")) R.push({ok:!(v("tarjetaErp")===v("saldoErp")||v("tarjetaErp")===v("tarjetasPos")),txt:"Ventas con tarjeta en ERP: solo si en el desglose hay sección \"Pos Alambrico Manual\" (si no, va 0)",campos:["tarjetaErp"]});
    R.push({ok:ok(v("aperturaErp")+v("ventasErp")+v("salidaPos")-v("gastosEf")-v("deposito"),v("saldoErp")),txt:"Caja ERP: apertura + ventas + ingreso del POS − gastos − depósito = saldo",campos:["aperturaErp","ventasErp","salidaPos","gastosEf","deposito","saldoErp"]});
  return R;
};
const difCierre = c => { const d=nC(c.diferencia); if(d!=null) return d; const a=nC(c.efectivoContado),b=nC(c.saldoSistema); return a!=null&&b!=null?a-b:null; };
const reducirFoto = (file) => new Promise((res,rej)=>{ const fr=new FileReader(); fr.onerror=rej; fr.onload=()=>{ const img=new Image(); img.onerror=rej; img.onload=()=>{
  const M=1700; let w=img.width,h=img.height; const k=Math.min(1,M/Math.max(w,h)); w=Math.round(w*k); h=Math.round(h*k);
  const cv=document.createElement("canvas"); cv.width=w; cv.height=h; cv.getContext("2d").drawImage(img,0,0,w,h); res(cv.toDataURL("image/jpeg",0.85)); }; img.src=fr.result; }; fr.readAsDataURL(file); });
const PROMPT_CIERRE = `Sos un asistente que lee cierres de caja de un local comercial en Uruguay. Las fotos pueden estar giradas o tener varios papeles juntos. Los números usan coma para miles y punto para decimales (ej: 25,438.00 = 25438).
Papeles posibles:
1) "Y de Caja" (ticket térmico angosto): Venta Total; Forma Pago-: Efectivo y Tarjetas; Ingresos-: Apertura De Caja; Egresos-: Salida De Caja; "Saldo Caja--Sis" Efectivo; "Caja Final--Caj" Efectivo; "Diferencias--Si" Efectivo; y "Cajero: N-Nombre".
2) "Z de Caja" (ticket térmico): líneas Efectivo, VISA, MASTERCARD, OCA, MAESTRO u otras tarjetas.
3) "Desglose de Valores en Caja por Forma de Pago" (hoja A4 del ERP). Sección "1-Efectivo $": entradas "E-Ticket Contado"/"E-Factura Contado" (ventas en efectivo del ERP), "7 Apertura De Caja", "11 Ingreso De Pos"; salidas: gastos y retiros (Movimiento De Caja con conceptos como Arreglo, Adelanto, Retiro, Gasto Recibo, Regalo), "0 Deposito:DE" (depósito al banco); "Saldo" final. Sección "21-Pos Alambrico Manual": ventas con tarjeta en el ERP (restar devoluciones), usar su Saldo. Si esa sección NO aparece en la hoja, tarjetaErp es 0 (no uses el Saldo de la sección Efectivo ni las tarjetas del POS).
4) Boleta de depósito del banco (MONTO).
Devolvé SOLO un JSON entre <json> y </json> con estas claves numéricas (null si no aparece): ventaPos, efectivoPos, tarjetasPos, visa, mastercard, oca, maestro, otrasTj, aperturaPos, salidaPos (positivo), saldoSistema, efectivoContado, diferencia, aperturaErp, ventasErp (suma de E-Ticket/E-Factura Contado en efectivo), tarjetaErp (saldo de Pos Alambrico Manual), gastosEf (suma de TODAS las salidas de efectivo del ERP que NO son el depósito: Gasto Recibo, Movimiento De Caja, etc.; comprobá que apertura + ventas + ingreso de POS − gastosEf − depósito = saldo), deposito, saldoErp; y además "fecha" (AAAA-MM-DD), "cajero" (solo el nombre) y "gastosDetalle" (UN SOLO TEXTO, no lista: concepto y monto de cada gasto separados por punto y coma). No agregues explicaciones.`;
// Junta las fotos del cierre en una sola imagen liviana para el mail (se guarda en la planilla de cierres, columnas AA en adelante)
const fotoParaMail = async (urls) => {
  if(!urls||!urls.length) return null;
  const imgs=await Promise.all(urls.map(u=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=u;}))).then(a=>a.filter(Boolean));
  if(!imgs.length) return null;
  for(const [H,q] of [[1100,0.6],[950,0.5],[800,0.45],[650,0.4],[520,0.35]]){
    const ws=imgs.map(i=>Math.round(i.width*H/i.height)); let W=ws.reduce((a,b)=>a+b,0), h=H; const k=Math.min(1,1700/W); W=Math.round(W*k); h=Math.round(H*k);
    const cv=document.createElement("canvas"); cv.width=W; cv.height=h; const g=cv.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,W,h);
    let x=0; imgs.forEach((im,j)=>{ const w=Math.round(ws[j]*k); g.drawImage(im,x,0,w,h); x+=w; });
    const b64=cv.toDataURL("image/jpeg",q).split(",")[1];
    if(b64.length<=135000) return b64;
  }
  return null;
};
const achicarFoto = (url, M) => new Promise(res=>{ const img=new Image(); img.onload=()=>{ let w=img.width,h=img.height; const k=Math.min(1,M/Math.max(w,h)); const cv=document.createElement("canvas"); cv.width=Math.round(w*k); cv.height=Math.round(h*k); cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height); res(cv.toDataURL("image/jpeg",0.8)); }; img.onerror=()=>res(url); img.src=url; });
let CANCELAR_LECTURA = null;
const leerCierreConIA = async (fotos, orKey, onEstado) => {
  let cancelado=false; CANCELAR_LECTURA=()=>{cancelado=true; if(ctrlActual) ctrlActual.abort();}; let ctrlActual=null;
  let modelos=[], fuente="lista", pagos=[];
  // Modelos pagos muy baratos (menos de 1 centavo de dólar por cierre): se prueban primero; si la cuenta no tiene saldo, fallan al instante y se sigue con los gratuitos.
  const PREF_PAGO=["google/gemini-2.5-flash","google/gemini-2.5-flash-lite","openai/gpt-4.1-mini","openai/gpt-4o-mini","google/gemini-2.0-flash-001"];
  let usarPago=true; try{ usarPago=localStorage.getItem("prolimpio_vision_pago")!=="no"; }catch(e){}
  try{ const r=await fetch("https://openrouter.ai/api/v1/models"); if(r.ok){ const j=await r.json();
    const conImg=new Set((j.data||[]).filter(m=>(m.architecture?.input_modalities||[]).includes("image")).map(m=>m.id));
    pagos=PREF_PAGO.filter(id=>conImg.has(id)).slice(0,2);
    const pref=["qwen2.5-vl","qwen-2.5-vl","qwen3-vl","llama-4-maverick","llama-4-scout","gemma-3-27b","mistral-small-3","kimi-vl","gemma-3"]; const sc=id=>{const i=pref.findIndex(p=>id.includes(p));return i<0?99:i;};
    modelos=(j.data||[]).filter(m=>m.id.endsWith(":free")&&(m.architecture?.input_modalities||[]).includes("image")&&!/safety|guard|inkling|embed|moderat/i.test(m.id)).map(m=>m.id).sort((a,b)=>{const ra=/reason|think|r1\b|-r1/i.test(a)?1:0,rb=/reason|think|r1\b|-r1/i.test(b)?1:0;return ra-rb||sc(a)-sc(b);}).slice(0,8);
    fuente="openrouter"; } }catch(e){}
  if(!modelos.length) modelos=["qwen/qwen2.5-vl-72b-instruct:free","meta-llama/llama-4-maverick:free","google/gemma-3-27b-it:free","mistralai/mistral-small-3.2-24b-instruct:free"];
  if(!pagos.length) pagos=PREF_PAGO.slice(0,2);
  if(usarPago) modelos=[...pagos,...modelos];
  let sinSaldo=false;
  const errores=[];
  const pedir=async(model,imgs)=>{
    if(cancelado) throw new Error("cancelado");
    const ctrl=new AbortController(); ctrlActual=ctrl; const to=setTimeout(()=>ctrl.abort(),45000);
    let r; try{ r=await fetch("https://openrouter.ai/api/v1/chat/completions",{signal:ctrl.signal,method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${orKey}`,"HTTP-Referer":"https://emarosteguy-oss.github.io/prolimpio2026/","X-Title":"PROlimpio Durazno"},
      body:JSON.stringify({model,temperature:0,max_tokens:1500,messages:[{role:"user",content:[{type:"text",text:PROMPT_CIERRE},...imgs.map(u=>({type:"image_url",image_url:{url:u}}))]}]})}); }
    catch(e){ clearTimeout(to); throw new Error(cancelado?"cancelado":"no respondió en 45 segundos"); }
    clearTimeout(to);
    let d={}; try{d=await r.json();}catch(e){}
    if(!r.ok||d.error){ const raw=d?.error?.metadata?.raw; let det=d?.error?.message||("HTTP "+r.status); if(raw) det+=" · "+String(typeof raw==="string"?raw:JSON.stringify(raw)).slice(0,140); if(d?.error?.metadata?.provider_name) det+=" ["+d.error.metadata.provider_name+"]"; throw new Error(det); }
    const t=d?.choices?.[0]?.message?.content||""; const m=t.match(/<json>([\s\S]*?)<\/json>/i)||t.match(/\{[\s\S]*\}/);
    if(!m) throw new Error("respondió sin datos: "+t.slice(0,80));
    return JSON.parse((m[1]||m[0]).replace(/```json|```/g,"").trim());
  };
  let chicas=null;
  for(const model of modelos){
    const nom=model.replace(":free",""); const esPago=!model.endsWith(":free");
    if(esPago&&sinSaldo) continue;
    try{ onEstado&&onEstado(`Leyendo con ${nom}…`); return {ok:true,datos:await pedir(model,fotos),modelo:model,errores}; }
    catch(e1){
      if(cancelado) return {ok:false,error:"Lectura cancelada",errores:[...errores,"Cancelada por el usuario"]};
      const m1=String(e1.message||e1);
      if(esPago&&/credit|insufficient|402|balance|payment/i.test(m1)){ sinSaldo=true; errores.push(`${nom}: la cuenta de OpenRouter no tiene saldo para modelos pagos`); continue; }
      if(/45 segundos|rate-limit|rate limit|agentic|ResourceExhausted|limit reached|429|not a valid model|No endpoints/i.test(m1)){ errores.push(`${nom}: ${m1}`); continue; }
      try{ onEstado&&onEstado(`Reintentando ${nom} con foto más chica…`); if(!chicas) chicas=await Promise.all(fotos.map(u=>achicarFoto(u,1100)));
        return {ok:true,datos:await pedir(model,chicas),modelo:model,errores}; }
      catch(e2){ if(cancelado) return {ok:false,error:"Lectura cancelada",errores:[...errores,"Cancelada por el usuario"]}; errores.push(`${nom}: ${String(e2.message||e2)}`); }
    }
  }
  return {ok:false,error:errores.length?errores[errores.length-1]:"sin modelos",errores,fuente,modelos,sinSaldo};
};
const sha256 = async (s) => { const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""); };
const HEAD_CIERRES = ["Fecha","Cajero",...CIERRE_CAMPOS.map(c=>c[1]),"Ventas credito","Ventas transferencia","Detalle gastos","Observacion","Timestamp"];

// ── Proyección de caja ───────────────────────────────────────────────────────
const MES3 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
// Días hábiles por mes (lunes a sábado) por año
const DIAS_HABILES = {
  "2022": {Ene:25,Feb:23,Mar:26,Abr:23,May:26,Jun:26,Jul:25,Ago:26,Set:26,Oct:26,Nov:26,Dic:27},
  "2023": {Ene:26,Feb:22,Mar:27,Abr:22,May:26,Jun:26,Jul:25,Ago:26,Set:26,Oct:26,Nov:26,Dic:25},
  "2024": {Ene:26,Feb:23,Mar:23,Abr:26,May:26,Jun:25,Jul:26,Ago:27,Set:25,Oct:27,Nov:26,Dic:25},
  "2025": {Ene:26,Feb:24,Mar:24,Abr:23,May:26,Jun:25,Jul:26,Ago:25,Set:26,Oct:27,Nov:25,Dic:26},
  "2026": {Ene:26,Feb:22,Mar:26,Abr:23,May:25,Jun:26,Jul:26,Ago:25,Set:26,Oct:27,Nov:25,Dic:26},
  "2027": {Ene:25,Feb:22,Mar:24,Abr:26,May:25,Jun:26,Jul:27,Ago:25,Set:26,Oct:26,Nov:26,Dic:26},
};
const LOCAL_CERRADO = new Set(["2026-12-25","2027-01-01","2027-02-08","2027-02-09","2027-03-25","2027-03-26","2027-03-27","2027-05-01","2027-07-18","2027-08-25","2027-12-25"]);

// ── Curva de ventas dentro del mes ───────────────────────────────────────────
// Las ventas no son parejas en el mes: arrancan fuerte (cobros, días 1–10) y bajan hacia fin de mes (días 16–28).
// Índices calculados con las ventas diarias de ene-2021 a oct-2026 (1.443 días): 1 = día promedio.
const DIA_MES_IDX = [1.172,1.2,1.243,1.221,1.189,1.157,1.134,1.118,1.112,1.097,1.062,1.008,1.001,0.98,0.96,0.915,0.904,0.895,0.884,0.862,0.863,0.898,0.91,0.906,0.867,0.861,0.868,0.878,0.918,0.945,0.977];
const DIA_SEM_IDX = [1.131,1.031,1.001,0.938,1.051,0.848]; // lunes … sábado
// Ventas diarias del año anterior (planilla), para comparar el mes en curso contra los mismos días
const VENTAS_DIA_HIST = {
  "2025-01":[0,100034,104663,63765,0,104893,81337,64922,105347,82030,77168,0,81636,82136,75035,58015,102604,65646,0,74279,71045,71910,64381,48217,66908,0,81901,42049,59577,102874,70809],
  "2025-02":[101851,0,109466,77190,41981,78647,81806,66423,0,70458,59079,61978,60269,82435,40403,0,83721,62260,58162,88854,72020,48438,0,81010,49347,42446,39022,58574,0,0,0],
  "2025-03":[0,0,0,0,93161,87402,68485,84888,0,86106,103568,41140,73669,127332,51851,0,57172,56978,56978,40426,55784,43480,0,64445,51072,55735,32953,46519,47978,0,61752],
  "2025-04":[72792,72658,71585,65911,60086,0,44875,45854,48775,38882,60491,47048,0,78132,52713,48169,0,0,0,0,57184,35708,50128,52749,63279,39103,0,70055,45247,60145,0],
  "2025-05":[0,64371,75045,0,48658,59039,104220,49657,81339,60678,0,75803,47124,60253,42088,72161,43683,0,53608,72580,44454,53436,52422,42563,0,41147,36323,45304,29867,38506,41581],
  "2025-06":[0,61811,62372,66116,67484,74643,64289,0,74578,91805,61588,42511,50939,31042,0,57660,38197,61117,66621,64731,42888,0,76799,52011,58063,51768,58125,48268,0,53366,0],
  "2025-07":[61371,63378,63139,59190,60412,0,67367,115321,87335,62990,72976,36868,0,93907,52184,48093,41743,0,49208,0,88482,38802,42308,60022,43665,32144,0,47293,53270,50161,53989],
  "2025-08":[71354,57044,0,76435,73538,89228,58512,57419,56704,0,77419,84816,38135,48161,54137,33018,0,90370,76047,65885,46007,49663,44381,0,0,38577,58914,55512,62993,55150,0],
  "2025-09":[48919,71707,62136,86043,101852,50338,0,67823,58259,66343,86956,63413,46528,0,98170,55507,48796,32539,39549,52562,0,55579,91717,58852,68676,57655,23434,0,53201,43511,0],
  "2025-10":[82637,73417,93619,63263,0,107813,116781,68658,52527,90333,50757,0,50949,103827,84589,63329,94176,43609,0,67552,60467,59119,39820,37592,32295,0,53426,58245,52193,46911,82493],
  "2025-11":[56608,0,84002,67611,85448,87959,63698,68547,0,104657,77370,73281,70032,69546,55882,0,82003,47399,53362,61652,28958,53364,0,48249,49707,59451,58034,65964,59831,0,0],
  "2025-12":[97709,122433,112835,84341,84488,116178,0,56822,38167,77453,76791,93925,97904,0,70539,117210,107062,94446,109157,110672,0,141359,124382,71102,0,167904,119701,0,191724,121527,121118],
  "2026-01":[0,162971,84270,0,127147,102717,131697,102632,85605,52710,0,104288,114329,97772,75516,78007,75662,0,89900,90275,66673,64523,64511,73412,0,81732,46434,82010,61713,167646,89427],
  "2026-02":[0,114704,126317,85931,83469,124824,58604,0,92350,84231,74278,50626,66906,45745,0,0,0,119205,64638,50640,52104,0,73051,60281,69413,66540,99129,47128,0,0,0],
  "2026-03":[0,75941,81150,81908,95153,75727,75437,0,89227,88434,93859,66602,52079,63282,0,74160,62655,69243,57198,76415,23394,0,54920,110798,52897,74298,67940,12927,0,114047,94610],
  "2026-04":[82912,0,0,0,0,94115,65286,88900,98706,85004,57761,0,102100,93231,55264,80064,66107,57123,0,69492,56661,69707,45489,73139,33639,0,45422,48588,51043,101071,0],
  "2026-05":[0,61146,0,87324,75113,54309,63435,72264,59842,0,73025,85460,70391,95921,75674,35350,0,63417,72507,27434,28890,59705,23964,0,118937,59948,46912,51222,48951,61276,0],
  "2026-06":[91544,92486,78219,96299,68707,70296,0,42009,42513,62071,53913,75214,41361,0,90358,80280,70503,74988,41210,52946,0,55219,39022,56767,51281,47568,35800,0,50292,99163,0],
  "2026-07":[80443,87991,63450,77431,0,53507,63846,64036,55260,65320,52807,0,79665,104787,76990,38227,52579,0,0,65303,50394,31449,133672,53183,50461,0,68386,60839,54055,56616,72396],
  "2026-08":[38779,0,86932,92086,66537,68688,64805,77937,0,115789,81355,49651,52998,37377,45455,0,40332,46182,59280,53080,80538,67013,0,59958,0,45975,26381,80769,51708,0,107676],
  "2026-09":[76889,105146,101236,91415,62792,0,74518,59180,70345,83986,73046,37073,0,104233,66996,52045,58517,82657,54748,0,73951,81403,41034,56322,62583,28528,0,194195,45795,72165,0],
};
const dhMes = (y,m) => DIAS_HABILES[String(y)]?.[MES3[m]]||26;
const pesoDia = (d) => { const wd=d.getDay(); if(wd===0||LOCAL_CERRADO.has(isoDe(d))) return 0; return DIA_MES_IDX[d.getDate()-1]*DIA_SEM_IDX[wd-1]; };
// Proyección del mes con la curva: lo vendido × (peso de todo el mes ÷ peso de los días ya vendidos)
const proyMesCurva = (y, m, lista) => {
  const delM=(lista||[]).filter(v=>{ if(!v.fecha||!(Number(v.monto)>0)) return false; const d=new Date(v.fecha+"T12:00:00"); return d.getFullYear()===y&&d.getMonth()===m; });
  const vend={}; delM.forEach(v=>{ vend[v.fecha]=(vend[v.fecha]||0)+Number(v.monto); });
  const fechas=Object.keys(vend).sort(); if(!fechas.length) return null;
  const ult=fechas[fechas.length-1], nd=new Date(y,m+1,0).getDate();
  let wH=0,wF=0,wTot=0; const pesos={};
  for(let k=1;k<=nd;k++){ const d=new Date(y,m,k,12); const iso=isoDe(d); let w=pesoDia(d); if(vend[iso]&&!w) w=DIA_MES_IDX[k-1]*DIA_SEM_IDX[Math.max(0,d.getDay()-1)]; pesos[iso]=w;
    if(vend[iso]) wH+=w; else if(iso>ult) wF+=w; }
  wTot=wH+wF;
  const total=fechas.reduce((s,f)=>s+vend[f],0), dias=fechas.length, base=wH?total/wH:0;
  const diasFalta=Object.keys(pesos).filter(f=>f>ult&&pesos[f]>0).length;
  const proy=Math.round(total*(wTot/wH));
  const simple=Math.round(total+(total/dias)*diasFalta);
  const esperado=f=>base*(pesos[f]||0);
  // mismos días del año anterior
  const hp=VENTAS_DIA_HIST[`${y-1}-${String(m+1).padStart(2,"0")}`]; const dUlt=+ult.slice(8,10);
  const prevMismos=hp? hp.slice(0,dUlt).reduce((s,x)=>s+x,0) : null, prevDiasMismos=hp? hp.slice(0,dUlt).filter(x=>x>0).length : 0;
  const prevMes=VM[m]?.[String(y-1)]??(hp?hp.reduce((s,x)=>s+x,0):null);
  const dh=dhMes(y,m), dhP=dhMes(y-1,m);
  const pd=total/dias, pdProy=proy/dh, pdPrevMes=prevMes? prevMes/dhP : null, pdPrevMismos=prevDiasMismos? prevMismos/prevDiasMismos : null;
  return {total,dias,diasFalta,ult,proy,simple,pctHecho:wH/wTot*100,esperado,prevMismos,prevDiasMismos,prevMes,dh,dhP,pd,pdProy,pdPrevMes,pdPrevMismos,
    varMismos: pdPrevMismos? (pd/pdPrevMismos-1)*100 : null, varMismosTot: prevMismos? (total/prevMismos-1)*100 : null,
    varProy: pdPrevMes? (pdProy/pdPrevMes-1)*100 : null};
};
// Mes en curso con los datos de la planilla (se usa en la proyección de caja y el pedido de SUBATIR)
// Ventas de días que todavía no están en la planilla: las cargadas en la app y, si no, el total del cierre de caja (se actualiza en cada render)
let EXTRA_VENTAS = [];
const ventasConExtra = () => { const fs=new Set(VENTAS_DIA_PLANILLA.map(v=>v.fecha)); const vistos=new Set(); const out=[...VENTAS_DIA_PLANILLA];
  for(const v of EXTRA_VENTAS){ if(!v.fecha||fs.has(v.fecha)||vistos.has(v.fecha)) continue; vistos.add(v.fecha); out.push(v); } return out; };
const curvaCurso = () => { const mc=MES_EN_CURSO; const y=2026+Math.floor(mc.idx/12), m=mc.idx%12; const r=proyMesCurva(y,m,ventasConExtra()); return r&&r.dias>=5?{y,m,...r}:null; };
// mes futuro = promedio diario del mismo mes del año anterior × (1+crecimiento) × días hábiles de este año
const escalaDias = (y,m) => dhMes(y,m)/dhMes(y-1,m);
const ventaMesBase = (y,m) => { const r=VM[m]?.[String(y)]; if(r!=null) return r; const cc=curvaCurso(); if(cc&&cc.y===y&&cc.m===m) return cc.proy; return null; };
// Crecimiento real de ventas mes a mes (2026 vs 2025) y tendencia de los últimos 3 meses cerrados
const crecimientoReal = () => {
  const meses=[]; ["2026","2027"].forEach(y=>{const p=String(+y-1); VM.forEach((r,i)=>{ if(r[y]!=null&&r[p]){ const dh=dhMes(+y,i), dhP=dhMes(+p,i); meses.push({mes:`${MES3[i]} ${y.slice(2)}`,y,i,v:r[y],vPrev:r[p],dh,dhP,pd:r[y]/dh,pdPrev:r[p]/dhP,pct:(r[y]/dh/(r[p]/dhP)-1)*100,pctTot:(r[y]/r[p]-1)*100}); } });});
  // todo por día hábil: así no influyen los domingos y feriados de cada mes
  const u3=meses.slice(-3); const tend=u3.length? (u3.reduce((s,x)=>s+x.v,0)/u3.reduce((s,x)=>s+x.dh,0)/(u3.reduce((s,x)=>s+x.vPrev,0)/u3.reduce((s,x)=>s+x.dhP,0))-1)*100 : 0;
  const anio=meses.length?meses[meses.length-1].y:"2026"; const ya=meses.filter(x=>x.y===anio);
  const ytd=ya.length?(ya.reduce((s,x)=>s+x.v,0)/ya.reduce((s,x)=>s+x.dh,0)/(ya.reduce((s,x)=>s+x.vPrev,0)/ya.reduce((s,x)=>s+x.dhP,0))-1)*100:0;
  // mes en curso: contra los mismos días del mismo mes del año anterior
  let curso=null; const cc=curvaCurso();
  if(cc&&VM[cc.m]?.[String(cc.y)]==null&&cc.prevMismos){ curso={mes:`${MES3[cc.m]} ${String(cc.y).slice(2)}`,dias:cc.dias,diasPrev:cc.prevDiasMismos,hasta:+cc.ult.slice(8,10),v:cc.total,vPrev:cc.prevMismos,pdA:cc.pd,pdP:cc.pdPrevMismos,pct:cc.varMismos,proy:cc.proy,pdProy:cc.pdProy,pdPrevMes:cc.pdPrevMes,prevMes:cc.prevMes,varProy:cc.varProy}; }
  return {meses,tend,ytd,anio,curso,u3:u3.map(x=>x.mes)};
};
const ESCENARIOS = [
  {k:"bajo",n:"Bajo",campo:"crecBajo",color:"#B45309"},
  {k:"medio",n:"Medio",campo:"crecMedio",color:"#e84400"},
  {k:"alto",n:"Alto",campo:"crecAlto",color:"#15803D"},
  {k:"tend",n:"Tendencia real",campo:null,color:"#1D4ED8"},
];
const crecEscenario = (cfg,k) => { const e=ESCENARIOS.find(x=>x.k===k)||ESCENARIOS[1]; return e.campo? Number(cfg[e.campo])||0 : Math.round(crecimientoReal().tend*10)/10; };
// Costos = gastos fijos (suben con la inflación desde enero) + variables (mercadería + IVA, % de las ventas)
// + comisión de bancos. La mercadería se paga mitad en el mes y mitad el mes siguiente (plazos de 30 a 60 días).
// Oct–dic 2026: como mínimo, los gastos ya programados en la planilla.
const proyectarCaja = (cfg, crecIn) => {
  const crec = (crecIn==null? crecEscenario(cfg,cfg.escSel||"medio") : crecIn)/100;
  const varP=(Number(cfg.varPct)||68)/100, fijos=Number(cfg.fijosMes)||370000, inf=(Number(cfg.infFijos)||0)/100;
  const cache={};
  const ventasDe=(y,m)=>{ const r=ventaMesBase(y,m); if(r!=null) return r; const key=`${y}-${m}`; if(cache[key]!=null) return cache[key];
    const prev= y>2025 ? ventasDe(y-1,m) : 0; return (cache[key]=Math.round((prev||0)*escalaDias(y,m)*(1+crec))); };
  const out = [];
  let saldo = cfg.saldo;
  const start = new Date(); let y = start.getFullYear(), m = start.getMonth();
  for(let k=0;k<15;k++){
    const ventas = ventasDe(y,m);
    const pm=m===0?11:m-1, py=m===0?y-1:y; const ventasAnt = ventasDe(py,pm);
    const idx = (y-2026)*12+m;                 // 9 = Oct 2026
    const fijoMes = Math.round(fijos*Math.pow(1+inf, Math.max(0,y-2026)));
    const variable = Math.round(varP*(ventas*0.5+ventasAnt*0.5));
    const costoEst = fijoMes + variable;
    const enCurso = k===0 && idx===MES_EN_CURSO.idx && (cfg.saldoFecha||"")>=MES_EN_CURSO.desde && String(cfg.saldoFecha).slice(0,7)===`${y}-${String(m+1).padStart(2,"0")}`;
    const costoMes = Math.max(costoEst, COSTOS_PROGRAMADOS[idx]||0) + (COMPRAS_TEMPORADA[idx]||0);
    const ventasMes = enCurso ? Math.max(0, ventas-MES_EN_CURSO.ventasYa-(cfg.depExtra||0)) : ventas;
    const comision = Math.round(ventasMes*comisionPctEfectiva()/100);
    const costos = (enCurso ? Math.max(0, costoMes-MES_EN_CURSO.pagadoYa-(cfg.pagExtra||0)) : costoMes) + comision;
    let deuda = 0;
    if(idx>=9 && idx<=29 && !(enCurso && MES_EN_CURSO.candelaPagada)) deuda += cfg.candela;        // Candela: Oct-26 a Jun-28
    if(idx>=9 && idx<=11) deuda += cfg.santander;      // Santander: hasta Dic-26
    if(idx===11 && cfg.pagaPF) deuda += cfg.plazoFijo; // plazo fijo en Dic-26
    const cobros = idx===10 ? cfg.cobros : 0;          // cobros en Nov-26
    const retiro = (y<2027 || (y===2027 && m===0)) ? cfg.retiroFijo : Math.round(cfg.retiroFijo2 + ventas*cfg.retiroPct/100);
    const retiroMes = enCurso ? Math.max(0, retiro-(MES_EN_CURSO.retiradoYa||0)-(cfg.retExtra||0)) : retiro;
    saldo = saldo + ventasMes - costos - deuda + cobros - retiroMes;
    out.push({ mes:`${MES3[m]} ${String(y).slice(2)}`, ventas, costos, fijos:fijoMes, deuda, retiro, saldo:Math.round(saldo) });
    m++; if(m>11){m=0;y++;}
  }
  return out;
};
// ── Pedido semanal SUBATIR ───────────────────────────────────────────────────
// Se pide el lunes y llega el miércoles; cada pedido cubre las ventas de miércoles a martes.
// Lo que se repone en SUBATIR ≈ pctSub % de las ventas (38,3% en 2025 y 38,9% en 2026). Tope de kg por pedido.
const ventasMesProy = (crec) => { const cache={}; const f=(y,m)=>{ const r=ventaMesBase(y,m); if(r!=null) return r; const key=`${y}-${m}`; if(cache[key]!=null) return cache[key]; return (cache[key]=Math.round((y>2025?f(y-1,m):0)*escalaDias(y,m)*(1+crec/100))); }; return f; };
const planSubatir = (cfg, semanas=14) => {
  const crec=crecEscenario(cfg,cfg.escSel||"medio"); const vm=ventasMesProy(crec);
  const pKg=Number(cfg.precioKg)||59, tope=Number(cfg.topeKg)||2500, pct=(Number(cfg.pctSub)||38.5)/100;
  const wMes={}; const sumW=(y,m)=>{ const k=y*12+m; if(wMes[k]!=null) return wMes[k]; let t=0; const nd=new Date(y,m+1,0).getDate(); for(let i=1;i<=nd;i++) t+=pesoDia(new Date(y,m,i,12)); return (wMes[k]=t); };
  const ventaDia=(d)=>{ const w=pesoDia(d); if(!w) return 0; const y=d.getFullYear(),m=d.getMonth(); return vm(y,m)*w/sumW(y,m); }; // reparte la venta del mes según la curva
  const hoy=new Date(); hoy.setHours(12,0,0,0); const lun=new Date(hoy); do{ lun.setDate(lun.getDate()+1); }while(lun.getDay()!==1);
  const filas=[];
  for(let k=0;k<semanas;k++){
    const L=new Date(lun); L.setDate(lun.getDate()+7*k); const llega=new Date(L); llega.setDate(L.getDate()+2);
    let ventas=0; for(let j=0;j<7;j++){ const d=new Date(llega); d.setDate(llega.getDate()+j); ventas+=ventaDia(d); }
    const necesario=Math.round(ventas*pct), kgNec=Math.round(necesario/pKg);
    const kgPed=Math.min(kgNec,tope); const paga=new Date(llega); paga.setDate(llega.getDate()+45);
    filas.push({lunes:isoDe(L),llega:isoDe(llega),paga:isoDe(paga),ventas:Math.round(ventas),necesario,kgNec,kgPed,montoPed:Math.round(kgPed*pKg),faltaKg:Math.max(0,kgNec-tope)});
  }
  // Pedido extra de inicio de temporada: cubre el faltante de las primeras semanas fuertes (faltan más del 20% del tope),
  // hasta 4 semanas seguidas; se pide el lunes anterior a la primera de ellas para no adelantar stock (y el pago) de más.
  const grande=f=>f.faltaKg>tope*0.2;
  const iF=filas.findIndex(grande);
  let extra=null;
  filas.forEach(f=>{ f.cubreExtra=0; f.faltaFinal=f.faltaKg; f.enTemporada=false; });
  if(iF>=0){
    let n=0; for(let k=iF;k<filas.length&&n<4&&grande(filas[k]);k++,n++) filas[k].enTemporada=true;
    const faltaTot=filas.filter(f=>f.enTemporada).reduce((s,f)=>s+f.faltaKg,0);
    const kg=Number(cfg.extraKg)>0?Number(cfg.extraKg):Math.ceil(faltaTot/50)*50;
    const lunesSug=filas[Math.max(0,iF-1)].lunes;
    const fecha=cfg.extraFecha&&cfg.extraFecha>=filas[0].lunes?cfg.extraFecha:lunesSug;
    const llega=new Date(fecha+"T12:00:00"); llega.setDate(llega.getDate()+2); const paga=new Date(llega); paga.setDate(llega.getDate()+45);
    extra={kg,monto:Math.round(kg*pKg),fecha,sugerida:lunesSug,llega:isoDe(llega),paga:isoDe(paga),faltaTot,primera:filas[iF].lunes,semanas:n};
    let stock=0, entro=false;
    filas.forEach(f=>{ if(!entro&&f.llega>=extra.llega){ stock=kg; entro=true; } if(!f.enTemporada) return; const usa=Math.min(stock,f.faltaKg); stock-=usa; f.cubreExtra=usa; f.faltaFinal=f.faltaKg-usa; });
  }
  return {filas,extra,pKg,tope,pct:pct*100,crec};
};
const refEsMasNuevo = (fecha,ts) => { const f=fecha||""; return f<SALDO_REF.fecha || (f===SALDO_REF.fecha && (ts||"")<SALDO_REF.ts); };
// Si el saldo guardado es anterior a SALDO_REF, toma los saldos reales de SALDO_REF (conserva USD y TC)
const conSaldoRef = (c) => {
  if(!refEsMasNuevo(c.saldoFecha,c.saldoTs)) return c;
  const n={...c,brou:SALDO_REF.brou,santUyu:SALDO_REF.santUyu,...(SALDO_REF.santUsd!=null?{santUsd:SALDO_REF.santUsd,tc:SALDO_REF.tc||c.tc}:{}),saldoFecha:SALDO_REF.fecha,saldoTs:SALDO_REF.ts};
  n.saldo=Math.round((+n.brou||0)+(+n.santUyu||0)+(+n.santUsd||0)*(+n.tc||0)); return n;
};
const CAJA_DEFAULT = { brou:17000, santUyu:-390000, santUsd:0, tc:40, saldo:-373000, saldoFecha:"2026-10-01", cobros:59951, plazoFijo:313000, pagaPF:true, candela:19600, santander:53347,
  ratio:89, crec27:10, comisionPct:3, retiroFijo:80000, retiroFijo2:80000, retiroPct:0, alerta:-600000, limite:-1000000,
  varPct:68, fijosMes:370000, infFijos:6, crecBajo:5, crecMedio:10, crecAlto:15, escSel:"medio", precioKg:59, topeKg:2500, pctSub:38.5, extraKg:0, extraFecha:"", cfgVer:9 };
// 11/10/2026: costos 89% de las ventas (2026 sin el stock comprado de más) y retiro fijo $80.000/mes. Se aplica una vez sobre lo guardado en cada equipo.
// 11/10/2026 (v72): proyección con gastos fijos + variables y tres escenarios de crecimiento.
const migrarCfg = (c) => {
  let n=c;
  if((n.cfgVer||0)<2) n={...n, ratio:89, retiroFijo:80000, retiroFijo2:80000, retiroPct:0, cfgVer:2};
  if((n.cfgVer||0)<3) n={...n, varPct:68, fijosMes:370000, infFijos:6, crecBajo:5, crecMedio:10, crecAlto:15, escSel:"medio", cfgVer:3};
  if((n.cfgVer||0)<4) n={...n, precioKg:59, topeKg:2500, pctSub:38.5, extraKg:0, extraFecha:"", cfgVer:4};
  if((n.cfgVer||0)<5) n={...n, cobros:Math.max(0,(Number(n.cobros)||0)-131801), cfgVer:5};
  if((n.cfgVer||0)<6) n={...n, cobros:Math.max(0,(Number(n.cobros)||0)-2718), cfgVer:6};
  if((n.cfgVer||0)<7) n={...n, cobros:Math.max(0,(Number(n.cobros)||0)-5357), cfgVer:7};
  if((n.cfgVer||0)<8) n={...n, cobros:(Number(n.cobros)||0)+5357, cfgVer:8};
  if((n.cfgVer||0)<9) n={...n, cobros:Math.max(0,(Number(n.cobros)||0)-5530), cfgVer:9};   // 20/10: BROU TRF pago a proveedores $5.530, cobro de venta a crédito (a confirmar)   // 17/10: los $5.357 eran una venta por transferencia del cierre 17/10, no un cobro: se devuelven   // 15/10: cobrada venta a crédito $2.718 (BROU)   // 13/10: Olkany pagó $131.801 de los cobros pendientes
  return n;
};

// ── Métricas del mes y análisis automático (sin IA) ─────────────────────────
const INF_ANUAL = {"2022":9.95,"2023":8.26,"2024":5.11,"2025":6.36,"2026":6.0,"2027":6.0};
const metricasMes = (mIdx, anioIn) => {
  const anio=String(anioIn), prev=String(Number(anio)-1), mc=MES3[mIdx];
  const v=VM[mIdx]?.[anio]??null, vPrev=VM[mIdx]?.[prev]??null;
  const pct=(a,b)=>(a!=null&&b)?(a/b-1)*100:null;
  const inf=INF_ANUAL[anio]??6;
  const nom=pct(v,vPrev); const real=nom==null?null:((1+nom/100)/(1+inf/100)-1)*100;
  const t=TK[mIdx]||{}; const k=anio.slice(2), kp=prev.slice(2);
  const tk=t["c"+k]??null, tkPrev=t["c"+kp]??null, tp=t["p"+k]??null, tpPrev=t["p"+kp]??null;
  const dias=DIAS_HABILES[anio]?.[mc], diasPrev=DIAS_HABILES[prev]?.[mc];
  const pd=v&&dias?v/dias:null, pdPrev=vPrev&&diasPrev?vPrev/diasPrev:null;
  const g=gastoTotal(anio,mIdx), dp=DEUDA_PAGOS[anio]?.[mIdx]||0;
  const res=(v!=null&&g!=null)?v-g:null, op=res!=null?res+dp:null;
  const ytd=VM.slice(0,mIdx+1).reduce((s,r)=>s+(r[anio]||0),0), ytdPrev=VM.slice(0,mIdx+1).reduce((s,r)=>s+(r[prev]||0),0);
  return {anio,prev,mc,v,vPrev,nom,real,inf,tk,tkPrev,tkVar:pct(tk,tkPrev),tp,tpPrev,tpVar:pct(tp,tpPrev),dias,diasPrev,pd,pdPrev,pdVar:pct(pd,pdPrev),
    gastos:g,deuda:dp,res,op,opPct:(op!=null&&v)?op/v*100:null,ytd,ytdPrev,ytdVar:(v!=null&&ytdPrev)?pct(ytd,ytdPrev):null};
};
const analisisLocal = (m) => {
  const $=x=>"$"+Math.round(x).toLocaleString("es-UY"); const p=x=>(x>=0?"+":"")+x.toFixed(1).replace(".",",")+"%";
  if(m.v==null) return ["Todavía no hay ventas cargadas para este mes."];
  const out=[];
  if(m.vPrev!=null) out.push(`Vendiste ${$(m.v)} contra ${$(m.vPrev)} en ${m.mc} ${m.prev}: ${p(m.nom)} nominal y ${p(m.real)} real, descontando ${String(m.inf).replace(".",",")}% de inflación.`);
  else out.push(`Vendiste ${$(m.v)}.`);
  if(m.pd!=null&&m.pdPrev!=null) out.push(`Por día hábil fueron ${$(m.pd)} (${m.dias} días) contra ${$(m.pdPrev)} (${m.diasPrev} días): ${p(m.pdVar)}.`);
  if(m.tk!=null&&m.tkPrev!=null) out.push(`Tickets: ${m.tk.toLocaleString("es-UY")} (${p(m.tkVar)}), ticket promedio $${String(m.tp).replace(".",",")} (${p(m.tpVar)}).`);
  if(m.op!=null) out.push(`Resultado: gastos ${$(m.gastos)}, ganancia operativa ${$(m.op)} (${m.opPct.toFixed(1).replace(".",",")}% de las ventas)${m.deuda?`; después de pagos de deuda (${$(m.deuda)}) quedan ${$(m.res)}`:""}.`);
  if(m.ytdVar!=null) out.push(`Acumulado enero–${m.mc}: ${$(m.ytd)} (${p(m.ytdVar)} contra ${m.prev}).`);
  const rec=[];
  if(m.real!=null&&m.real<0) rec.push("las ventas cayeron en términos reales: revisá qué categorías bajaron");
  if(m.tpVar!=null&&m.tpVar<m.inf) rec.push("el ticket promedio sube menos que la inflación: hay margen para combos o productos de mayor valor en caja");
  if(m.tkVar!=null&&m.tkVar<0) rec.push("vinieron menos clientes: reforzá promociones o redes");
  if(m.tkVar!=null&&m.tpVar!=null&&m.tkVar>=0&&m.tpVar>=m.inf) rec.push("crecen tanto los clientes como el gasto por cliente: buen mes para reforzar el stock de lo que más rota");
  if(m.opPct!=null&&m.opPct<8) rec.push("el margen operativo quedó bajo: mirá qué compras se concentraron en el mes");
  if(m.opPct!=null&&m.opPct>=15) rec.push("buen margen: es un mes para reforzar el colchón de caja");
  if(rec.length) out.push("A tener en cuenta: "+rec.join("; ")+".");
  return out;
};

// ── Informes PDF ─────────────────────────────────────────────────────────────
const P$=x=>x==null||isNaN(x)?"—":(x<0?"-":"")+"$"+new Intl.NumberFormat("es-UY",{maximumFractionDigits:0}).format(Math.abs(Math.round(x)));
const PF=s=>{if(!s)return "—";const p=String(s).split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s;};
const PP=x=>x==null||isNaN(x)?"—":(x>=0?"+":"")+x.toFixed(1).replace(".",",")+"%";
const PN=(x,d=0)=>x==null||isNaN(x)?"—":new Intl.NumberFormat("es-UY",{maximumFractionDigits:d,minimumFractionDigits:d}).format(x);
const generarInforme = (tipo, mIdx, anio, ctx) => {
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210, M=14; let y=0;
  const NAR=[232,68,0], OSC=[31,13,5], MAR=[122,46,10], CREMA=[255,243,230];
  const hoy=new Date(); const fHoy=`${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;
  const titulos={mensual:`Informe mensual — ${MESES[mIdx]} ${anio}`,anual:`Informe anual — ${anio}`,caja:"Informe de caja y deudas"};
  const header=()=>{doc.setFillColor(...NAR);doc.rect(0,0,W,20,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text("PROlimpio Durazno",M,13);doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.text(`Generado el ${fHoy}`,W-M,13,{align:"right"});y=30;};
  header();
  doc.setTextColor(...OSC);doc.setFont("helvetica","bold");doc.setFontSize(17);doc.text(titulos[tipo],M,y);y+=8;
  const nuevaPag=(alto)=>{if(y+alto>282){doc.addPage();header();}};
  const seccion=(t)=>{nuevaPag(14);doc.setFont("helvetica","bold");doc.setFontSize(12.5);doc.setTextColor(...MAR);doc.text(t,M,y);doc.setDrawColor(...NAR);doc.setLineWidth(0.5);doc.line(M,y+1.6,W-M,y+1.6);y+=7;};
  const parrafos=(arr)=>{doc.setFont("helvetica","normal");doc.setFontSize(10.5);doc.setTextColor(...OSC);arr.forEach(p=>{const ls=doc.splitTextToSize(p,W-2*M);nuevaPag(ls.length*5+2);doc.text(ls,M,y);y+=ls.length*5+2.5;});y+=2;};
  const tabla=(head,body,opts={})=>{autoTable(doc,{startY:y,head:[head],body,margin:{left:M,right:M,top:26},theme:"grid",
    styles:{font:"helvetica",fontSize:9.5,textColor:OSC,lineColor:[242,201,160],lineWidth:0.2,cellPadding:2.2},
    headStyles:{fillColor:CREMA,textColor:MAR,fontStyle:"bold"},alternateRowStyles:{fillColor:[255,250,245]},
    columnStyles:opts.cols||{},didDrawPage:(d)=>{if(d.pageNumber>1&&d.cursor&&d.table.startPageNumber!==d.pageNumber){}},...opts.extra});
    y=doc.lastAutoTable.finalY+7;};
  const der={halign:"right"};

  if(tipo==="mensual"){
    const m=metricasMes(mIdx,anio);
    seccion("Resumen");
    parrafos(analisisLocal(m));
    seccion(`Comparación con ${MESES[mIdx]} ${m.prev}`);
    tabla(["Indicador",`${MES3[mIdx]} ${anio}`,`${MES3[mIdx]} ${m.prev}`,"Variación"],[
      ["Ventas",P$(m.v),P$(m.vPrev),PP(m.nom)],
      ["Variación real (descontando inflación)","","",PP(m.real)],
      [`Promedio por día hábil`,`${P$(m.pd)} (${m.dias??"—"} días)`,`${P$(m.pdPrev)} (${m.diasPrev??"—"} días)`,PP(m.pdVar)],
      ["Tickets emitidos",PN(m.tk),PN(m.tkPrev),PP(m.tkVar)],
      ["Ticket promedio",m.tp!=null?"$"+PN(m.tp,2):"—",m.tpPrev!=null?"$"+PN(m.tpPrev,2):"—",PP(m.tpVar)],
      [`Acumulado enero–${MES3[mIdx]}`,P$(m.ytd),P$(m.ytdPrev),PP(m.ytdVar)],
    ],{cols:{1:der,2:der,3:der}});
    if(m.gastos!=null){seccion("Resultado del mes");tabla(["Concepto","Monto","% de ventas"],[
      ["Ventas",P$(m.v),"100%"],["Gastos totales",P$(m.gastos),PP(m.gastos/m.v*100).replace("+","")],
      ["Pagos de préstamos (incluidos en gastos)",P$(m.deuda),PP(m.deuda/m.v*100).replace("+","")],
      ["Ganancia operativa (sin préstamos)",P$(m.op),PP(m.opPct).replace("+","")],["Resultado después de préstamos",P$(m.res),PP(m.res/m.v*100).replace("+","")],
    ],{cols:{1:der,2:der}});}
    seccion(`${MESES[mIdx]} en todos los años`);
    tabla(["Año","Ventas","Días hábiles","Promedio diario","Tickets","Ticket prom."],["2022","2023","2024","2025","2026"].map(yy=>{const v=VM[mIdx][yy];const d=DIAS_HABILES[yy]?.[MES3[mIdx]];const t=TK[mIdx]||{};const k=yy.slice(2);return [yy,P$(v),d??"—",v&&d?P$(v/d):"—",PN(t["c"+k]),t["p"+k]!=null?"$"+PN(t["p"+k],2):"—"];}),{cols:{1:der,2:der,3:der,4:der,5:der}});
    if(ctx.aiText){seccion("Comentario del análisis con IA");parrafos(ctx.aiText.split(/\n+/).filter(Boolean));}
  }
  if(tipo==="anual"){
    const yy=String(anio), yp=String(Number(anio)-1), y2=String(Number(anio)-2);
    seccion("Ventas mes a mes");
    const filas=VM.map(r=>[r.mes,P$(r[y2]),P$(r[yp]),P$(r[yy]),r[yy]!=null&&r[yp]?PP((r[yy]/r[yp]-1)*100):"—"]);
    const sum=(k)=>VM.reduce((s,r)=>s+(r[k]||0),0); const n=VM.filter(r=>r[yy]!=null).length; const sumN=(k)=>VM.slice(0,n).reduce((s,r)=>s+(r[k]||0),0);
    const nMeses=filas.length;
    if(n<12) filas.push([`Total ene–${MES3[n-1]} (para comparar)`,P$(sumN(y2)),P$(sumN(yp)),P$(sumN(yy)),PP((sumN(yy)/sumN(yp)-1)*100)]);
    filas.push([n<12?"Total año completo":"Total del año",P$(sum(y2)),P$(sum(yp)),n<12?`${P$(sum(yy))} (hasta ${MES3[n-1]})`:P$(sum(yy)),n<12?"—":PP((sum(yy)/sum(yp)-1)*100)]);
    tabla(["Mes",y2,yp,yy,`Var. ${yy}/${yp}`],filas,{cols:{1:der,2:der,3:der,4:der},extra:{didParseCell:(d)=>{if(d.section==="body"&&d.row.index>=nMeses){d.cell.styles.fontStyle="bold";d.cell.styles.fillColor=[255,243,230];}}}});
    if(n<12) parrafos([`La primera fila de totales suma solo enero a ${MESES[n-1].toLowerCase()} de cada año, para comparar contra ${yy}, que todavía no cerró. La segunda suma el año completo.`]);
    seccion("Tickets");
    tabla(["Mes",`Tickets ${yp}`,`Tickets ${yy}`,"Var.",`Ticket prom. ${yp}`,`Ticket prom. ${yy}`],TK.map(t=>{const a=t["c"+yp.slice(2)],b=t["c"+yy.slice(2)],pa=t["p"+yp.slice(2)],pb=t["p"+yy.slice(2)];return [t.mes,PN(a),PN(b),a&&b?PP((b/a-1)*100):"—",pa!=null?"$"+PN(pa,2):"—",pb!=null?"$"+PN(pb,2):"—"];}),{cols:{1:der,2:der,3:der,4:der,5:der}});
    seccion("Resultado por año");
    tabla(["Año","Ventas","Gastos totales","Pagos préstamos","Ganancia operativa","% op."],["2022","2023","2024","2025","2026"].map(k=>{const c=TG_REAL[k].filter(x=>x!=null).length;const v=VM.slice(0,c).reduce((s,r)=>s+(r[k]||0),0);const g=TG_REAL[k].slice(0,c).reduce((s,x,j)=>s+(gastoTotal(k,j)||0),0);const d=DEUDA_PAGOS[k].slice(0,c).reduce((s,x)=>s+(x||0),0);return [c<12?`${k} (ene–${MES3[c-1]})`:k,P$(v),P$(g),P$(d),P$(v-g+d),PP((v-g+d)/v*100).replace("+","")];}),{cols:{1:der,2:der,3:der,4:der,5:der}});
    parrafos(["Ganancia operativa = ventas menos gastos totales de la hoja de deudas, sin contar los pagos de préstamos familiares y créditos."]);
  }
  if(tipo==="caja"){
    const c=ctx.caja; const neto=Math.round((+c.brou||0)+(+c.santUyu||0)+(+c.santUsd||0)*(+c.tc||0));
    seccion(`Saldos bancarios al ${PF(c.saldoFecha)}`);
    tabla(["Cuenta","Saldo"],[["BROU ($)",P$(c.brou)],["Santander ($)",P$(c.santUyu)],[`Santander (USD) a TC ${PN(c.tc,2)}`,`USD ${PN(c.santUsd)} = ${P$((+c.santUsd||0)*(+c.tc||0))}`],["Neto en pesos",P$(neto)]],{cols:{1:der}});
    {const fechas=new Set((ctx.stock||[]).map(s=>s.fecha));const A=analizarStock([...STOCK_HIST.filter(s=>!fechas.has(s.fecha)),...(ctx.stock||[])]);
     if(A){seccion("Stock valorizado a costo");tabla(["Indicador","Valor"],[[`Stock al ${PF(A.ult.fecha)}`,P$(A.ult.valor)],["Cobertura",`${PN(A.cobertura,1)} meses de compras`],["Crecimiento del stock (12 meses)",PP(A.stockVar)],["Crecimiento de las ventas (12 meses)",PP(A.ventasVar)]],{cols:{1:der}});}}
    seccion(`Deudas pendientes (según planilla al ${PENDIENTES_FECHA})`);
    const meses=[...new Set(PENDIENTES.map(p=>p.mes))];const S=(f)=>PENDIENTES.filter(f).reduce((s,p)=>s+p.monto,0);
    const nom=k=>{const [a,b]=k.split("-");return `${MESES[+b-1]} ${a}`;};
    tabla(["Mes","Proveedores","Cheques SUBATIR","Créditos / plazo fijo","Total"],[...meses.map(k=>[nom(k),P$(S(p=>p.mes===k&&p.tipo==="prov")),P$(S(p=>p.mes===k&&p.tipo==="cheque")),P$(S(p=>p.mes===k&&(p.tipo==="credito"||p.tipo==="plazo"))),P$(S(p=>p.mes===k))]),["Total",P$(S(p=>p.tipo==="prov")),P$(S(p=>p.tipo==="cheque")),P$(S(p=>p.tipo==="credito"||p.tipo==="plazo")),P$(S(()=>true))]],{cols:{1:der,2:der,3:der,4:der}});
    tabla(["Mes","Concepto","Tipo","Monto"],PENDIENTES.map(p=>[nom(p.mes),p.prov,p.tipo==="prov"?"Proveedor":p.tipo==="cheque"?"Cheque SUBATIR":p.tipo==="plazo"?"Plazo fijo":"Crédito",P$(p.monto)]),{cols:{3:der}});
    const ra=(ctx.retiros||[]).filter(r=>String(r.fecha).startsWith(String(new Date().getFullYear())));
    seccion(`Retiros registrados en ${new Date().getFullYear()}`);
    if(ra.length) tabla(["Fecha","Tipo","Observación","Monto"],[...ra.map(r=>[PF(r.fecha),r.tipo||"",r.obs||"",P$(+r.monto)]),["Total","","",P$(ra.reduce((s,r)=>s+(+r.monto||0),0))]],{cols:{3:der}});
    else parrafos(["No hay retiros registrados en la app este año (o Sheets no estaba conectado al generar el informe)."]);
    seccion("Saldo proyectado — próximos 15 meses");
    const pr=proyectarCaja(c);
    tabla(["Mes","Ventas est.","Costos est.","Deudas","Retiro","Saldo"],pr.map(p=>[p.mes,P$(p.ventas),P$(p.costos),P$(p.deuda),P$(p.retiro),P$(p.saldo)]),{cols:{1:der,2:der,3:der,4:der,5:der},extra:{didParseCell:(d)=>{if(d.section==="body"&&d.column.index===5){const v=pr[d.row.index].saldo;d.cell.styles.textColor=v<c.limite?[185,28,28]:v<c.alerta?[180,83,9]:v<0?[146,64,14]:[20,83,45];d.cell.styles.fontStyle="bold";}}}});
    { const CRp=crecimientoReal(); const esc=ESCENARIOS.find(e=>e.k===(c.escSel||"medio"))||ESCENARIOS[1];
      parrafos([`Escenario: ${esc.n}, ventas +${PN(crecEscenario(c,esc.k),1)}% contra el mismo mes del año anterior (tendencia real de los últimos 3 meses: ${PN(CRp.tend,1)}%). Al final del período: ${ESCENARIOS.map(e=>`${e.n} (${PN(crecEscenario(c,e.k),1)}%) ${P$(proyectarCaja(c,crecEscenario(c,e.k)).slice(-1)[0].saldo)}`).join(" · ")}.`,
        `Supuestos: gastos fijos ${P$(c.fijosMes)} por mes (+${PN(c.infFijos,1)}% desde enero), mercadería e IVA ${PN(c.varPct,1)}% de las ventas (mitad se paga el mes siguiente), comisión de bancos ${PN(comisionPctEfectiva(),1)}% de las ventas; para oct–dic 2026 se usan los gastos ya programados si son mayores. Retiro de ${P$(c.retiroFijo)} hasta enero y luego ${P$(c.retiroFijo2)}${+c.retiroPct?` + ${PN(c.retiroPct,1)}% de las ventas`:""}. Plazo fijo de diciembre: ${c.pagaPF?"se paga":"se renueva"}.`]); }
  }
  const np=doc.getNumberOfPages();
  for(let i=1;i<=np;i++){doc.setPage(i);doc.setFillColor(...NAR);doc.rect(0,0,W,20,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text("PROlimpio Durazno",M,13);doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.text(`Generado el ${fHoy}`,W-M,13,{align:"right"});doc.setFontSize(8.5);doc.setTextColor(...MAR);doc.text(`PROlimpio Durazno - ${titulos[tipo]}`,M,292);doc.text(`Página ${i} de ${np}`,W-M,292,{align:"right"});}
  const nombre=(tipo==="mensual"?`PROlimpio_${MES3[mIdx]}_${anio}`:tipo==="anual"?`PROlimpio_anual_${anio}`:`PROlimpio_caja_${fHoy.replace(/\//g,"-")}`)+".pdf";
  return {blob:doc.output("blob"),nombre,titulo:titulos[tipo]};
};


// Promedio diario hábil por mes
const promDiarioHabil = (ventas, mes, anio) => {
  const dias = DIAS_HABILES[String(anio)]?.[mes];
  if(!dias || !ventas) return null;
  return ventas / dias;
};
const PD=[
  {mes:"Ene","2024":49818,"2025":77045,"2026":91292},
  {mes:"Feb","2024":54198,"2025":67327,"2026":77732},
  {mes:"Mar","2024":45581,"2025":62036,"2026":72473},
  {mes:"Abr","2024":46252,"2025":55720,"2026":70471},
  {mes:"May","2024":40393,"2025":55227,"2026":62897},
  {mes:"Jun","2024":51344,"2025":59152,"2026":63847},
  {mes:"Jul","2024":42381,"2025":59447,"2026":65888},
  {mes:"Ago","2024":45265,"2025":60777,"2026":63891},
  {mes:"Set","2024":47619,"2025":61156,"2026":73492},
  {mes:"Oct","2024":48833,"2025":67792,"2026":null},
  {mes:"Nov","2024":58877,"2025":65305,"2026":null},
  {mes:"Dic","2024":65422,"2025":104883,"2026":null},
];

// ── Google Sheets API helpers ─────────────────────────────────────────────
const gapi_append = async (token, sheet, values, sid=SHEET_ID) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${sheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [values] }),
  });
  return res.ok;
};


const gapi_ensure_sheet = async (token, title, headers, sid=SHEET_ID) => {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties`, { headers: { Authorization: `Bearer ${token}` } });
  if(!metaRes.ok) return false;
  const meta = await metaRes.json();
  if((meta.sheets||[]).some(s=>s.properties.title===title)) return true;
  const add = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`, {
    method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
    body: JSON.stringify({ requests:[{ addSheet:{ properties:{ title } } }] })
  });
  if(!add.ok) return false;
  return await gapi_append(token, title, headers, sid);
};

const gapi_read = async (token, range, sid=SHEET_ID) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}`;
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
  const [tab,setTab]=useState("hoy");
  const [toast,setToast]=useState(null);
  const [gastosAnio,setGastosAnio]=useState("2026");
  const [vvgAnio,setVvgAnio]=useState("2026");
  const [tabAnio,setTabAnio]=useState("2026");
  const [resAnio,setResAnio]=useState("2026");
  const [histAnio,setHistAnio]=useState(String(new Date().getFullYear()));
  const [rTipo,setRTipo]=useState("mensual");
  const [rMes,setRMes]=useState(()=>{const m=new Date().getMonth();return m===0?11:m-1;});
  const [rAnio,setRAnio]=useState(()=>{const d=new Date();return d.getMonth()===0?d.getFullYear()-1:d.getFullYear();});
  const [rIA,setRIA]=useState(true);
  const [sheetStock,setSheetStock]=useState([]);
  const [sheetCierres,setSheetCierres]=useState([]);
  const [sheetDepositos,setSheetDepositos]=useState([]);
  const [sheetPagosRaw,setSheetPagos]=useState([]);
  // pagos que Claude vio en los bancos (se suman si no están ya marcados en la hoja Pagos)
  const sheetPagos=useMemo(()=>[...sheetPagosRaw,...PAGOS_CLAUDE.filter(c=>!sheetPagosRaw.some(x=>x.clave===c.clave))],[sheetPagosRaw]);
  const [ciF,setCiF]=useState({fecha:hoyISO(),venta:"",efectivo:"",tarjetas:"",ventaErp:"",gastosEf:"",saldoErp:"",obs:""});
  const [deF,setDeF]=useState({fecha:hoyISO(),tipo:"Tarjetas",cuenta:"Santander",monto:"",obs:""});
  const [pagoEdit,setPagoEdit]=useState(null);
  const [cjF,setCjF]=useState(CIERRE_VACIO());
  const [fotos,setFotos]=useState([]);
  const [leyendo,setLeyendo]=useState("");
  const [leido,setLeido]=useState(null);
  const [ultimoCierre,setUltimoCierre]=useState(null);
  const [sheetCierresRaw,setSheetCierres2]=useState([]);
  const sheetCierres2=useMemo(()=>[...sheetCierresRaw,...CIERRES_CLAUDE.filter(c=>!sheetCierresRaw.some(x=>x.fecha===c.fecha))],[sheetCierresRaw]);
  const [sidCierres,setSidCierres]=useState(()=>{try{return localStorage.getItem("prolimpio_sheet_cierres")||SHEET_CIERRES;}catch(e){return SHEET_CIERRES;}});
  const [modoCaja,setModoCaja]=useState(()=>{try{return localStorage.getItem("prolimpio_modo_caja")||"";}catch(e){return "";}});
  const [pinIn,setPinIn]=useState("");
  const [actCierres,setActCierres]=useState("");
  useEffect(()=>{ if(modoCaja&&tab!=="control") setTab("control"); },[modoCaja,tab]);
  const [stF,setStF]=useState({fecha:hoyISO(),valor:"",obs:""});
  const [metaCob,setMetaCob]=useState(()=>{try{return Number(localStorage.getItem("prolimpio_meta_cob"))||3;}catch(e){return 3;}});
  const [orKey,setOrKey]=useState(()=>{try{return localStorage.getItem("prolimpio_or_key")||"";}catch(e){return "";}});
  const [orKeyIn,setOrKeyIn]=useState("");
  const [visionPago,setVisionPago]=useState(()=>{try{return localStorage.getItem("prolimpio_vision_pago")!=="no";}catch(e){return true;}});
  const [sheetSaldos,setSheetSaldos]=useState([]);
  const [sheetRetirosRaw,setSheetRetiros]=useState([]);
  const sheetRetiros=useMemo(()=>[...sheetRetirosRaw,...RETIROS_CLAUDE.filter(c=>!sheetRetirosRaw.some(x=>Number(x.monto)===c.monto&&Math.abs(new Date(String(x.fecha).slice(0,10)+"T12:00:00")-new Date(c.fecha+"T12:00:00"))<=2*864e5))],[sheetRetirosRaw]);
  const [rF,setRF]=useState({fecha:hoyISO(),monto:"",tipo:"Fijo",obs:"",cuenta:"Santander"});
  const [caja,setCajaState]=useState(()=>{let c=CAJA_DEFAULT;try{const s=localStorage.getItem("prolimpio_caja");if(s)c={...CAJA_DEFAULT,...JSON.parse(s)};}catch(e){} return conSaldoRef(migrarCfg(c));});
  const setCaja=(patch)=>setCajaState(p=>{const n={...p,...patch};try{localStorage.setItem("prolimpio_caja",JSON.stringify(n));}catch(e){}return n;});
  // datos de control (cierres + depósitos) compartidos por la pestaña Caja y por la comisión de bancos
  const ctlCierres=useMemo(()=>[...sheetCierres2.map(c=>({_i:"n"+c._i,fecha:c.fecha,venta:(c.ventaPos||0)+(c.tarjetaErp||0),efectivo:c.efectivoPos||0,tarjetas:(c.tarjetasPos||0)+(c.tarjetaErp||0),ventaErp:c.ventasErp||0,gastosEf:c.gastosEf||0,saldoErp:c.saldoErp})),
    ...sheetCierres.filter(o=>!sheetCierres2.some(n=>n.fecha===o.fecha))],[sheetCierres,sheetCierres2]);
  const ctlDepositos=useMemo(()=>{
    const cerca=(a,b,d)=>Math.abs(new Date(String(a).slice(0,10)+"T12:00:00")-new Date(String(b).slice(0,10)+"T12:00:00"))<=d*864e5;
    const deCierre=sheetCierres2.filter(c=>c.deposito).map(c=>({fecha:c.fecha,tipo:"Efectivo",cuenta:"Santander",monto:Number(c.deposito),deCierre:true}));
    // un depósito de efectivo cargado a mano que ya viene en el cierre (mismo monto, mismo día o el siguiente) no se cuenta dos veces
    const manual=sheetDepositos.filter(d=>!(d.tipo==="Efectivo"&&deCierre.some(c=>Number(d.monto)===c.monto&&cerca(d.fecha,c.fecha,1))));
    const extra=DEPOSITOS_CLAUDE.filter(c=>!sheetDepositos.some(d=>d.tipo===c.tipo&&Math.abs(Number(d.monto)-c.monto)<=1&&cerca(d.fecha,c.fecha,1)));
    return [...manual,...deCierre,...extra];},[sheetDepositos,sheetCierres2]);
  const ctlK=useMemo(()=>controlDiario(ctlCierres,ctlDepositos),[ctlCierres,ctlDepositos]);
  COM.pct=Number(caja.comisionPct); if(isNaN(COM.pct)) COM.pct=3;
  COM.real=comisionPorMes(ctlK.filas);
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [token,setToken]=useState(null);
  const [pideToque,setPideToque]=useState(false); // reconexión automática bloqueada por el navegador: un toque para reconectar
  const [syncStatus,setSyncStatus]=useState("disconnected"); // disconnected | syncing | ok | error
  const [sheetVentas,setSheetVentas]=useState([]);
  // total del día según el cierre de caja: POS + ERP contado + ERP tarjeta + crédito + transferencias
  const ventasCierres=useMemo(()=>sheetCierres2.map(c=>({fecha:c.fecha,monto:(c.ventaPos||0)+(c.ventasErp||0)+(c.tarjetaErp||0)+(c.credito||0)+(c.transferencia||0),obs:"",origen:"Cierre"})).filter(v=>v.monto>0),[sheetCierres2]);
  const ventasExtra=useMemo(()=>{const fa=new Set(sheetVentas.map(v=>v.fecha)); return [...sheetVentas.map(v=>({...v,origen:"App"})),...ventasCierres.filter(v=>!fa.has(v.fecha))];},[sheetVentas,ventasCierres]);
  EXTRA_VENTAS=ventasExtra;
  const [sheetCompras,setSheetCompras]=useState([]);
  const [sheetTickets,setSheetTickets]=useState([]);
  const [sheetGids,setSheetGids]=useState({Ventas:0,Compras:1,Tickets:2});
  const [vF,setVF]=useState({fecha:hoyISO(),monto:"",obs:""});
  const [cF,setCF]=useState({fecha:hoyISO(),factura:"",proveedor:"",monto:"",obs:""});
  const [tkF,setTkF]=useState({mes:new Date().getMonth(),anio:2026,cantidad:"",promedio:"",dias:""});
  const [aMes,setAMes]=useState(new Date().getMonth());
  const [aAnio,setAAnio]=useState(2026);
  const [freeQ,setFreeQ]=useState("");

  const showToast=useCallback((msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3200)},[]);

  // Load Google Identity Services
  const gisListo=useRef(false);
  useEffect(()=>{
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => { gisListo.current=true; if(!leerTok() && yaConecto()) conectar("auto"); };
    document.head.appendChild(script);
  },[]);

  // Al abrir: si hay un permiso guardado y vigente, se usa directo (sin tocar nada)
  useEffect(()=>{ const o=leerTok(); if(o){ setToken(o.t); setSyncStatus("syncing"); loadSheetData(o.t).then(ok=>{ if(ok!==false) setSyncStatus("ok"); }); } },[]);
  // Al volver a la app: si el permiso venció, intenta reconectar solo (o deja el botón de un toque)
  useEffect(()=>{ const f=()=>{ if(document.visibilityState!=="visible"||!token) return; if(!leerTok()){ setToken(null); setSyncStatus("disconnected"); if(gisListo.current) conectar("auto"); } };
    document.addEventListener("visibilitychange",f); return ()=>document.removeEventListener("visibilitychange",f); },[token]);

  const conectar = (modo) => {
    if(!window.google?.accounts?.oauth2){ if(modo!=="auto") showToast("Google todavía está cargando, probá de nuevo en un segundo","er"); return; }
    let hint=""; try{ hint=localStorage.getItem("prolimpio_gmail")||""; }catch(e){}
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      ...(hint?{hint}:{}),
      callback: async (resp) => {
        if(resp.access_token){
          guardarTok(resp.access_token, resp.expires_in);
          setPideToque(false);
          setToken(resp.access_token);
          setSyncStatus("syncing");
          if(modo!=="auto") showToast("✓ Conectado a Google Sheets");
          try{ const r=await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${resp.access_token}`); const j=await r.json(); if(j.email) localStorage.setItem("prolimpio_gmail",j.email); }catch(e){}
          await loadSheetData(resp.access_token);
          setSyncStatus("ok");
        } else if(modo==="auto"){ setPideToque(true); setSyncStatus("disconnected"); }
      },
      error_callback: () => { setPideToque(true); setSyncStatus("disconnected"); },
    });
    client.requestAccessToken(yaConecto()?{prompt:""}:{});
  };
  const handleLogin = () => conectar("manual");
  // Permiso vencido mientras se usa la app (Google responde 401)
  const tokenVencido = () => { borrarTok(); setToken(null); setSyncStatus("disconnected"); setPideToque(true); };

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

  const loadCierres2 = async (tk) => {
    try{ const rows=await gapi_read(tk,"CierresCaja!A2:Z3000",sidCierres||SHEET_ID);
      setActCierres(new Date().toLocaleTimeString("es-UY",{hour:"2-digit",minute:"2-digit"}));
      setSheetCierres2(rows.map((r,i)=>{const o={_i:i,fecha:r[0],cajero:r[1]||""};CIERRE_CAMPOS.forEach(([k],j)=>{o[k]=r[2+j]===""||r[2+j]==null?null:Number(r[2+j]);});const b=2+CIERRE_CAMPOS.length;o.credito=Number(r[b])||0;o.transferencia=Number(r[b+1])||0;o.gastosDetalle=r[b+2]||"";o.obs=r[b+3]||"";o.ts=r[b+4]||"";if(/\[object Object\]/.test(o.gastosDetalle))o.gastosDetalle="";const cx=CIERRES_CORREC[o.fecha];return cx?{...o,...cx}:o;}).filter(o=>o.fecha));
    }catch(e){}
  };
  const loadSheetData = async (tk) => {
    await loadCierres2(tk);
    if(modoCaja) return;
    try {
      // Fetch sheet metadata to get real gids
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`;
      const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${tk}` } });
      if(metaRes.status===401){ tokenVencido(); return false; }
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
      try{ const ss = await gapi_read(tk, "Saldos!A2:G500");
        const isoF=(x)=>{const t=String(x||"").trim();const m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:t;};
        const lst = ss.map(r=>({fecha:isoF(r[0]),brou:Number(r[1])||0,santUyu:Number(r[2])||0,santUsd:Number(r[3])||0,tc:Number(r[4])||0,neto:Number(r[5])||0,ts:r[6]||""})).filter(r=>r.fecha);
        setSheetSaldos(lst);
        const u=lst.length?[...lst].sort((a,b)=>a.fecha!==b.fecha?(a.fecha<b.fecha?1:-1):(a.ts<b.ts?1:-1))[0]:null;
        if(!u || refEsMasNuevo(u.fecha,u.ts)){
          // el saldo real informado es más nuevo que el último de la hoja: se registra en el historial
          const base=SALDO_REF.santUsd!=null?{santUsd:SALDO_REF.santUsd,tc:SALDO_REF.tc||40}:(u?{santUsd:u.santUsd,tc:u.tc||40}:{santUsd:0,tc:40});
          const neto=Math.round(SALDO_REF.brou+SALDO_REF.santUyu+(base.santUsd||0)*(base.tc||0));
          setCaja({brou:SALDO_REF.brou,santUyu:SALDO_REF.santUyu,...base,saldo:neto,saldoFecha:SALDO_REF.fecha,saldoTs:SALDO_REF.ts});
          if(!SALDO_REF.guardado) try{ SALDO_REF.guardado=true; if(await gapi_ensure_sheet(tk,"Saldos",["Fecha","BROU $","Santander $","Santander USD","TC","Neto $","Timestamp"]))
            await gapi_append(tk,"Saldos",[SALDO_REF.fecha,String(SALDO_REF.brou),String(SALDO_REF.santUyu),String(base.santUsd||0),String(base.tc||40),String(neto),SALDO_REF.ts]);
            setSheetSaldos([...lst,{fecha:SALDO_REF.fecha,brou:SALDO_REF.brou,santUyu:SALDO_REF.santUyu,santUsd:base.santUsd||0,tc:base.tc||40,neto,ts:SALDO_REF.ts}]); }catch(e){}
        } else setCaja({brou:u.brou,santUyu:u.santUyu,santUsd:u.santUsd,tc:u.tc||40,saldo:u.neto,saldoFecha:u.fecha,saldoTs:u.ts||""});
      }catch(e){}
      try{ const ci = await gapi_read(tk, "Cierres!A2:I2000"); setSheetCierres(ci.map((r,i)=>({_i:i,fecha:r[0],venta:Number(r[1])||0,efectivo:Number(r[2])||0,tarjetas:Number(r[3])||0,ventaErp:Number(r[4])||0,gastosEf:Number(r[5])||0,saldoErp:r[6]===""||r[6]==null?null:Number(r[6]),obs:r[7]||""})).filter(r=>r.fecha)); }catch(e){}
      try{ const de = await gapi_read(tk, "Depositos!A2:F2000"); setSheetDepositos(de.map((r,i)=>({_i:i,fecha:r[0],tipo:r[1],cuenta:r[2],monto:Number(r[3])||0,obs:r[4]||"",ts:r[5]||""})).filter(r=>r.fecha)); }catch(e){}
      try{ const pg = await gapi_read(tk, "Pagos!A2:G2000"); setSheetPagos(pg.map((r,i)=>({_i:i,fecha:r[0],clave:r[1],concepto:r[2],monto:Number(r[3])||0,mes:r[4],ts:r[5]||"",cuenta:r[6]||""})).filter(r=>r.clave)); }catch(e){}
      try{ const st = await gapi_read(tk, "Stock!A2:D500"); setSheetStock(st.map(r=>({fecha:r[0],valor:Number(r[1])||0,obs:r[2]||""})).filter(r=>r.fecha&&r.valor)); }catch(e){}
      try{ const rr = await gapi_read(tk, "Retiros!A2:F500"); setSheetRetiros(rr.map(r=>({fecha:r[0],monto:r[1],tipo:r[2],obs:r[3],ts:r[4]||"",cuenta:r[5]||""})).filter(r=>r.fecha)); }catch(e){}
      setSheetVentas(v.map(r=>({fecha:r[0],monto:r[1],obs:r[2]})).filter(r=>r.fecha));
      setSheetCompras(c.map(r=>({fecha:r[0],factura:r[1],proveedor:r[2],monto:r[3],obs:r[4]})).filter(r=>r.fecha));
      setSheetTickets(t.map(r=>({mes:r[0],anio:r[1],cantidad:r[2],promedio:r[3],dias:r[4]})).filter(r=>r.mes));
    } catch(e){ setSyncStatus("error"); }
  };

  const deleteRow = async (sheet, rowIndex) => {
    if(!token){showToast("Conectate a Sheets primero","er");return;}
    if(!window.confirm("¿Borrar este registro?")) return;
    setSyncStatus("syncing");
    const gid = sheetGids[sheet];
    if(gid===undefined){showToast("No encontré la hoja "+sheet+", recargá la app","er");setSyncStatus("error");return;}
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
    setVF({fecha:hoyISO(),monto:"",obs:""});
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
    setCF({fecha:hoyISO(),factura:"",proveedor:"",monto:"",obs:""});
  };

  const hacerInforme = async (modo) => {
    try{
      const usarIA = rIA && rTipo==="mensual" && aiText && aMes===rMes && String(aAnio)===String(rAnio) && !aiText.startsWith("Los modelos") && !aiText.startsWith("Falta");
      const {blob,nombre,titulo} = generarInforme(rTipo, rMes, rAnio, {caja, retiros:sheetRetiros, stock:sheetStock, aiText: usarIA?aiText:""});
      const file = new File([blob], nombre, {type:"application/pdf"});
      if(modo==="compartir" && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:titulo, text:`${titulo} — PROlimpio Durazno`});
        return;
      }
      const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000);
      if(modo==="compartir") showToast("Este navegador no permite compartir directo: el PDF se descargó");
    }catch(e){ if(e&&e.name==="AbortError") return; showToast("No se pudo generar el informe","er"); console.error(e); }
  };

  useEffect(()=>{ if(!token||tab!=="control") return; const id=setInterval(()=>{ loadCierres2(token); },180000); return ()=>clearInterval(id); },[token,tab,sidCierres]);
  const borrarCierre2 = async (idx) => {
    if(typeof idx!=="number"||isNaN(idx)){ showToast("Este cierre lo cargó Claude desde el chat: pedile que lo saque","er"); return; }
    if(!token||!window.confirm("¿Borrar este cierre?")) return;
    const sid=sidCierres||SHEET_ID;
    const meta=await (await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties`,{headers:{Authorization:`Bearer ${token}`}})).json();
    const sh=(meta.sheets||[]).find(s=>s.properties.title==="CierresCaja"); if(!sh){showToast("No encontré la hoja","er");return;}
    const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId:sh.properties.sheetId,dimension:"ROWS",startIndex:idx+1,endIndex:idx+2}}}]})});
    if(r.ok){showToast("Cierre borrado");await loadCierres2(token);} else showToast("No se pudo borrar","er");
  };
  const analizarFotos = async () => {
    if(!fotos.length){showToast("Sacá o elegí la foto del cierre","er");return;}
    if(!orKey){showToast("Falta la clave de OpenRouter en este equipo","er");return;}
    setLeyendo("Preparando fotos…"); setLeido(null);
    const r=await leerCierreConIA(fotos,orKey,setLeyendo);
    setLeyendo("");
    if(!r.ok){showToast("No pude leer la foto: completá a mano","er");setLeido({error:r.error,errores:r.errores,fuente:r.fuente});return;}
    const d=r.datos; const n={...cjF};
    CIERRE_CAMPOS.forEach(([k])=>{ if(d[k]!=null&&!isNaN(Number(d[k]))) n[k]=String(Math.abs(Number(d[k]))*(k==="diferencia"&&Number(d[k])<0?-1:1)); });
    if(d.fecha&&/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) n.fecha=d.fecha;
    if(d.cajero) n.cajero=String(d.cajero).replace(/^\d+-/,"").trim();
    if(d.gastosDetalle) n.gastosDetalle=textoGastos(d.gastosDetalle);
    setCjF(n); setLeido({modelo:r.modelo}); showToast("✓ Foto leída: revisá los números");
  };
  // Datos que vienen del "Lector de cierres" (página de Claude): link #cierre=CODIGO o código pegado
  const aplicarCodigoLector = (code) => {
    try{
      const b=String(code||"").trim().replace(/^.*#cierre=/,"").replace(/-/g,"+").replace(/_/g,"/");
      const d=JSON.parse(decodeURIComponent(escape(atob(b+"===".slice((b.length+3)%4)))));
      const n={...CIERRE_VACIO()};
      [...CIERRE_CAMPOS.map(([k])=>k),"credito","transferencia"].forEach(k=>{ if(d[k]!=null&&!isNaN(Number(d[k]))) n[k]=String(Number(d[k])); });
      if(d.fecha&&/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) n.fecha=d.fecha;
      if(d.cajero) n.cajero=String(d.cajero); if(d.gastosDetalle) n.gastosDetalle=textoGastos(d.gastosDetalle);
      setCjF(n); setLeido({modelo:"Claude (lector de cierres)"}); setTab("control"); showToast("✓ Números del lector cargados: revisá y guardá"); return true;
    }catch(e){ showToast("El código no es válido. Copialo de nuevo desde el lector","er"); return false; }
  };
  useEffect(()=>{ if(location.hash.startsWith("#cierre=")){ const c=location.hash; try{history.replaceState(null,"",location.pathname+location.search);}catch(e){} aplicarCodigoLector(c); } },[]);
  const [codLector,setCodLector]=useState("");
  const guardarCierre2 = async () => {
    if(!token){showToast("Conectate a Google primero","er");return;}
    if(!cjF.fecha||nC(cjF.ventaPos)==null){showToast("Falta la fecha o la venta total","er");return;}
    const malos=chequearCierre(cjF).filter(x=>!x.ok);
    if(malos.length&&!window.confirm(`Hay ${malos.length} control(es) que no cierran. ¿Guardar igual?`)) return;
    const sid=sidCierres||SHEET_ID;
    setSyncStatus("syncing");
    const okS=await gapi_ensure_sheet(token,"CierresCaja",HEAD_CIERRES,sid);
    const fila=[cjF.fecha,cjF.cajero||"",...CIERRE_CAMPOS.map(([k])=>nC(cjF[k])==null?"":String(nC(cjF[k]))),String(nC(cjF.credito)||0),String(nC(cjF.transferencia)||0),textoGastos(cjF.gastosDetalle),cjF.obs||"",new Date().toISOString()];
    // foto liviana para el mail, partida en pedazos de 45.000 caracteres (límite de una celda)
    try{ const b64=await fotoParaMail(fotos); if(b64 && okS){ const partes=b64.match(/.{1,45000}/g)||[];
        const meta=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}?fields=sheets.properties(sheetId,title,gridProperties.columnCount)`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json());
        const hj=(meta.sheets||[]).find(x=>x.properties.title==="CierresCaja"); const fal=26+partes.length-(hj?.properties?.gridProperties?.columnCount||26);
        if(hj&&fal>0) await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({requests:[{appendDimension:{sheetId:hj.properties.sheetId,dimension:"COLUMNS",length:fal+2}}]})});
        fila.push(...partes.map(x=>"img:"+x)); } }catch(e){}
    const ok=okS&&await gapi_append(token,"CierresCaja",fila,sid);
    if(ok){ setSyncStatus("ok"); setUltimoCierre({...cjF}); setCjF(CIERRE_VACIO()); setFotos([]); setLeido(null); await loadCierres2(token); window.scrollTo({top:0,behavior:"smooth"}); }
    else { setSyncStatus("error"); showToast("No se pudo guardar: revisá la conexión","er"); }
  };
  const activarModoCaja = async () => {
    if(!/^\d{4}$/.test(pinIn)){showToast("El PIN tiene que ser de 4 números","er");return;}
    const h=await sha256("prolimpio:"+pinIn); try{localStorage.setItem("prolimpio_modo_caja",h);}catch(e){} setModoCaja(h); setPinIn(""); setTab("control");
  };
  const salirModoCaja = async () => {
    const p=window.prompt("PIN para salir del modo caja"); if(!p) return;
    if(await sha256("prolimpio:"+p)===modoCaja){ try{localStorage.removeItem("prolimpio_modo_caja");}catch(e){} setModoCaja(""); showToast("Modo caja desactivado"); if(token) await loadSheetData(token); }
    else showToast("PIN incorrecto","er");
  };

  const guardarFila = async (hoja, headers, fila, okMsg, extra=[]) => {
    if(!token){showToast("Conectate a Google Sheets primero","er");return false;}
    setSyncStatus("syncing");
    const okS = await gapi_ensure_sheet(token,hoja,headers);
    const ok = okS && await gapi_append(token,hoja,[...fila,new Date().toISOString(),...extra]);
    if(ok){ showToast(okMsg); setSyncStatus("ok"); await loadSheetData(token); return true; }
    showToast("Error al guardar","er"); setSyncStatus("error"); return false;
  };
  const saveCierre = async () => {
    if(!ciF.fecha||!ciF.venta){showToast("Completá fecha y venta total","er");return;}
    const ef=Number(ciF.efectivo)||0, tj=Number(ciF.tarjetas)||0, v=Number(ciF.venta)||0;
    if(Math.abs(ef+tj-v)>1 && !window.confirm(`Efectivo + tarjetas (${ef+tj}) no da la venta total (${v}). ¿Guardar igual?`)) return;
    const ok=await guardarFila("Cierres",["Fecha","Venta POS","Efectivo POS","Tarjetas POS","Ventas contado ERP","Gastos pagados en efectivo","Saldo final caja ERP","Observacion","Timestamp"],
      [ciF.fecha,String(v),String(ef),String(tj),String(Number(ciF.ventaErp)||0),String(Number(ciF.gastosEf)||0),ciF.saldoErp===""?"":String(Number(ciF.saldoErp)),ciF.obs||""],"✓ Cierre guardado");
    if(ok) setCiF(p=>({...p,venta:"",efectivo:"",tarjetas:"",ventaErp:"",gastosEf:"",saldoErp:"",obs:""}));
  };
  const saveDeposito = async () => {
    if(!deF.fecha||!deF.monto){showToast("Completá fecha y monto","er");return;}
    const ok=await guardarFila("Depositos",["Fecha","Tipo","Cuenta","Monto","Observacion","Timestamp"],[deF.fecha,deF.tipo,deF.cuenta,String(Number(deF.monto)),deF.obs||""],"✓ Depósito guardado");
    if(ok) setDeF(p=>({...p,monto:"",obs:""}));
  };
  const marcarPago = async () => {
    if(!pagoEdit) return; const m=Number(pagoEdit.monto)||0; if(!m){showToast("Poné el monto pagado","er");return;}
    const ok=await guardarFila("Pagos",["Fecha pago","Clave","Concepto","Monto","Mes","Timestamp","Cuenta"],[pagoEdit.fecha,pagoEdit.clave,pagoEdit.concepto,String(m),pagoEdit.mes],"✓ Pago registrado",[pagoEdit.cuenta||"Santander"]);
    if(ok) setPagoEdit(null);
  };

  const saveStock = async () => {
    if(!token){showToast("Conectate a Google Sheets primero","er");return;}
    if(!stF.fecha||!stF.valor){showToast("Completá fecha y valor","er");return;}
    setSyncStatus("syncing");
    const okS = await gapi_ensure_sheet(token,"Stock",["Fecha","Valor $","Observacion","Timestamp"]);
    const ok = okS && await gapi_append(token,"Stock",[stF.fecha,String(stF.valor),stF.obs||"",new Date().toISOString()]);
    if(ok){ showToast("✓ Stock guardado"); setSyncStatus("ok"); setStF(p=>({...p,valor:"",obs:""})); await loadSheetData(token); }
    else { showToast("Error al guardar el stock","er"); setSyncStatus("error"); }
  };

  const saveSaldo = async () => {
    if(!token){showToast("Conectate a Google Sheets primero","er");return;}
    const neto = Math.round((Number(caja.brou)||0)+(Number(caja.santUyu)||0)+(Number(caja.santUsd)||0)*(Number(caja.tc)||0));
    setSyncStatus("syncing");
    const okS = await gapi_ensure_sheet(token,"Saldos",["Fecha","BROU $","Santander $","Santander USD","TC","Neto $","Timestamp"]);
    const ok = okS && await gapi_append(token,"Saldos",[caja.saldoFecha,String(caja.brou),String(caja.santUyu),String(caja.santUsd),String(caja.tc),String(neto),new Date().toISOString()]);
    if(ok){ setCaja({saldo:neto}); showToast("✓ Saldo guardado"); setSyncStatus("ok"); await loadSheetData(token); }
    else { showToast("Error al guardar el saldo","er"); setSyncStatus("error"); }
  };

  const saveRetiro = async () => {
    if(!rF.monto||!rF.fecha){showToast("Completá fecha y monto","er");return;}
    if(!token){showToast("Conectate a Google Sheets primero","er");return;}
    setSyncStatus("syncing");
    const okSheet = await gapi_ensure_sheet(token,"Retiros",["Fecha","Monto","Tipo","Observacion","Timestamp","Cuenta"]);
    const ok = okSheet && await gapi_append(token,"Retiros",[rF.fecha,String(rF.monto),rF.tipo,rF.obs||"",new Date().toISOString(),rF.cuenta||"Santander"]);
    if(ok){ showToast("✓ Retiro guardado"); setSyncStatus("ok"); setRF(p=>({...p,monto:"",obs:""})); await loadSheetData(token); }
    else { showToast("Error al guardar el retiro","er"); setSyncStatus("error"); }
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
  const syncLabel = syncStatus==="ok"?"Sheets conectado":syncStatus==="syncing"?"Sincronizando...":syncStatus==="disconnected"?(yaConecto()?"Reconectar":"Conectar Sheets"):"Error de sync";

  const tk26=TK.filter(r=>r.c26).reduce((s,r)=>s+(r.c26||0),0);
  const tk25=TK.filter(r=>r.c26).reduce((s,r)=>s+(r.c25||0),0);
  const cTk=pct(tk26,tk25);
  const pvTk=TK.filter(r=>r.p26).reduce((s,r,i,a)=>s+r.p26/a.length,0);
  const t25=VM.reduce((s,r)=>s+(r["2025"]||0),0);
  const t24=VM.reduce((s,r)=>s+(r["2024"]||0),0);
  // Real 2026 data from Excel
  const real26EneSet = 2373579+1710114+1884301+1620824+1304108;
  const real25EneAbr = 2003181+1615840+1488874+1281569+1435910+1478792+1545618+1519419+1590065;
  const crec26real = pct(real26EneSet, real25EneAbr);
  // Also include new daily sales loaded from sheets
  const sheetVentasTotal = sheetVentas.filter(v=>v.fecha&&v.fecha.startsWith("2026")&&!isNaN(Number(v.monto))).reduce((s,v)=>s+Number(v.monto),0);
  const cvM=VM.map(r=>({mes:r.mes,"2024":r["2024"]/1000,"2025":r["2025"]/1000,"2026":r["2026"]?r["2026"]/1000:undefined}));
  const cvT=TK.map(r=>({mes:r.mes,"Cant 25":r.c25,"Cant 26":r.c26}));

  const runAI=async(q)=>{
    setAiLoading(true);setAiText("");
    try{
      const M=metricasMes(aMes,aAnio); const anio=M.anio;
      const f0=x=>x==null?"sin dato":"$"+fmt(Math.round(x)); const pc=x=>x==null?"sin dato":(x>=0?"+":"")+fmt(x,1)+"%";
      const yrs=["2022","2023","2024","2025","2026"];
      const hist=yrs.map(y=>`${MES3[aMes]} ${y}: ${f0(VM[aMes][y])}`).join(" | ");
      const anual=yrs.map(y=>{const n=TG_REAL[y].filter(x=>x!=null).length;const v=VM.slice(0,n).reduce((s,r)=>s+(r[y]||0),0);const gg=TG_REAL[y].slice(0,n).reduce((s,x,j)=>s+(gastoTotal(y,j)||0),0);const d2=DEUDA_PAGOS[y].slice(0,n).reduce((s,x)=>s+(x||0),0);return `${y}${n<12?" (Ene–"+MES3[n-1]+")":""}: ventas ${f0(v)}, ganancia operativa ${f0(v-gg+d2)} (${fmt((v-gg+d2)/v*100,1)}%)`;}).join("\n");
      const sys=`Sos un analista de negocios uruguayo que asesora al dueño de un local franquiciado de PROlimpio (productos de limpieza) en Durazno, Uruguay. Abre de lunes a sábado; su principal proveedor es SUBATIR (paga a 45 días). Escribís en español rioplatense, directo y práctico. Todas las cifras ya están calculadas: NO hagas cuentas ni las verifiques, usalas tal cual. Escribí únicamente el texto final para el dueño, entre las etiquetas <respuesta> y </respuesta>.`;
      const prompt=`CIFRAS YA CALCULADAS — ${MESES[aMes]} ${anio} comparado con ${MESES[aMes]} ${M.prev}:
- Ventas: ${f0(M.v)} vs ${f0(M.vPrev)} → ${pc(M.nom)} nominal, ${pc(M.real)} real (inflación ${fmt(M.inf,2)}%)
- Promedio por día hábil: ${f0(M.pd)} (${M.dias??"?"} días) vs ${f0(M.pdPrev)} (${M.diasPrev??"?"} días) → ${pc(M.pdVar)}
- Tickets emitidos: ${M.tk??"sin dato"} vs ${M.tkPrev??"sin dato"} → ${pc(M.tkVar)}
- Ticket promedio: ${M.tp!=null?"$"+M.tp:"sin dato"} vs ${M.tpPrev!=null?"$"+M.tpPrev:"sin dato"} → ${pc(M.tpVar)}
- Gastos totales del mes: ${f0(M.gastos)}; ganancia operativa ${f0(M.op)} (${M.opPct!=null?fmt(M.opPct,1)+"%":"sin dato"} de las ventas); pagos de préstamos ${f0(M.deuda)}
- Acumulado enero–${M.mc}: ${f0(M.ytd)} vs ${f0(M.ytdPrev)} → ${pc(M.ytdVar)}
Nota: los tickets no cubren el total de ventas (parte se vende por otra vía); no multipliques tickets por ticket promedio.

Historia de ${MESES[aMes].toLowerCase()}: ${hist}
Resumen anual (ganancia operativa = ventas − gastos, sin pagos de préstamos):
${anual}

PEDIDO: ${q||`Comentá cómo le fue en ${MESES[aMes]} ${anio} usando las cifras de arriba y terminá con 2 o 3 recomendaciones concretas.`}
Máximo 180 palabras, párrafos cortos. Respondé solo entre <respuesta> y </respuesta>.`;
      const extraer=(s)=>{ if(!s) return null; s=s.replace(/<think>[\s\S]*?<\/think>/gi,""); const fin=s.lastIndexOf("</respuesta>"); if(fin<0) return null; const ini=s.lastIndexOf("<respuesta>",fin); if(ini<0) return null; const t=s.slice(ini+11,fin).trim(); return t.length>40?t:null; };
      const OR_KEY = orKey.trim();
      if(!OR_KEY){ setAiText("Falta cargar tu clave de OpenRouter (más abajo, en \"Clave de OpenRouter\")."); setAiLoading(false); return; }
      // Lista dinámica: consulta en vivo qué modelos gratuitos ofrece OpenRouter hoy
      const FALLBACK = ["deepseek/deepseek-chat-v3-0324:free","meta-llama/llama-3.3-70b-instruct:free","google/gemma-3-27b-it:free","qwen/qwen3-235b-a22b:free"];
      let MODELS = FALLBACK;
      try{
        const lr = await fetch("https://openrouter.ai/api/v1/models");
        if(lr.ok){
          const lj = await lr.json();
          const pref = ["llama-3.3","llama-4","mistral","gemma-3","deepseek-chat","qwen-2.5","glm","deepseek"];
          const score = id => { const i = pref.findIndex(p=>id.includes(p)); return i<0?99:i; };
          const free = (lj.data||[])
            .filter(m => m.id.endsWith(":free") && m.pricing && Number(m.pricing.prompt)===0 && Number(m.pricing.completion)===0)
            .filter(m => !/vision|image|audio|embed|guard/i.test(m.id))
            .sort((a,b)=> (/r1|think|reason|qwen3|gpt-oss|nemotron|gemma-4/i.test(a.id)?1:0)-(/r1|think|reason|qwen3|gpt-oss|nemotron|gemma-4/i.test(b.id)?1:0) || score(a.id)-score(b.id) || (b.context_length||0)-(a.context_length||0))
            .map(m=>m.id);
          if(free.length) MODELS = free.slice(0,8);
        }
      }catch(e){}
      let txt = null; let respaldo = null;
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
            body:JSON.stringify({model,messages:[{role:"system",content:sys},{role:"user",content:prompt}],max_tokens:3000,temperature:0.4,reasoning:{exclude:true}})
          });
          if(!res.ok){ const e=await res.json(); lastErr=`${model}: ${e?.error?.message||res.status}`; continue; }
          const data = await res.json();
          const raw = data?.choices?.[0]?.message?.content;
          const ok = extraer(raw);
          if(ok){ txt = ok+"\n\n— "+model.replace(":free",""); break; }
          lastErr = `${model}: respuesta incompleta o sin formato`;
        }catch(e){ lastErr=`${model}: ${e.message}`; }
      }
      if(txt){ setAiText(txt); }
      else { setAiText("Los modelos gratuitos no devolvieron una respuesta válida ("+MODELS.length+" probados). El resumen automático de arriba tiene las cifras exactas; podés reintentar la IA en unos minutos.\nÚltimo error: "+lastErr); }
    }catch(e){ setAiText("Error de red: "+e.message); }
    setAiLoading(false);
  };


  // ── Datos compartidos entre pestañas ─────────────────────────────────────
  const hoyD=new Date(); const mIdx=hoyD.getMonth(); const yAct=hoyD.getFullYear();
  const mesKey=`${yAct}-${String(mIdx+1).padStart(2,"0")}`;
  const delMes=sheetRetiros.map((r,i)=>({...r,_i:i})).filter(r=>{const d=new Date(r.fecha+"T12:00:00");return d.getMonth()===mIdx&&d.getFullYear()===yAct;});
  const retiradoMes=delMes.reduce((s,r)=>s+(Number(r.monto)||0),0);
  // saldo estimado de hoy
  const saldoHoy=(()=>{const desde=caja.saldoFecha||"0000"; const dTs=caja.saldoTs||""; const posterior=x=>dTs&&x.ts?x.ts>dTs:x.fecha>desde;
    const cta=x=>{const c=String(x.cuenta||x.cta||"").toLowerCase(); return c.startsWith("brou")?"brou":c.startsWith("efectivo")?"efectivo":c.startsWith("otro")?"otro":"sant";};
    const movs=[...sheetDepositos.filter(posterior).map(d=>({m:+d.monto||0,c:cta(d)})),...sheetCierres2.filter(c=>c.deposito&&posterior(c)).map(c=>({m:+c.deposito||0,c:"sant"})),
      ...sheetPagos.filter(posterior).map(p=>({m:-(+p.monto||0),c:cta(p),pago:true})),...sheetRetiros.filter(r=>r.ts?posterior(r):r.fecha>desde).map(r=>({m:-(Number(r.monto)||0),c:cta(r),ret:true}))];
    const suma=f=>movs.filter(f).reduce((s,x)=>s+x.m,0);
    const brou=(+caja.brou||0)+suma(x=>x.c==="brou"), sant=(+caja.santUyu||0)+suma(x=>x.c==="sant"), usd=(+caja.santUsd||0)*(+caja.tc||0);
    const dep=suma(x=>x.m>0&&(x.c==="sant"||x.c==="brou")), pag=-suma(x=>x.pago&&(x.c==="sant"||x.c==="brou")), ret=-suma(x=>x.ret&&(x.c==="sant"||x.c==="brou"));
    const pagTodos=-suma(x=>x.pago), retTodos=-suma(x=>x.ret), fueraBanco=-suma(x=>(x.pago||x.ret)&&x.c==="efectivo");
    return {brou,sant,dep,pag,ret,pagTodos,retTodos,fueraBanco,depTodos:suma(x=>x.m>0),est:brou+sant+usd,hay:movs.length>0};})();
  // la proyección arranca del saldo estimado de hoy y descuenta del mes lo ya cobrado, pagado y retirado después del último saldo
  const cajaProy={...caja,saldo:saldoHoy.est-saldoHoy.fueraBanco,depExtra:saldoHoy.depTodos,pagExtra:saldoHoy.pagTodos,retExtra:saldoHoy.retTodos};
  const proy=proyectarCaja(cajaProy);
  const CR=crecimientoReal(); const escSel=caja.escSel||"medio";
  const escProy=ESCENARIOS.map(e=>({...e,crec:crecEscenario(caja,e.k),p:proyectarCaja(cajaProy,crecEscenario(caja,e.k))}));
  const PS=planSubatir(caja); const fD=iso=>{const p=iso.split("-");return `${p[2]}/${p[1]}`;};
  const chartEsc=proy.map((r,i)=>{const o={mes:r.mes}; escProy.forEach(e=>{o[e.k]=e.p[i].saldo;}); return o;});
  const sugerido=proy[0]?.retiro||0;
  const minimo=proy.reduce((a,b)=>b.saldo<a.saldo?b:a,proy[0]);
  const enLimite=proy.find(p=>p.saldo<caja.limite);
  const enAlerta=proy.find(p=>p.saldo<caja.alerta);
  const anioRet=sheetRetiros.filter(r=>String(r.fecha).startsWith(String(yAct))).reduce((s,r)=>s+(Number(r.monto)||0),0);
  const num=(k)=>e=>setCaja({[k]:Number(e.target.value)});

  // ventas del mes en curso (planilla + app)
  const RMC=(()=>{const delM=v=>{if(!v.fecha||isNaN(Number(v.monto))||Number(v.monto)<=0)return false;const d=new Date(v.fecha+"T12:00:00");return d.getMonth()===mIdx&&d.getFullYear()===yAct;};
    const todas=ventasConExtra().filter(delM);
    const total=todas.reduce((s,v)=>s+Number(v.monto),0), dias=todas.length, prom=dias?total/dias:0;
    const dh=DIAS_HABILES[String(yAct)]?.[MES3[mIdx]]||26, vPrev=VM[mIdx]?.[String(yAct-1)], dhP=DIAS_HABILES[String(yAct-1)]?.[MES3[mIdx]]||26;
    const promPrev=vPrev?vPrev/dhP:null; const cv=proyMesCurva(yAct,mIdx,todas);
    return {total,dias,prom,dh,proyeccion:cv?cv.proy:total+prom*Math.max(0,dh-dias),simple:cv?.simple,cv,promPrev,var:cv?.varMismos??(promPrev&&prom?(prom/promPrev-1)*100:null)};})();
  // pendientes del mes
  const pagadasK=new Set(sheetPagos.map(x=>x.clave));
  const pendMes=PENDIENTES.filter(p=>p.mes===mesKey&&!pagadasK.has(clavePend(p)));
  const fijosMesLista=(COSTOS_FIJOS_MES[mesKey]||COSTOS_FIJOS).filter(c=>!c.planilla&&!sheetPagos.find(p=>p.clave===claveFijo(mesKey,c.nombre)));
  const girosSinDebitar=PENDIENTES.filter(p=>/giro hecho/i.test(p.prov)&&!pagadasK.has(clavePend(p)));
  const TABS=[{id:"hoy",label:"🏠 Hoy"},{id:"ventas",label:"📈 Ventas"},{id:"control",label:"🧾 Caja"},{id:"pagos",label:"💳 Pagos"},{id:"compras",label:"📦 Compras"},{id:"proy",label:"🔮 Proyección"},{id:"carga",label:"✏️ Cargar"},{id:"informes",label:"📄 Informes"},{id:"historial",label:"📚 Historial"}];


  return<>
    <style>{CSS}</style>
    <div className="app">
      <header className="header">
        <div>
          <img src={LOGO_H} alt="PROlimpio" style={{height:40,objectFit:"contain"}}/>
          <div className="header-sub">{modoCaja?"Cierre de caja · Durazno":"Panel de gestión · Durazno"}</div>
        </div>
        <div className="header-actions">
          <a className="sync-badge" href="./reloj.html" style={{textDecoration:"none",color:"inherit"}} title="Reloj de marcas del personal">⏱️ Reloj</a>
          <div className="sync-badge" onClick={!token?handleLogin:()=>loadSheetData(token)}>
            <span className={`sync-dot ${syncDot}`}/>
            {syncLabel}
          </div>
        </div>
      </header>
      {!token&&pideToque&&<div onClick={handleLogin} style={{cursor:"pointer",margin:"8px 16px 0",padding:"12px 14px",borderRadius:12,background:"#e84400",color:"#fff",fontWeight:700,textAlign:"center"}}>🔄 Tocá acá para reconectar con Google</div>}
      {!modoCaja&&<nav className="nav">
        {TABS.map(n=><button key={n.id} className={`nav-btn${tab===n.id?" active":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
      </nav>}
      <main style={{paddingBottom:48,paddingTop:6}}>

        {tab==="hoy"&&<div className="gap">
          <div className="abar"/>
          {!token&&<div className="banner">🔗 <span>Tocá <strong style={{color:"#C2410C",cursor:"pointer"}} onClick={handleLogin}>"Conectar Sheets"</strong> arriba para ver tus pagos, retiros y saldos guardados.</span></div>}
          <div className="card" style={{borderLeft:"5px solid #E84400"}}>
            <div className="ctitle">Saldo estimado de hoy</div>
            <div className="cval" style={{color:saldoHoy.est<0?"#B91C1C":"#14532D"}}>{fmtM(saldoHoy.est)}</div>
            <div className="csub">BROU {fmtM(saldoHoy.brou)} · Santander {fmtM(saldoHoy.sant)}{+caja.santUsd?` · USD ${fmt(caja.santUsd)}`:""}</div>
            <div className="csub" style={{fontSize:".85rem"}}>Último saldo real al {caja.saldoFecha?caja.saldoFecha.split("-").reverse().join("/"):"—"} (BROU {fmtM(caja.brou)} · Santander {fmtM(caja.santUyu)}){saldoHoy.hay?` + depósitos ${fmtM(saldoHoy.dep)} − pagos ${fmtM(saldoHoy.pag)} − retiros ${fmtM(saldoHoy.ret)} cargados después`:""}</div>
            {girosSinDebitar.length>0&&<div className="delta wr" style={{marginTop:8}}>Falta que el banco debite {girosSinDebitar.map(g=>g.prov.split(" (")[0]).join(" y ")}: {fmtM(girosSinDebitar.reduce((s,g)=>s+g.monto,0))}</div>}
          </div>
          <div className="grid2">
            <div className="card" onClick={()=>setTab("ventas")} style={{cursor:"pointer"}}>
              <div className="ctitle">Ventas de {MESES[mIdx]}</div>
              <div className="cval ac">{RMC.total?fmtM(RMC.total):"Sin datos"}</div>
              <div className="csub">{RMC.dias} de {RMC.dh} días · proyección del mes {fmtM(RMC.proyeccion)} = <b>{fmtM(RMC.proyeccion/RMC.dh)}/día</b>{RMC.cv?.pdPrevMes?` vs ${fmtM(RMC.cv.pdPrevMes)}/día en ${yAct-1} (${RMC.cv.varProy>=0?"+":""}${fmt(RMC.cv.varProy,1)}%)`:""}</div>
              {RMC.var!=null&&<div className={`delta ${RMC.var>=0?"up":"dn"}`}>{RMC.var>=0?"▲":"▼"} {fmt(Math.abs(RMC.var),1)}% por día vs mismos días de {yAct-1}</div>}
            </div>
            <div className="card" onClick={()=>setTab("pagos")} style={{cursor:"pointer"}}>
              <div className="ctitle">Falta pagar en {MESES[mIdx]}</div>
              <div className="cval">{fmtM(pendMes.reduce((s,p)=>s+p.monto,0)+fijosMesLista.reduce((s,c)=>s+c.monto,0))}</div>
              <div className="csub">Proveedores {fmtM(pendMes.filter(p=>p.tipo==="prov").reduce((s,p)=>s+p.monto,0))} · cheques SUBATIR {fmtM(pendMes.filter(p=>p.tipo==="cheque").reduce((s,p)=>s+p.monto,0))} · créditos {fmtM(pendMes.filter(p=>p.tipo==="credito"||p.tipo==="plazo").reduce((s,p)=>s+p.monto,0))} · fijos {fmtM(fijosMesLista.reduce((s,c)=>s+c.monto,0))}</div>
              {fijosMesLista.length>0&&<div className="delta wr">Fijos sin marcar: {fijosMesLista.map(c=>c.nombre.split(" (")[0]).join(", ")}</div>}
            </div>
            {PS.filas[0]&&<div className="card" onClick={()=>setTab("compras")} style={{cursor:"pointer"}}>
              <div className="ctitle">Pedido SUBATIR del lunes {fD(PS.filas[0].lunes)}</div>
              <div className="cval">{fmt(PS.filas[0].kgPed)} kg</div>
              <div className="csub">≈ {fmtM(PS.filas[0].montoPed)}{PS.filas[0].faltaKg>0?` · harían falta ${fmt(PS.filas[0].kgNec)} kg`:""}</div>
              {PS.extra&&<div className="delta up">Pedido extra de temporada: {fmt(PS.extra.kg)} kg el lunes {fD(PS.extra.fecha)}</div>}
            </div>}
            <div className="card" onClick={()=>setTab("proy")} style={{cursor:"pointer"}}>
              <div className="ctitle">Retiro de {MESES[mIdx]}</div>
              <div className="cval">{fmtM(retiradoMes)} <span className="tsm">de {fmtM(sugerido)}</span></div>
              <div className="csub">Saldo más bajo proyectado: {minimo?`${fmtM(minimo.saldo)} en ${minimo.mes}`:"—"}</div>
              <div className={`delta ${retiradoMes<=sugerido?"up":"dn"}`}>{retiradoMes<=sugerido?`Disponible ${fmtM(sugerido-retiradoMes)}`:`Excedido ${fmtM(retiradoMes-sugerido)}`}</div>
            </div>
          </div>
          {enLimite?<div className="banner" style={{borderColor:"#B91C1C",color:"#B91C1C"}}>🔴 En {enLimite.mes} el saldo proyectado ({fmtM(enLimite.saldo)}) pasa el límite del sobregiro.</div>
           :enAlerta?<div className="banner" style={{borderColor:"#B45309",color:"#92400E"}}>⚠️ En {enAlerta.mes} el saldo proyectado ({fmtM(enAlerta.saldo)}) baja de tu límite de alerta ({fmtM(caja.alerta)}).</div>
           :<div className="banner">✓ En los próximos 15 meses el saldo proyectado no baja de tu límite de alerta ({fmtM(caja.alerta)}), escenario {(ESCENARIOS.find(e=>e.k===escSel)||{}).n}.</div>}
          {pendMes.length>0&&<details className="card"><summary style={{cursor:"pointer",color:"var(--text2)",fontSize:".95rem",fontWeight:600}}>Pendientes de {MESES[mIdx]} ({pendMes.length}) · {fmtM(pendMes.reduce((s,p)=>s+p.monto,0))}</summary>
            <div className="tw" style={{marginTop:6}}><table className="tcomp"><tbody>{pendMes.map((p,i)=><tr key={i}><td>{p.prov}</td><td className="tac" style={{whiteSpace:"nowrap"}}>{fmtM(p.monto)}</td></tr>)}</tbody></table></div>
            <div className="tsm" style={{marginTop:6}}>Para marcarlos pagados, andá a 💳 Pagos.</div></details>}
        </div>}

        {tab==="ventas"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Ventas del mes en curso</span><span className="ss">De tu planilla y las cargadas en la app</span></div>
          {(()=>{
            const hoy = new Date();
            const mesActual = hoy.getMonth();
            const anioActual = hoy.getFullYear();
            const nombreMes = MESES[mesActual];
            const nombreMesCorto = nombreMes.slice(0,3);
            const delMes = v=>{ if(!v.fecha||isNaN(Number(v.monto))||Number(v.monto)<=0) return false; const d = new Date(v.fecha+"T12:00:00"); return d.getMonth()===mesActual && d.getFullYear()===anioActual; };
            const dePlanilla = VENTAS_DIA_PLANILLA.filter(delMes).map(v=>({...v,origen:"Planilla"}));
            const fechasPl = new Set(dePlanilla.map(v=>v.fecha));
            const ventasMesActual = [...dePlanilla, ...ventasExtra.filter(delMes).filter(v=>!fechasPl.has(v.fecha))];
            const totalMes = ventasMesActual.reduce((s,v)=>s+Number(v.monto),0);
            const diasCargados = ventasMesActual.length;
            const promDiario = diasCargados>0?totalMes/diasCargados:0;
            const diasHabilesTotal = DIAS_HABILES[String(anioActual)]?.[nombreMesCorto]||26;
            const diasHabilesRestantes = Math.max(0, diasHabilesTotal - diasCargados);
            const CV = proyMesCurva(anioActual, mesActual, ventasMesActual);
            const proyeccionSimple = totalMes + (promDiario * diasHabilesRestantes);
            const proyeccion = CV ? CV.proy : proyeccionSimple;
            const ventasMismoMesAnterior = VM.find(r=>r.mes===nombreMesCorto)?.[String(anioActual-1)];
            const diasHabilesAnterior = DIAS_HABILES[String(anioActual-1)]?.[nombreMesCorto]||26;
            const promDiarioAnterior = ventasMismoMesAnterior?ventasMismoMesAnterior/diasHabilesAnterior:null;
            const proyeccionVsAnterior = promDiarioAnterior?promDiarioAnterior*diasHabilesTotal:null;
            return <>
              <div className="grid4">
                <div className="card" style={{borderLeft:"4px solid var(--accent, #e84400)"}}>
                  <div className="ctitle">Prom. diario proyectado {nombreMes}</div>
                  <div className="cval ac">{proyeccion>0?fmtM(CV?CV.pdProy:proyeccion/diasHabilesTotal):"—"}</div>
                  <div className="csub">Proyección del mes {proyeccion>0?fmtM(proyeccion):"—"} ÷ {diasHabilesTotal} días hábiles</div>
                  {CV?.varProy!=null&&<div className={`delta ${CV.varProy>=0?"up":"dn"}`}>{CV.varProy>=0?"▲":"▼"} {fmt(Math.abs(CV.varProy),1)}% vs {fmtM(CV.pdPrevMes)}/día en {nombreMes} {anioActual-1}</div>}
                  {CV&&<div className="tsm" style={{marginTop:4}}>Ya se hizo el {fmt(CV.pctHecho,0)}% del mes · faltan {CV.diasFalta} días hábiles · con el promedio simple daría {fmtM(proyeccionSimple)}</div>}
                </div>
                <div className="card">
                  <div className="ctitle">Prom. diario hasta hoy</div>
                  <div className="cval">{promDiario>0?fmtM(promDiario):"—"}</div>
                  <div className="csub">{fmtM(totalMes)} en {diasCargados} días trabajados</div>
                  {CV?.varMismos!=null?<div className={`delta ${CV.varMismos>=0?"up":"dn"}`}>{CV.varMismos>=0?"▲":"▼"} {fmt(Math.abs(CV.varMismos),1)}% vs {fmtM(CV.pdPrevMismos)}/día mismos días {anioActual-1}</div>
                  :promDiarioAnterior&&promDiario>0&&<div className={`delta ${promDiario>=promDiarioAnterior?"up":"dn"}`}>
                    {promDiario>=promDiarioAnterior?"▲":"▼"} {fmt(Math.abs(pct(promDiario,promDiarioAnterior)),1)}% vs {anioActual-1}
                  </div>}
                  <div className="tsm" style={{marginTop:4}}>Es alto porque el inicio de mes vende más; no sirve solo para proyectar.</div>
                </div>
                <div className="card">
                  <div className="ctitle">Prom. diario {nombreMes} {anioActual-1}</div>
                  <div className="cval">{promDiarioAnterior?fmtM(promDiarioAnterior):"—"}</div>
                  <div className="csub">{ventasMismoMesAnterior?fmtM(ventasMismoMesAnterior):"—"} en {diasHabilesAnterior} días hábiles</div>
                </div>
                <div className="card">
                  <div className="ctitle">Días hábiles {nombreMes}</div>
                  <div className="cval">{diasHabilesTotal} <span style={{fontSize:".9rem",fontWeight:500}}>vs {diasHabilesAnterior} en {anioActual-1}</span></div>
                  <div className="csub">Lunes a sábado, sin feriados en que cierra el local</div>
                </div>
              </div>
              {CV&&<div className="card" style={{borderLeft:"4px solid #1D4ED8"}}>
                <div className="ctitle">Cómo se proyecta el mes</div>
                <div className="csub" style={{lineHeight:1.5}}>Las ventas arrancan fuertes los primeros 10 días (cobros) y bajan hacia fin de mes: del 16 al 28 se vende 10–14% menos que el promedio, y el sábado ~15% menos que un día normal. Por eso no se multiplica el promedio de lo que va del mes por los días que faltan: se usa la curva de los últimos 5 años.
                {CV.prevMismos!=null&&<> Hasta el {+CV.ult.slice(8,10)} de {nombreMes} {anioActual-1} se vendió {fmtM(CV.prevMismos)} en {CV.prevDiasMismos} días ({fmtM(CV.pdPrevMismos)}/día); este año {fmtM(CV.total)} en {CV.dias} días ({fmtM(CV.pd)}/día): <b style={{color:CV.varMismos>=0?"#15803D":"#B91C1C"}}>{CV.varMismos>=0?"+":""}{fmt(CV.varMismos,1)}% por día</b>.</>}
                <> Las comparaciones son siempre por día hábil, porque cada mes tiene distinta cantidad de domingos y feriados.</></div>
              </div>}
              {ventasMesActual.length>0&&<div className="card tw" style={{marginTop:4}}>
                <table className="tcomp"><thead><tr><th>Fecha</th><th>Monto</th><th>vs esperado</th><th>Obs.</th></tr></thead>
                <tbody>{[...ventasMesActual].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map((v,i)=>{
                  const esp = CV? CV.esperado(v.fecha) : promDiario; const diff = esp>0?((Number(v.monto)-esp)/esp*100):0;
                  return<tr key={i}>
                    <td style={{whiteSpace:"nowrap"}}>{fCorta(v.fecha)}</td>
                    <td className="tac">${fmt(Number(v.monto))}</td>
                    <td><span className={`tag ${diff>=0?"tg":"tr"}`}>{diff>=0?"+":""}{fmt(diff,1)}%</span></td>
                    <td className="tsm">{v.obs||""}{v.origen==="App"?<span className="tag ty" style={{marginLeft:v.obs?4:0}}>app</span>:v.origen==="Cierre"?<span className="tag tg">según cierre</span>:null}</td>
                  </tr>;
                })}</tbody></table>
              </div>}
              {ventasMesActual.length===0&&token&&<div className="banner">📅 Cargá ventas de {nombreMes} {anioActual} arriba para ver la proyección del mes.</div>}
            </>;
          })()}
            <div className="sh"><span className="st">Crecimiento real de ventas</span><span className="ss">Promedio por día hábil de cada mes contra el mismo mes del año anterior</span></div>
            <div className="grid4">
              <div className="card" style={{borderLeft:"4px solid #1D4ED8"}}><div className="ctitle">Tendencia (últimos 3 meses)</div><div className="cval" style={{color:"#1D4ED8"}}>{(CR.tend>=0?"+":"")+fmt(CR.tend,1)}%</div><div className="csub">{CR.u3.join(", ")} · es el escenario "Tendencia real"</div></div>
              <div className="card"><div className="ctitle">Acumulado {CR.anio}</div><div className="cval">{(CR.ytd>=0?"+":"")+fmt(CR.ytd,1)}%</div><div className="csub">Meses cerrados del año</div></div>
              {CR.curso&&<div className="card"><div className="ctitle">{CR.curso.mes} en curso</div><div className="cval">{(CR.curso.pct>=0?"+":"")+fmt(CR.curso.pct,1)}%</div><div className="csub">Por día, hasta el {CR.curso.hasta}: {fmtM(CR.curso.pdA)} vs {fmtM(CR.curso.pdP)} los mismos días del año pasado · proyectado {fmtM(CR.curso.pdProy)}/día ({CR.curso.varProy>=0?"+":""}{fmt(CR.curso.varProy,1)}%)</div></div>}
            </div>
            <div className="card tw"><table className="tcomp thist"><thead><tr><th>Mes</th><th>Año ant./día</th><th>Este año/día</th><th>Crec.</th></tr></thead>
              <tbody>{[...CR.meses].reverse().slice(0,12).map((x,i)=><tr key={i}><td style={{fontWeight:600}}>{x.mes}</td><td>{cM(x.pdPrev)}<div className="tsm">{x.dhP} días</div></td><td>{cM(x.pd)}<div className="tsm">{x.dh} días</div></td>
                <td><span className={`tag ${x.pct>=10?"tg":x.pct>=0?"ty":"tr"}`}>{(x.pct>=0?"+":"")+fmt(x.pct,1)}%</span><div className="tsm">total {(x.pctTot>=0?"+":"")+fmt(x.pctTot,1)}%</div></td></tr>)}</tbody></table></div>
          <div className="sh"><span className="st">Tickets</span></div>
          
          <div className="grid2">
            <div className="card"><div className="ctitle">Tickets Ene–Set 2026</div><div className="cval ac">{fmt(tk26)}</div><div className="csub">vs {fmt(tk25)} en 2025</div><div className={`delta ${cTk>=0?"up":"dn"}`}>{cTk>=0?"▲":"▼"} {fmt(Math.abs(cTk),1)}%</div></div>
            <div className="card"><div className="ctitle">Valor prom. ticket 2026</div><div className="cval">${fmt(pvTk,0)}</div><div className="csub">Prom Ene–Set 2026</div><div className="delta wr">Inflación ~7%</div></div>
          </div>
          {(()=>{const t=TK_CURSO, r=TK[t.mes]||{}, k=String(t.anio-1).slice(2), cPrev=r["c"+k], pPrev=r["p"+k], dPrev=DIAS_HABILES[String(t.anio-1)]?.[MES3[t.mes]];
            if(!cPrev||!dPrev||r["c"+String(t.anio).slice(2)]!=null) return null;
            const xd=t.cantidad/t.dias, xdPrev=cPrev/dPrev, dC=pct(xd,xdPrev), dP=pct(t.promedio,pPrev);
            return <div className="card" style={{borderLeft:"4px solid #E84400"}}><div className="ctitle">{MESES[t.mes]} {t.anio} en curso (al {t.hasta}, {t.dias} días)</div>
              <div className="grid2" style={{marginTop:8}}>
                <div><div className="cval ac">{fmt(xd,1)}</div><div className="csub">tickets por día ({fmt(t.cantidad)} en total) vs {fmt(xdPrev,1)} en {t.anio-1}</div><div className={`delta ${dC>=0?"up":"dn"}`}>{dC>=0?"▲":"▼"} {fmt(Math.abs(dC),1)}%</div></div>
                <div><div className="cval">${fmt(t.promedio,0)}</div><div className="csub">ticket promedio vs ${fmt(pPrev,0)} en {t.anio-1}</div><div className={`delta ${dP>=0?"up":"dn"}`}>{dP>=0?"▲":"▼"} {fmt(Math.abs(dP),1)}%</div></div>
              </div></div>;})()}
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
          <div><div className="sh"><span className="st">Ventas mensuales</span><span className="ss">2024 vs 2025 — en miles $</span></div>
          <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={cvM} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
              <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
              <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${v}k`}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
              <Bar dataKey="2024" fill="#7a3800" radius={[3,3,0,0]}/>
              <Bar dataKey="2025" fill="#e84400" radius={[3,3,0,0]}/>
              <Bar dataKey="2026" fill="#B91C1C" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer></div></div></div>
          <div className="grid2">
            <div><div className="sh"><span className="st">Promedio diario</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={PD}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
                <Line type="monotone" dataKey="2024" stroke="#d4956a" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2025" stroke="#e84400" dot={false} strokeWidth={2.5}/>
                <Line type="monotone" dataKey="2026" stroke="#B91C1C" dot={false} strokeWidth={2.5} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer></div></div></div>
            <div><div className="sh"><span className="st">Tickets emitidos</span></div>
            <div className="card"><div className="ch"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={cvT}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                <YAxis stroke="#7A2E0A" fontSize={12}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
                <Bar dataKey="Cant 25" fill="#d4956a" radius={[3,3,0,0]}/>
                <Bar dataKey="Cant 26" fill="#e84400" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer></div></div></div>
          </div>
        </div>}

        {tab==="control"&&<div className="gap">
          <div className="abar"/>
          {!token&&<div className="banner" style={{borderColor:"#B45309"}}>⚠️ Tocá <b>&nbsp;Conectar Sheets&nbsp;</b> arriba para poder guardar el cierre.</div>}
          {token&&!modoCaja&&(()=>{const u=[...sheetCierres2].sort((x,y)=>x.fecha<y.fecha?1:-1)[0];if(!u)return <div className="tsm" style={{padding:"0 4px"}}>Se actualiza sola cada 3 minutos{actCierres?` · última: ${actCierres}`:""}</div>;const d=difCierre(u);const c=d==null?"#8A4A2A":Math.abs(d)<=50?"#15803D":Math.abs(d)<=300?"#B45309":"#B91C1C";
            return <div className="card" style={{borderLeft:`5px solid ${c}`}}><div className="ctitle">Último cierre · {fCorta(u.fecha)}{u.cajero?` · ${u.cajero}`:""}</div>
              <div style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:6,fontSize:"1rem"}}><span>Venta POS <b>{fmtM(u.ventaPos||0)}</b></span>{u.credito?<span>Crédito <b>{fmtM(u.credito)}</b></span>:null}{u.transferencia?<span>Transf. <b>{fmtM(u.transferencia)}</b></span>:null}{u.deposito?<span>Depósito <b>{fmtM(u.deposito)}</b></span>:null}<span style={{color:c,fontWeight:700}}>Diferencia {d==null?"—":`${d>0?"+":""}${d}`}</span></div>
              <div className="tsm" style={{marginTop:6}}>Se actualiza sola cada 3 minutos{actCierres?` · última: ${actCierres}`:""}</div></div>;})()}
          {(()=>{
            const chq=chequearCierre(cjF); const malos=new Set(chq.filter(x=>!x.ok).flatMap(x=>x.campos));
            const set=k=>e=>setCjF(p=>({...p,[k]:e.target.value}));
            const campo=(k,l,extra={})=><div className="fl" key={k}><label className="flabel">{l}</label><input type="number" inputMode="decimal" className="finput" value={cjF[k]} onChange={set(k)} style={malos.has(k)?{background:"#FEF3C7",borderColor:"#B45309"}:(extra.destacar?{background:"#FFF3E6",borderColor:"#E84400",borderWidth:2}:{})}/></div>;
            const ord=[...sheetCierres2].sort((a,b)=>a.fecha<b.fecha?1:-1);
            let racha=0; for(const c of ord){const d=difCierre(c); if(d!=null&&Math.abs(d)<=50) racha++; else break;}
            const R=ultimoCierre?difCierre(ultimoCierre):null;
            const nivel=R==null?null:Math.abs(R)<=50?"ok":Math.abs(R)<=300?"rev":"mal";
            const est={ok:{bg:"#DCFCE7",bd:"#16A34A",tx:"#14532D",ic:"🎉",t:"¡Caja impecable!",m:R===0?"Cerró justo, al peso. ¡Excelente trabajo!":`Diferencia de solo $${Math.abs(R)}. ¡Muy bien!`},
                       rev:{bg:"#FEF3C7",bd:"#B45309",tx:"#92400E",ic:"🔎",t:"Casi perfecto",m:`Diferencia de $${R}. Revisá el conteo o si quedó algo sin registrar.`},
                       mal:{bg:"#FDE4E1",bd:"#B91C1C",tx:"#7F1D1D",ic:"🧐",t:"Hay una diferencia para revisar",m:`Diferencia de $${R}. Contá de nuevo y fijate si falta registrar algún gasto o venta.`}};
            const hola=(()=>{const h=new Date().getHours();return h<12?"¡Buen día":h<20?"¡Buenas tardes":"¡Buenas noches";})();
            return <>
            {modoCaja&&<div className="card" style={{background:"#E84400",color:"#fff",border:"none"}}>
              <div style={{fontSize:".9rem",opacity:.9}}>PROlimpio Durazno</div>
              <div style={{fontSize:"1.35rem",fontWeight:700}}>{hola}{cjF.cajero?`, ${cjF.cajero}`:""}! Cierre de caja</div></div>}
            {nivel&&<div className="card" style={{background:est[nivel].bg,border:`2px solid ${est[nivel].bd}`,textAlign:"center"}}>
              <div style={{fontSize:"2.4rem"}}>{est[nivel].ic}</div>
              <div style={{fontSize:"1.35rem",fontWeight:700,color:est[nivel].tx}}>{est[nivel].t}</div>
              <div style={{fontSize:"1rem",color:est[nivel].tx,marginTop:4}}>{est[nivel].m}</div>
              <div style={{fontSize:".9rem",color:est[nivel].tx,marginTop:6}}>Cierre del {ultimoCierre.fecha.split("-").reverse().join("/")} guardado ✓</div></div>}
            {racha>=2&&<div className="card" style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:"1.8rem"}}>🔥</div><div style={{fontSize:"1rem"}}><b>{racha} cierres seguidos</b> con la caja impecable. ¡Seguí así!</div></div>}

            <div className="sh"><span className="st">1 · Foto del cierre</span><span className="ss">Y de Caja, Z de Caja, desglose del ERP y boleta de depósito</span></div>
            <div className="card">
              <details style={{marginBottom:12}}><summary style={{cursor:"pointer",color:"#9A3412",fontWeight:600}}>¿Lo leyó Claude en el lector de cierres? Pegar código del lector</summary>
                <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}><textarea className="ftxt" style={{minHeight:60,flex:"1 1 220px"}} placeholder="Pegá acá el código" value={codLector} onChange={e=>setCodLector(e.target.value)}/>
                <button className="btn btn-p" onClick={()=>{if(aplicarCodigoLector(codLector))setCodLector("");}}>Cargar números</button></div></details>
              {(()=>{const alElegir=async e=>{const fs=[...e.target.files];e.target.value="";try{const urls=await Promise.all(fs.map(reducirFoto));setFotos(p=>[...p,...urls].slice(0,4));}catch(x){showToast("No se pudo abrir la foto","er");}};
                const est={flex:"1 1 150px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"16px 10px",border:"2px dashed #E84400",borderRadius:12,cursor:"pointer",color:"#9A3412",fontWeight:700,fontSize:"1.02rem",textAlign:"center"};
                return <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <label style={est}>📷 {fotos.length?"Sacar otra foto":"Sacar foto"}<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={alElegir}/></label>
                  <label style={est}>🖼️ Elegir de la galería<input type="file" accept="image/*" multiple style={{display:"none"}} onChange={alElegir}/></label>
                </div>;})()}
              {fotos.length>0&&<div className="tsm" style={{marginTop:6}}>{fotos.length} foto(s) cargada(s). Podés sacar una por papel (hasta 4).</div>}
              {fotos.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{fotos.map((u,i)=><div key={i} style={{position:"relative"}}><img src={u} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:"1px solid #F2C9A0"}}/><button onClick={()=>setFotos(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,background:"#B91C1C",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer"}}>×</button></div>)}</div>}
              <button className="btn btn-p" style={{marginTop:12,width:"100%",fontSize:"1.05rem"}} disabled={!!leyendo} onClick={analizarFotos}>{leyendo?`⏳ ${leyendo}`:"✨ Leer la foto y completar"}</button>
              {leyendo&&<button className="btn btn-s" style={{marginTop:8,width:"100%"}} onClick={()=>{CANCELAR_LECTURA&&CANCELAR_LECTURA();}}>✋ Cancelar lectura</button>}
              {leido&&leido.modelo&&<div className="tsm" style={{marginTop:8}}>Leído con {leido.modelo.replace(":free","")}. Revisá que los números coincidan con el papel.</div>}
              {leido&&leido.error&&<div className="tsm" style={{marginTop:8,color:"#B91C1C"}}>No se pudo leer automáticamente. Completá los números a mano.
                <details style={{marginTop:6}}><summary style={{cursor:"pointer"}}>Ver detalle ({(leido.errores||[]).length} modelos probados)</summary>
                  <div style={{marginTop:6,fontSize:".82rem",color:"#7A2E0A",wordBreak:"break-word"}}>{(leido.errores||[leido.error]).map((x,i)=><div key={i} style={{marginBottom:4}}>• {x}</div>)}{leido.fuente?<div>Lista de modelos: {leido.fuente}</div>:null}</div></details>
                {leido.sinSaldo&&<div style={{marginTop:8,color:"#92400E"}}>💡 Los modelos gratuitos fallan seguido (saturados). Para que lea siempre: entrá a openrouter.ai → Credits con la cuenta de esta clave y cargá USD 5. La app usa primero Gemini Flash, que cuesta menos de 1 centavo de dólar por cierre.</div>}</div>}
            </div>

            <div className="sh"><span className="st">2 · Ventas que no están en la caja</span><span className="ss">Esto lo completás vos</span></div>
            <div className="card"><div className="fg">
              {campo("credito","💳 Ventas a crédito del día",{destacar:true})}
              {campo("transferencia","📲 Ventas por transferencia del día",{destacar:true})}
            </div></div>

            <div className="sh"><span className="st">3 · Revisá los números</span><span className="ss">Si algo no cierra, se marca en amarillo</span></div>
            <div className="card">
              <div className="fg">
                <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={cjF.fecha} onChange={set("fecha")}/></div>
                <div className="fl"><label className="flabel">Cajera</label><input list="cajeras" className="finput" value={cjF.cajero} onChange={set("cajero")}/><datalist id="cajeras"><option>Karen</option><option>Valentina Preza</option><option>Natalia Pereira</option></datalist></div>
                {campo("ventaPos","Venta total POS")}{campo("efectivoPos","Efectivo POS")}{campo("tarjetasPos","Tarjetas POS")}
                {campo("saldoSistema","Saldo efectivo según sistema")}{campo("efectivoContado","Efectivo contado")}{campo("diferencia","Diferencia de caja")}
                {campo("deposito","Depósito al banco")}{campo("gastosEf","Gastos pagados en efectivo")}
              </div>
              <details style={{marginTop:12}}><summary style={{cursor:"pointer",color:"var(--text2)",fontWeight:600}}>Más datos (tarjetas por marca, caja ERP)</summary>
                <div className="fg" style={{marginTop:10}}>
                  {campo("visa","Visa")}{campo("mastercard","Mastercard")}{campo("oca","OCA")}{campo("maestro","Maestro")}{campo("otrasTj","Otras tarjetas")}
                  {campo("aperturaPos","Apertura caja POS")}{campo("salidaPos","Salida de caja POS")}
                  {campo("aperturaErp","Apertura caja ERP")}{campo("ventasErp","Ventas contado ERP")}{campo("tarjetaErp","Tarjeta en ERP (POS manual)")}{campo("saldoErp","Saldo final caja ERP")}
                  <div className="fl"><label className="flabel">Detalle de gastos</label><input type="text" className="finput" value={cjF.gastosDetalle} onChange={set("gastosDetalle")} placeholder="ej: techo 12000, adelanto 1000"/></div>
                  <div className="fl"><label className="flabel">Observación</label><input type="text" className="finput" value={cjF.obs} onChange={set("obs")}/></div>
                </div></details>
              {chq.length>0&&<div style={{marginTop:12}}>{chq.map((x,i)=><div key={i} style={{fontSize:".95rem",padding:"4px 0",color:x.ok?"#14532D":"#92400E"}}>{x.ok?"✅":"⚠️"} {x.txt}</div>)}</div>}
              <button className="btn btn-p" style={{marginTop:14,width:"100%",fontSize:"1.1rem",padding:"14px"}} onClick={guardarCierre2}>💾 Guardar cierre</button>
            </div>

            {!modoCaja&&ord.length>0&&<div className="card tw"><table><thead><tr><th>Día</th><th>Cajera</th><th>Venta POS</th><th>Crédito</th><th>Transf.</th><th>Depósito</th><th>Dif.</th><th></th></tr></thead>
              <tbody>{ord.slice(0,15).map(c=>{const d=difCierre(c);return <tr key={c._i}><td style={{fontWeight:600}}>{fCorta(c.fecha)}</td><td>{c.cajero||"—"}</td><td>{fmtM(c.ventaPos||0)}</td><td>{c.credito?fmtM(c.credito):"—"}</td><td>{c.transferencia?fmtM(c.transferencia):"—"}</td><td>{c.deposito?fmtM(c.deposito):"—"}</td>
                <td>{d!=null?<span className={`tag ${Math.abs(d)<=50?"tg":Math.abs(d)<=300?"ty":"tr"}`}>{d>0?"+":""}{d}</span>:"—"}</td>
                <td><button onClick={()=>borrarCierre2(c._i)} style={{background:"rgba(232,68,0,0.12)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.85rem"}}>✕</button></td></tr>;})}</tbody></table></div>}

            {modoCaja&&<button className="btn btn-s" style={{marginTop:20}} onClick={salirModoCaja}>🔒 Salir del modo caja</button>}
            </>;
          })()}

          {!modoCaja&&(()=>{
            const K=ctlK;
            const ultimos=[...K.filas].reverse().slice(0,21);
            return <>
            <div className="sh"><span className="st">Depósitos</span><span className="ss">Tarjetas que acredita el banco y efectivo que deposita la encargada</span></div>
            <div className="card">
              <div className="fg">
                <div className="fl"><label className="flabel">Fecha del depósito</label><input type="date" className="finput" value={deF.fecha} onChange={e=>setDeF(p=>({...p,fecha:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Tipo</label><select className="finput" value={deF.tipo} onChange={e=>setDeF(p=>({...p,tipo:e.target.value}))}><option value="Tarjetas">Tarjetas (acreditación del banco)</option><option value="Efectivo">Efectivo (depósito de la encargada)</option></select></div>
                <div className="fl"><label className="flabel">Cuenta</label><select className="finput" value={deF.cuenta} onChange={e=>setDeF(p=>({...p,cuenta:e.target.value}))}><option>Santander</option><option>BROU</option></select></div>
                <div className="fl"><label className="flabel">Monto</label><input type="number" className="finput" value={deF.monto} onChange={e=>setDeF(p=>({...p,monto:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Observación</label><input type="text" className="finput" placeholder="opcional" value={deF.obs} onChange={e=>setDeF(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <button className="btn btn-p" style={{marginTop:12}} onClick={saveDeposito}>💾 Guardar depósito</button>
              <div className="tsm" style={{marginTop:8}}>Los depósitos de efectivo que vienen en el cierre se cuentan solos: acá registrá las acreditaciones de tarjetas. Las tarjetas de lunes a jueves se acreditan al día hábil siguiente; las de viernes y sábado, el lunes (o el siguiente día bancario si hay feriado).</div>
            </div>

            {K.filas.length>0&&<>
            <div className="sh"><span className="st">Control</span><span className="ss">Ventas contra depósitos</span></div>
            <div className="grid4">
              <div className="card"><div className="ctitle">Comisión de tarjetas</div><div className="cval">{K.comision!=null?fmt(K.comision,1)+"%":"—"}</div><div className="csub">{K.comision==null?`Faltan días: hay ${K.diasAcred} con acreditación (se calcula desde 5, porque Visa y Master no acreditan siempre el mismo día)`:`Vendido ${fmtM(K.tjVend)} · acreditado ${fmtM(K.tjCob)}`}</div>
                {(()=>{const k=hoyISO().slice(0,7);const r=COM.real[k];return <div className="tsm" style={{marginTop:4}}>{r?`Este mes: ${fmt(r.tasa,1)}% sobre tarjetas ≈ ${fmtM(r.monto)} (se usa como gasto)`:`Se usa ${fmt(COM.pct,1)}% de las ventas como gasto hasta tener 8 días acreditados en el mes`}</div>;})()}</div>
              <div className="card"><div className="ctitle">Efectivo a depositar</div><div className="cval">{fmtM(K.efVendNeto)}</div><div className="csub">Efectivo POS + ventas ERP − gastos en efectivo{K.desde?` · cierres del ${fCorta(K.desde)} al ${fCorta(K.hasta)}`:""}</div></div>
              <div className="card"><div className="ctitle">Efectivo depositado</div><div className="cval">{fmtM(K.efDepTot)}</div><div className="csub">Depósitos de efectivo de esos mismos días (sin repetir los que vienen en el cierre)</div></div>
              <div className="card"><div className="ctitle">Efectivo pendiente</div><div className="cval" style={{color:K.efPendiente>50000?"#B45309":"#1F0D05"}}>{fmtM(K.efPendiente)}</div><div className="csub">Debería estar en la caja ERP{(()=>{const u=[...sheetCierres].filter(c=>c.saldoErp!=null).sort((a,b)=>a.fecha<b.fecha?1:-1)[0];return u?` · último saldo ERP informado ${fmtM(u.saldoErp)} (${fCorta(u.fecha)})`:"";})()}</div></div>
            </div>
            <div className="card tw"><table><thead><tr><th>Día</th><th>Venta</th><th>Tarjetas</th><th>Acreditado</th><th>Efectivo neto</th><th>Depositado</th><th>%</th><th></th></tr></thead>
              <tbody>{ultimos.map(f=><tr key={f._i}>
                <td style={{fontWeight:600}}>{fCorta(f.fecha)}</td>
                <td>{fmtM(f.ventaTot)}</td>
                <td>{fmtM(f.tarjetas)}</td>
                <td>{f.tjAcred!=null?fmtM(f.tjAcred):<span className="tsm">{f.pendiente?`espera ${fCorta(f.fechaAcred)}`:`falta ${fCorta(f.fechaAcred)}`}</span>}</td>
                <td>{fmtM(f.efNeto)}{f.gastosEf?<div className="tsm">gastos {fmtM(f.gastosEf)}</div>:null}</td>
                <td>{f.efDep?fmtM(f.efDep):<span className="tsm">—</span>}</td>
                <td>{f.pct!=null&&f.tjAcred!=null?<span className={`tag ${f.pct>=97?"tg":f.pct>=90?"ty":"tr"}`}>{fmt(f.pct,1)}%</span>:<span className="tsm">—</span>}</td>
                <td><button onClick={()=>{if(String(f._i).startsWith("n"))borrarCierre2(Number(String(f._i).slice(1)));else deleteRow("Cierres",f._i);}} style={{background:"rgba(232,68,0,0.12)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.85rem"}}>✕</button></td>
              </tr>)}</tbody></table></div>
            <div className="tsm" style={{padding:"0 4px"}}>% = (tarjetas acreditadas + efectivo depositado ese día + gastos pagados en efectivo) / venta del día. Si viernes y sábado se acreditan juntos el lunes, el depósito se reparte entre los dos días según lo vendido con tarjeta. Si el efectivo se deposita cada dos o tres días, mirá el "efectivo pendiente".</div>
            </>}

            {sheetDepositos.length>0&&<div className="card tw"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Cuenta</th><th>Monto</th><th></th></tr></thead>
              <tbody>{[...sheetDepositos].sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,20).map(d=><tr key={d._i}><td>{fCorta(d.fecha)}</td><td><span className={`tag ${d.tipo==="Efectivo"?"ty":"tg"}`}>{d.tipo}</span></td><td>{d.cuenta}</td><td className="tac">{fmtM(d.monto)}</td>
                <td><button onClick={()=>deleteRow("Depositos",d._i)} style={{background:"rgba(232,68,0,0.12)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.85rem"}}>✕</button></td></tr>)}</tbody></table></div>}

            <div className="sh"><span className="st">⚙️ Configuración de este equipo</span><span className="ss">Planilla de cierres y modo caja</span></div>
            <div className="card">
              <label style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,fontSize:".95rem"}}><input type="checkbox" checked={visionPago} onChange={e=>{const v=e.target.checked;setVisionPago(v);try{localStorage.setItem("prolimpio_vision_pago",v?"si":"no");}catch(x){}}}/> Leer fotos primero con modelo pago (Gemini Flash, menos de 1 centavo por cierre; solo cobra si cargaste saldo en OpenRouter)</label>
              <div className="fg">
                <div className="fl"><label className="flabel">ID de la planilla de cierres (ya viene cargado)</label><input type="text" className="finput" value={sidCierres} onChange={e=>setSidCierres(e.target.value.trim())} placeholder={SHEET_CIERRES}/></div>
              </div>
              <button className="btn btn-s" style={{marginTop:10}} onClick={()=>{try{localStorage.setItem("prolimpio_sheet_cierres",sidCierres);}catch(e){} showToast("✓ Guardado en este equipo"); if(token) loadCierres2(token);}}>Guardar ID</button>
              <div className="tsm" style={{marginTop:8}}>Los cierres se guardan en la planilla "PROlimpio Durazno – Cierres" (compartida con durazno@prolimpio.com.uy); tu planilla principal queda privada. No hace falta tocar este campo.</div>
              <div className="fg" style={{marginTop:14}}>
                <div className="fl"><label className="flabel">PIN para el modo caja (4 números)</label><input type="password" inputMode="numeric" maxLength={4} className="finput" value={pinIn} onChange={e=>setPinIn(e.target.value.replace(/\D/g,""))}/></div>
              </div>
              <button className="btn btn-p" style={{marginTop:10}} onClick={activarModoCaja}>🔒 Activar modo caja en este equipo</button>
              <div className="tsm" style={{marginTop:8}}>En modo caja la app muestra solo el cierre: sin pestañas, sin ventas del mes ni saldos. Para salir hace falta el PIN.</div>
            </div>
            </>;
          })()}
        </div>}

        {tab==="pagos"&&<div className="gap">
          <div className="abar"/>
            <div className="card" style={{borderLeft:"4px solid #E84400"}}>
                <div className="ctitle">Saldo estimado de hoy</div>
                <div className="cval" style={{color:saldoHoy.est<0?"#B91C1C":"#14532D"}}>{fmtM(saldoHoy.est)}</div>
                <div className="grid2" style={{marginTop:6}}><div><div className="ctitle">BROU</div><div style={{fontWeight:700}}>{fmtM(saldoHoy.brou)}</div></div><div><div className="ctitle">Santander</div><div style={{fontWeight:700}}>{fmtM(saldoHoy.sant)}</div></div></div>
                <div className="csub" style={{marginTop:6}}>Parte del último saldo guardado ({caja.saldoFecha?caja.saldoFecha.split("-").reverse().join("/"):"—"}) y le suma o resta en su cuenta lo que cargues después: depósitos {fmtM(saldoHoy.dep)}, pagos {fmtM(saldoHoy.pag)} y retiros {fmtM(saldoHoy.ret)}. Lo pagado o retirado desde el efectivo de la caja no cambia los bancos. Al guardar un saldo real nuevo, vuelve a empezar desde ahí.</div>
              </div>
            <div className="sh"><span className="st">Costos fijos del mes</span><span className="ss">Tocá uno para marcarlo pagado</span></div>
            {(()=>{const d=new Date();const mes=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
              const lista=(COSTOS_FIJOS_MES[mes]||COSTOS_FIJOS).map(c=>{const K=claveFijo(mes,c.nombre);const pg=sheetPagos.find(p=>p.clave===K)||(c.planilla?{monto:c.monto,fecha:"",planilla:true}:null);return {...c,K,pg};});
              const pagado=lista.filter(x=>x.pg).reduce((s,x)=>s+x.pg.monto,0), falta=lista.filter(x=>!x.pg).reduce((s,x)=>s+x.monto,0);
              return <div className="card">
                <div className="csub" style={{marginBottom:8}}>{MESES[d.getMonth()]}: pagado {fmtM(pagado)} · falta pagar ~{fmtM(falta)}</div>
                {lista.map(x=>{const K=x.K;return <div key={K} style={{padding:"10px 0",borderBottom:"1px solid #F6DCC2"}}>
                  <div onClick={()=>{if(x.pg){if(x.pg.planilla){showToast("Figura pagado en la planilla");return;}if(window.confirm("¿Desmarcar este pago?"))deleteRow("Pagos",x.pg._i);}else setPagoEdit({clave:K,concepto:x.nombre,monto:x.monto,mes,fecha:hoyISO()});}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",gap:10}}>
                    <span style={{fontWeight:600,textDecoration:x.pg?"line-through":"none",color:x.pg?"#8A4A2A":"#1F0D05"}}>{x.pg?"✅":"⬜"} {x.nombre}</span>
                    <span>{x.pg?<span className="tag tg">Pagado {fmtM(x.pg.monto)}{x.pg.planilla?" · según planilla":" · "+x.pg.fecha.split("-").reverse().slice(0,2).join("/")}</span>:<span className="tsm">~{fmtM(x.monto)}</span>}</span>
                  </div>
                  {pagoEdit&&pagoEdit.clave===K&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
                    <input type="date" className="finput" style={{maxWidth:160}} value={pagoEdit.fecha} onChange={e=>setPagoEdit(p=>({...p,fecha:e.target.value}))}/>
                    <input type="number" className="finput" style={{maxWidth:140}} value={pagoEdit.monto} onChange={e=>setPagoEdit(p=>({...p,monto:e.target.value}))}/>
                    <select className="finput" style={{maxWidth:170}} value={pagoEdit.cuenta||"Santander"} onChange={e=>setPagoEdit(p=>({...p,cuenta:e.target.value}))}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select>
                    <button className="btn btn-p" onClick={marcarPago}>✓ Confirmar pago</button><button className="btn btn-s" onClick={()=>setPagoEdit(null)}>Cancelar</button></div>}
                </div>;})}
                <div className="tsm" style={{marginTop:8}}>Montos y pagos según tu planilla de deudas al {PENDIENTES_FECHA}; al marcar un pago podés poner el monto real.</div>
              </div>;})()}
            <div className="sh"><span className="st">Deudas pendientes</span><span className="ss">Según la planilla al {PENDIENTES_FECHA}</span></div>
            {(()=>{
              const meses=[...new Set(PENDIENTES.map(p=>p.mes))];
              const nom=k=>{const [y,m]=k.split("-");return `${MESES[Number(m)-1]} ${y}`;};
              const pagadas=new Set(sheetPagos.map(x=>x.clave));const sum=(f)=>PENDIENTES.filter(p=>!pagadas.has(clavePend(p))).filter(f).reduce((s,p)=>s+p.monto,0);
              const tipos=[["prov","🟡 Proveedores sin pagar"],["cheque","🟣 Cheques SUBATIR"],["credito","Cuotas de créditos"],["plazo","Plazo fijo"]];
              return <>
              <div className="grid4">
                {tipos.map(([t,l])=>{const v=sum(p=>p.tipo===t);return v?<div key={t} className="card"><div className="ctitle">{l}</div><div className="cval">{fmtM(v)}</div><div className="csub">{PENDIENTES.filter(p=>p.tipo===t).length} pagos</div></div>:null;})}
              </div>
              <div className="card tw"><table><thead><tr><th>Mes</th><th>Proveedores</th><th>Cheques SUBATIR</th><th>Créditos / plazo fijo</th><th>Total</th></tr></thead>
                <tbody>{meses.map(k=><tr key={k}>
                  <td style={{fontWeight:600}}>{nom(k)}</td>
                  <td>{fmtM(sum(p=>p.mes===k&&p.tipo==="prov"))}</td>
                  <td>{fmtM(sum(p=>p.mes===k&&p.tipo==="cheque"))}</td>
                  <td>{fmtM(sum(p=>p.mes===k&&(p.tipo==="credito"||p.tipo==="plazo")))}</td>
                  <td><span className="tag tr">{fmtM(sum(p=>p.mes===k))}</span></td>
                </tr>)}
                <tr><td style={{fontWeight:700}}>Total</td><td>{fmtM(sum(p=>p.tipo==="prov"))}</td><td>{fmtM(sum(p=>p.tipo==="cheque"))}</td><td>{fmtM(sum(p=>p.tipo==="credito"||p.tipo==="plazo"))}</td><td><span className="tag tr">{fmtM(sum(()=>true))}</span></td></tr>
                </tbody></table></div>
              <details className="card" open><summary style={{cursor:"pointer",color:"var(--text2)",fontSize:".95rem",fontWeight:600}}>Detalle — tocá un pago para marcarlo pagado</summary>
                <div className="tw" style={{marginTop:10}}><table><thead><tr><th>Mes</th><th>Concepto</th><th>Tipo</th><th>Monto</th></tr></thead>
                <tbody>{PENDIENTES.map((p,i)=>{const K=clavePend(p);const pg=sheetPagos.find(x=>x.clave===K);return <React.Fragment key={i}><tr onClick={()=>{if(pg){if(window.confirm("¿Desmarcar este pago?"))deleteRow("Pagos",pg._i);}else setPagoEdit({clave:K,concepto:p.prov,monto:p.monto,mes:p.mes,fecha:hoyISO()});}} style={{cursor:"pointer",opacity:pg?0.6:1}}><td>{nom(p.mes)}</td><td style={{textDecoration:pg?"line-through":"none"}}>{pg?"✅ ":"⬜ "}{p.prov}</td>
                  <td>{pg?<span className="tag tg">Pagado {pg.fecha.split("-").reverse().slice(0,2).join("/")}</span>:<span className={`tag ${p.tipo==="cheque"?"tr":p.tipo==="prov"?"ty":"tg"}`}>{p.tipo==="prov"?"Proveedor":p.tipo==="cheque"?"Cheque":p.tipo==="plazo"?"Plazo fijo":"Crédito"}</span>}</td>
                  <td className="tac">{fmtM(p.monto)}</td></tr>
                  {pagoEdit&&pagoEdit.clave===K&&<tr><td colSpan={4}>{<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
                    <input type="date" className="finput" style={{maxWidth:160}} value={pagoEdit.fecha} onChange={e=>setPagoEdit(p=>({...p,fecha:e.target.value}))}/>
                    <input type="number" className="finput" style={{maxWidth:140}} value={pagoEdit.monto} onChange={e=>setPagoEdit(p=>({...p,monto:e.target.value}))}/>
                    <select className="finput" style={{maxWidth:170}} value={pagoEdit.cuenta||"Santander"} onChange={e=>setPagoEdit(p=>({...p,cuenta:e.target.value}))}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select>
                    <button className="btn btn-p" onClick={marcarPago}>✓ Confirmar pago</button><button className="btn btn-s" onClick={()=>setPagoEdit(null)}>Cancelar</button></div>}</td></tr>}</React.Fragment>;})}</tbody></table></div>
              </details>
              <div className="tsm" style={{padding:"0 4px"}}>Noviembre todavía tiene un SUBATIR sin cargar y diciembre no tiene pedidos SUBATIR. Estos montos no incluyen los fijos del mes (alquiler, sueldos, IVA, etc.); la Proyección sí los incluye.</div>
              </>;
            })()}
            <div className="sh"><span className="st">Saldos bancarios</span><span className="ss">Guardalos con fecha para llevar el registro</span></div>
            {(()=>{const neto=Math.round((Number(caja.brou)||0)+(Number(caja.santUyu)||0)+(Number(caja.santUsd)||0)*(Number(caja.tc)||0));
            const setAcc=(k)=>e=>{const v={[k]:Number(e.target.value)};const n={...caja,...v};setCaja({...v,saldo:Math.round((Number(n.brou)||0)+(Number(n.santUyu)||0)+(Number(n.santUsd)||0)*(Number(n.tc)||0))});};
            return <div className="card">
              <div className="fg">
                <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={caja.saldoFecha} onChange={e=>setCaja({saldoFecha:e.target.value})}/></div>
                <div className="fl"><label className="flabel">BROU ($)</label><input type="number" className="finput" value={caja.brou} onChange={setAcc("brou")}/></div>
                <div className="fl"><label className="flabel">Santander ($) — negativo si es sobregiro</label><input type="number" className="finput" value={caja.santUyu} onChange={setAcc("santUyu")}/></div>
                <div className="fl"><label className="flabel">Santander (USD)</label><input type="number" className="finput" value={caja.santUsd} onChange={setAcc("santUsd")}/></div>
                <div className="fl"><label className="flabel">Tipo de cambio ($/USD)</label><input type="number" className="finput" value={caja.tc} onChange={setAcc("tc")}/></div>
              </div>
              <div style={{marginTop:12,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div><div className="ctitle">Neto en pesos</div><div className="cval" style={{color:neto<0?"#B91C1C":""}}>{fmtM(neto)}</div></div>
                <button className="btn btn-p" onClick={saveSaldo}>💾 Guardar saldo</button>
              </div>
              {sheetSaldos.length>0&&<div className="tw" style={{marginTop:12}}><table><thead><tr><th>Fecha</th><th>BROU</th><th>Sant. $</th><th>Sant. USD</th><th>TC</th><th>Neto</th><th></th></tr></thead>
                <tbody>{sheetSaldos.map((s,i)=>({...s,_i:i})).sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,12).map(s=><tr key={s._i}>
                  <td>{s.fecha}</td><td>{fmtM(s.brou)}</td><td>{fmtM(s.santUyu)}</td><td>USD {fmt(s.santUsd)}</td><td>{s.tc}</td>
                  <td><span className={`tag ${s.neto>=0?"tg":"tr"}`}>{fmtM(s.neto)}</span></td>
                  <td><button onClick={()=>deleteRow("Saldos",s._i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td>
                </tr>)}</tbody></table></div>}
            </div>;})()}
        </div>}

        {tab==="compras"&&<div className="gap">
          <div className="abar"/>
            <div className="sh"><span className="st">Pedido semanal SUBATIR</span><span className="ss">Se pide el lunes, llega el miércoles · escenario {(ESCENARIOS.find(e=>e.k===escSel)||{}).n} ({(PS.crec>=0?"+":"")+fmt(PS.crec,1)}%)</span></div>
            {(()=>{const f0=PS.filas[0]; const E=PS.extra; return <>
            <div className="grid4">
              <div className="card" style={{borderLeft:"4px solid #E84400"}}><div className="ctitle">Pedido del lunes {fD(f0.lunes)}</div><div className="cval ac">{fmt(f0.kgPed)} kg</div><div className="csub">≈ {fmtM(f0.montoPed)} · cubre ventas del {fD(f0.llega)} al martes (est. {fmtM(f0.ventas)}) · se paga ~{fD(f0.paga)}</div>
                {f0.faltaKg>0&&<div className={`delta ${f0.faltaKg<=PS.tope*0.2?"wr":"dn"}`}>Necesitaría {fmt(f0.kgNec)} kg: {f0.faltaKg<=PS.tope*0.2?`pedí unos ${fmt(f0.kgNec)} kg si te lo aceptan`:`faltan ${fmt(f0.faltaKg)} kg`}</div>}</div>
              {E?<div className="card" style={{borderLeft:"4px solid #15803D"}}><div className="ctitle">Pedido extra de inicio de temporada</div><div className="cval" style={{color:"#15803D"}}>{fmt(E.kg)} kg</div>
                <div className="csub">≈ {fmtM(E.monto)} · pedir el lunes {fD(E.fecha)}{E.fecha!==E.sugerida?` (sugerido ${fD(E.sugerida)})`:""}, llega {fD(E.llega)}, se paga ~{fD(E.paga)}. Cubre los {fmt(E.faltaTot)} kg que no entran en el tope en las {E.semanas} semanas fuertes desde el {fD(E.primera)}.</div></div>
               :<div className="card"><div className="ctitle">Pedido extra de temporada</div><div className="cval">No hace falta</div><div className="csub">En las próximas {PS.filas.length} semanas todo entra en el tope de {fmt(PS.tope)} kg.</div></div>}
            </div>
            <div className="card tw"><table className="tcomp"><thead><tr><th>Lunes</th><th>Necesario</th><th>Pedir</th><th>Falta</th></tr></thead>
              <tbody>{PS.filas.map((f,i)=><tr key={i}>
                <td style={{fontWeight:600,whiteSpace:"nowrap"}}>{fD(f.lunes)}<div className="tsm" style={{fontWeight:400}}>vende ${fmt(f.ventas/1000)}k</div></td>
                <td style={{whiteSpace:"nowrap"}}>{fmt(f.kgNec)} kg<div className="tsm">${fmt(f.necesario/1000)}k</div></td>
                <td style={{whiteSpace:"nowrap"}}><span className={`tag ${f.kgPed>=PS.tope?"ty":"tg"}`}>{fmt(f.kgPed)} kg</span><div className="tsm">paga ~{fD(f.paga)}</div></td>
                <td>{f.faltaKg>0?<span className={`tag ${f.cubreExtra>0&&f.faltaFinal===0?"tg":f.faltaKg<=PS.tope*0.2?"ty":"tr"}`}>{fmt(f.faltaKg)} kg</span>:"—"}
                  <div className="tsm">{f.cubreExtra>0?(f.faltaFinal>0?`extra cubre ${fmt(f.cubreExtra)}; faltan ${fmt(f.faltaFinal)}`:"lo cubre el extra"):f.faltaKg>0&&f.faltaKg<=PS.tope*0.2?"pedir +":f.faltaKg>0?"2º pedido":""}</div></td></tr>)}</tbody></table></div>
            <div className="card"><div className="fg">
              <div className="fl"><label className="flabel">Precio promedio SUBATIR ($/kg)</label><input type="number" step="0.5" className="finput" value={caja.precioKg} onChange={num("precioKg")}/></div>
              <div className="fl"><label className="flabel">Tope por pedido (kg)</label><input type="number" className="finput" value={caja.topeKg} onChange={num("topeKg")}/></div>
              <div className="fl"><label className="flabel">SUBATIR como % de las ventas</label><input type="number" step="0.1" className="finput" value={caja.pctSub} onChange={num("pctSub")}/></div>
              <div className="fl"><label className="flabel">Pedido extra: kg (0 = sugerido)</label><input type="number" className="finput" value={caja.extraKg} onChange={num("extraKg")}/></div>
              <div className="fl"><label className="flabel">Pedido extra: lunes (vacío = sugerido)</label><input type="date" className="finput" value={caja.extraFecha||""} onChange={e=>setCaja({extraFecha:e.target.value})}/></div>
            </div>
            <div className="tsm" style={{marginTop:8}}>Ventas de cada día = venta proyectada del mes (escenario elegido en Proyección) ÷ días hábiles. Lo necesario es el % de SUBATIR sobre esas ventas, a costo. Si una semana necesita menos que el tope, pedí solo lo necesario para no subir el stock. El precio por kg sale del pedido del 12/10 (2.650 kg ≈ $157.000); actualizalo cuando cambie. Diciembre se reparte parejo en el mes; en la práctica las últimas dos semanas venden más. Faltante en amarillo: es poco, alcanza con pedir un poco más del tope (como los 2.650 kg del 12/10). En rojo: hace falta un segundo pedido esa semana o ampliar el tope.</div></div>
            </>;})()}
            <div className="sh"><span className="st">Stock valorizado</span><span className="ss">A costo · cobertura y crecimiento</span></div>
            {(()=>{
              const fechas=new Set(sheetStock.map(s=>s.fecha));
              const lista=[...STOCK_HIST.filter(s=>!fechas.has(s.fecha)).map(s=>({...s,_base:true})),...sheetStock.map((s,i)=>({...s,_i:i}))];
              const A=analizarStock(lista);
              const objetivo=metaCob*COMPRAS_PROM_MES; const exced=A?A.ult.valor-objetivo:0;
              const fF=s=>{const p=s.split("-");return `${p[2]}/${p[1]}/${p[0]}`;};
              return <>
              <div className="grid4">
                <div className="card"><div className="ctitle">Stock al {A?fF(A.ult.fecha):"—"}</div><div className="cval ac">{A?fmtM(A.ult.valor):"—"}</div><div className="csub">Valorizado a costo</div></div>
                <div className="card"><div className="ctitle">Cobertura</div><div className="cval">{A?fmt(A.cobertura,1):"—"} meses</div><div className="csub">Sobre compras promedio de {fmtM(COMPRAS_PROM_MES)}/mes</div>
                  {A&&<div className={`delta ${A.cobertura<=metaCob+0.2?"up":"wr"}`}>{A.cobertura<=metaCob+0.2?"Dentro de la meta":`Meta: ${fmt(metaCob,1)} meses`}</div>}</div>
                <div className="card"><div className="ctitle">Stock vs ventas (12 meses)</div><div className="cval">{A&&A.stockVar!=null?`${A.stockVar>=0?"+":""}${fmt(A.stockVar,1)}%`:"—"}</div><div className="csub">Ventas: {A&&A.ventasVar!=null?`${A.ventasVar>=0?"+":""}${fmt(A.ventasVar,1)}%`:"—"}</div>
                  {A&&A.stockVar!=null&&A.ventasVar!=null&&<div className={`delta ${A.stockVar>A.ventasVar+5?"dn":"up"}`}>{A.stockVar>A.ventasVar+5?"El stock crece más rápido que las ventas":"Crece en línea con las ventas"}</div>}</div>
                <div className="card"><div className="ctitle">{exced>0?"Excedente sobre la meta":"Margen hasta la meta"}</div><div className="cval" style={{color:exced>0?"#B45309":"#14532D"}}>{fmtM(Math.abs(exced))}</div><div className="csub">Meta: {fmt(metaCob,1)} meses = {fmtM(objetivo)}</div></div>
              </div>
              {A&&A.stockVar!=null&&A.ventasVar!=null&&A.stockVar>A.ventasVar+5&&<div className="banner" style={{borderColor:"#B45309"}}>⚠️ En el último año el stock creció {fmt(A.stockVar,1)}% y las ventas {fmt(A.ventasVar,1)}%. Esa diferencia es plata inmovilizada que hoy financia el sobregiro: conviene reponer menos de lo que rota lento.</div>}
              <div className="card">
                <div className="fg">
                  <div className="fl"><label className="flabel">Fecha de la valuación</label><input type="date" className="finput" value={stF.fecha} onChange={e=>setStF(p=>({...p,fecha:e.target.value}))}/></div>
                  <div className="fl"><label className="flabel">Valor del stock a costo ($)</label><input type="number" className="finput" placeholder="ej: 3890000" value={stF.valor} onChange={e=>setStF(p=>({...p,valor:e.target.value}))}/></div>
                  <div className="fl"><label className="flabel">Observación</label><input type="text" className="finput" placeholder="opcional" value={stF.obs} onChange={e=>setStF(p=>({...p,obs:e.target.value}))}/></div>
                  <div className="fl"><label className="flabel">Meta de cobertura (meses)</label><input type="number" step="0.1" className="finput" value={metaCob} onChange={e=>{const v=Number(e.target.value);setMetaCob(v);try{localStorage.setItem("prolimpio_meta_cob",String(v));}catch(x){}}}/></div>
                </div>
                <button className="btn btn-p" style={{marginTop:12}} onClick={saveStock}>💾 Guardar valuación</button>
                <div className="tw" style={{marginTop:12}}><table><thead><tr><th>Fecha</th><th>Valor</th><th>Cobertura</th><th>Obs.</th><th></th></tr></thead>
                  <tbody>{A?[...A.lista].reverse().map((s,k)=><tr key={k}><td>{fF(s.fecha)}</td><td className="tac">{fmtM(s.valor)}</td><td>{fmt(s.valor/COMPRAS_PROM_MES,1)} meses</td><td className="tsm">{s.obs||"—"}</td>
                    <td>{s._base?<span className="tsm">base</span>:<button onClick={()=>deleteRow("Stock",s._i)} style={{background:"rgba(232,68,0,0.12)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.85rem"}}>✕</button>}</td></tr>):null}</tbody></table></div>
                <div className="tsm" style={{marginTop:8}}>Ideal: cargar una valuación por mes, a fin de mes. La cobertura usa el promedio de compras de 2026 (sin cuotas de créditos).</div>
              </div>
              </>;
            })()}
          {/* Condiciones de pago */}
          <div className="sh"><span className="st">Condiciones de pago proveedores</span><span className="ss">Plazos acordados</span></div>
          <div className="grid4">
            {[
              {proveedor:"SUBATIR",plazo:"45 días",pct:"38.1%",color:"#e84400"},
              {proveedor:"Estuario Platino",plazo:"60 días",pct:"~8%",color:"#9A3412"},
              {proveedor:"JASPE",plazo:"45 días",pct:"~4%",color:"#9A3412"},
              {proveedor:"Resto proveedores",plazo:"30 días",pct:"~50%",color:"#7a3800"},
            ].map((p,i)=><div key={i} className="card">
              <div className="ctitle">{p.proveedor}</div>
              <div className="cval" style={{fontSize:"1.4rem",color:p.color}}>{p.plazo}</div>
              <div className="csub">{p.pct} del total de compras</div>
            </div>)}
          </div>
          {/* Evolucion compras SUBATIR por año */}
          <div><div className="sh"><span className="st">Evolución compras SUBATIR</span><span className="ss">2022–2026 por mes</span></div>
          <div className="card"><div className="ch">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"].map((m,i)=>({
                mes:m,
                "2023":COMPRAS_SUBATIR["2023"][i],
                "2024":COMPRAS_SUBATIR["2024"][i],
                "2025":COMPRAS_SUBATIR["2025"][i],
                "2026":COMPRAS_SUBATIR["2026"][i],
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
                <Line type="monotone" dataKey="2023" stroke="#4a2000" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2024" stroke="#7a3800" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2025" stroke="#d4956a" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="2026" stroke="#e84400" dot={false} strokeWidth={2.5} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer>
          </div></div></div>
          {/* Tabla comparativa proveedores por año */}
          <div className="sh"><span className="st">Compras por proveedor — resumen anual</span></div>
          <div className="card tw"><table><thead>
            <tr><th>Proveedor</th><th>Plazo</th><th>2022</th><th>2023</th><th>2024</th><th>2025</th><th>2026 (Ene-Jun)</th></tr>
          </thead><tbody>
            {[
              {p:"SUBATIR",plazo:"45 días",data:COMPRAS_SUBATIR},
              {p:"Estuario Platino",plazo:"60 días",data:COMPRAS_ESTUARIO},
              {p:"JASPE",plazo:"45 días",data:COMPRAS_JASPE},
            ].map((r,i)=>{
              const tot = (yr) => r.data[yr].filter(v=>v!=null).reduce((s,v)=>s+v,0);
              return <tr key={i}>
                <td style={{fontWeight:600}}>{r.p}</td>
                <td><span className="tag ty">{r.plazo}</span></td>
                <td>{fmtM(tot("2022"))}</td>
                <td>{fmtM(tot("2023"))}</td>
                <td>{fmtM(tot("2024"))}</td>
                <td>{fmtM(tot("2025"))}</td>
                <td>{fmtM(tot("2026"))}</td>
              </tr>;
            })}
          </tbody></table></div>
        </div>}

        {tab==="proy"&&<div className="gap">
          <div className="abar"/>
            <div className="sh"><span className="st">Saldo proyectado</span><span className="ss">Próximos 15 meses · 4 escenarios de crecimiento</span></div>
            <div className="card">
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                {escProy.map(e=><button key={e.k} onClick={()=>setCaja({escSel:e.k})} style={{border:`2px solid ${e.color}`,background:escSel===e.k?e.color:"transparent",color:escSel===e.k?"#fff":e.color,borderRadius:20,padding:"6px 12px",fontWeight:600,fontSize:"0.85rem",cursor:"pointer"}}>
                  {e.n} {(e.crec>=0?"+":"")+fmt(e.crec,1)}% · {fmtM(e.p[e.p.length-1].saldo)}</button>)}
              </div>
              <div className="ch">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartEsc}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                  <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                  <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip content={<TT/>}/>
                  <ReferenceLine y={0} stroke="#7A2E0A"/>
                  <ReferenceLine y={caja.alerta} stroke="#B45309" strokeDasharray="4 4" label={{value:"Alerta",fill:"#B45309",fontSize:10,position:"insideTopLeft"}}/>
                  <ReferenceLine y={caja.limite} stroke="#B91C1C" strokeDasharray="4 4" label={{value:"Límite sobregiro",fill:"#B91C1C",fontSize:10,position:"insideTopLeft"}}/>
                  {escProy.map(e=><Line key={e.k} type="monotone" dataKey={e.k} name={`${e.n} (${fmt(e.crec,1)}%)`} stroke={e.color} strokeWidth={escSel===e.k?3:1.5} strokeDasharray={e.k==="tend"?"5 3":undefined} dot={escSel===e.k?{r:3}:false}/>)}
                </LineChart>
              </ResponsiveContainer>
            </div>
              <div className="tsm" style={{marginTop:6}}>Tocá un escenario para ver su detalle abajo. El elegido también se usa para el retiro sugerido, las alertas y el informe PDF.</div>
            </div>
            <div className="card tw"><table className="tcomp thist"><thead><tr><th>Mes</th><th>Ventas</th><th>Costos</th><th>Deudas</th><th>Retiro</th><th>Saldo</th></tr></thead>
              <tbody>{proy.map((p,i)=><tr key={i}>
                <td style={{fontWeight:600,whiteSpace:"nowrap"}}>{p.mes}</td><td>{cM(p.ventas)}</td><td>{cM(p.costos)}<div className="tsm">fijos {cM(p.fijos)}</div></td><td>{cM(p.deuda)}</td><td>{cM(p.retiro)}</td>
                <td><span className={`tag ${p.saldo>=0?"tg":p.saldo>=caja.alerta?"ty":"tr"}`}>{cM(p.saldo)}</span></td>
              </tr>)}</tbody></table></div>
            <div className="sh"><span className="st">Retiros de {MESES[mIdx]}</span><span className="ss">Registro y control</span></div>
            <div className="grid4">
              <div className="card"><div className="ctitle">Retirado este mes</div><div className="cval ac">{fmtM(retiradoMes)}</div><div className="csub">{delMes.length} movimientos</div></div>
              <div className="card"><div className="ctitle">Sugerido este mes</div><div className="cval">{fmtM(sugerido)}</div><div className="csub">{(yAct<2027||(yAct===2027&&mIdx===0))?"Monto fijo":`${fmtM(caja.retiroFijo2)} + ${caja.retiroPct}% de ventas`}</div>
                <div className={`delta ${retiradoMes<=sugerido?"up":"dn"}`}>{retiradoMes<=sugerido?`Disponible ${fmtM(sugerido-retiradoMes)}`:`Excedido ${fmtM(retiradoMes-sugerido)}`}</div></div>
              <div className="card"><div className="ctitle">Retirado en {yAct}</div><div className="cval">{fmtM(anioRet)}</div><div className="csub">Registrado en la app</div></div>
              <div className="card"><div className="ctitle">Saldo más bajo proyectado</div><div className="cval" style={{color:minimo&&minimo.saldo<caja.alerta?"#B91C1C":""}}>{minimo?fmtM(minimo.saldo):"—"}</div><div className="csub">{minimo?.mes}</div></div>
            </div>

            {enLimite?<div className="banner" style={{borderColor:"#B91C1C",color:"#B91C1C"}}>🔴 Con este plan, en {enLimite.mes} el saldo proyectado ({fmtM(enLimite.saldo)}) pasa el límite del sobregiro ({fmtM(caja.limite)}). Conviene bajar el retiro o renovar el plazo fijo.</div>
             :enAlerta?<div className="banner" style={{borderColor:"#B45309",color:"#92400E"}}>⚠️ En {enAlerta.mes} el saldo proyectado ({fmtM(enAlerta.saldo)}) baja de tu límite de alerta ({fmtM(caja.alerta)}). Ese mes conviene reducir la parte variable del retiro.</div>
             :<div className="banner">✓ Con este plan el saldo no baja de tu límite de alerta en los próximos 15 meses.</div>}

            <div className="card">
              <div className="fg">
                <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={rF.fecha} onChange={e=>setRF(p=>({...p,fecha:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Monto ($)</label><input type="number" className="finput" placeholder="ej: 100000" value={rF.monto} onChange={e=>setRF(p=>({...p,monto:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Tipo</label><select className="finput" value={rF.tipo} onChange={e=>setRF(p=>({...p,tipo:e.target.value}))}><option>Fijo</option><option>Variable</option><option>Adelanto</option></select></div>
                <div className="fl"><label className="flabel">¿De dónde salió?</label><select className="finput" value={rF.cuenta} onChange={e=>setRF(p=>({...p,cuenta:e.target.value}))}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="fl"><label className="flabel">Observación</label><input type="text" className="finput" placeholder="opcional" value={rF.obs} onChange={e=>setRF(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <button className="btn" style={{marginTop:12}} onClick={saveRetiro}>💾 Guardar retiro</button>
            </div>

            {sheetRetiros.length>0&&<div className="card tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Tipo</th><th>Obs.</th><th></th></tr></thead>
              <tbody>{[...sheetRetiros.map((r,i)=>({...r,_i:i}))].reverse().slice(0,24).map(r=><tr key={r._i}>
                <td>{r.fecha}</td><td className="tac">{fmtM(Number(r.monto)||0)}</td><td><span className="tag ty">{r.tipo}</span></td><td className="tsm">{r.obs||"—"}</td>
                <td><button onClick={()=>{if(r._claude){showToast("Este retiro lo cargó Claude desde el chat: pedile que lo saque","er");return;}deleteRow("Retiros",r._i);}} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td>
              </tr>)}</tbody></table></div>}
            <div className="sh"><span className="st">Datos de partida</span><span className="ss">Actualizalos cuando cambien</span></div>
            <div className="card"><div className="fg">

              <div className="fl"><label className="flabel">Cobros pendientes (nov.)</label><input type="number" className="finput" value={caja.cobros} onChange={num("cobros")}/></div>
              <div className="fl"><label className="flabel">Plazo fijo diciembre</label><input type="number" className="finput" value={caja.plazoFijo} onChange={num("plazoFijo")}/></div>
              <div className="fl"><label className="flabel">¿Pagar plazo fijo en dic.?</label><select className="finput" value={caja.pagaPF?"si":"no"} onChange={e=>setCaja({pagaPF:e.target.value==="si"})}><option value="si">Sí, pagarlo</option><option value="no">No, renovarlo</option></select></div>
              <div className="fl"><label className="flabel">Retiro fijo hasta enero</label><input type="number" className="finput" value={caja.retiroFijo} onChange={num("retiroFijo")}/></div>
              <div className="fl"><label className="flabel">Retiro fijo desde febrero</label><input type="number" className="finput" value={caja.retiroFijo2} onChange={num("retiroFijo2")}/></div>
              <div className="fl"><label className="flabel">+ % de ventas desde febrero</label><input type="number" className="finput" value={caja.retiroPct} onChange={num("retiroPct")}/></div>
              <div className="fl"><label className="flabel">Gastos fijos por mes ($, sueldos+BPS, alquiler, luz, publicidad, otros)</label><input type="number" className="finput" value={caja.fijosMes} onChange={num("fijosMes")}/></div>
              <div className="fl"><label className="flabel">Aumento de gastos fijos desde enero (% inflación)</label><input type="number" step="0.5" className="finput" value={caja.infFijos} onChange={num("infFijos")}/></div>
              <div className="fl"><label className="flabel">Costo variable: mercadería + IVA (% ventas)</label><input type="number" step="0.5" className="finput" value={caja.varPct} onChange={num("varPct")}/></div>
              <div className="fl"><label className="flabel">Comisión bancos (% ventas, si no hay medición)</label><input type="number" step="0.1" className="finput" value={caja.comisionPct} onChange={num("comisionPct")}/></div>
              <div className="fl"><label className="flabel">Crecimiento escenario Bajo (%)</label><input type="number" step="0.5" className="finput" value={caja.crecBajo} onChange={num("crecBajo")}/></div>
              <div className="fl"><label className="flabel">Crecimiento escenario Medio (%)</label><input type="number" step="0.5" className="finput" value={caja.crecMedio} onChange={num("crecMedio")}/></div>
              <div className="fl"><label className="flabel">Crecimiento escenario Alto (%)</label><input type="number" step="0.5" className="finput" value={caja.crecAlto} onChange={num("crecAlto")}/></div>
              <div className="fl"><label className="flabel">Límite de alerta ($)</label><input type="number" className="finput" value={caja.alerta} onChange={num("alerta")}/></div>
              <div className="fl"><label className="flabel">Límite sobregiro ($)</label><input type="number" className="finput" value={caja.limite} onChange={num("limite")}/></div>
            </div>
            <div className="tsm" style={{marginTop:10}}>El saldo de partida es el neto de las tres cuentas guardado arriba. Incluye cuota Candela (~$19.600 hasta jun-28) y Santander ($53.347 hasta dic-26). Ventas de cada mes = el mismo mes del año anterior más el crecimiento del escenario. Costos = gastos fijos (suben con la inflación desde enero) + mercadería e IVA como % de las ventas, pagados mitad en el mes y mitad el mes siguiente; para octubre a diciembre 2026 se usan los gastos ya programados en la planilla cuando son mayores que el estimado. Últimos 12 meses reales: fijos ~$366.000/mes y variable 67,7% (2025: 65,3%; 2026 con el stock de más: 71,6%). A los costos se suma la comisión de los bancos por tarjetas: la real medida en Caja si hay meses cerrados con datos, si no el % configurado. Estos datos se guardan en este dispositivo.</div>
            <button className="btn" style={{marginTop:10,background:"var(--bg3)"}} onClick={()=>setCaja(CAJA_DEFAULT)}>Restablecer valores</button>
            </div>
        </div>}

        {tab==="carga"&&<div className="gap">
          <div className="abar"/>
          {!token&&<div className="banner">🔗 <span>Para guardar datos en Google Sheets, <strong style={{color:"#C2410C",cursor:"pointer"}} onClick={handleLogin}>conectate primero</strong> tocando el botón arriba.</span></div>}
          <div className="sh"><span className="st">Registrar venta diaria</span></div>
          <div className="card">
            <div className="fg">
              <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={vF.fecha} onChange={e=>setVF(p=>({...p,fecha:e.target.value}))}/></div>
              <div className="fl"><label className="flabel">Monto del día ($)</label><input type="number" className="finput" placeholder="ej: 85000" value={vF.monto} onChange={e=>setVF(p=>({...p,monto:e.target.value}))}/></div>
              <div className="fl" style={{gridColumn:"1/-1"}}><label className="flabel">Observación (opcional)</label><input type="text" className="finput" placeholder="ej: lluvia, feriado, Olkany..." value={vF.obs} onChange={e=>setVF(p=>({...p,obs:e.target.value}))}/></div>
            </div>
            <div className="factions"><button className="btn btn-p" onClick={saveVenta}>✓ Guardar en Sheets</button><span className="tsm">{token?"Se guarda directo en tu Google Sheet":"Conectate a Sheets primero"}</span></div>
          </div>
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
          <div className="sh"><span className="st">Registrar retiro</span><span className="ss">Plata que sacás del negocio, incluidas cuentas personales pagadas desde el banco</span></div>
          <div className="card">
              <div className="fg">
                <div className="fl"><label className="flabel">Fecha</label><input type="date" className="finput" value={rF.fecha} onChange={e=>setRF(p=>({...p,fecha:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Monto ($)</label><input type="number" className="finput" placeholder="ej: 100000" value={rF.monto} onChange={e=>setRF(p=>({...p,monto:e.target.value}))}/></div>
                <div className="fl"><label className="flabel">Tipo</label><select className="finput" value={rF.tipo} onChange={e=>setRF(p=>({...p,tipo:e.target.value}))}><option>Fijo</option><option>Variable</option><option>Adelanto</option></select></div>
                <div className="fl"><label className="flabel">¿De dónde salió?</label><select className="finput" value={rF.cuenta} onChange={e=>setRF(p=>({...p,cuenta:e.target.value}))}>{CUENTAS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="fl"><label className="flabel">Observación</label><input type="text" className="finput" placeholder="opcional" value={rF.obs} onChange={e=>setRF(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <button className="btn btn-p" style={{marginTop:12}} onClick={saveRetiro}>💾 Guardar retiro</button>
            </div>
          <div className="tsm" style={{padding:"0 4px"}}>Saldos bancarios, pagos y stock se cargan en sus pestañas (💳 Pagos y 📦 Compras).</div>
          <details className="card"><summary style={{cursor:"pointer",color:"var(--text2)",fontSize:".95rem",fontWeight:600}}>Ver lo guardado en Google Sheets (para corregir o borrar)</summary>
          {sheetVentas.length>0&&<><div className="sh"><span className="st">Ventas en Google Sheets</span><span className="ss">{sheetVentas.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{sheetVentas.slice(0,20).map((v,i)=><tr key={i}><td>{v.fecha}</td><td className="tac">${fmt(Number(v.monto))}</td><td className="tsm">{v.obs||"—"}</td><td><button onClick={()=>deleteRow("Ventas",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
          {sheetTickets.length>0&&<><div className="sh"><span className="st">Tickets en Google Sheets</span><span className="ss">{sheetTickets.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Mes</th><th>Año</th><th>Cantidad</th><th>Prom $</th><th>Días</th></tr></thead>
          <tbody>{sheetTickets.map((t,i)=><tr key={i}><td>{t.mes}</td><td>{t.anio}</td><td>{fmt(Number(t.cantidad))}</td><td>${fmt(Number(t.promedio),0)}</td><td>{t.dias||"—"}</td><td><button onClick={()=>deleteRow("Tickets",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
          {sheetCompras.length>0&&<><div className="sh"><span className="st">Compras en Google Sheets</span><span className="ss">{sheetCompras.length} registros</span></div>
          <div className="card tw"><table><thead><tr><th>Fecha</th><th>Factura</th><th>Proveedor</th><th>Monto</th><th>Obs.</th></tr></thead>
          <tbody>{sheetCompras.slice(0,20).map((c,i)=><tr key={i}><td>{c.fecha}</td><td className="tsm">{c.factura||"—"}</td><td>{c.proveedor}</td><td className="tac">${fmt(Number(c.monto))}</td><td className="tsm">{c.obs||"—"}</td><td><button onClick={()=>deleteRow("Compras",i)} style={{background:"rgba(232,68,0,0.15)",border:"none",color:"#C2410C",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>✕</button></td></tr>)}</tbody></table></div></>}
          </details>
        </div>}

        {tab==="informes"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Informes en PDF</span><span className="ss">Para guardar o mandar por WhatsApp</span></div>
          <div className="card">
            <div className="fg">
              <div className="fl"><label className="flabel">Tipo de informe</label>
                <select className="finput" value={rTipo} onChange={e=>setRTipo(e.target.value)}>
                  <option value="mensual">Mensual — resumen de un mes</option>
                  <option value="anual">Anual — ventas, tickets y resultado</option>
                  <option value="caja">Caja y deudas — saldos, pendientes y proyección</option>
                </select></div>
              {rTipo==="mensual"&&<div className="fl"><label className="flabel">Mes</label>
                <select className="finput" value={rMes} onChange={e=>setRMes(Number(e.target.value))}>{MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>}
              {rTipo!=="caja"&&<div className="fl"><label className="flabel">Año</label>
                <select className="finput" value={rAnio} onChange={e=>setRAnio(Number(e.target.value))}>{[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select></div>}
              {rTipo==="mensual"&&<div className="fl"><label className="flabel">Comentario de IA</label>
                <select className="finput" value={rIA?"si":"no"} onChange={e=>setRIA(e.target.value==="si")}><option value="si">Incluir si ya lo generé para ese mes</option><option value="no">No incluir</option></select></div>}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
              <button className="btn btn-p" onClick={()=>hacerInforme("compartir")}>📤 Compartir (WhatsApp, mail…)</button>
              <button className="btn btn-s" onClick={()=>hacerInforme("descargar")}>⬇️ Descargar PDF</button>
            </div>
            <div className="tsm" style={{marginTop:12}}>En el iPhone, "Compartir" abre el menú del sistema: elegí WhatsApp y el contacto. Para el informe de caja conviene tener Sheets conectado, así incluye tus retiros.</div>
          </div>
          <div className="sh"><span className="st">Análisis con IA</span><span className="ss">Basado en tus datos reales</span></div>
          <div className="card">
            <div className="ctitle">Clave de OpenRouter</div>
            {orKey?<div className="csub" style={{marginTop:6}}>✓ Clave guardada en este dispositivo (…{orKey.slice(-6)})</div>
                  :<div className="csub" style={{marginTop:6}}>Creá una clave gratis en openrouter.ai/keys y pegala acá. Queda guardada solo en este dispositivo, no se sube a GitHub.</div>}
            <div className="msel" style={{marginTop:10}}>
              <input type="password" className="finput" placeholder="sk-or-v1-..." value={orKeyIn} onChange={e=>setOrKeyIn(e.target.value)} style={{flex:1,minWidth:180}}/>
              <button className="btn btn-p" onClick={()=>{const k=orKeyIn.trim();if(!k)return;try{localStorage.setItem("prolimpio_or_key",k);}catch(e){}setOrKey(k);setOrKeyIn("");showToast("✓ Clave guardada");}}>Guardar clave</button>
              {orKey&&<button className="btn btn-s" onClick={()=>{try{localStorage.removeItem("prolimpio_or_key");}catch(e){}setOrKey("");}}>Borrar</button>}
            </div>
          </div>
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
          {(()=>{const L=analisisLocal(metricasMes(aMes,aAnio));return <div className="card">
            <div className="ctitle">Resumen automático — {MESES[aMes]} {aAnio}</div>
            <div style={{fontSize:"1rem",color:"var(--text)",lineHeight:1.7,marginTop:8}}>{L.map((x,i)=><p key={i} style={{marginTop:i?8:0}}>{x}</p>)}</div>
          </div>;})()}
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

        {tab==="historial"&&<div className="gap">
          <div className="abar"/>
          <div className="sh"><span className="st">Historial mes a mes</span>
            <select value={histAnio} onChange={e=>setHistAnio(e.target.value)} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",color:"var(--text)",fontFamily:"var(--font)",fontSize:".95rem",padding:"7px 10px",outline:"none"}}>
              {["2022","2023","2024","2025","2026"].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
          {(()=>{
            const y=histAnio, k=y.slice(2), prev=String(+y-1);
            const isoF=x=>{const t=String(x||"");const m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:t;};
            const saldos=[...sheetSaldos.map(s=>({fecha:isoF(s.fecha),neto:s.neto,ts:s.ts||""})),{fecha:SALDO_REF.fecha,neto:SALDO_REF.brou+SALDO_REF.santUyu,ts:SALDO_REF.ts}];
            const saldoMes=i=>{const pre=`${y}-${String(i+1).padStart(2,"0")}`;const l=saldos.filter(s=>s.fecha.startsWith(pre)).sort((a,b)=>a.fecha!==b.fecha?(a.fecha<b.fecha?1:-1):(a.ts<b.ts?1:-1));return l[0]||null;};
            const rows=VM.map((r,i)=>{const v=r[y], vP=r[prev]; const enCurso=v==null&&+y===yAct&&i===mIdx&&RMC.total>0;
              const tk=TK[i]?.["c"+k]??(enCurso&&TK_CURSO.mes===i&&TK_CURSO.anio===+y?TK_CURSO.cantidad:null), tp=TK[i]?.["p"+k]??(enCurso&&TK_CURSO.mes===i?TK_CURSO.promedio:null);
              const g=v!=null?gastoTotal(y,i):null, d=DEUDA_PAGOS[y]?.[i]||0, op=(v!=null&&g!=null)?v-g+d:null;
              return {mes:r.mes,i,v:v??(enCurso?RMC.total:null),enCurso,vP,crec:v!=null&&vP?(v/dhMes(+y,i)/(vP/dhMes(+prev,i))-1)*100:null,pd:v!=null?v/dhMes(+y,i):(enCurso?RMC.proyeccion/RMC.dh:null),tk,tp,g,op,opPct:op!=null&&v?op/v*100:null,saldo:saldoMes(i)};});
            const cer=rows.filter(r=>r.v!=null&&!r.enCurso); const sum=f=>cer.reduce((s,r)=>s+(f(r)||0),0);
            const tV=sum(r=>r.v), tP=sum(r=>r.vP), tTk=sum(r=>r.tk), tG=sum(r=>r.g), tOp=sum(r=>r.op);
            const tpProm=tTk?cer.reduce((s,r)=>s+(r.tk||0)*(r.tp||0),0)/tTk:null;
            const vis=rows.filter(r=>r.v!=null||r.saldo);
            return <>
            <div className="grid4">
              <div className="card"><div className="ctitle">Ventas {y}{cer.length<12?` (${cer.length} meses)`:""}</div><div className="cval ac">{fmtM(tV)}</div>{tP?<div className={`delta ${tV>=tP?"up":"dn"}`}>{tV>=tP?"▲":"▼"} {fmt(Math.abs((tV/tP-1)*100),1)}% vs mismos meses de {prev}</div>:null}</div>
              <div className="card"><div className="ctitle">Tickets {y}</div><div className="cval">{tTk?fmt(tTk):"—"}</div><div className="csub">{tpProm?`Ticket promedio $${fmt(tpProm,0)}`:"Sin datos de tickets"}</div></div>
              <div className="card"><div className="ctitle">Gastos {y}</div><div className="cval">{fmtM(tG)}</div><div className="csub">Incluye comisión de bancos</div></div>
              <div className="card"><div className="ctitle">Resultado operativo {y}</div><div className="cval" style={{color:tOp>=0?"#14532D":"#B91C1C"}}>{fmtM(tOp)}</div><div className="csub">{tV?`${fmt(tOp/tV*100,1)}% de las ventas · sin pagos de préstamos`:""}</div></div>
            </div>
            <div className="card tw"><table className="tcomp thist"><thead><tr><th>Mes</th><th>Ventas</th><th>Tickets</th><th>Gastos</th><th>Resultado</th><th>Banco</th></tr></thead>
              <tbody>{vis.map(r=><tr key={r.i}>
                <td style={{fontWeight:600}}>{r.mes}</td>
                <td style={{whiteSpace:"nowrap"}}>{r.v!=null?cM(r.v):"—"}<div className="tsm">{r.pd!=null?`${cM(r.pd)}/día${r.enCurso?" proy.":""}`:""}{r.crec!=null?` · ${r.crec>=0?"+":""}${fmt(r.crec,1)}%`:""}</div></td>
                <td style={{whiteSpace:"nowrap"}}>{r.tk!=null?fmt(r.tk):"—"}<div className="tsm">{r.tp?`$${fmt(r.tp,0)}`:""}</div></td>
                <td style={{whiteSpace:"nowrap"}}>{r.g!=null?cM(r.g):"—"}</td>
                <td style={{whiteSpace:"nowrap"}}>{r.op!=null?<span className={`tag ${r.opPct>=10?"tg":r.opPct>=0?"ty":"tr"}`}>{cM(r.op)}</span>:"—"}<div className="tsm">{r.opPct!=null?`${fmt(r.opPct,1)}%`:""}</div></td>
                <td style={{whiteSpace:"nowrap"}}>{r.saldo?<span style={{color:r.saldo.neto<0?"#B91C1C":"#14532D"}}>{cM(r.saldo.neto)}</span>:"—"}<div className="tsm">{r.saldo?fD(r.saldo.fecha):""}</div></td>
              </tr>)}
              <tr><td style={{fontWeight:700}}>Total</td><td style={{fontWeight:700,whiteSpace:"nowrap"}}>{cM(tV)}</td><td style={{fontWeight:700}}>{tTk?fmt(tTk):"—"}</td><td style={{fontWeight:700,whiteSpace:"nowrap"}}>{cM(tG)}</td><td style={{fontWeight:700,whiteSpace:"nowrap"}}>{cM(tOp)}</td><td></td></tr>
              </tbody></table>
              <div className="tsm" style={{padding:"8px 4px"}}>Resultado = ventas − gastos de la planilla − comisión de bancos, sin contar las cuotas de préstamos. Saldo banco = el último saldo guardado de ese mes (BROU + Santander). Los totales son de los meses cerrados.</div></div>
            </>;
          })()}
          <div className="sh"><span className="st">Resumen por año</span></div>
          {(()=>{const ys=["2022","2023","2024","2025","2026"];
            const D=ys.map(y=>{const k=y.slice(2);const n=TG_REAL[y].filter(x=>x!=null).length;const v=VM.slice(0,n).reduce((s,r)=>s+(r[y]||0),0);const vP=+y>2022?VM.slice(0,n).reduce((s,r)=>s+(r[String(+y-1)]||0),0):null;
              const g=TG_REAL[y].slice(0,n).reduce((s,x,j)=>s+(gastoTotal(y,j)||0),0);const d=DEUDA_PAGOS[y].slice(0,n).reduce((s,x)=>s+(x||0),0);const tk=TK.slice(0,n).reduce((s,r)=>s+(r["c"+k]||0),0);
              return {y,n,v,crec:vP?(v/vP-1)*100:null,tk,g,op:v-g+d,opPct:v?(v-g+d)/v*100:0};});
            return <div className="card tw"><table className="tcomp thist"><thead><tr><th>Año</th><th>Ventas</th><th>Tickets</th><th>Gastos</th><th>Resultado</th></tr></thead>
              <tbody>{D.map(r=><tr key={r.y} onClick={()=>setHistAnio(r.y)} style={{cursor:"pointer",background:r.y===histAnio?"#FFF1E6":""}}>
                <td style={{fontWeight:600}}>{r.y}{r.n<12?<div className="tsm">{r.n} meses</div>:null}</td>
                <td style={{whiteSpace:"nowrap"}}>{cM(r.v)}<div className="tsm">{r.crec!=null?`${r.crec>=0?"+":""}${fmt(r.crec,1)}%`:""}</div></td>
                <td>{r.tk?fmt(r.tk):"—"}</td><td style={{whiteSpace:"nowrap"}}>{cM(r.g)}</td>
                <td style={{whiteSpace:"nowrap"}}><span className={`tag ${r.opPct>=10?"tg":r.opPct>=0?"ty":"tr"}`}>{cM(r.op)}</span><div className="tsm">{fmt(r.opPct,1)}%</div></td></tr>)}</tbody></table>
              <div className="tsm" style={{padding:"8px 4px"}}>Tocá un año para verlo arriba mes a mes. El crecimiento compara los mismos meses del año anterior.</div></div>;})()}
          {/* Ventas vs Gastos con selector */}
          {(()=>{
            const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
            return <div><div className="sh">
              <span className="st">Ventas vs Gastos</span>
            </div>
            <div className="card"><div className="ch">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meses.map((m,i)=>({
                mes:m,
                Ventas:VM.find(r=>r.mes===m)?.[histAnio]||null,
                Gastos:gastosMes(histAnio,i)||null,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
                <Bar dataKey="Ventas" fill="#e84400" radius={[3,3,0,0]}/>
                <Bar dataKey="Gastos" fill="#7a3800" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div></div></div>;
          })()}
          {/* Grafica gastos por categoria con selector de año */}
          {(()=>{
            const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
            return <>
            <div><div className="sh">
              <span className="st">Gastos mensuales por categoría</span>
            </div>
            <div className="card"><div className="ch" style={{height:300}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meses.map((m,i)=>({
                mes:m,
                SUBATIR:COMPRAS_SUBATIR[histAnio]?.[i]||null,
                Estuario:COMPRAS_ESTUARIO[histAnio]?.[i]||null,
                Empleados:GASTOS.empleados[histAnio]?.[i]||null,
                Fijos:(GASTOS.alquiler[histAnio]?.[i]||0)+(GASTOS.luz[histAnio]?.[i]||0)+(GASTOS.publicidad[histAnio]?.[i]||0),
                IVA:GASTOS.iva[histAnio]?.[i]||null,
                Otros:GASTOS.otros[histAnio]?.[i]||null,
                Bancos:comisionBanco(histAnio,i),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F6DCC2"/>
                <XAxis dataKey="mes" stroke="#7A2E0A" fontSize={12}/>
                <YAxis stroke="#7A2E0A" fontSize={12} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{fontSize:"0.9rem",color:"#7A2E0A"}}/>
                <Bar dataKey="SUBATIR" stackId="a" fill="#e84400" radius={[0,0,0,0]}/>
                <Bar dataKey="Estuario" stackId="a" fill="#d4956a" radius={[0,0,0,0]}/>
                <Bar dataKey="Empleados" stackId="a" fill="#7a3800" radius={[0,0,0,0]}/>
                <Bar dataKey="Fijos" stackId="a" fill="#4a2000" radius={[0,0,0,0]}/>
                <Bar dataKey="IVA" stackId="a" fill="#3B1206" radius={[0,0,0,0]}/>
                <Bar dataKey="Bancos" name="Comisión bancos" stackId="a" fill="#B45309" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div></div></div>
          </>;
          })()}
          <details className="card"><summary style={{cursor:"pointer",color:"var(--text2)",fontSize:".95rem",fontWeight:600}}>Gastos por rubro, mes a mes ({histAnio})</summary>
          {/* Tabla detalle */}
          {(()=>{
            const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
            return <>
            <div className="sh">
              <span className="st">Detalle mensual</span>
            </div>
            <div className="card tw"><table><thead>
              <tr><th>Mes</th><th>Ventas</th><th>SUBATIR</th><th>Estuario</th><th>Empleados</th><th>Alquiler</th><th>Luz/Tel</th><th>Publicidad</th><th>IVA</th><th>Otros</th><th>Comisión bancos</th><th>Total gastos</th><th>Margen</th><th>%</th></tr>
            </thead><tbody>
            {meses.map((m,i)=>{
              const venta = VM.find(r=>r.mes===m)?.[histAnio]||0;
              const sub = COMPRAS_SUBATIR[histAnio]?.[i]||0;
              const est = COMPRAS_ESTUARIO[histAnio]?.[i]||0;
              const emp = GASTOS.empleados[histAnio]?.[i]||0;
              const alq = GASTOS.alquiler[histAnio]?.[i]||0;
              const luz = GASTOS.luz[histAnio]?.[i]||0;
              const pub = GASTOS.publicidad[histAnio]?.[i]||0;
              const iva = GASTOS.iva[histAnio]?.[i]||0;
              const ot = GASTOS.otros[histAnio]?.[i]||0;
              const ban = comisionBanco(histAnio,i)||0;
              const banReal = !!COM.real[`${histAnio}-${String(i+1).padStart(2,"0")}`];
              const total = gastosMes(histAnio,i);
              const margen = venta - total;
              const pct_margen = venta>0?((margen/venta)*100):0;
              if(!venta && !total) return null;
              return <tr key={i}>
                <td style={{fontWeight:600}}>{m}</td>
                <td className="tac">{fmtM(venta)}</td>
                <td>{fmtM(sub)}</td>
                <td>{fmtM(est)}</td>
                <td>{fmtM(emp)}</td>
                <td>{fmtM(alq)}</td>
                <td>{fmtM(luz)}</td>
                <td>{fmtM(pub)}</td>
                <td>{fmtM(iva)}</td>
                <td>{fmtM(ot)}</td>
                <td>{fmtM(ban)}{ban?<div className="tsm">{banReal?"real":"est. "+fmt(COM.pct,1)+"%"}</div>:null}</td>
                <td style={{fontWeight:600}}>{fmtM(total)}</td>
                <td><span className={`tag ${margen>=0?"tg":"tr"}`}>{fmtM(margen)}</span></td>
                <td><span className={`tag ${pct_margen>=5?"tg":pct_margen>=0?"ty":"tr"}`}>{fmt(pct_margen,1)}%</span></td>
              </tr>;
            })}
          </tbody></table></div>
          </>;
          })()}
          </details>
          <div className="sh"><span className="st">Ventas históricas</span><span className="ss">Todos los años</span>
            {token&&<button className="btn btn-p" style={{fontSize:"0.8rem",padding:"7px 14px"}} onClick={cargarHistorico}>📥 Cargar histórico a Sheets</button>}
          </div>
          <div className="card tw"><table className="tcomp thist"><thead><tr><th>Mes</th><th>2022</th><th>2023</th><th>Δ</th><th>2024</th><th>Δ</th><th>2025</th><th>Δ</th><th>2026</th><th>Δ</th></tr></thead>
          <tbody>{VM.map((r,i)=>{
            const tg=v=>v==null?"—":<span className={`tag ${v>=0?"tg":"tr"}`}>{v>=0?"+":""}{fmt(v,1)}%</span>;
            return<tr key={i}><td style={{fontWeight:600}}>{r.mes}</td>
              <td>{cM(r["2022"])}</td><td>{cM(r["2023"])}</td><td>{tg(pct(r["2023"],r["2022"]))}</td>
              <td>{cM(r["2024"])}</td><td>{tg(pct(r["2024"],r["2023"]))}</td>
              <td>{cM(r["2025"])}</td><td>{tg(pct(r["2025"],r["2024"]))}</td>
              <td>{r["2026"]?cM(r["2026"]):<span className="tsm">—</span>}</td>
              <td>{r["2026"]?tg(pct(r["2026"],r["2025"])):"—"}</td>
            </tr>;
          })}</tbody></table></div>
          <div className="sh"><span className="st">Crecimiento real anual</span></div>
          <div className="card tw">
            <div className="tsm" style={{padding:"8px 12px 4px",color:"#7A2E0A"}}>Inflación según datos oficiales INE Uruguay</div>
            <table><thead><tr><th>Período</th><th>Crec. nominal</th><th>Inflación real INE</th><th>Crec. real</th><th>Resultado</th></tr></thead>
          <tbody>{[
            {p:"2022 (apertura)",n:null,i:9.95,src:"INE 2022"},
            {p:"2023 vs 2022",n:7.6,i:8.26,src:"INE 2023"},
            {p:"2024 vs 2023",n:24.05,i:5.11,src:"INE 2024"},
            {p:"2025 vs 2024",n:36.7,i:6.36,src:"INE 2025"},
            {p:`2026 vs 2025 (${CR.u3.length?"Ene–"+CR.meses[CR.meses.length-1].mes.slice(0,3):""})`,n:Math.round(CR.ytd*10)/10,i:INF_ANUAL["2026"],src:"estimada"},
          ].map((r,i)=>{
            if(r.n===null) return <tr key={i}>
              <td style={{fontWeight:600}}>{r.p}</td>
              <td className="tsm">—</td>
              <td className="tsm">{fmt(r.i,2)}% ({r.src})</td>
              <td className="tsm">—</td>
              <td className="tsm">Primer año</td>
            </tr>;
            const real=r.n-r.i;
            return<tr key={i}><td style={{fontWeight:600}}>{r.p}</td>
              <td className="tac">+{fmt(r.n,1)}%</td>
              <td className="tsm">{fmt(r.i,2)}% <span style={{color:"#8A4A2A",fontSize:"0.8rem"}}>({r.src})</span></td>
              <td><span className={`tag ${real>=0?"tg":"tr"}`}>{real>=0?"+":""}{fmt(real,1)}% real</span></td>
              <td>{real>=10?"🚀 Excelente":real>=3?"📈 Bueno":real>=0?"➡️ Estable":"⚠️ Caída"}</td>
            </tr>;
          })}</tbody></table></div>
        </div>}

      </main>
    </div>
    {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
  </>;
}
