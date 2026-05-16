<div style={{width:sidebarCollapsed?68:200,flexShrink:0,background:"#0F0F0F",borderRight:"0.5px solid rgba(201,168,76,0.15)",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:100,transition:"width 0.25s ease",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:sidebarCollapsed?"20px 16px":"20px 18px"}}>
      <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:"radial-gradient(circle,rgba(201,168,76,0.35) 0%,transparent 70%)",border:"1px solid rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",color:"#C9A84C",fontFamily:"Raleway",fontSize:12,fontWeight:600}}>SD</div>
      <div style={{fontFamily:"Raleway",fontSize:14,fontWeight:700,color:"rgba(245,240,232,0.85)",letterSpacing:1,whiteSpace:"nowrap",opacity:sidebarCollapsed?0:1,transition:"opacity 0.2s",overflow:"hidden",width:sidebarCollapsed?0:"auto"}}>Lichtkern</div>
    </div>
    <div style={{flex:1,padding:"4px 0",overflowY:"auto"}}>
      {SIDEBAR_SECTIONS.map((sec,si)=>(
        <div key={si} style={{marginBottom:4,marginTop:si>0?18:0}}>
          <div style={{fontFamily:"Raleway",fontSize:9,fontWeight:700,letterSpacing:2,color:"rgba(201,168,76,0.6)",textTransform:"uppercase",padding:sidebarCollapsed?"0":"0 18px 6px",opacity:sidebarCollapsed?0:1,height:sidebarCollapsed?0:"auto",overflow:"hidden",transition:"opacity 0.2s"}}>{sec.label}</div>
          {sec.items.map(item=>{
            const isA=screen===item.id;
            return <button key={item.id} onClick={()=>item.isSession?startSession():nav(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarCollapsed?"10px 0":"9px 18px",justifyContent:sidebarCollapsed?"center":"flex-start",width:"100%",border:"none",background:isA?"rgba(201,168,76,0.08)":"transparent",color:isA?"#C9A84C":"rgba(245,240,232,0.75)",cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:13,textAlign:"left",transition:"all 0.15s",borderRadius:sidebarCollapsed?0:"0 12px 12px 0",marginRight:sidebarCollapsed?0:8,marginBottom:1}}>
              <span style={{fontSize:17,width:22,textAlign:"center",flexShrink:0,filter:isA?"none":"grayscale(1) brightness(1.5)"}}>{item.icon}</span>
              <span style={{whiteSpace:"nowrap",overflow:"hidden",opacity:sidebarCollapsed?0:1,width:sidebarCollapsed?0:"auto",transition:"opacity 0.2s"}}>{item.label}</span>
              {isA&&!sidebarCollapsed&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:"#C9A84C",flexShrink:0}}/>}
            </button>;
          })}
        </div>
      ))}
    </div>
    <div style={{borderTop:"1px solid rgba(201,168,76,0.1)",padding:"8px 0 12px"}}>
      <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarCollapsed?"10px 0":"10px 18px",justifyContent:sidebarCollapsed?"center":"flex-start",width:"100%",border:"none",background:"transparent",color:"rgba(245,240,232,0.5)",cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:13,transition:"all 0.15s"}}>
        <span style={{fontSize:17,width:22,textAlign:"center",opacity:0.65}}>⚙</span>
        <span style={{opacity:sidebarCollapsed?0:1,width:sidebarCollapsed?0:"auto",overflow:"hidden",whiteSpace:"nowrap",transition:"opacity 0.2s"}}>Einstellungen</span>
      </button>
      <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:"8px 0",border:"none",background:"transparent",color:"rgba(245,240,232,0.2)",cursor:"pointer",fontSize:16,transition:"all 0.15s"}}>
        {sidebarCollapsed?"»":"«"}
      </button>
    </div>
  </div>
