import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Si algo falla al dibujar la app, muestra el error en vez de dejar la pantalla en blanco
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err,info){ this.setState({err,stack:(info&&info.componentStack)||""}); }
  render(){
    if(!this.state.err) return this.props.children;
    const e=this.state.err;
    const b={padding:"12px 16px",margin:"6px 6px 0 0",border:"none",borderRadius:8,fontSize:15,background:"#e84400",color:"#fff"};
    return <div style={{padding:16,fontFamily:"system-ui,sans-serif",color:"#222",background:"#fff",minHeight:"100vh"}}>
      <h2 style={{marginTop:0}}>La app tuvo un error</h2>
      <p>Mandale una captura de esta pantalla a Claude.</p>
      <pre style={{whiteSpace:"pre-wrap",fontSize:12,background:"#f4f4f4",padding:10,borderRadius:8}}>{String(e&&e.message||e)}{"\n"}{String(e&&e.stack||"").slice(0,900)}{"\n"}{String(this.state.stack||"").slice(0,600)}</pre>
      <button style={b} onClick={()=>location.reload()}>Recargar</button>
      <button style={{...b,background:"#555"}} onClick={()=>{try{localStorage.removeItem("prolimpio_caja");}catch(x){} location.reload();}}>Borrar saldos guardados en este equipo y recargar</button>
    </div>;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>,
)
