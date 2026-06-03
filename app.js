// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMQoCeNw1-sGT59-SUaeC8uaHvElty_CrPeI_I5SkjIhiWRlCdp4NFzYS901U2_OcEYg/exec';

// ─────────────────────────────────────────────
// QUESTIONNAIRE DATA
// ─────────────────────────────────────────────

const DASS21 = {
  title: "DASS-21",
  instruction: "Please read each statement and select how much it applied to you over the past week.",
  scale: ["Did not apply (0)", "Somewhat (1)", "Considerable (2)", "Very much (3)"],
  scaleShort: ["0", "1", "2", "3"],
  items: [
    "I found it hard to wind down",
    "I was aware of dryness of my mouth",
    "I couldn't seem to experience any positive feeling at all",
    "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)",
    "I found it difficult to work up the initiative to do things",
    "I tended to over-react to situations",
    "I experienced trembling (e.g. in the hands)",
    "I felt that I was using a lot of nervous energy",
    "I was worried about situations in which I might panic and make a fool of myself",
    "I felt that I had nothing to look forward to",
    "I found myself getting agitated",
    "I found it difficult to relax",
    "I felt down-hearted and blue",
    "I was intolerant of anything that kept me from getting on with what I was doing",
    "I felt I was close to panic",
    "I was unable to become enthusiastic about anything",
    "I felt I wasn't worth much as a person",
    "I felt that I was rather touchy",
    "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)",
    "I felt scared without any good reason",
    "I felt that life was meaningless"
  ]
};

// Full validated MPQ-R (Nater, 2003)
const MPQ_R = {
  // Section 1: Music style preferences (1–5)
  styles: [
    { label: "Pop", example: "e.g. hit parade" },
    { label: "Rock", example: "e.g. Indie, Alternative" },
    { label: "Hip Hop", example: "e.g. Rap" },
    { label: "Latin", example: "e.g. Tango, Salsa" },
    { label: "Soul / Funk", example: "e.g. R'n'B" },
    { label: "Hard Rock", example: "e.g. Heavy Metal, Crossover" },
    { label: "Electronic Music", example: "e.g. Techno, House" },
    { label: "New Age", example: "e.g. Meditation Music" },
    { label: "Folk Music", example: "e.g. Country, Folk" },
    { label: "Classical Music", example: "e.g. Baroque, Romance, Opera" },
    { label: "Jazz / Blues", example: "" }
  ],
  // Section 4: Purposes (1–5)
  purposes: [
    "Relaxation", "Activation", "Distraction",
    "To reduce aggression", "To work better",
    "To evoke certain feelings", "To increase certain feelings",
    "Against boredom", "Against loneliness", "Because of the music"
  ],
  // Section 5: Situations (1–5)
  situations: [
    "Disco / Club", "Techno Party",
    "Concerts (Rock / Pop)", "Concerts (Classical / Opera)",
    "As background activity when doing something else (e.g. sports, housework, on the move)",
    "When making music myself (e.g. singing)",
    "When I'm alone", "When I'm with friends"
  ]
};

const PANAS = {
  title: "PANAS",
  instruction: "Indicate to what extent you feel this way RIGHT NOW, at this present moment.",
  legend: ["1 = Very slightly / Not at all", "5 = Extremely"],
  items: [
    "Interested", "Distressed", "Excited", "Upset", "Strong",
    "Guilty", "Scared", "Hostile", "Enthusiastic", "Proud",
    "Irritable", "Alert", "Ashamed", "Inspired", "Nervous",
    "Determined", "Attentive", "Jittery", "Active", "Afraid"
  ]
};

const RRS = {
  title: "RRS-10 (Ruminative Response Scale)",
  instruction: "We all think and act differently. Below are some phrases that describe what we may think or do when we feel low. Reflecting on your experiences over the past few days (or a recent experience), please indicate what you generally think or do:",
  instruction_post: "After engaging in the music listening activity, to what extent are you now rethinking the following items?",
  scale: ["Almost Never (1)", "Sometimes (2)", "Often (3)", "Almost Always (4)"],
  scaleShort: ["1", "2", "3", "4"],
  items: [
    "Think «What am I doing to deserve this?»",
    "Analyze recent events to try to understand why you are depressed.",
    "Think «Why do I always react this way?»",
    "Go away by yourself and think about why you feel this way.",
    "Write down what you are thinking about and analyze it.",
    "Think about a recent situation, wishing it had gone better.",
    "Think «Why do I have problems other people don't have?»",
    "Think «Why can't I handle things better?»",
    "Analyze your personality to try to understand why you are depressed.",
    "Go someplace alone to think about your feelings."
  ]
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const state = {
  step: 0,
  participant: {},
  consent: false,
  dass21: [],
  mpqr: [],
  panas1: [],
  rrs1: [],
  panas2: [],
  rrs2: [],
  timerStart: null,
  timerElapsed: 0,
  timerInterval: null,
  timerPaused: false,
  timerDone: false,
  timestamps: {}
};

// Steps: 0=welcome, 1=demographics, 2=consent, 3=dass21, 4=mpqr, 5=panas1, 6=rrs1,
//        7=cog1, 8=timer, 9=panas2, 10=rrs2, 11=cog2, 12=thankyou
const TOTAL_STEPS = 13;

function setStep(n) {
  state.step = n;
  state.timestamps['step_' + n] = new Date().toISOString();
  render();
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const wrap = document.getElementById('progress-wrap');
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (state.step === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  const pct = Math.round((state.step / (TOTAL_STEPS - 1)) * 100);
  fill.style.width = pct + '%';
  const stepNames = ['', 'Demographics', 'Consent', 'DASS-21', 'Music Preferences', 'PANAS (Pre)', 'RRS (Pre)', 'Cognitive Test 1', 'Music Listening', 'PANAS (Post)', 'RRS (Post)', 'Cognitive Test 2', 'Complete'];
  label.textContent = (stepNames[state.step] || 'Step ' + state.step) + ' — ' + pct + '% complete';
}

// ─────────────────────────────────────────────
// RENDER DISPATCHER
// ─────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch (state.step) {
    case 0: app.innerHTML = renderWelcome(); break;
    case 1: app.innerHTML = renderDemographics(); break;
    case 2: app.innerHTML = renderConsent(); break;
    case 3: app.innerHTML = renderDASS21(); break;
    case 4: app.innerHTML = renderMPQR(); break;
    case 5: app.innerHTML = renderPANAS('panas1', 'Pre-Listening: How do you feel right now?'); break;
    case 6: app.innerHTML = renderRRS('rrs1'); break;
    case 7: app.innerHTML = renderCogTest1(); break;
    case 8: app.innerHTML = renderTimer(); break;
    case 9: app.innerHTML = renderPANAS('panas2', 'Post-Listening: How do you feel right now?'); break;
    case 10: app.innerHTML = renderRRS('rrs2'); break;
    case 11: app.innerHTML = renderCogTest2(); break;
    case 12: app.innerHTML = renderThankYou(); break;
  }
  bindEvents();
}

// ─────────────────────────────────────────────
// STEP RENDERS
// ─────────────────────────────────────────────

function renderWelcome() {
  return `
  <div class="card" style="text-align:center; padding: 3rem 2.5rem;">
    <div class="hero-icon" style="margin: 0 auto 1.5rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    </div>
    <div class="step-tag">Research Study</div>
    <h1>Music &amp; Emotional Wellbeing</h1>
    <p style="font-size:1.05rem; max-width:480px; margin: 0 auto 1.5rem;">
      A research study exploring the relationship between music listening behaviour and emotional states.
    </p>
    <div style="margin-bottom: 2rem;">
      <span class="info-pill">⏱ ~35–45 minutes</span>
      <span class="info-pill">🎧 Bring headphones</span>
      <span class="info-pill">💻 Screen recorded</span>
    </div>
    <div class="divider"></div>
    <p style="font-size:14px; max-width:480px; margin: 1.25rem auto 0; color: var(--text3);">
      This session involves questionnaires, two short cognitive tasks, and a 10-minute music listening period. Your participation is entirely voluntary.
    </p>
    <div class="btn-row" style="justify-content: center; margin-top: 2rem;">
      <button class="btn btn-primary" onclick="setStep(1)">Begin &rarr;</button>
    </div>
  </div>`;
}

function renderDemographics() {
  const p = state.participant;
  return `
  <div class="card">
    <div class="step-tag">Step 1 of 11</div>
    <h2>About You</h2>
    <p>Please fill in the details below before we begin.</p>
    <div class="form-group">
      <label for="name">Full Name</label>
      <input type="text" id="name" placeholder="Your name" value="${p.name || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="age">Age</label>
        <input type="number" id="age" placeholder="e.g. 24" min="16" max="80" value="${p.age || ''}">
      </div>
      <div class="form-group">
        <label for="gender">Gender</label>
        <select id="gender">
          <option value="" disabled ${!p.gender ? 'selected' : ''}>Select</option>
          <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
          <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
          <option value="Non-binary" ${p.gender === 'Non-binary' ? 'selected' : ''}>Non-binary / Gender non-conforming</option>
          <option value="Prefer not to say" ${p.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
          <option value="Other" ${p.gender === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="profession">Profession / Field of Study</label>
      <input type="text" id="profession" placeholder="e.g. Computer Science student" value="${p.profession || ''}">
    </div>
    <div id="demo-error" class="error-msg" style="display:none;">Please fill in all fields.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(0)">&larr; Back</button>
      <button class="btn btn-primary" id="demo-next">Next &rarr;</button>
    </div>
  </div>`;
}

function renderConsent() {
  return `
  <div class="card">
    <div class="step-tag">Step 2 of 11</div>
    <h2>Informed Consent</h2>
    <p>Please read the following carefully before proceeding.</p>
    <div class="consent-box">
      <h3>Purpose of the Study</h3>
      <p>This study is conducted as part of academic research on the relationship between passive music listening behaviour and emotional wellbeing. It is not a clinical screening tool and does not provide any diagnosis or medical advice.</p>

      <h3 style="margin-top:1rem;">What the Study Involves</h3>
      <ul>
        <li>Completing validated psychological questionnaires (DASS-21, PANAS, RRS-10, MPQ-R)</li>
        <li>Performing two short cognitive tasks (approximately 5 minutes each)</li>
        <li>A 10-minute free music listening period on a platform of your choice</li>
        <li>Repeating some questionnaires after the listening period</li>
      </ul>

      <h3 style="margin-top:1rem;">Screen Recording</h3>
      <p>Your screen will be recorded during the music listening session only. The recording will capture your activity on the device during that period and will be used solely for research purposes. It will not be shared publicly.</p>

      <h3 style="margin-top:1rem;">Data Use &amp; Storage</h3>
      <ul>
        
        <li>Data will be anonymised before analysis and used only for academic research purposes.</li>
        <li>No personally identifiable information will be published in any report or presentation.</li>
        <li>You may withdraw at any time without consequence - simply close the browser window.</li>
      </ul>

      <h3 style="margin-top:1rem;">Voluntary Participation</h3>
      <p>Participation is entirely voluntary. You may skip any question or withdraw at any point. This study poses no known physical or psychological risk beyond normal daily activity.</p>

      <h3 style="margin-top:1rem;">Contact</h3>
      <p>For questions regarding this study, please contact Sikta Roy at +91 91635 04945.</p>
    </div>
    <label class="consent-checkbox">
      <input type="checkbox" id="consent-check" ${state.consent ? 'checked' : ''}>
      <span>I have read and understood the above information. I voluntarily agree to participate in this study, including screen recording, and consent to my data being used for research purposes.</span>
    </label>
    <div id="consent-error" class="error-msg" style="display:none;">You must accept the consent to continue.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(1)">&larr; Back</button>
      <button class="btn btn-primary" id="consent-next">I Consent &amp; Continue &rarr;</button>
    </div>
  </div>`;
}

function renderDASS21() {
  const answers = state.dass21;
  const items = DASS21.items.map((q, i) => `
    <div class="q-item">
      <div class="q-text"><span class="q-num">${i + 1}.</span> ${q}</div>
      <div class="scale-options">
        ${DASS21.scale.map((label, v) => `
          <button class="scale-btn ${answers[i] === v ? 'selected' : ''}"
            onclick="setAnswer('dass21', ${i}, ${v})">
            ${label.replace('\n', '<br>')}
          </button>`).join('')}
      </div>
    </div>`).join('');
  const answered = answers.filter(a => a !== undefined).length;
  return `
  <div class="card">
    <div class="step-tag">Step 3 of 11 — DASS-21</div>
    <h2>Depression, Anxiety &amp; Stress Scale</h2>
    <p>${DASS21.instruction}</p>
    <p style="font-size:13px; color: var(--text3);">Answered: ${answered} / ${DASS21.items.length}</p>
    <div class="divider"></div>
    ${items}
    <div id="q-error" class="error-msg" style="display:none; margin-top:1rem;">Please answer all questions before proceeding.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(2)">&larr; Back</button>
      <button class="btn btn-primary" id="q-next">Next &rarr;</button>
    </div>
  </div>`;
}

function scaleButtons(key, subkey, index, val, max, labels) {
  return Array.from({length: max}, (_, i) => {
    const v = i + 1;
    const sel = (state.mpqr_data[key] && state.mpqr_data[key][subkey] !== undefined
      ? state.mpqr_data[key][subkey]
      : (state.mpqr_data[key] && state.mpqr_data[key][index])) === v;
    return `<button class="scale-btn ${sel ? 'selected' : ''}"
      onclick="setMPQR('${key}','${subkey !== undefined ? subkey : index}',${v})">${labels ? labels[i] : v}</button>`;
  }).join('');
}

function setMPQR(key, subkey, value) {
  if (!state.mpqr_data[key]) state.mpqr_data[key] = {};
  state.mpqr_data[key][subkey] = value;
  render();
}

function renderMPQR() {
  const d = state.mpqr_data;

  // Section 1 — style preferences
  const styleRows = MPQ_R.styles.map((s, i) => `
    <div class="q-item">
      <div class="q-text"><strong>${s.label}</strong>${s.example ? `<span style="color:var(--text3); font-size:13px; margin-left:6px;">${s.example}</span>` : ''}</div>
      <div class="scale-options" data-mpqr-group="styles-${i}">
        ${[1,2,3,4,5].map(v => {
          const sel = d.styles && d.styles[i] === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRArr('styles',${i},${v})">
            ${v === 1 ? 'Not at all' : v === 5 ? 'Very much' : v}</button>`;
        }).join('')}
      </div>
    </div>`).join('');

  // Section 1 other (2 open fields)
  const other1a = (d.other_style1 || {});
  const other1b = (d.other_style2 || {});

  // Section 2 — favourite music
  const fav = d.favourite || {};

  // Section 3 — daily listening
  const dl = d.daily_listening || {};

  // Section 4 — purposes
  const purposeRows = MPQ_R.purposes.map((p, i) => `
    <div class="q-item">
      <div class="q-text">${p}</div>
      <div class="scale-options" data-mpqr-group="purposes-${i}">
        ${[1,2,3,4,5].map(v => {
          const sel = d.purposes && d.purposes[i] === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRArr('purposes',${i},${v})">
            ${v === 1 ? 'Never' : v === 5 ? 'Very often' : v}</button>`;
        }).join('')}
      </div>
    </div>`).join('');

  // Section 5 — situations
  const situationRows = MPQ_R.situations.map((s, i) => `
    <div class="q-item">
      <div class="q-text">${s}</div>
      <div class="scale-options" data-mpqr-group="situations-${i}">
        ${[1,2,3,4,5].map(v => {
          const sel = d.situations && d.situations[i] === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRArr('situations',${i},${v})">
            ${v === 1 ? 'Never' : v === 5 ? 'Very often' : v}</button>`;
        }).join('')}
      </div>
    </div>`).join('');

  // Section 6 — currently making music
  const cm = d.current_music || '';
  // Section 7 — previously making music
  const pm = d.prev_music || '';

  // Section 8 — importance
  const imp = d.importance;
  const impBtns = [1,2,3,4,5].map(v => {
    const sel = imp === v;
    return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('importance',${v})">
      ${v === 1 ? 'Not at all' : v === 5 ? 'Very important' : v}</button>`;
  }).join('');

  // Section 9 — chills
  const chillFreq = d.chill_freq;
  const chillInt = d.chill_int;
  const chillFreqBtns = [1,2,3,4,5].map(v => {
    const sel = chillFreq === v;
    return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('chill_freq',${v})">
      ${v === 1 ? 'Not at all' : v === 5 ? 'Almost always' : v}</button>`;
  }).join('');
  const chillIntBtns = [1,2,3,4,5].map(v => {
    const sel = chillInt === v;
    return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('chill_int',${v})">
      ${v === 1 ? 'Hardly noticeable' : v === 5 ? 'Overwhelmingly strong' : v}</button>`;
  }).join('');

  return `
  <div class="card">
    <div class="step-tag">Step 4 of 11 — MPQ-R</div>
    <h2>Music Preference Questionnaire</h2>
    <p style="font-size:13px; color:var(--text3);">© Urs Nater (2003). All rights reserved.</p>
    <p>The following questions refer to which music you like to listen to and in which situations you do so.</p>

    <div class="divider"></div>
    <div class="q-section-title">1. Music Style Preferences — rate each style (1 = Not at all · 5 = Very much)</div>
    ${styleRows}
    <div class="q-item">
      <div class="q-text">Other style 1 (optional)</div>
      <input type="text" placeholder="Genre name" style="margin-bottom:8px;"
        value="${d.other_style1_name || ''}" oninput="setMPQRSingle('other_style1_name',this.value)">
      <div class="scale-options" data-mpqr-group="other_style1_rating">
        ${[1,2,3,4,5].map(v => {
          const sel = d.other_style1_rating === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('other_style1_rating',${v})">${v === 1 ? 'Not at all' : v === 5 ? 'Very much' : v}</button>`;
        }).join('')}
      </div>
    </div>
    <div class="q-item">
      <div class="q-text">Other style 2 (optional)</div>
      <input type="text" placeholder="Genre name" style="margin-bottom:8px;"
        value="${d.other_style2_name || ''}" oninput="setMPQRSingle('other_style2_name',this.value)">
      <div class="scale-options" data-mpqr-group="other_style2_rating">
        ${[1,2,3,4,5].map(v => {
          const sel = d.other_style2_rating === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('other_style2_rating',${v})">${v === 1 ? 'Not at all' : v === 5 ? 'Very much' : v}</button>`;
        }).join('')}
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">2. Favourite Music / Group (max. 3)</div>
    <div class="form-group">
      <label>Favourite music / group</label>
      <input type="text" placeholder="e.g. A.R. Rahman, The Beatles" value="${d.fav_name || ''}"
        oninput="setMPQRSingle('fav_name',this.value)">
    </div>
    <div class="form-group">
      <label>Music style category</label>
      <input type="text" placeholder="e.g. Classical, Pop, Rock" value="${d.fav_style || ''}"
        oninput="setMPQRSingle('fav_style',this.value)">
    </div>

    <div class="divider"></div>
    <div class="q-section-title">3. Daily Listening Duration</div>
    <div class="form-row">
      <div class="form-group">
        <label>Hours per day</label>
        <input type="number" min="0" max="24" placeholder="0" value="${d.daily_hours || ''}"
          oninput="setMPQRSingle('daily_hours',this.value)">
      </div>
      <div class="form-group">
        <label>Minutes</label>
        <input type="number" min="0" max="59" placeholder="0" value="${d.daily_mins || ''}"
          oninput="setMPQRSingle('daily_mins',this.value)">
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">4. Purposes of Listening — rate each (1 = Never · 5 = Very often)</div>
    ${purposeRows}
    <div class="q-item">
      <div class="q-text">Other purpose 1 (optional)</div>
      <input type="text" placeholder="Describe purpose" style="margin-bottom:8px;"
        value="${d.other_purpose1_name || ''}" oninput="setMPQRSingle('other_purpose1_name',this.value)">
      <div class="scale-options" data-mpqr-group="other_purpose1_rating">
        ${[1,2,3,4,5].map(v => {
          const sel = d.other_purpose1_rating === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('other_purpose1_rating',${v})">${v === 1 ? 'Never' : v === 5 ? 'Very often' : v}</button>`;
        }).join('')}
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">5. Situations / Occasions for Listening  — rate each (1 = Never · 5 = Very often)</div>
    ${situationRows}
    <div class="q-item">
      <div class="q-text">Other situation (optional)</div>
      <input type="text" placeholder="Describe situation" style="margin-bottom:8px;"
        value="${d.other_situation_name || ''}" oninput="setMPQRSingle('other_situation_name',this.value)">
      <div class="scale-options" data-mpqr-group="other_situation_rating">
        ${[1,2,3,4,5].map(v => {
          const sel = d.other_situation_rating === v;
          return `<button class="scale-btn ${sel ? 'selected' : ''}" data-val="${v}" onclick="setMPQRSingle('other_situation_rating',${v})">${v === 1 ? 'Never' : v === 5 ? 'Very often' : v}</button>`;
        }).join('')}
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">6. Currently Making Music</div>
    <div class="form-group">
      ${['No',
        'I play an instrument',
        'I sing in a choir',
        'Other'].map(opt => `
        <label class="consent-checkbox" style="margin-bottom:8px;">
          <input type="radio" name="current_music" value="${opt}" ${d.current_music === opt ? 'checked' : ''}
            onchange="handleMusicRadio('current_music','${opt}')">
          <span>${opt}</span>
        </label>`).join('')}
    </div>
    <div id="current_music-detail-wrap" style="display:${d.current_music && d.current_music !== 'No' ? 'block' : 'none'};">
      <div class="form-group">
        <label>Details (instrument / choir / other, and how long?)</label>
        <input type="text" placeholder="e.g. Guitar — 5 years" value="${d.current_music_detail || ''}"
          oninput="setMPQRSingle('current_music_detail',this.value)">
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">7. Previously Making Music</div>
    <div class="form-group">
      ${['No',
        'I played an instrument',
        'I was in a choir',
        'Other'].map(opt => `
        <label class="consent-checkbox" style="margin-bottom:8px;">
          <input type="radio" name="prev_music" value="${opt}" ${d.prev_music === opt ? 'checked' : ''}
            onchange="handleMusicRadio('prev_music','${opt}')">
          <span>${opt}</span>
        </label>`).join('')}
    </div>
    <div id="prev_music-detail-wrap" style="display:${d.prev_music && d.prev_music !== 'No' ? 'block' : 'none'};">
      <div class="form-group">
        <label>Details (instrument / choir / other, and how long?)</label>
        <input type="text" placeholder="e.g. Tabla — 3 years" value="${d.prev_music_detail || ''}"
          oninput="setMPQRSingle('prev_music_detail',this.value)">
      </div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">8. Importance of Music in Your Life</div>
    <div class="q-item">
      <div class="q-text">How important is music in your life?</div>
      <div class="scale-options" data-mpqr-group="importance">${impBtns}</div>
    </div>

    <div class="divider"></div>
    <div class="q-section-title">9. Music-Induced Chills</div>
    <p style="font-size:14px; color:var(--text2); margin-bottom:1rem;">
      Chills are physical reactions — a shudder or shiver spreading from the head to the back and/or other parts of the body — experienced while listening to music.
    </p>
    <div class="q-item">
      <div class="q-text">How often do you experience chills while listening to music?</div>
      <div class="scale-options" data-mpqr-group="chill_freq">${chillFreqBtns}</div>
    </div>
    <div class="q-item">
      <div class="q-text">If you experience chills, how intense are they?</div>
      <div class="scale-options" data-mpqr-group="chill_int">${chillIntBtns}</div>
    </div>

    <div id="q-error" class="error-msg" style="display:none; margin-top:1rem;">Please complete all required sections before proceeding.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(3)">&larr; Back</button>
      <button class="btn btn-primary" id="q-next">Next &rarr;</button>
    </div>
  </div>`;
}

function renderPANAS(key, title) {
  const answers = state[key];
  const stepNum = key === 'panas1' ? 5 : 9;
  const prevStep = key === 'panas1' ? 4 : 8;
  const nextStep = key === 'panas1' ? 6 : 10;
  const stepLabel = key === 'panas1' ? 'Step 5 of 11' : 'Step 9 of 11';
  const answered = answers.filter(a => a !== undefined).length;
  const items = PANAS.items.map((word, i) => `
    <div class="panas-item">
      <div class="panas-word">${word}</div>
      <div class="panas-scale">
        ${[1,2,3,4,5].map(v => `
          <button class="${answers[i] === v ? 'selected' : ''}"
            onclick="setAnswer('${key}', ${i}, ${v})">${v}</button>`).join('')}
      </div>
    </div>`).join('');
  return `
  <div class="card">
    <div class="step-tag">${stepLabel} — PANAS</div>
    <h2>${title}</h2>
    <p>${PANAS.instruction}</p>
    <div class="panas-legend"><span>1 = Very slightly / Not at all</span><span>5 = Extremely</span></div>
    <p style="font-size:13px; color: var(--text3);">Answered: ${answered} / ${PANAS.items.length}</p>
    <div class="panas-grid">${items}</div>
    <div id="q-error" class="error-msg" style="display:none; margin-top:1rem;">Please rate all words before proceeding.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(${prevStep})">&larr; Back</button>
      <button class="btn btn-primary" id="q-next" data-next="${nextStep}">Next &rarr;</button>
    </div>
  </div>`;
}

function renderRRS(key) {
  const answers = state[key];
  const prevStep = key === 'rrs1' ? 5 : 9;
  const nextStep = key === 'rrs1' ? 7 : 11;
  const stepLabel = key === 'rrs1' ? 'Step 6 of 11' : 'Step 10 of 11';
  const answered = answers.filter(a => a !== undefined).length;
  const items = RRS.items.map((q, i) => `
    <div class="q-item">
      <div class="q-text"><span class="q-num">${i + 1}.</span> ${q}</div>
      <div class="scale-options">
        ${RRS.scale.map((label, v) => `
          <button class="scale-btn ${answers[i] === (v + 1) ? 'selected' : ''}"
            onclick="setAnswer('${key}', ${i}, ${v + 1})">
            ${label}
          </button>`).join('')}
      </div>
    </div>`).join('');
  return `
  <div class="card">
    <div class="step-tag">${stepLabel} — RRS-10</div>
    <h2>Ruminative Response Scale</h2>
    <p>${key === 'rrs1' ? RRS.instruction : RRS.instruction_post}</p>
    <p style="font-size:13px; color: var(--text3);">Answered: ${answered} / ${RRS.items.length}</p>
    <div class="divider"></div>
    ${items}
    <div id="q-error" class="error-msg" style="display:none; margin-top:1rem;">Please answer all questions before proceeding.</div>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(${prevStep})">&larr; Back</button>
      <button class="btn btn-primary" id="q-next" data-next="${nextStep}">Next &rarr;</button>
    </div>
  </div>`;
}

function renderCogTest1() {
  return `
  <div class="card">
    <div class="step-tag">Step 7 of 11 — Cognitive Task 1</div>
    <h2>Stroop Colour–Word Task</h2>
    <p>This is a classic cognitive test measuring attention and processing speed. Follow the on-screen instructions within the task window below. Complete the entire task before clicking Next.</p>
    <div class="warn-box">
      <strong>Note:</strong> The task opens in the frame below. If it does not load, you can <a href="https://www.psytoolkit.org/experiment-library/experiment_stroop.html" target="_blank" style="color:inherit;">open it in a new tab</a> and return when done.
    </div>
    <div class="iframe-wrap">
      <iframe src="https://www.psytoolkit.org/experiment-library/experiment_stroop.html" allowfullscreen></iframe>
    </div>
    <p class="iframe-note">Complete the full task above, then click Next to continue.</p>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(6)">&larr; Back</button>
      <button class="btn btn-primary" onclick="setStep(8)">I have completed the task &rarr;</button>
    </div>
  </div>`;
}

function renderTimer() {
  const elapsed = state.timerElapsed;
  const total = 10 * 60;
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const pct = Math.min(100, (elapsed / total) * 100).toFixed(1);
  const done = state.timerDone || remaining === 0;
  return `
  <div class="card" style="text-align:center;">
    <div class="step-tag">Step 8 of 11 — Music Listening</div>
    <h2>10-Minute Listening Session</h2>
    <p>Open your music app and listen freely. This timer tracks your listening time.</p>
    <div class="timer-display ${state.timerPaused ? 'paused' : ''}" id="timer-display">${display}</div>
    <div class="timer-status" id="timer-status">
      ${done ? '✓ Session complete!' : state.timerPaused ? 'Paused' : 'Listening...'}
    </div>
    <div style="height: 6px; background: var(--border); border-radius: 3px; overflow:hidden; margin: 0 auto 1.5rem; max-width: 300px;">
      <div style="height:100%; width:${pct}%; background:var(--accent); border-radius:3px; transition: width 1s linear;"></div>
    </div>
    <div class="timer-controls">
      ${done ? '' : `
        <button class="btn ${state.timerPaused ? 'btn-primary' : 'btn-secondary'}" id="timer-pause" onclick="toggleTimer()">
          ${state.timerPaused ? '▶ Resume' : '⏸ Pause'}
        </button>`}
      <button class="btn btn-primary" ${!done ? 'onclick="skipTimer()"' : 'onclick="setStep(9)"'}>
        ${done ? 'Continue →' : 'Skip (Finish Early) →'}
      </button>
    </div>
    <div class="timer-note">
      🎧 Play music on <strong>Spotify, YouTube Music, Apple Music</strong> or any platform you prefer. Come back here when you're done or when the timer ends.
    </div>
  </div>`;
}

function renderCogTest2() {
  return `
  <div class="card">
    <div class="step-tag">Step 11 of 11 — Cognitive Task 2</div>
    <h2>Numerical Stroop Task</h2>
    <p>One more cognitive test. Follow the on-screen instructions in the task window below. Complete the entire task before clicking Finish.</p>
    <div class="warn-box">
      <strong>Note:</strong> If the task does not load, you can <a href="https://www.psytoolkit.org/experiment-library/experiment_numerical_stroop.html" target="_blank" style="color:inherit;">open it in a new tab</a> and return when done.
    </div>
    <div class="iframe-wrap">
      <iframe src="https://www.psytoolkit.org/experiment-library/experiment_numerical_stroop.html" allowfullscreen></iframe>
    </div>
    <p class="iframe-note">Complete the full task above, then click Finish to submit your data.</p>
    <div class="btn-row">
      <button class="btn btn-secondary" onclick="setStep(10)">&larr; Back</button>
      <button class="btn btn-primary" onclick="submitAndFinish()">Finish &amp; Submit ✓</button>
    </div>
  </div>`;
}

function renderThankYou() {
  const d = state.dass21;
  const p1 = state.panas1, p2 = state.panas2;
  const r1 = state.rrs1, r2 = state.rrs2;
  const dass_d = [2,4,9,12,15,16,20].reduce((s,i) => s + (d[i] || 0), 0) * 2;
  const dass_a = [1,3,6,8,14,18,19].reduce((s,i) => s + (d[i] || 0), 0) * 2;
  const dass_s = [0,5,7,10,11,13,17].reduce((s,i) => s + (d[i] || 0), 0) * 2;
  const pa1 = [0,2,4,8,9,11,13,15,16,18].reduce((s,i) => s + (p1[i] || 0), 0);
  const na1 = [1,3,5,6,7,10,12,14,17,19].reduce((s,i) => s + (p1[i] || 0), 0);
  const pa2 = [0,2,4,8,9,11,13,15,16,18].reduce((s,i) => s + (p2[i] || 0), 0);
  const na2 = [1,3,5,6,7,10,12,14,17,19].reduce((s,i) => s + (p2[i] || 0), 0);
  const rrs1_total = r1.reduce((s, v) => s + (v || 0), 0);
  const rrs2_total = r2.reduce((s, v) => s + (v || 0), 0);
  return `
  <div class="card" style="text-align:center;">
    <div class="thankyou-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" width="36" height="36">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h2>Thank You!</h2>
    <p>Your responses have been recorded. We sincerely appreciate your participation in this study.</p>
    <div id="save-status" class="saving-badge">
      <span id="save-icon">⏳</span>
      <span id="save-text">Saving your data...</span>
    </div>
    <div class="divider" style="margin-top:1.5rem;"></div>
    <p style="font-size:13px; color:var(--text3); margin-top:1rem; margin-bottom:0.5rem;">Your session summary</p>
    
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────
function bindEvents() {
  // Demographics
  const demoNext = document.getElementById('demo-next');
  if (demoNext) {
    demoNext.onclick = () => {
      const name = document.getElementById('name').value.trim();
      const age = document.getElementById('age').value.trim();
      const gender = document.getElementById('gender').value;
      const profession = document.getElementById('profession').value.trim();
      if (!name || !age || !gender || !profession) {
        document.getElementById('demo-error').style.display = 'block';
        return;
      }
      state.participant = { name, age, gender, profession };
      setStep(2);
    };
  }

  // Consent
  const consentNext = document.getElementById('consent-next');
  if (consentNext) {
    consentNext.onclick = () => {
      const checked = document.getElementById('consent-check').checked;
      if (!checked) { document.getElementById('consent-error').style.display = 'block'; return; }
      state.consent = true;
      setStep(3);
    };
  }

  // Generic questionnaire next
  const qNext = document.getElementById('q-next');
  if (qNext) {
    qNext.onclick = () => {
      const nextStep = parseInt(qNext.dataset.next || '0');
      let allAnswered = false;
      if (state.step === 3) {
        allAnswered = state.dass21.filter(a => a !== undefined).length === DASS21.items.length;
      } else if (state.step === 4) {
        const stylesOk = state.mpqr_data.styles && state.mpqr_data.styles.filter(a => a !== undefined).length === MPQ_R.styles.length;
        const impOk = state.mpqr_data.importance !== undefined;
        allAnswered = stylesOk && impOk;
      } else if (state.step === 5) {
        allAnswered = state.panas1.filter(a => a !== undefined).length === PANAS.items.length;
      } else if (state.step === 6) {
        allAnswered = state.rrs1.filter(a => a !== undefined).length === RRS.items.length;
      } else if (state.step === 9) {
        allAnswered = state.panas2.filter(a => a !== undefined).length === PANAS.items.length;
      } else if (state.step === 10) {
        allAnswered = state.rrs2.filter(a => a !== undefined).length === RRS.items.length;
      }
      if (!allAnswered) { document.getElementById('q-error').style.display = 'block'; return; }
      const next = nextStep || (state.step + 1);
      setStep(next);
    };
  }
}

// ─────────────────────────────────────────────
// ANSWER SETTER
// ─────────────────────────────────────────────
function setAnswer(key, index, value) {
  if (!state[key]) state[key] = [];
  state[key][index] = value;
  render();
}

// ─────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────
function startTimer() {
  if (state.timerInterval) return;
  state.timerStart = Date.now();
  state.timerInterval = setInterval(() => {
    if (!state.timerPaused) {
      state.timerElapsed++;
      if (state.timerElapsed >= 600) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        state.timerDone = true;
      }
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const total = 10 * 60;
  const remaining = Math.max(0, total - state.timerElapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const el = document.getElementById('timer-display');
  if (el) el.textContent = display;
  const pct = Math.min(100, (state.timerElapsed / total) * 100).toFixed(1);
  const bar = document.querySelector('.timer-controls')?.previousElementSibling?.previousElementSibling?.children[0];
  if (bar) bar.style.width = pct + '%';
  const status = document.getElementById('timer-status');
  if (status) {
    if (state.timerDone) {
      status.textContent = '✓ Session complete!';
      // Re-render to show Continue button
      const app = document.getElementById('app');
      app.innerHTML = renderTimer();
      bindEvents();
    } else {
      status.textContent = state.timerPaused ? 'Paused' : 'Listening...';
    }
  }
}

function toggleTimer() {
  state.timerPaused = !state.timerPaused;
  const btn = document.getElementById('timer-pause');
  if (btn) btn.textContent = state.timerPaused ? '▶ Resume' : '⏸ Pause';
  const el = document.getElementById('timer-display');
  if (el) el.className = 'timer-display' + (state.timerPaused ? ' paused' : '');
  const status = document.getElementById('timer-status');
  if (status) status.textContent = state.timerPaused ? 'Paused' : 'Listening...';
}

function skipTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  state.timerDone = true;
  setStep(9);
}

// Auto-start timer when on timer step
const _origSetStep = setStep;
// Override render to start timer on step 8
const _origRender = render;

// Patch render to start timer
const realRender = render;
window.render = render;

// Hook into step 8 to auto-start timer
function afterRender() {
  if (state.step === 8 && !state.timerDone) {
    startTimer();
  }
}

// ─────────────────────────────────────────────
// DATA SUBMISSION
// ─────────────────────────────────────────────
async function submitAndFinish() {
  setStep(12);
  await saveData();
}

async function saveData() {
  const saveIcon = document.getElementById('save-icon');
  const saveText = document.getElementById('save-text');

  // Compute scores
  const d = state.dass21;
  const p1 = state.panas1, p2 = state.panas2;
  const r1 = state.rrs1, r2 = state.rrs2;

  const dass_depression = [2,4,9,12,15,16,20].reduce((s,i) => s + (d[i]||0), 0) * 2;
  const dass_anxiety = [1,3,6,8,14,18,19].reduce((s,i) => s + (d[i]||0), 0) * 2;
  const dass_stress = [0,5,7,10,11,12,17].reduce((s,i) => s + (d[i]||0), 0) * 2;

  const pa1 = [0,2,4,8,9,11,12,15,16,18].reduce((s,i) => s + (p1[i]||0), 0);
  const na1 = [1,3,5,6,7,10,14,15,17,19].reduce((s,i) => s + (p1[i]||0), 0);
  const pa2 = [0,2,4,8,9,11,12,15,16,18].reduce((s,i) => s + (p2[i]||0), 0);
  const na2 = [1,3,5,6,7,10,14,15,17,19].reduce((s,i) => s + (p2[i]||0), 0);

  const payload = {
    timestamp: new Date().toISOString(),
    name: state.participant.name,
    age: state.participant.age,
    gender: state.participant.gender,
    profession: state.participant.profession,

    // DASS-21 subscales
    dass_depression,
    dass_anxiety,
    dass_stress,
    dass21_raw: d.join('|'),

    // MPQ-R (full)
    mpqr_styles: (state.mpqr_data.styles || []).join('|'),
    mpqr_purposes: (state.mpqr_data.purposes || []).join('|'),
    mpqr_situations: (state.mpqr_data.situations || []).join('|'),
    mpqr_fav_name: state.mpqr_data.fav_name || '',
    mpqr_fav_style: state.mpqr_data.fav_style || '',
    mpqr_daily_hours: state.mpqr_data.daily_hours || '',
    mpqr_daily_mins: state.mpqr_data.daily_mins || '',
    mpqr_current_music: state.mpqr_data.current_music || '',
    mpqr_current_music_detail: state.mpqr_data.current_music_detail || '',
    mpqr_prev_music: state.mpqr_data.prev_music || '',
    mpqr_prev_music_detail: state.mpqr_data.prev_music_detail || '',
    mpqr_importance: state.mpqr_data.importance || '',
    mpqr_chill_freq: state.mpqr_data.chill_freq || '',
    mpqr_chill_int: state.mpqr_data.chill_int || '',
    mpqr_other_style1: (state.mpqr_data.other_style1_name || '') + ':' + (state.mpqr_data.other_style1_rating || ''),
    mpqr_other_style2: (state.mpqr_data.other_style2_name || '') + ':' + (state.mpqr_data.other_style2_rating || ''),
    mpqr_other_purpose1: (state.mpqr_data.other_purpose1_name || '') + ':' + (state.mpqr_data.other_purpose1_rating || ''),
    mpqr_other_situation: (state.mpqr_data.other_situation_name || '') + ':' + (state.mpqr_data.other_situation_rating || ''),

    // PANAS
    panas1_PA: pa1, panas1_NA: na1,
    panas2_PA: pa2, panas2_NA: na2,
    panas1_raw: p1.join('|'),
    panas2_raw: p2.join('|'),

    // RRS
    rrs1_total: r1.reduce((s,v) => s + (v||0), 0),
    rrs2_total: r2.reduce((s,v) => s + (v||0), 0),
    rrs1_raw: r1.join('|'),
    rrs2_raw: r2.join('|'),

    // Timer
    timer_seconds: state.timerElapsed,
    timer_skipped: state.timerElapsed < 600,

    // Timestamps
    timestamps: JSON.stringify(state.timestamps)
  };

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    console.log('Data (no URL configured):', payload);
    if (saveIcon) saveIcon.textContent = '⚠️';
    if (saveText) saveText.textContent = 'Apps Script URL not configured — data logged to console.';
    if (saveText) saveText.style.color = 'var(--accent2)';
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (saveIcon) saveIcon.textContent = '✅';
    if (saveText) saveText.textContent = 'Data saved successfully.';
  } catch (err) {
    if (saveIcon) saveIcon.textContent = '❌';
    if (saveText) saveText.textContent = 'Could not save data. Please contact the researcher.';
    console.error('Save error:', err, payload);
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
// Patch setStep to hook timer
const origSetStepFn = setStep;
window.setStep = function(n) {
  origSetStepFn(n);
  afterRender();
};

// Initial state arrays
state.dass21 = new Array(21).fill(undefined);
state.mpqr_data = { styles: new Array(11).fill(undefined) };
state.panas1 = new Array(20).fill(undefined);
state.rrs1 = new Array(10).fill(undefined);
state.panas2 = new Array(20).fill(undefined);
state.rrs2 = new Array(10).fill(undefined);

setStep(0);

// ─────────────────────────────────────────────
// MPQ-R HELPERS — update DOM in-place, no full re-render
// ─────────────────────────────────────────────
function setMPQRArr(key, index, value) {
  if (!state.mpqr_data[key]) state.mpqr_data[key] = [];
  state.mpqr_data[key][index] = value;
  // Update only the button group for this item
  const group = document.querySelector(`[data-mpqr-group="${key}-${index}"]`);
  if (group) {
    group.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === value);
    });
  }
}

function setMPQRSingle(key, value) {
  state.mpqr_data[key] = value;
  if (typeof value === 'string' && value.length > 2) return; // text input, no DOM update needed
  // Update only the button group for this key
  const group = document.querySelector(`[data-mpqr-group="${key}"]`);
  if (group) {
    group.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.val) === value);
    });
  }
}

function handleMusicRadio(key, value) {
  state.mpqr_data[key] = value;
  const detailWrap = document.getElementById(`${key}-detail-wrap`);
  if (detailWrap) detailWrap.style.display = value === 'No' ? 'none' : 'block';
}
