/* Splash + Language + Phone/OTP — v2 with animations & i18n */

const SplashScreen = ({ lang, onNext }) => {
  const [act, setAct] = React.useState(0);
  const [coins, setCoins] = React.useState([]);

  React.useEffect(() => {
    const t1 = setTimeout(() => setAct(1), 2500);
    const t2 = setTimeout(() => { setAct(2); startCoins(); }, 6000);
    const t3 = setTimeout(() => setAct(3), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const startCoins = () => {
    let id = 0;
    const iv = setInterval(() => {
      setCoins(c => [...c, { id: id++, left: 35 + Math.random()*30, delay: Math.random()*0.3 }]);
      if (id > 6) clearInterval(iv);
    }, 400);
  };

  return (
    <div style={{ width:'100%',height:'100%',background:'linear-gradient(180deg,#2a1400 0%,#0d0700 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',fontFamily:"'Nunito',sans-serif" }}>
      <button onClick={onNext} style={{ position:'absolute',top:12,right:16,color:'#D4A017',background:'none',border:'none',fontSize:13,cursor:'pointer',opacity:0.7,zIndex:10 }}>Skip →</button>

      {/* Chiraiya flies in from right in Act 1, lands on GULLAK text in Act 3 */}
      <img src="assets/chiraiya-clean.png" alt="" style={{
        position:'absolute', width: act >= 3 ? 50 : 80, height: act >= 3 ? 50 : 65, objectFit:'contain',
        top: act < 1 ? '20%' : act < 3 ? '18%' : '52%',
        right: act < 1 ? '-80px' : act < 3 ? '10%' : undefined,
        left: act >= 3 ? '50%' : undefined,
        transform: act >= 3 ? 'translateX(20px) scaleX(-1)' : 'none',
        transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: act >= 1 ? 1 : 0,
        zIndex: 5,
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
      }} />

      {/* Gullak pot */}
      <div style={{ position:'relative', zIndex:2 }}>
        <img src="assets/gullak-clean.png" alt="Gullak" style={{
          width: 150, height: 120, objectFit:'contain',
          animation: act === 0 ? 'dropIn 0.8s ease-out forwards' : 'gentleFloat 3s ease-in-out infinite',
          filter: act >= 2 ? 'drop-shadow(0 0 25px rgba(212,160,23,0.5))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          transition: 'filter 1s ease',
        }} />
        {/* Gold coins pouring in */}
        {coins.map(c => (
          <div key={c.id} style={{
            position:'absolute', top: -20, left: `${c.left}%`,
            width: 14, height: 14, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017, #a07800)',
            border: '1.5px solid #c49a00',
            animation: `coinDrop 0.8s ease-in ${c.delay}s forwards`,
            opacity: 0, zIndex: 3,
            boxShadow: '0 0 6px rgba(212,160,23,0.6)',
          }}></div>
        ))}
      </div>

      {/* App name */}
      <div style={{
        fontFamily:"'Tiro Devanagari Hindi',serif", fontSize:34, fontWeight:700,
        color:'#E8650A', letterSpacing:6, marginTop:12,
        opacity: act >= 0 ? 1 : 0, transition:'opacity 0.8s ease',
        textShadow: '0 2px 10px rgba(232,101,10,0.3)',
        position: 'relative', zIndex: 1,
      }}>GULLAK</div>

      {/* Tagline */}
      <div style={{
        fontFamily:"'Tiro Devanagari Hindi',serif", fontSize:15, color:'#D4A017',
        marginTop:6, opacity: act >= 0 ? 1 : 0, transition:'opacity 1s ease 0.5s',
      }}>{t(lang, 'splashTagline')}</div>

      {/* Act 2 - problem */}
      <div style={{
        position:'absolute', bottom:140, left:0, right:0, textAlign:'center',
        color:'#FFF8F0', fontSize:14, fontStyle:'italic', padding:'0 28px',
        opacity: act === 1 || act === 2 ? 1 : 0, transition:'opacity 0.8s ease',
        lineHeight: 1.5,
      }}>{t(lang, 'splashAct2')}</div>

      {/* Act 3 - Savestment reveal */}
      <div style={{
        position:'absolute', bottom:50, left:0, right:0, textAlign:'center', padding:'0 24px',
        opacity: act >= 2 ? 1 : 0, transition:'opacity 0.8s ease',
      }}>
        <div style={{
          fontSize: act >= 3 ? 24 : 18, fontWeight:800, letterSpacing:3,
          background:'linear-gradient(90deg,#E8650A,#D4A017,#E8650A)',
          backgroundSize:'200% auto', animation:'shimmer 2s linear infinite',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          transition:'font-size 0.6s ease',
        }}>SAVESTMENT</div>
        <div style={{ color:'#FFF8F0', fontSize:12, marginTop:6, lineHeight:1.4 }}>
          {t(lang, 'splashAct3sub')}
        </div>
        <button onClick={onNext} style={{
          marginTop:16, padding:'14px 28px',
          background:'linear-gradient(135deg,#E8650A,#C4602A)',
          color:'#FFF8F0', border:'none', borderRadius:28, fontSize:15, fontWeight:700,
          cursor:'pointer', opacity: act >= 3 ? 1 : 0, transition:'opacity 0.6s ease',
          boxShadow:'0 4px 20px rgba(232,101,10,0.4)',
        }}>{t(lang, 'splashCta')}</button>
      </div>
    </div>
  );
};

const LanguageScreen = ({ onSelect }) => {
  const languages = [
    { code:'en', label:'English', native:'English', flag:'🇬🇧' },
    { code:'hi', label:'Hindi', native:'हिन्दी', flag:'🇮🇳' },
    { code:'pa', label:'Punjabi', native:'ਪੰਜਾਬੀ', flag:'🇮🇳' },
    { code:'kn', label:'Kannada', native:'ಕನ್ನಡ', flag:'🇮🇳' },
  ];
  const [hov, setHov] = React.useState(null);

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'32px 24px 16px',textAlign:'center' }}>
        <div style={{ position:'relative', display:'inline-block' }}>
          <img src="assets/gullak-clean.png" alt="" style={{ width:80,height:65,objectFit:'contain' }} />
          <img src="assets/chiraiya-clean.png" alt="" style={{ position:'absolute',top:-10,right:-30,width:40,height:35,objectFit:'contain',transform:'scaleX(-1)',animation:'gentleFloat 2s ease-in-out infinite' }} />
        </div>
        <div style={{ fontSize:22,fontWeight:800,color:'#3E1F00',marginTop:8 }}>Choose Your Language</div>
        <div style={{ fontSize:13,color:'#555',marginTop:4 }}>अपनी भाषा चुनें · ਆਪਣੀ ಭಾಷೆ ಆಯ್ಕೆ</div>
      </div>
      <div style={{ padding:'0 24px',display:'flex',flexDirection:'column',gap:12,flex:1 }}>
        {languages.map((l,i) => (
          <div key={l.code} style={{
            display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'16px 20px',background: hov===l.code ? '#FFF5EC' : '#fff',
            border: hov===l.code ? '2px solid #E8650A' : '2px solid #f0e6d9',
            borderRadius:16,cursor:'pointer',transition:'all 0.25s ease',
            animation: `slideUp 0.4s ease-out ${i*0.08}s both`,
          }}
            onClick={() => onSelect(l.code)}
            onMouseEnter={() => setHov(l.code)} onMouseLeave={() => setHov(null)}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:22 }}>{l.flag}</span>
              <span style={{ fontSize:16,fontWeight:700,color:'#3E1F00' }}>{l.label}</span>
            </div>
            <span style={{ fontSize:15,color:'#C4602A',fontWeight:600 }}>{l.native}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:'16px 24px',textAlign:'center',fontSize:11,color:'#0E8C7A',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
        <span style={{ fontWeight:700 }}>🔒</span> 100% Safe | RBI Regulated Partners
      </div>
    </div>
  );
};

const PhoneOTPScreen = ({ lang, onComplete }) => {
  const [step, setStep] = React.useState('phone');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSendOTP = () => {
    if (phone.length !== 10) { setError(t(lang,'phoneBad')); return; }
    setError(''); setStep('otp');
  };
  const handleVerify = () => {
    if (otp === '123456') onComplete(phone);
    else setError(t(lang,'otpWrong'));
  };

  return (
    <div style={{ width:'100%',height:'100%',background:'#FFF8F0',display:'flex',flexDirection:'column',fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ padding:'32px 24px 16px',display:'flex',flexDirection:'column',alignItems:'center' }}>
        <img src="assets/chiraiya-clean.png" alt="" style={{ width:90,height:75,objectFit:'contain',animation:'gentleFloat 2.5s ease-in-out infinite',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }} />
        <div style={{ fontSize:20,fontWeight:800,color:'#3E1F00',textAlign:'center',marginTop:8 }}>
          {step === 'phone' ? t(lang,'phoneTitle') : t(lang,'otpTitle')}
        </div>
        <div style={{ fontSize:13,color:'#555',marginTop:4,textAlign:'center' }}>
          {step === 'phone' ? t(lang,'phoneSub') : `${phone} ${t(lang,'phoneSentTo')}`}
        </div>
      </div>
      <div style={{ padding:'24px',flex:1 }}>
        {step === 'phone' ? (
          <div style={{ animation:'slideUp 0.3s ease-out' }}>
            <div style={{ display:'flex',alignItems:'center',background:'#fff',border:'2px solid #f0e6d9',borderRadius:14,padding:'0 16px' }}>
              <span style={{ fontSize:16,fontWeight:700,color:'#3E1F00',marginRight:8 }}>+91</span>
              <input style={{ flex:1,border:'none',outline:'none',fontSize:18,fontWeight:600,padding:'14px 0',background:'transparent',color:'#3E1F00',fontFamily:"'Nunito',sans-serif" }}
                type="tel" maxLength={10} placeholder="9876543210"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} />
            </div>
            {error && <div style={{ color:'#C0392B',fontSize:12,marginTop:6 }}>{error}</div>}
            <button style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',marginTop:12,boxShadow:'0 4px 16px rgba(232,101,10,0.3)',opacity:phone.length===10?1:0.5,transition:'opacity 0.3s' }}
              onClick={handleSendOTP}>{t(lang,'sendOtp')} →</button>
          </div>
        ) : (
          <div style={{ animation:'slideUp 0.3s ease-out' }}>
            <div style={{ display:'flex',alignItems:'center',background:'#fff',border:'2px solid #f0e6d9',borderRadius:14,padding:'0 16px' }}>
              <input style={{ flex:1,border:'none',outline:'none',fontSize:22,fontWeight:600,padding:'14px 0',background:'transparent',color:'#3E1F00',fontFamily:"'Nunito',sans-serif",letterSpacing:10,textAlign:'center' }}
                type="tel" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} />
            </div>
            {error && <div style={{ color:'#C0392B',fontSize:12,marginTop:6 }}>{error}</div>}
            <button style={{ width:'100%',padding:'15px',background:'linear-gradient(135deg,#E8650A,#C4602A)',color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',marginTop:12,boxShadow:'0 4px 16px rgba(232,101,10,0.3)',opacity:otp.length===6?1:0.5,transition:'opacity 0.3s' }}
              onClick={handleVerify}>{t(lang,'verify')} ✓</button>
            <div style={{ fontSize:12,color:'#888',marginTop:8,textAlign:'center' }}>{t(lang,'otpHint')}</div>
          </div>
        )}
      </div>
      <div style={{ padding:'12px 24px',textAlign:'center',fontSize:11,color:'#0E8C7A' }}>🔒 {t(lang,'phoneHint')}</div>
    </div>
  );
};

Object.assign(window, { SplashScreen, LanguageScreen, PhoneOTPScreen });
