

**GULLAK**

*नए ज़माने की पुरानी आदत*

**CLAUDE CODE — MASTER PRODUCT REBUILD PROMPT**

Complete Engineering & Design Roadmap | v2.0

Prepared for: Claude Code  |  Classification: Confidential Product Strategy

# **HOW TO USE THIS DOCUMENT**

|   📖  INSTRUCTIONS FOR CLAUDE CODE |
| :---- |
| This document is a precision-engineered directive for Claude Code to rebuild the Gullak app from near-scratch. |
| Every section is a standalone instruction module. Read ALL sections before writing a single line of code. |
| The attached images (Gullak Piggy Bank \+ Chiraiya the Sparrow) are MANDATORY design assets — extract their visual identity. |
| The two PDFs (Savestment Canvas v2 & Mascot Architecture v1) are canonical strategy docs. Never contradict them. |
| Priority order: Safety/Regulatory \> Trust Architecture \> Mascot System \> UI/UX \> Feature Logic. |

**This document is structured as follows:**

| Section | Title | Purpose |
| :---- | :---- | :---- |
| Section 0 | How To Use This Document | Reading guide & priority ordering |
| Section 1 | Product Identity & Brand System | Logo, tagline, Savestment USP, color system |
| Section 2 | Splash Screen & Onboarding | Launch experience, trust-building flow |
| Section 3 | Mascot System — Chiraiya | Animation states, all sparrow poses across app |
| Section 4 | Dashboard Rebuild — V1 Thesis | Complete screen-by-screen layout specification |
| Section 5 | Onboarding Flow Overhaul | Cognitive load reduction, commitment moment |
| Section 6 | Goal Engine & Smart Amounts | Goal categories, default amounts, credit layer |
| Section 7 | Trust Architecture | Regulatory copy, transparency mechanics |
| Section 8 | Language & Localisation | Full script consistency, Hindi/Hinglish rules |
| Section 9 | Color & Theme System | Coherent visual design tokens |
| Section 10 | Credit Feature — New Addition | Car/bike/gold loan cross-sell layer |
| Section 11 | Animation Spec Library | All specific animations, triggers, timings |
| Section 12 | Acceptance Criteria | Definition of Done for each module |

# **SECTION 1 — PRODUCT IDENTITY & BRAND SYSTEM**

## **1.1  App Name, Logo & Visual Identity**

The app is named GULLAK. The logo IS the traditional Indian earthen Gullak (piggy bank). Refer to the attached image 'Traditional Indian Gullak' — this terracotta pot with a coin slot IS the primary logo mark.

|   🏺  LOGO SPECIFICATION |
| :---- |
| Logo Mark: The 3D terracotta earthen Gullak from the attached image — warm brown, rounded, with a coin slot on top. |
| Companion Mark: A feather (sparrow feather) floating near the Gullak — this ties the mascot to the logo. |
| Typography: App name 'GULLAK' in bold, grounded serif or semi-rounded sans (NOT tech-cold fonts). |
| The logo must feel: warm, familiar, trustworthy, indigenous, hopeful — NOT corporate fintech. |
| DO NOT use generic coin/graph icons. The earthen pot IS the differentiator. |

## **1.2  The Savestment USP — Core Vocabulary Rule**

CRITICAL: The word 'Savestment' is a proprietary invented term that IS the product's USP. It must appear throughout the app. Never replace it with generic terms.

| ❌ NEVER USE | ✅ ALWAYS USE |
| :---- | :---- |
| Smart Savings | Savestment |
| Invest Daily | Savestment karo |
| Save & Grow | Savestment se badhao |
| Smart Investment | Aapka Savestment |
| Savings Plan | Savestment Plan |

|   💡  SAVESTMENT DEFINITION & USAGE RULES |
| :---- |
| Definition to embed in app copy: 'Savestment \= Aap save karo, hum invest karein. Sirf saving nahi — growth.' |
| First appearance: Splash screen (after logo animation), as part of the reveal sequence. |
| The model: User saves small daily amounts → we route to AAA-rated bonds / govt securities / gold bonds → user earns returns far above 3% savings account → all frictionlessly. |
| NEVER promise specific return percentages. Say 'savings account se zyada' or 'AAA-rated securities mein'. |

## **1.3  Taglines**

| Placement | Copy |
| :---- | :---- |
| Primary Tagline (Hindi) | नए ज़माने की पुरानी आदत |
| Primary Tagline (English transliteration) | Naye zamaane ki puraani aadat |
| Savestment Byline | Sirf save nahi — Savestment karo |
| Trust Anchor Line | Aapka paisa aapke naam par invest hota hai |
| Withdrawal Line | Todna aasan, nikalna aasan |
| Habit Loop Line | Roz thoda, kal bada |

# **SECTION 2 — SPLASH SCREEN & APP LAUNCH EXPERIENCE**

## **2.1  The 3-Act Splash Sequence**

The splash screen is the product's first psychological handshake. It must deliver: brand recall → problem awareness → Savestment promise — in under 20 seconds, zero interaction required.

| Act / Timing | Visual & Animation | Copy & Psychology |
| :---- | :---- | :---- |
| ACT 1(0–3 seconds)Cultural Anchor | Black/dark warm screen fades in. The 3D terracotta Gullak drops in from above with a satisfying clay-thud micro-animation. It settles on a wooden surface (ref: attached image). A subtle golden 'shine' sweeps across it. App name 'GULLAK' fades in below in warm saffron. | Copy: 'नए ज़माने की पुरानी आदत'Psychology: Zero-cost brand recall. Triggers deep nostalgia \+ inherent trust. User's brain pattern-matches to childhood Gullak. |
| ACT 2(4–10 seconds)Problem Statement | The Gullak shakes gently. A coin drops in — but stays static. Chiraiya the sparrow peeks in from the side of screen, head tilted, looking at the static coin with curiosity. | Copy: 'Mitti ke Gullak mein paisa sirf aaram karta hai...'Psychology: Gently challenges idle savings without being preachy. Sparrow's curiosity \= user's unspoken question. |
| ACT 3(11–20 seconds)Savestment Reveal | The earthen Gullak smoothly morphs into a glowing digital version (same shape, now with golden shimmer lines). A green micro-chart sprouts from it. The words 'Save' and 'Invest' merge on screen to form 'SAVESTMENT'. Chiraiya picks up a coin in her beak and drops it into the digital Gullak — she does a happy flutter. | Copy: '...Digital Gullak mein paisa kaam karta hai. Sirf save nahi — Savestment karein.'CTA: 'Apna Digital Gullak Banayein'Psychology: The morph connects old trust to new utility. Savestment reveal \= product promise crystallized. |

## **2.2  Onboarding Flow Redesign — Cognitive Load Reduction**

|   ⚠️  CURRENT PROBLEM & SOLUTION DIRECTIVE |
| :---- |
| PROBLEM: The current onboarding has too many inputs. It creates cognitive overload and drop-off. |
| SOLUTION: Split into 3 micro-phases. Each phase has ONE commitment action. Never more than 2 inputs per screen. |
| RULE: Always show Chiraiya in a 'thinking pose' (wings around face) whenever asking for user input. |

| Phase | Screens & Inputs | Chiraiya Pose |
| :---- | :---- | :---- |
| Phase 1: Identity(2 screens max) | Screen 1: Name \+ Mobile. Screen 2: OTP. — That's it. No DOB, no email at this stage. | Curious head tilt, one wing extended toward input field |
| Phase 2: First Goal(2 screens max) | Screen 1: 'Kisliye bachana chahte ho?' — show 6 goal tiles (wedding, car, home, EMI, emergency, other). Screen 2: Confirm amount \+ timeline using smart defaults (see Section 6). | Excited — bouncing on branch, pointing at goal tiles |
| Phase 3: First Commitment(The Trust Moment — 1 screen) | UPI mandate setup. Show EXACTLY what will happen: 'Roz ₹20 aapke account se jayenge. Jab chahein rok sakte ho.' — Show a live preview of first ₹20 moving from bank icon → Gullak. Chiraiya carries the coin. | Flying with coin in beak toward Gullak |
| Phase 4: KYC (Deferred) | Do NOT block onboarding with KYC. Collect after first successful save. Show progress bar: 'Gullak unlock karo — KYC karein'. | Sleeping on branch (idle, non-threatening) |

## **2.3  First Commitment Moment — 'The Trust Click'**

|   ✅  FIRST COMMITMENT MOMENT SPECIFICATION |
| :---- |
| This is the most critical screen in the entire app. It must DO what Zerodha and Groww do: show the user their money MOVING. |
| Animation: Bank account icon (left) → animated rupee coin flows rightward → enters the Gullak (right). Chiraiya carries the coin mid-flight. |
| Text above animation: 'Aapka pehla Savestment shuru ho raha hai...' |
| Text below: 'AAA-rated securities mein invest ho raha hai — 100% safe, RBI regulated' |
| After mandate success: Gullak glows. Chiraiya does a celebration flutter. Confetti in saffron/gold colors. |
| Copy: 'Mubarak ho\! Aapka Gullak zinda ho gaya.' with a ticker showing projected annual growth. |

# **SECTION 3 — MASCOT SYSTEM: CHIRAIYA THE SPARROW**

The sparrow mascot (named Chiraiya) is visible in the attached image. She is a warm-brown Indian sparrow with white breast, expressive eyes, and an orange-yellow beak. She is NOT generic — she is specific, hand-crafted, and carries the brand's emotional layer.

|   🐦  CHIRAIYA — CANONICAL IDENTITY RULES |
| :---- |
| The mascot PDF (Mascot Architecture v1) suggested a geometric entity — OVERRIDE THIS with the Chiraiya sparrow from the attached image. |
| Chiraiya must appear across ALL key screens. She is the emotional glue of the product. |
| Animation style: Fluid, warm, slightly cartoon-realistic — NOT flat/minimal, NOT hyper-animated. |
| The sparrow has a companion: baby sparrows (chicks) that appear on milestone celebrations. |

## **3.1  Chiraiya State Matrix — All Animation Poses**

| App Event / State | Chiraiya Action & Animation | Copy Trigger |
| :---- | :---- | :---- |
| App Launch / Idle | Perched on a branch, eyes blinking slowly, tail twitching. Peaceful idle loop. | No copy — ambient presence |
| User Input Required | Wings wrap around her face — 'thinking pose'. Head tilts. One feather raised like a question mark. | 'Batao, hum shuruaat karein?' |
| Daily Save Successful | Picks up gold coin in beak, flies a small arc, drops it into the Gullak with a satisfying 'clink'. | 'Aaj ki savestment pakki\! ₹20 safe hai.' |
| Streak (3+ days) | Hops left-right excitedly on branch. Baby chicks cheer in background. | '3 din se lag raho ho — kya baat hai\!' |
| Milestone Hit (Goal 25%/50%/100%) | Circles the Gullak triumphantly, wings spread wide. Chicks fly around Gullak. | 'Manzil ke paas aa rahe ho\! Gullak bhar raha hai.' |
| Processing / Loading | Slow rhythmic wing-flap while perched. Eyes look side to side. | 'Bas ek second, Gullak update ho raha hai...' |
| Transaction Failed / Error | Stands protectively in front of Gullak. Wings slightly spread. Firm, protective stance. | 'Paisa 100% safe hai. Kuch nahi kata.' |
| Withdrawal Requested | Looks at Gullak lovingly, then at user, nods. Holds a small calendar in claw. | 'Process ho gaya\! Kal tak paisa bank mein hoga.' |
| User Withdraws / Goal Complete | Chiraiya taps Gullak with beak — it cracks open dramatically. Coins rain down. Baby chicks jump on coins. Confetti. | 'Badhaai ho\! Aapka sapna poora hua\!' |
| User Inactive (2+ days) | Chiraiya sits facing away, looking droopy. Turns head to peek at user. | 'Aapka Gullak aapka intezaar kar raha hai...' |
| Support Needed | Chiraiya extends one wing toward a chat bubble icon. Soft, inviting gesture. | 'Main yahaan hoon. Team se baat karein?' |
| KYC Pending | Chiraiya holds a small 'ID card' icon and points to it. | 'Gullak unlock karne ke liye ek kaam bacha hai.' |
| New Feature Discovery | Chiraiya holds a small lantern, illuminating the feature. | 'Naya feature\! Aapke kaam ka hai.' |
| Credit Pre-approval | Chiraiya drops a small golden key into user's palm animation. | 'Aapke liye ek special offer hai — dekhein?' |

## **3.2  The Gullak Break Animation — Withdrawal**

|   ✨  WITHDRAWAL ANIMATION SPEC |
| :---- |
| This is the app's most delightful animation. Build it with care. |
| Trigger: User confirms a withdrawal. |
| Animation: Chiraiya approaches Gullak, gives it ONE precise tap with her beak. |
| The Gullak cracks in a satisfying cartoon-physics way (not violent — joyful, like breaking a pinata). |
| Gold coins, rupee notes, and a shower of saffron-gold confetti burst out. |
| Baby chicks jump around in excitement. |
| Duration: 2.5 seconds. Skippable with tap. |
| Post-animation copy: 'Aapke sapne ki value: ₹X — Bank mein T+1 din mein' |

# **SECTION 4 — DASHBOARD REBUILD: V1 THESIS**

The dashboard must answer one question in under 3 seconds: 'Mera paisa jama ho raha hai, badh raha hai, aur control mere paas hai.' Every element serves this north star.

## **4.1  Dashboard Layout Architecture**

| Screen Zone (% of height) | Content Block & Purpose |
| :---- | :---- |
| Zone A — Top 5%(Fixed Trust Strip) | App logo (left) | One-tap support call (right) | Persistent microcopy: 'Aapka paisa aapke naam par invest hota hai' |
| Zone B — Next 25%(Financial Motion) | SINGLE smooth line chart: Total Savestment balance over time. Toggle pills: Balance | Saved | Munafa. Tap any point: '₹20 add hua \+ ₹2 munafa'. Label: 'Aapka Savestment kaise badh raha hai'. Calm green line, NO jagged axes. |
| Zone C — Next 20%(Emotional Anchor) | Gullak (center) showing ₹ Total Saved in large bold. Subtext: 'Total jama'. Chiraiya animation (context-aware state). Secondary: 'Aaj tak aapne itna save kiya hai'. |
| Zone D — Next 10%(Growth Card) | ₹X Munafa this month. Subtext: 'Aapka paisa invest hone ki wajah se badh raha hai'. Small line: 'Savings account se zyada'. |
| Zone E — Next 15%(Primary Goal Card) | Goal name. Progress ring/bar. ₹ saved / ₹ target. 'Bas ₹X aur'. ETA: 'Is speed se \~N mahine lagenge'. |
| Zone F — Next 10%(Next Action Card) | If upcoming: 'Kal ₹20 automatically add hoga'. If done today: 'Aaj ka Savestment ho chuka hai ✓'. Habit reinforcement. |
| Zone G — Next 10%(Transparency Layer) | Last 3 transactions only. Each row: amount \+ date \+ type (Daily / Round-up / Sweep). CTA: 'Sab dekhein →' |
| Zone H — Next 3%(Single Nudge) | ONE contextual nudge: '₹20 se ₹30 karein to goal jaldi hoga'. CTA: 'Badhao →'. Only one nudge maximum. |
| Zone I — Bottom 2%(Controls) | Support | Help | Settings — intentionally at bottom. Slight friction \= correct. |

## **4.2  Chart Deep Design Rules**

|   📈  CHART DESIGN RULES — NON-NEGOTIABLE |
| :---- |
| Chart type: Single smooth line chart (NOT candlestick, NOT bar chart, NOT pie). |
| Color: Calm teal-to-green gradient fill under the line. |
| NO percentage signs on the chart surface. NO complex axes by default. |
| Tap-to-reveal: User taps any point → small pill appears: '₹20 save \+ ₹2 munafa' for that date. |
| Toggle pills (small, above chart): 'Balance' (default active) | 'Saved' | 'Munafa'. |
| Never show volatility or dips prominently. The chart MUST feel like steady progress. |
| DO NOT show portfolio-style NAV numbers. This is not Zerodha. Keep it simple. |

## **4.3  Dynamic Motivational Copy System**

Below the chart or near the goal card, show ONE rotating contextual motivational line. Examples:

| Trigger Context | Copy (Hindi) |
| :---- | :---- |
| New user (0–7 days) | Chhota shuru kiya hai, lekin yeh badh raha hai — bas consistency chahiye. |
| Streak active | Roz ₹20 se bhi bada fund banta hai — aap sahi raaste par hain. |
| Goal 50% reached | Aadhi manzil par ho — aage badhte raho\! |
| Nudge to increase amount | Aaj thoda aur add karoge to kal ka goal aur paas aayega. |
| Passive reassurance | Aapka paisa kaam kar raha hai — aap sirf habit banaye rakho. |
| Post-withdrawal | Ek sapna poora hua. Ab agla Gullak banao\! |

# **SECTION 5 — GOAL ENGINE & SMART AMOUNT DEFAULTS**

## **5.1  Goal Categories with Realistic Default Amounts**

CRITICAL ISSUE IN V1: The suggested amounts were unrealistically low. The table below specifies correct defaults for Bharat-level users.

| Goal Category | Realistic Amount Range (INR) | Smart Default & Daily Save Suggestion |
| :---- | :---- | :---- |
| Family Wedding | ₹5 Lakhs — ₹40 Lakhs | Default: ₹10L. Daily save: ₹200–₹500 |
| Own Wedding | ₹3 Lakhs — ₹15 Lakhs | Default: ₹5L. Daily save: ₹100–₹300 |
| Home Purchase / Down Payment | ₹5 Lakhs — ₹30 Lakhs (for down payment) | Default: ₹10L. Daily save: ₹500–₹2000 |
| Car Purchase | ₹3 Lakhs — ₹15 Lakhs | Default: ₹5L. Daily save: ₹100–₹300 |
| Bike Purchase | ₹50,000 — ₹3 Lakhs | Default: ₹1L. Daily save: ₹50–₹150 |
| EMI Prepayment | ₹20,000 — ₹5 Lakhs | Default: ₹1L. Daily save: ₹50–₹200 |
| Child's Education | ₹2 Lakhs — ₹20 Lakhs | Default: ₹5L. Daily save: ₹100–₹500 |
| Emergency Fund | ₹25,000 — ₹2 Lakhs | Default: ₹50K. Daily save: ₹30–₹100 |
| Festival/Puja | ₹5,000 — ₹50,000 | Default: ₹15K. Daily save: ₹20–₹100 |
| Travel/Vacation | ₹20,000 — ₹2 Lakhs | Default: ₹50K. Daily save: ₹50–₹200 |
| Gold Purchase | ₹30,000 — ₹5 Lakhs | Default: ₹1L. Daily save: ₹50–₹200 |
| Custom / Other | User defined | No default. Ask: 'Kitna chahiye?' with numeric slider. |

|   🎯  GOAL FEASIBILITY ENGINE RULES |
| :---- |
| GOAL FEASIBILITY ENGINE: When user selects goal \+ timeline, run a backend feasibility check. |
| If goal is NOT achievable at current savings rate → Chiraiya shows a calendar, NOT a warning. |
| Copy: 'Is speed se goal ₹X mahine mein hoga. Thoda aur bachane se ₹Y mahine ho sakta hai.' |
| NEVER say 'Not possible' or show red error states for goals. Always show a path forward. |
| For very short timelines (\< 30 days) with large amounts: 'Abhi ke liye credit option bhi dekh sakte ho.' |

# **SECTION 6 — TRUST ARCHITECTURE & REGULATORY COMPLIANCE**

## **6.1  Regulatory Copy Rules — Critical**

|   ⚠️  REGULATORY — MANDATORY COMPLIANCE RULES |
| :---- |
| REMOVE: Any copy that implies user can use their savings balance while it's deployed in investments. |
| Money CANNOT be in two places simultaneously. Do not imply it. |
| The model is: User's daily savings → routed to AAA-rated bonds / Govt Securities / Gold Bonds → user earns returns above savings account rate. |
| Investment allocation changes dynamically based on goal timeline (short goal \= more liquid/safer instruments, long goal \= slightly higher yield). |
| NEVER state specific return percentages (e.g., '12% returns'). Say 'savings account se zyada'. |
| Withdrawal \= T+1 settlement. Always communicate this proactively before withdrawal. |

## **6.2  Trust Signals to Embed Throughout App**

| Trust Signal | Placement & Implementation |
| :---- | :---- |
| '100% Safe | RBI Regulated Partners' | Top strip of every major screen. Small badge, always visible. |
| 'Todna aasan, nikalna aasan' | Shown on onboarding commitment screen AND withdrawal screen. |
| 'Aapka paisa aapke naam par invest hota hai' | Dashboard top strip. Persistent. Cannot be hidden. |
| Instrument Transparency (Tappable) | Chiraiya sits on 'Gullak Balance'. When user TAPS her, she 'unpacks' the balance showing which instruments hold the money (e.g., 'Govt Bond ₹450 | Gold Bond ₹200'). |
| Transaction Log | Every deduction shown with date, amount, type. Never hide a transaction. |
| Mandate Memory | 'Next auto-save: \[Date\] at \[Time\]' — always visible on dashboard. |

# **SECTION 7 — LANGUAGE & LOCALISATION SYSTEM**

## **7.1  Language Selection Rules**

|   🌐  LANGUAGE SYSTEM — NON-NEGOTIABLE RULES |
| :---- |
| RULE 1: Language selection happens at FIRST LAUNCH, before onboarding. Not buried in settings. |
| RULE 2: Once a language is selected, EVERY SINGLE STRING in the app must render in that language and script. |
| RULE 3: This is non-negotiable. If user selects Hindi — Devanagari script everywhere. Marathi — Marathi script. Tamil — Tamil script. |
| RULE 4: No 'partial' translations. Buttons, error messages, tooltips, Chiraiya's copy, everything. |
| RULE 5: The language of Chiraiya's motivational copy must also match. Pre-build all strings. |

## **7.2  Priority Language Support (Build Order)**

| Priority | Language |
| :---- | :---- |
| P0 (Launch) | Hindi (Devanagari) \+ English |
| P1 (60 days post-launch) | Hinglish (Roman Hindi — most urban Bharat users) |
| P2 (120 days) | Marathi, Bengali, Tamil, Telugu |
| P3 (180 days) | Gujarati, Kannada, Odia, Punjabi |

## **7.3  Hinglish Tone Guidelines**

Hinglish is the default emotional register for the app. It must feel like a trusted dost (friend) speaking — not a bank officer, not an algorithm.

| ❌ Bank-Speak (Avoid) | ✅ Dost-Speak (Use) |
| :---- | :---- |
| Transaction processed successfully. | Ho gaya\! Aapka paisa safe hai. |
| Insufficient funds in account. | Aaj account mein thoda kam tha. Kal try karenge. |
| Investment has been allocated. | Aapka Savestment kaam pe lag gaya\! |
| Withdrawal request submitted. | Gullak toda\! Paisa kal tak bank mein hoga. |
| Goal completion: 50% | Adha ho gaya\! Chiraiya khush hai. |
| Mandate successfully created. | Shuruaat ho gayi. Roz thoda, kal bada. |

# **SECTION 8 — COLOR & THEME SYSTEM**

The current app color scheme is bland and does not convey trust, warmth, or the Gullak identity. The new system is built around the earthen pot's natural palette — terracotta, saffron, warm cream — anchored by trust-signal teal/green.

## **8.1  Primary Color Tokens**

| Token Name | Hex Value | Usage |
| :---- | :---- | :---- |
| \--gullak-saffron | \#E8650A | Primary CTAs, logo text, key highlights |
| \--gullak-terracotta | \#C4602A | Section headers, secondary actions |
| \--gullak-deep-brown | \#3E1F00 | Primary text, headings |
| \--gullak-gold | \#D4A017 | Coin icons, achievement badges, sparkles |
| \--gullak-cream | \#FFF8F0 | App background (warm, not cold white) |
| \--gullak-teal | \#0E8C7A | Trust signals, RBI badge, growth line on chart |
| \--gullak-green | \#1A7A4A | Positive states, success, munafa card |
| \--gullak-soft-red | \#C0392B | Errors only — used sparingly, never for key UI |
| \--gullak-gray-text | \#2D2D2D | Body copy |
| \--gullak-gray-sub | \#555555 | Secondary labels |

## **8.2  Typography System**

| Role | Specification |
| :---- | :---- |
| App Font (Latin) | Nunito or Poppins — round, friendly, readable at small sizes |
| App Font (Devanagari/Hindi) | Hind or Mukta — clear, designed for mobile screens |
| App Name 'GULLAK' | Bold, large, saffron, slightly tracked |
| Numbers (₹ amounts) | Large, bold, deep-brown — numbers must feel IMPORTANT |
| Chiraiya Copy / Motivational | Slightly smaller, terracotta, italics-optional |
| Error / Warning | Regular weight, soft-red, NEVER all-caps screaming |

# **SECTION 9 — CREDIT FEATURE (NEW — CROSS-SELL LAYER)**

|   💳  CREDIT FEATURE — STRATEGIC CONTEXT |
| :---- |
| This is a NEW feature not in v1. It is a revenue-generating layer built on top of the savings relationship. |
| Data assets available: UPI mandate history, Account Aggregator data, GST records, transaction patterns. |
| This gives us a strong credit profile signal — use it to offer contextual, small-ticket credit. |
| Credit does NOT replace savings. It is a parallel offer that appears contextually. |

## **9.1  Credit Products to Build**

| Product | Target Audience & Trigger |
| :---- | :---- |
| Vehicle Loan (Car) | User saved for 'Car' goal for 60+ days. Offer: 'Abhi lo, saath mein bachate raho.' |
| Two-Wheeler / Bike Loan | User saved for 'Bike' goal OR income signals below ₹30K/month. |
| Gold Loan | User has gold purchase goal OR shows seasonal patterns (Diwali/Akshaya Tritiya). |
| Consumer Durable Loan | User shows purchase intent signals (high round-up frequency on shopping apps). |
| Emergency Credit Line | User has emergency fund goal but savings are low \+ urgent withdrawal pattern. |

## **9.2  Credit UI & Chiraiya Interaction**

|   🔑  CREDIT — UX RULES |
| :---- |
| Chiraiya holds a small golden KEY and appears on the dashboard as a non-intrusive badge when credit is pre-approved. |
| Entry copy: 'Aapke liye ek khaas offer — Chiraiya ne ek key layi hai\!' |
| DO NOT push credit if user has not saved for at least 30 days. Respect the savings-first relationship. |
| Credit offer card appears in Zone H (single nudge zone) — never interrupts the core savings flow. |
| The credit application UX must match the warm Hinglish tone. NO bank-speak in the credit flow. |

# **SECTION 10 — ANIMATION SPECIFICATION LIBRARY**

## **10.1  Core Animation Principles**

| Principle | Rule |
| :---- | :---- |
| Duration | Chiraiya actions: 0.8–1.5s. Celebrations: 2–3s. Loading: Loop at 1.2s. All skippable with tap. |
| Easing | Use ease-out for drops/falls (gravity feel). Use ease-in-out for Chiraiya flight. |
| Frame Rate | Target 60fps on mid-range Android (the primary device class for Bharat users). |
| Fallback | If device can't run animation (low-end), show static Chiraiya image \+ subtle CSS pulse. |
| Accessibility | All animations respect system 'Reduce Motion' setting — show simple fade instead. |

## **10.2  Priority Animation Build List**

| Priority | Animation Name & Spec |
| :---- | :---- |
| P0 — Build First | Coin drop into Gullak: Chiraiya flies short arc, coin falls with physics, Gullak flashes gold. |
| P0 — Build First | Gullak break (withdrawal): Crack animation, coins scatter, chicks celebrate. 2.5s. |
| P0 — Build First | Splash morph: Earthen Gullak → Digital Gullak morph. 3s total with glow effect. |
| P1 — Core Loop | Streak flutter: Chiraiya hops left-right 3 times, then looks at camera with pride. |
| P1 — Core Loop | Goal milestone: Chiraiya circles Gullak, baby chicks fly around, saffron confetti. |
| P1 — Core Loop | Thinking pose: Wings fold around face when input screen is active. |
| P2 — Trust Loop | Loading wave: Slow rhythmic wing-flap, eyes tracking side to side. |
| P2 — Trust Loop | Shield stance: Chiraiya spreads wings protectively on error screens. |
| P3 — Delight | Credit key reveal: Chiraiya flies in carrying a small gold key, drops it to user. |
| P3 — Delight | Idle breathing: Very subtle chest puff \+ exhale loop when app is open but idle. |

# **SECTION 11 — ACCEPTANCE CRITERIA & DEFINITION OF DONE**

Each module below must pass ALL its criteria before it is considered shippable. Claude Code must self-audit against this checklist.

## **11.1  Acceptance Checklist — By Module**

| 🏺 | Brand System | Logo renders on all screen densities. 'Savestment' appears ≥5 times in onboarding. All taglines correct. |
| :---: | :---- | :---- |

| ✨ | Splash Screen | All 3 acts play in \< 20s. Chiraiya appears in Act 2 & 3\. 'Savestment' word appears. CTA is visible. |
| :---: | :---- | :---- |

| 📝 | Onboarding Flow | Max 2 inputs per screen. First commitment moment shows money-moving animation. KYC is deferred. |
| :---: | :---- | :---- |

| 🐦 | Chiraiya System | All 13 states from Section 3.1 are implemented. Thinking pose on all input screens. No missing states. |
| :---: | :---- | :---- |

| 📱 | Dashboard | All 9 zones present. Chart is smooth line (not bar). Single nudge only. Chiraiya animates on save. |
| :---: | :---- | :---- |

| 🎯 | Goal Engine | All 12 categories with correct default amounts. Feasibility engine runs. No red error states for goals. |
| :---: | :---- | :---- |

| 🔐 | Trust Architecture | RBI badge persistent. False promise copy removed. Instrument transparency on tap. T+1 withdrawal communicated. |
| :---: | :---- | :---- |

| 🌐 | Language System | Language select at launch. All strings translate including Chiraiya copy. No English leakage in Hindi mode. |
| :---: | :---- | :---- |

| 🎨 | Color & Theme | Warm cream background throughout. Saffron CTAs. Teal trust signals. No blue/grey corporate palette. |
| :---: | :---- | :---- |

| 💳 | Credit Feature | Pre-approval badge visible. Chiraiya key animation present. Not shown before 30-day save milestone. |
| :---: | :---- | :---- |

| 🎬 | Animations | All P0 animations functional at 60fps. Reduce Motion respected. All animations skippable. |
| :---: | :---- | :---- |

**🏺  GULLAK — नए ज़माने की पुरानी आदत**

*Sirf save nahi — Savestment karo.*

End of Claude Code Master Prompt Document  |  v2.0  |  Confidential