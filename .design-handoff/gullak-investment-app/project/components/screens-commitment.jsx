/* Autopilot + Commitment + Mandate + Success — v2 with i18n, coin animation */

const AutopilotScreen = ({ lang, goal, onSelect }) => {
  const [mode, setMode] = React.useState(null);
  const modes = [
    { id:'fixed', icon:'📅', titleKey:'autoFixed', descKey:'autoFixedDesc', tagKey:'autoTag1' },
    { id:'roundup', icon:'🔄', titleKey:'autoRoundup', descKey:'autoRoundupDesc', tagKey:'autoTag2' },
    { id:'sweep', icon:'💰', titleKey:'autoSweep', descKey:'autoSweepDesc', tagKey:'autoTag3' },
  ];

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'24px 24px 8px',textAlign:'center' }}>
        <img src="assets/chiraiya-clean.png" alt="" style={{ width:70,height:55,objectFit:'contain',animation:'gentleFloat 2s ease-in-out infinite',filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }} />
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00',marginTop:4 }}>{t(lang,'autoTitle')}</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4 }}>{goal.label}{t(lang,'autoSub')}</div>
      </div>
      <div style={{ padding:'12px 20px',flex:1,display:'flex',flexDirection:'column',gap:12 }}>
        {modes.map((m,i) => (
          <div key={m.id} style={{
            padding:'16px',background: mode===m.id ? '#FFF5EC' : '#fff',
            border: mode===m.id ? '2px solid #E8650A' : '2px solid #f0e6d9',
            borderRadius:16,cursor:'pointer',transition:'all 0.2s',display:'flex',gap:14,alignItems:'center',position:'relative',
            animation: `slideUp 0.35s ease-out ${i*0.08}s both`,
          }} onClick={() => setMode(m.id)}>
            <span style={{ position:'absolute',top:8,right:10,fontSize:10,fontWeight:700,color:'#E8650A',background:'#FFF5EC',padding:'2px 8px',borderRadius:8 }}>{t(lang,m.tagKey)}</span>
            <div style={{ fontSize:26,width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',background:'#FFF8F0',borderRadius:12 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:'#3E1F00' }}>{t(lang,m.titleKey)}</div>
              <div style={{ fontSize:12,color:'#555',marginTop:2,lineHeight:1.4 }}>{t(lang,m.descKey)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 24px' }}>
        <button style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(232,101,10,0.3)',opacity:mode?1:0.5,transition:'opacity 0.3s' }}
          onClick={() => mode && onSelect(mode)}>{t(lang,'next')} →</button>
        <div style={{ textAlign:'center',fontSize:11,color:'#0E8C7A',marginTop:8 }}>{t(lang,'autoHint')}</div>
      </div>
    </div>
  );
};

const CommitmentScreen = ({ lang, goal, onSelect }) => {
  const [amount, setAmount] = React.useState(20);
  const amounts = [10, 20, 50, 100, 200, 500];
  const yearly = amount * 365;
  const munafa = Math.round(yearly * 0.07);

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'24px 24px 8px',textAlign:'center' }}>
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00' }}>{t(lang,'commitTitle')}</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4 }}>{t(lang,'commitSub')}</div>
      </div>
      <div style={{ padding:'16px 24px',flex:1,animation:'slideUp 0.35s ease-out' }}>
        <div style={{ textAlign:'center',margin:'12px 0' }}>
          <div style={{ fontSize:52,fontWeight:800,color:'#3E1F00' }}>₹{amount}</div>
          <div style={{ fontSize:14,color:'#C4602A',fontWeight:600,marginTop:2 }}>{t(lang,'perDay')}</div>
        </div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',marginTop:16 }}>
          {amounts.map(a => (
            <div key={a} onClick={() => setAmount(a)} style={{
              padding:'10px 20px',borderRadius:24,
              border: amount===a ? '2px solid #E8650A' : '2px solid #f0e6d9',
              background: amount===a ? '#E8650A' : '#fff',
              color: amount===a ? '#fff' : '#3E1F00',
              fontSize:15,fontWeight:700,cursor:'pointer',transition:'all 0.2s',
            }}>₹{a}</div>
          ))}
        </div>
        <div style={{ background:'#fff',borderRadius:16,padding:'16px',border:'1px solid #f0e6d9',marginTop:20 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#3E1F00' }}>📊 {t(lang,'projTitle')}</div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:10,fontSize:13 }}>
            <span style={{ color:'#555' }}>{t(lang,'projSaved')}</span>
            <span style={{ fontWeight:700,color:'#1A7A4A' }}>₹{yearly.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:13 }}>
            <span style={{ color:'#555' }}>{t(lang,'projMunafa')}</span>
            <span style={{ fontWeight:700,color:'#1A7A4A' }}>+₹{munafa.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:13 }}>
            <span style={{ color:'#555' }}>{t(lang,'projTotal')}</span>
            <span style={{ fontWeight:700,color:'#1A7A4A',fontSize:15 }}>₹{(yearly+munafa).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ fontSize:10,color:'#888',marginTop:8 }}>{t(lang,'projDisclaimer')}</div>
        </div>
      </div>
      <div style={{ padding:'14px 24px' }}>
        <button style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(232,101,10,0.3)' }}
          onClick={() => onSelect(amount)}>₹{amount}{t(lang,'commitCta')} 🏺</button>
        <div style={{ textAlign:'center',fontSize:11,color:'#0E8C7A',marginTop:8 }}>{t(lang,'commitHint')}</div>
      </div>
    </div>
  );
};

const MandateScreen = ({ lang, amount, onConfirm }) => {
  const [agreed, setAgreed] = React.useState(false);

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'24px 24px 8px',textAlign:'center' }}>
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00' }}>{t(lang,'mandateTitle')}</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4 }}>{t(lang,'mandateSub')}</div>
      </div>
      <div style={{ padding:'16px 24px',flex:1,animation:'slideUp 0.35s ease-out' }}>
        <div style={{ background:'#fff',borderRadius:16,padding:'18px',border:'2px solid #f0e6d9' }}>
          {[[t(lang,'mandateDaily'),`₹${amount}`],[t(lang,'mandateFreq'),t(lang,'mandateFreqVal')],[t(lang,'mandateMode'),t(lang,'mandateModeVal')],[t(lang,'mandateCancel'),t(lang,'mandateCancelVal')]].map(([l,v],i) => (
            <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom: i<3 ? '1px solid #f5f0ea' : 'none' }}>
              <span style={{ fontSize:13,color:'#555' }}>{l}</span>
              <span style={{ fontSize:13,fontWeight:700,color:'#3E1F00' }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Animated money flow */}
        <div style={{ marginTop:18,background:'linear-gradient(135deg,#FFF5EC,#FFF8F0)',borderRadius:16,padding:'18px',textAlign:'center',border:'1px solid #f0e6d9',position:'relative',overflow:'hidden' }}>
          <div style={{ fontSize:13,color:'#C4602A',fontWeight:600,marginBottom:14 }}>{t(lang,'mandateFlowTitle')}</div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
            <div style={{ padding:'10px 14px',background:'#fff',borderRadius:12,fontSize:13,fontWeight:700,color:'#3E1F00',border:'1px solid #f0e6d9' }}>🏦 {t(lang,'mandateBank')}</div>
            <div style={{ position:'relative',width:60,height:30 }}>
              {/* Animated coin flying */}
              <div style={{
                width:14,height:14,borderRadius:'50%',
                background:'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
                border:'1.5px solid #c49a00',
                position:'absolute',top:8,
                animation:'coinFly 1.8s ease-in-out infinite',
              }}></div>
              <img src="assets/chiraiya-clean.png" alt="" style={{
                position:'absolute',top:-8,left:16,width:28,height:24,objectFit:'contain',
                animation:'birdCarry 1.8s ease-in-out infinite',
                transform:'scaleX(-1)',
              }} />
            </div>
            <div style={{ padding:'10px 14px',background:'#fff',borderRadius:12,fontSize:13,fontWeight:700,color:'#3E1F00',border:'1px solid #f0e6d9' }}>🏺 {t(lang,'mandateGullak')}</div>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginTop:16,cursor:'pointer' }} onClick={() => setAgreed(!agreed)}>
          <div style={{ width:22,height:22,borderRadius:6,border:'2px solid #E8650A',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,background: agreed ? '#E8650A' : 'transparent',transition:'all 0.2s' }}>
            {agreed && <span style={{ color:'#fff',fontSize:13,fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:12,color:'#555',lineHeight:1.4 }}>
            {t(lang,'mandateAgree',{amount})}
          </span>
        </div>
      </div>
      <div style={{ padding:'14px 24px' }}>
        <button style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(232,101,10,0.3)',opacity:agreed?1:0.4,transition:'opacity 0.3s' }}
          onClick={() => agreed && onConfirm()}>{t(lang,'mandateCta')} ✓</button>
        <div style={{ textAlign:'center',fontSize:11,color:'#0E8C7A',marginTop:8 }}>🔐 {t(lang,'mandateTrust')}</div>
      </div>
    </div>
  );
};

const SuccessScreen = ({ lang, userName, amount, onGoHome }) => {
  const [showConfetti, setShowConfetti] = React.useState(true);
  const [coinsDone, setCoinsDone] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setShowConfetti(false), 3500); setTimeout(() => setCoinsDone(true), 2000); }, []);

  return (
    <div style={{ width:'100%',height:'100%',background:'linear-gradient(180deg,#FFF8F0,#FFF2E5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'Nunito',sans-serif",position:'relative',overflow:'hidden',textAlign:'center',padding:'24px' }}>
      {showConfetti && (
        <div style={{ position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none' }}>
          {Array.from({length:28}).map((_,i) => (
            <div key={i} style={{
              position:'absolute',top:-10,left:`${Math.random()*100}%`,
              width: 6+Math.random()*6, height: 6+Math.random()*6,
              background:['#E8650A','#D4A017','#C4602A','#0E8C7A','#1A7A4A'][i%5],
              borderRadius: i%3===0 ? '50%' : '2px',
              animation:`confettiFall ${1.5+Math.random()*2}s ease-in ${Math.random()*0.6}s forwards`,
            }}></div>
          ))}
        </div>
      )}

      {/* Chiraiya celebration — flying around */}
      <img src="assets/chiraiya-clean.png" alt="" style={{
        position:'absolute',top:'12%',right:'8%',width:55,height:45,objectFit:'contain',
        animation:'celebFly 2s ease-in-out infinite',
        filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
      }} />

      <div style={{ position:'relative' }}>
        <img src="assets/gullak-clean.png" alt="" style={{
          width:120,height:100,objectFit:'contain',
          filter:'drop-shadow(0 0 24px rgba(212,160,23,0.5))',
          animation:'gentleFloat 3s ease-in-out infinite',
        }} />
        {/* Coins dropping into gullak */}
        {!coinsDone && Array.from({length:5}).map((_,i) => (
          <div key={i} style={{
            position:'absolute',top:-15,left:`${30+i*10}%`,
            width:12,height:12,borderRadius:'50%',
            background:'radial-gradient(circle at 35% 35%, #f5d442, #D4A017)',
            border:'1.5px solid #c49a00',
            animation:`coinDrop 0.6s ease-in ${i*0.3}s forwards`,
            opacity:0,
          }}></div>
        ))}
      </div>

      <div style={{ fontSize:24,fontWeight:800,color:'#3E1F00',marginTop:16,animation:'fadeIn 0.5s ease-out 0.3s both' }}>
        {t(lang,'successTitle',{name: userName})}
      </div>
      <div style={{ fontSize:16,color:'#C4602A',fontWeight:600,marginTop:6,animation:'fadeIn 0.5s ease-out 0.5s both' }}>
        {t(lang,'successSub')}
      </div>
      <div style={{ background:'#fff',borderRadius:16,padding:'18px',border:'1px solid #f0e6d9',marginTop:20,width:'100%',animation:'fadeIn 0.5s ease-out 0.7s both' }}>
        {[[t(lang,'successDaily'),`₹${amount}`],[t(lang,'success1yr'),`₹${(amount*365).toLocaleString('en-IN')}`],[t(lang,'successInvest'),t(lang,'successInvestVal')]].map(([l,v],i) => (
          <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom: i<2 ? '1px solid #f5f0ea' : 'none' }}>
            <span style={{ fontSize:13,color:'#555' }}>{l}</span>
            <span style={{ fontSize:13,fontWeight:700,color:'#1A7A4A' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:12,color:'#0E8C7A',marginTop:14,fontWeight:600 }}>🔐 {t(lang,'successTrust')}</div>
      <button onClick={onGoHome} style={{
        width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',marginTop:16,boxShadow:'0 4px 16px rgba(232,101,10,0.3)',
      }}>{t(lang,'successCta')} →</button>
    </div>
  );
};

Object.assign(window, { AutopilotScreen, CommitmentScreen, MandateScreen, SuccessScreen });
