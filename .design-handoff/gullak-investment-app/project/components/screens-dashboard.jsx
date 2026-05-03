/* Dashboard — v2 with i18n & animations */

const DashboardScreen = ({ lang, userName, amount, goal }) => {
  const totalSaved = 14780;
  const munafa = 847;
  const streak = 7;
  const goalTarget = goal?.id==='wedding'?500000:goal?.id==='home'?1000000:goal?.id==='emergency'?50000:100000;
  const goalProgress = totalSaved/goalTarget;
  const [chartToggle, setChartToggle] = React.useState('balance');
  const gl = GOAL_LABELS[lang]||GOAL_LABELS.en;
  const txl = TX_LABELS[lang]||TX_LABELS.en;

  const chartPoints = [20,35,40,55,50,65,75,70,85,90,88,95];
  const chartPath = chartPoints.map((p,i)=>`${i===0?'M':'L'} ${(i/(chartPoints.length-1))*100} ${100-p}`).join(' ');
  const fillPath = chartPath + ' L 100 100 L 0 100 Z';
  const months = Math.ceil((goalTarget-totalSaved)/(amount*30));

  const txns = [
    { type:txl.daily, date:'2 May 2026', amount:`+₹${amount}` },
    { type:txl.daily, date:'1 May 2026', amount:`+₹${amount}` },
    { type:txl.roundup, date:'30 Apr 2026', amount:'+₹7' },
  ];

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif",overflowY:'auto',overflowX:'hidden' }}>
      {/* Zone A — Trust Strip */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px',background:'#e6f7f4',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <img src="assets/gullak-clean.png" alt="" style={{ width:26,height:22,objectFit:'contain' }} />
          <div>
            <div style={{ fontSize:13,fontWeight:800,color:'#3E1F00' }}>GULLAK</div>
            <div style={{ fontSize:8,color:'#0E8C7A',fontWeight:600 }}>{t(lang,'dashTrust')}</div>
          </div>
        </div>
        <div style={{ fontSize:11,color:'#0E8C7A',cursor:'pointer',fontWeight:700 }}>📞 {t(lang,'dashHelp')}</div>
      </div>

      {/* Zone B — Chart */}
      <div style={{ padding:'14px 14px 8px',flexShrink:0,animation:'fadeIn 0.4s ease-out' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
          <div style={{ fontSize:12,fontWeight:700,color:'#3E1F00' }}>{t(lang,'dashChartTitle')}</div>
          <div style={{ display:'flex',gap:3 }}>
            {[['balance','dashBalance'],['saved','dashSaved'],['munafa','dashMunafa']].map(([k,lk])=>(
              <button key={k} onClick={()=>setChartToggle(k)} style={{ padding:'3px 8px',borderRadius:10,fontSize:9,fontWeight:700,border:'none',cursor:'pointer',background:chartToggle===k?'#E8650A':'#f0e6d9',color:chartToggle===k?'#fff':'#555',transition:'all 0.2s' }}>
                {t(lang,lk)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width:'100%',height:90,borderRadius:12,overflow:'hidden',background:'#fff',border:'1px solid #f0e6d9' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width:'100%',height:'100%' }}>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0E8C7A" stopOpacity="0.25"/><stop offset="100%" stopColor="#0E8C7A" stopOpacity="0.02"/></linearGradient></defs>
            <path d={fillPath} fill="url(#cg)"/>
            <path d={chartPath} fill="none" stroke="#0E8C7A" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ animation:'chartDraw 1.5s ease-out' }}/>
          </svg>
        </div>
      </div>

      {/* Zone C — Balance */}
      <div style={{ textAlign:'center',padding:'8px 14px',flexShrink:0,position:'relative' }}>
        <img src="assets/chiraiya-clean.png" alt="" style={{ position:'absolute',top:0,right:14,width:42,height:35,objectFit:'contain',animation:'gentleFloat 2.5s ease-in-out infinite',filter:'drop-shadow(0 1px 4px rgba(0,0,0,0.1))' }} />
        <img src="assets/gullak-clean.png" alt="" style={{ width:50,height:42,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(212,160,23,0.3))' }} />
        <div style={{ fontSize:34,fontWeight:800,color:'#3E1F00',marginTop:2 }}>₹{totalSaved.toLocaleString('en-IN')}</div>
        <div style={{ fontSize:11,color:'#555' }}>{t(lang,'dashTotalJama')}</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:4,background:'#FFF5EC',padding:'4px 12px',borderRadius:12,fontSize:11,fontWeight:700,color:'#E8650A',marginTop:4 }}>
          🔥 {streak}{t(lang,'dashStreak')}
        </div>
      </div>

      {/* Zone D — Munafa */}
      <div style={{ margin:'6px 14px',padding:'12px 14px',background:'linear-gradient(135deg,#f0f7e6,#e6f7f4)',borderRadius:14,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,animation:'slideUp 0.35s ease-out 0.1s both' }}>
        <div>
          <div style={{ fontSize:18,fontWeight:800,color:'#1A7A4A' }}>+₹{munafa}</div>
          <div style={{ fontSize:10,color:'#555',marginTop:2 }}>{t(lang,'dashMunafaMonth')}</div>
        </div>
        <div style={{ fontSize:9,color:'#0E8C7A',fontWeight:700,background:'#d9f2ed',padding:'3px 8px',borderRadius:8 }}>{t(lang,'dashMunafaTag')} ↑</div>
      </div>

      {/* Zone E — Goal */}
      <div style={{ margin:'6px 14px',padding:'14px',background:'#fff',borderRadius:14,border:'1px solid #f0e6d9',flexShrink:0,animation:'slideUp 0.35s ease-out 0.2s both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#3E1F00' }}>{goal?.emoji} {goal?.label || gl.emergency}</div>
          <div style={{ fontSize:13,fontWeight:800,color:'#E8650A' }}>{Math.round(goalProgress*100)}%</div>
        </div>
        <div style={{ height:7,background:'#f0e6d9',borderRadius:4,marginTop:8,overflow:'hidden' }}>
          <div style={{ height:'100%',background:'linear-gradient(90deg,#E8650A,#D4A017)',borderRadius:4,width:`${Math.min(goalProgress*100,100)}%`,transition:'width 1.5s ease' }}></div>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'#555' }}>
          <span>₹{totalSaved.toLocaleString('en-IN')} / ₹{goalTarget.toLocaleString('en-IN')}</span>
          <span>{t(lang,'dashGoalRemain',{n:(goalTarget-totalSaved).toLocaleString('en-IN')})}</span>
        </div>
        <div style={{ fontSize:10,color:'#C4602A',marginTop:4,fontWeight:600 }}>{t(lang,'dashGoalEta',{n:months})}</div>
      </div>

      {/* Zone F — Next Action */}
      <div style={{ margin:'6px 14px',padding:'12px 14px',background:'#FFF5EC',borderRadius:14,display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
        <span style={{ fontSize:18 }}>⏰</span>
        <div>
          <div style={{ fontSize:12,color:'#3E1F00',fontWeight:600 }}>{t(lang,'dashNextAction',{n:amount})}</div>
          <div style={{ fontSize:10,color:'#555' }}>{t(lang,'dashNextSub')}</div>
        </div>
      </div>

      {/* Motivational */}
      <div style={{ padding:'6px 14px',textAlign:'center',fontSize:10,color:'#C4602A',fontStyle:'italic',flexShrink:0 }}>
        {t(lang,'dashMotivation',{n:amount})} 🐦
      </div>

      {/* Zone G — Transactions */}
      <div style={{ margin:'4px 14px',flexShrink:0 }}>
        <div style={{ fontSize:12,fontWeight:700,color:'#3E1F00',marginBottom:6 }}>{t(lang,'dashTxTitle')}</div>
        {txns.map((tx,i) => (
          <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f5f0ea' }}>
            <div>
              <div style={{ fontSize:11,fontWeight:600,color:'#3E1F00' }}>{tx.type}</div>
              <div style={{ fontSize:9,color:'#888' }}>{tx.date}</div>
            </div>
            <div style={{ fontSize:12,fontWeight:700,color:'#1A7A4A' }}>{tx.amount}</div>
          </div>
        ))}
        <div style={{ textAlign:'center',fontSize:11,color:'#E8650A',fontWeight:700,cursor:'pointer',padding:'6px' }}>{t(lang,'dashTxMore')} →</div>
      </div>

      {/* Zone H — Nudge */}
      <div style={{ margin:'4px 14px 10px',padding:'12px 14px',background:'linear-gradient(135deg,#FFF5EC,#FFF8F0)',borderRadius:14,border:'1px dashed #E8650A',flexShrink:0 }}>
        <div style={{ fontSize:11,color:'#3E1F00',lineHeight:1.4 }}>{t(lang,'dashNudge',{a:amount,b:amount*2,n:Math.ceil((goalTarget-totalSaved)/(amount*2*30))})}</div>
        <div style={{ fontSize:11,color:'#E8650A',fontWeight:700,cursor:'pointer',marginTop:4 }}>{t(lang,'dashNudgeCta')} →</div>
      </div>

      {/* Zone I — Bottom Nav */}
      <div style={{ display:'flex',justifyContent:'space-around',padding:'8px 0',background:'#fff',borderTop:'1px solid #f0e6d9',flexShrink:0 }}>
        {[{icon:'🏠',lk:'navHome',a:true},{icon:'🎯',lk:'navGoals'},{icon:'📊',lk:'navPortfolio'},{icon:'👤',lk:'navProfile'}].map((n,i) => (
          <div key={i} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:1,fontSize:9,color:n.a?'#E8650A':'#888',fontWeight:n.a?700:500,cursor:'pointer' }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>
            {t(lang,n.lk)}
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { DashboardScreen });
