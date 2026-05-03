/* Profile + Trust + Goals — v2 with i18n, info tooltips, animations */

const ProfileScreen = ({ lang, onComplete }) => {
  const [name, setName] = React.useState('');
  const [salaryDay, setSalaryDay] = React.useState(1);
  const [step, setStep] = React.useState('name');

  const btn = { width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',marginTop:20,boxShadow:'0 4px 16px rgba(232,101,10,0.3)' };
  const trust = { padding:'12px 24px',textAlign:'center',fontSize:11,color:'#0E8C7A' };

  if (step === 'name') {
    return (
      <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
        <div style={{ padding:'32px 24px 16px',display:'flex',flexDirection:'column',alignItems:'center' }}>
          <img src="assets/chiraiya-clean.png" alt="" style={{ width:85,height:70,objectFit:'contain',animation:'gentleFloat 2.5s ease-in-out infinite',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }} />
          <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00',textAlign:'center',marginTop:8 }}>{t(lang,'nameTitle')}</div>
          <div style={{ fontSize:13,color:'#555',marginTop:4,textAlign:'center' }}>{t(lang,'nameSub')}</div>
        </div>
        <div style={{ padding:'24px',flex:1,animation:'slideUp 0.35s ease-out' }}>
          <label style={{ fontSize:13,fontWeight:700,color:'#3E1F00',marginBottom:6,display:'block' }}>{t(lang,'nameLabel')}</label>
          <input style={{ width:'100%',padding:'14px 16px',border:'2px solid #f0e6d9',borderRadius:14,fontSize:16,fontWeight:600,color:'#3E1F00',background:'#fff',outline:'none',fontFamily:"'Nunito',sans-serif",boxSizing:'border-box' }}
            placeholder={t(lang,'namePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
          <button style={{...btn,opacity:name.length>1?1:0.5,transition:'opacity 0.3s'}} onClick={() => name.length>1 && setStep('salary')}>
            {t(lang,'next')} →
          </button>
        </div>
        <div style={trust}>🔒 100% Safe | RBI Regulated Partners</div>
      </div>
    );
  }

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'32px 24px 16px',display:'flex',flexDirection:'column',alignItems:'center' }}>
        <img src="assets/chiraiya-clean.png" alt="" style={{ width:85,height:70,objectFit:'contain',animation:'gentleFloat 2.5s ease-in-out infinite',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }} />
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00',textAlign:'center',marginTop:8 }}>{name}{t(lang,'salaryTitle')}</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4,textAlign:'center' }}>{t(lang,'salarySub')}</div>
      </div>
      <div style={{ padding:'24px',flex:1,animation:'slideUp 0.35s ease-out' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:8 }}>
          {[1,5,7,10,15,20,25,28].map(d => (
            <button key={d} onClick={() => setSalaryDay(d)} style={{
              width:'100%',height:44,borderRadius:12,
              border: salaryDay===d ? '2px solid #E8650A' : '2px solid #f0e6d9',
              background: salaryDay===d ? '#E8650A' : '#fff',
              color: salaryDay===d ? '#fff' : '#3E1F00',
              fontSize:15,fontWeight:700,cursor:'pointer',transition:'all 0.2s',
            }}>{d}</button>
          ))}
        </div>
        <button style={btn} onClick={() => onComplete(name, salaryDay)}>
          {t(lang,'confirm')} ✓
        </button>
      </div>
      <div style={trust}>🔒 100% Safe | RBI Regulated Partners</div>
    </div>
  );
};

const TrustScreen = ({ lang, userName, onNext }) => {
  const [infoOpen, setInfoOpen] = React.useState(false);

  const trustItems = [
    { icon:'🏛️', bg:'#e6f7f4', titleKey:'trust1t', descKey:'trust1d' },
    { icon:'🔐', bg:'#FFF5EC', titleKey:'trust2t', descKey:'trust2d' },
    { icon:'📊', bg:'#f0f7e6', titleKey:'trust3t', descKey:'trust3d', hasInfo:true },
    { icon:'🏺', bg:'#FFF5EC', titleKey:'trust4t', descKey:'trust4d' },
    { icon:'🛡️', bg:'#e6f7f4', titleKey:'trust5t', descKey:'trust5d' },
  ];

  return (
    <div style={{ width:'100%',height:'100%',background:'linear-gradient(180deg,#FFF8F0 0%,#FFF2E5 100%)',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'24px 24px 8px',textAlign:'center' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'#e6f7f4',padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:700,color:'#0E8C7A',marginBottom:12 }}>
          🛡️ {t(lang,'trustBadge')}
        </div>
        <div style={{ fontSize:21,fontWeight:800,color:'#3E1F00',lineHeight:1.3 }}>
          {userName}{t(lang,'trustTitle')}
        </div>
      </div>
      <div style={{ padding:'12px 18px',flex:1,display:'flex',flexDirection:'column',gap:10,overflowY:'auto' }}>
        {trustItems.map((item, i) => (
          <div key={i} style={{
            background:'#fff',borderRadius:14,padding:'14px',border:'1px solid #f0e6d9',
            display:'flex',gap:12,alignItems:'flex-start',
            animation: `slideUp 0.35s ease-out ${i*0.07}s both`,
            position:'relative',
          }}>
            <div style={{ width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,background:item.bg }}>{item.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#3E1F00',display:'flex',alignItems:'center',gap:6 }}>
                {t(lang, item.titleKey)}
                {item.hasInfo && (
                  <span onClick={(e) => { e.stopPropagation(); setInfoOpen(!infoOpen); }} style={{
                    width:18,height:18,borderRadius:'50%',background:'#0E8C7A',color:'#fff',
                    fontSize:11,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center',
                    cursor:'pointer',flexShrink:0,
                  }}>i</span>
                )}
              </div>
              <div style={{ fontSize:11,color:'#555',marginTop:2,lineHeight:1.4 }}>{t(lang, item.descKey)}</div>
              {/* AAA info tooltip */}
              {item.hasInfo && infoOpen && (
                <div style={{
                  marginTop:8,padding:'10px 12px',background:'#e6f7f4',borderRadius:10,
                  fontSize:11,color:'#0E8C7A',lineHeight:1.5,fontWeight:500,
                  animation:'fadeIn 0.25s ease-out',
                  border:'1px solid #b8e6dc',
                }}>
                  {t(lang,'trust3info')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 24px' }}>
        <button onClick={onNext} style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(232,101,10,0.3)' }}>
          {t(lang,'trustCta')} →
        </button>
        <div style={{ textAlign:'center',fontSize:11,color:'#0E8C7A',marginTop:8 }}>{t(lang,'trustFooter')}</div>
      </div>
    </div>
  );
};

const GoalScreen = ({ lang, onSelect }) => {
  const [hov, setHov] = React.useState(null);
  const goals = [
    { id:'wedding', emoji:'💍', sub:'₹5L–₹40L' },
    { id:'home', emoji:'🏠', sub:'₹5L–₹30L' },
    { id:'car', emoji:'🚗', sub:'₹50K–₹15L' },
    { id:'emi', emoji:'📋', sub:'₹20K–₹5L' },
    { id:'emergency', emoji:'🛡️', sub:'₹25K–₹2L' },
    { id:'education', emoji:'🎓', sub:'₹2L–₹20L' },
    { id:'festival', emoji:'🪔', sub:'₹5K–₹50K' },
    { id:'travel', emoji:'✈️', sub:'₹20K–₹2L' },
    { id:'gold', emoji:'✨', sub:'₹30K–₹5L' },
  ];
  const gl = GOAL_LABELS[lang] || GOAL_LABELS.en;

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'24px 24px 8px',textAlign:'center' }}>
        <div style={{ position:'relative',display:'inline-block' }}>
          <img src="assets/chiraiya-clean.png" alt="" style={{ width:70,height:55,objectFit:'contain',animation:'gentleFloat 2s ease-in-out infinite',filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }} />
        </div>
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00',marginTop:4 }}>{t(lang,'goalTitle')}</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4 }}>{t(lang,'goalSub')}</div>
      </div>
      <div style={{ padding:'8px 18px',flex:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,overflowY:'auto',alignContent:'start' }}>
        {goals.map((g,i) => (
          <div key={g.id} style={{
            display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 4px',
            background: hov===g.id ? '#FFF5EC' : '#fff',
            border: hov===g.id ? '2px solid #E8650A' : '2px solid #f0e6d9',
            borderRadius:16,cursor:'pointer',transition:'all 0.2s',gap:4,
            animation: `slideUp 0.3s ease-out ${i*0.04}s both`,
          }}
            onClick={() => onSelect({...g, label: gl[g.id]})}
            onMouseEnter={() => setHov(g.id)} onMouseLeave={() => setHov(null)}>
            <div style={{ fontSize:28 }}>{g.emoji}</div>
            <div style={{ fontSize:12,fontWeight:700,color:'#3E1F00',textAlign:'center' }}>{gl[g.id]}</div>
            <div style={{ fontSize:10,color:'#888' }}>{g.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'10px 24px',textAlign:'center',fontSize:11,color:'#0E8C7A' }}>🔒 100% Safe | RBI Regulated Partners</div>
    </div>
  );
};

Object.assign(window, { ProfileScreen, TrustScreen, GoalScreen });
