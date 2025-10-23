// Simple Exercise Tracker
const LS_KEY = 'exercise-tracker:v1'
const HIST_KEY = 'exercise-tracker:history:v1'
let exercises = []
// history: array of { type: 'created'|'finished'|'unfinished', id, name, at }
let history = loadHistory()

const q = sel => document.querySelector(sel)
const qi = id => document.getElementById(id)

// Elements
const form = qi('exercise-form')
const nameInput = qi('exercise-name')
const repsInput = qi('exercise-reps')
// status select removed from form; items default to 'not-finished' on add
const listEl = qi('exercise-list')
const totalEl = qi('total')
const finishedEl = qi('finished-count')

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(exercises))
}

function load(){
  const raw = localStorage.getItem(LS_KEY)
  if(!raw) return []
  try{ return JSON.parse(raw) }catch(e){ return [] }
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7) }

function render(){
  listEl.innerHTML = ''
  if(exercises.length === 0){
    const el = document.createElement('div')
    el.className = 'empty'
    el.textContent = 'No exercises yet — add one using the form above.'
    listEl.appendChild(el)
  }

  exercises.forEach(item => {
    const li = document.createElement('li')
    li.className = 'card'

    const left = document.createElement('div')
    left.className = 'left'

    const badge = document.createElement('div')
    badge.className = 'badge'
    badge.textContent = item.name.charAt(0).toUpperCase()

    const meta = document.createElement('div')
    meta.className = 'meta'

    const nm = document.createElement('div')
    nm.className = 'name'
    nm.textContent = item.name
    if(item.status === 'finished') nm.classList.add('finished')

    const dt = document.createElement('div')
    dt.className = 'detail'
    dt.textContent = item.reps || ''

    meta.appendChild(nm)
    meta.appendChild(dt)

    left.appendChild(badge)
    left.appendChild(meta)

    const controls = document.createElement('div')
    controls.className = 'controls'

    // Tick button to toggle finished state
    const tick = document.createElement('button')
    tick.className = 'btn small tick-btn'
    tick.type = 'button'
    tick.title = item.status === 'finished' ? 'Mark as not finished' : 'Mark as finished'
    tick.innerHTML = item.status === 'finished' ? '✓' : '○'
    if(item.status === 'finished') tick.classList.add('active')
    tick.addEventListener('click', () => {
      const prev = item.status
      item.status = item.status === 'finished' ? 'not-finished' : 'finished'
      save();
      render();
      // If just marked finished, trigger celebration
      if(prev !== 'finished' && item.status === 'finished') showCelebrate()
      // record finish/unfinish in history
      try{
        const at = Date.now()
        history.unshift({ type: item.status === 'finished' ? 'finished' : 'unfinished', id: item.id, name: item.name, at })
        saveHistory()
      }catch(e){}
    })

    const del = document.createElement('button')
    del.className = 'btn small remove'
    del.textContent = 'Delete'
    del.addEventListener('click', () => {
      exercises = exercises.filter(e => e.id !== item.id)
      save(); render();
    })

  controls.appendChild(tick)
    controls.appendChild(del)

    li.appendChild(left)
    li.appendChild(controls)

    listEl.appendChild(li)
  })

  totalEl.textContent = exercises.length
  finishedEl.textContent = exercises.filter(e => e.status === 'finished').length
}

form.addEventListener('submit', e => {
  e.preventDefault()
  const name = nameInput.value.trim()
  const reps = repsInput.value.trim()
  const status = 'not-finished'
  if(!name) return
  const now = Date.now()
  const item = { id: uid(), name, reps, status, createdAt: now }
  exercises.unshift(item)
  // record creation in history
  try{
    history.unshift({ type: 'created', id: item.id, name: item.name, at: now })
    saveHistory()
  }catch(e){}
  save();
  render();
  form.reset();
  nameInput.focus();
})

// init
exercises = load()

// Purge any exercises that are not from today (keep only today's exercises)
function isSameDay(tsA, tsB){
  const a = new Date(tsA); const b = new Date(tsB)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function purgeOldExercises(){
  const now = Date.now()
  const before = exercises.length
  exercises = exercises.filter(item => item.createdAt && isSameDay(item.createdAt, now))
  if(exercises.length !== before){
    save()
    render()
  }
}

purgeOldExercises()
render()

// Schedule purge at next midnight and also run a minute-based fallback
function scheduleMidnightPurge(){
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,2,0) // 2 seconds after midnight
  const ms = next.getTime() - now.getTime()
  setTimeout(()=>{ purgeOldExercises(); scheduleMidnightPurge() }, ms)
}
scheduleMidnightPurge()
setInterval(()=>{ purgeOldExercises() }, 60*1000) // fallback every minute

// Celebration messages and helper
const celebrateEl = document.getElementById('celebrate')
const celebrateMsg = document.getElementById('celebrate-message')
const messages = [
  "Great job! Keep it up!",
  "Nice work — you crushed that set!",
  "Awesome effort! You're getting stronger!",
  "Well done! One step closer to your goals!",
  "Fantastic — momentum matters!"
]

function showCelebrate(){
  if(!celebrateEl) return
  const msg = messages[Math.floor(Math.random()*messages.length)]
  celebrateMsg.textContent = msg
  celebrateEl.classList.add('show')
  celebrateEl.setAttribute('aria-hidden','false')
  // launch confetti
  launchConfetti()
  setTimeout(() => {
    celebrateEl.classList.remove('show')
    celebrateEl.setAttribute('aria-hidden','true')
  }, 1600)
}

function launchConfetti(){
  const container = document.getElementById('confetti-container')
  if(!container) return
  const rect = container.getBoundingClientRect()
  const colors = ['#ff4d4f','#ffa940','#ffd666','#69db7c','#73d2de','#a78bfa']
  const count = 46
  for(let i=0;i<count;i++){
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.background = colors[Math.floor(Math.random()*colors.length)]
  // position within the card using percentages (start near bottom)
  const startX = Math.random()*100
  el.style.left = startX + '%'
  // start lower in the card so particles travel upward to the top
  el.style.top = (80 + Math.random()*15) + '%'
  el.style.transform = `rotate(${Math.random()*360}deg)`
    container.appendChild(el)
    // force layout then add animation with random delay and end translation within card
    requestAnimationFrame(()=>{
      el.classList.add('confetti-fall')
      el.style.animationDelay = (Math.random()*220) + 'ms'
      // translate up (bottom-to-top) to roughly -90%..-100% of the container height
      el.style.transform = `translateY(-${90 + Math.random()*10}%) rotate(${Math.random()*720}deg)`
    })
    // cleanup (match slightly after animation end)
    setTimeout(()=>{ try{ container.removeChild(el) }catch(e){} }, 1800 + 600)
  }
}

// -----------------------------
// History storage and UI
// -----------------------------

function saveHistory(){
  try{ localStorage.setItem(HIST_KEY, JSON.stringify(history)) }catch(e){}
}

function loadHistory(){
  try{
    const raw = localStorage.getItem(HIST_KEY)
    if(!raw) return []
    return JSON.parse(raw)
  }catch(e){ return [] }
}

function startOfWeek(ts){
  const d = new Date(ts)
  const day = d.getDay() // 0=Sun..6
  const diff = (day === 0 ? -6 : 1 - day) // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d.getTime()
}

function getThisWeekHistory(){
  const now = Date.now()
  const start = startOfWeek(now)
  return history.filter(h => h.at >= start && h.at <= now)
}

function renderHistoryPanel(){
  let panel = document.getElementById('history-panel')
  const anchor = document.getElementById('history-stat') || document.querySelector('.app')
  if(!panel){
    panel = document.createElement('aside')
    panel.id = 'history-panel'
    panel.className = 'history-panel'
    panel.setAttribute('aria-hidden','true')
    // append to body so fixed positioning works, we'll move visually next to anchor
    document.body.appendChild(panel)
  }
  const items = getThisWeekHistory()

  // Build header + content wrapper so we can always show a close button
  let html = ''
  html += '<div class="history-card">'
  html += '<header class="history-header">'
  html += '<div class="history-title">Weekly History</div>'
  html += '<button id="history-close" class="history-close" aria-label="Close history">&times;</button>'
  html += '</header>'
  html += '<div class="history-body">'

  // Daily performance summary (for today)
  const today = new Date()
  today.setHours(0,0,0,0)
  const todayTs = today.getTime()
  // find unique finished exercise names that were finished today
  const finishedToday = history.filter(h => h.type === 'finished' && new Date(h.at).setHours(0,0,0,0) === todayTs)
  const uniqueFinishedNames = Array.from(new Set(finishedToday.map(f => f.name)))
  const uniqueCount = uniqueFinishedNames.length
  // compute a simple percentage: cap at 100; 5 or more -> 95 by default
  let percent = Math.min(100, Math.round((uniqueCount / 5) * 100))
  if(uniqueCount >= 5) percent = 95
  // decide message
  let perfMsg = ''
  if(uniqueCount >= 5){
    perfMsg = "You're in the top 10% — great work!"
  } else if(uniqueCount < 3){
    perfMsg = "Keep going — small steps add up!"
  } else {
    perfMsg = "Nice progress — keep the momentum!"
  }
  html += `<div class="history-summary"><div class="summary-row"><div class="summary-msg">${perfMsg}</div><div class="summary-percent">${percent}%</div></div><div class="summary-bar"><div class="summary-fill" style="width:${percent}%"></div></div></div>`

  if(items.length === 0){
    html += '<div class="history-empty">No activity this week.</div>'
    html += '</div></div>'
    panel.innerHTML = html
    // attach close handler
    const closeBtnEmpty = panel.querySelector('#history-close')
    if(closeBtnEmpty) closeBtnEmpty.addEventListener('click', closeHistoryPanel)
    return
  }

  const byDay = {}
  items.forEach(i => {
    const day = new Date(i.at).toISOString().slice(0,10)
    byDay[day] = byDay[day] || []
    byDay[day].push(i)
  })

  const days = Object.keys(byDay).sort()
  html += '<div class="history-inner">'
  days.forEach(day => {
    const date = new Date(day + 'T00:00:00')
    const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    html += `<div class="history-day"><div class="history-day-label">${label}</div>`
    byDay[day].forEach(ev => {
      const time = new Date(ev.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      let msg = ''
      if(ev.type === 'created') msg = `Added: ${ev.name}`
      else if(ev.type === 'finished') msg = `Finished: ${ev.name}`
      else if(ev.type === 'unfinished') msg = `Marked not finished: ${ev.name}`
      html += `<div class="history-item"><div class="history-time">${time}</div><div class="history-msg">${msg}</div></div>`
    })
    html += '</div>'
  })
  html += '</div>'
  // footer with clear history button
  html += '<footer class="history-footer"><button id="history-clear" class="btn ghost">Clear history</button></footer>'
  html += '</div></div>'
  panel.innerHTML = html

  // attach close handler
  const closeBtn = panel.querySelector('#history-close')
  if(closeBtn) closeBtn.addEventListener('click', closeHistoryPanel)

  // attach clear history handler for the footer button if present
  const clearBtn = panel.querySelector('#history-clear')
  if(clearBtn) clearBtn.addEventListener('click', ()=>{
    // confirm before clearing
    if(!confirm('Clear all history for this device? This cannot be undone.')) return
    history = []
    saveHistory()
    // update UI
    renderHistoryPanel()
  })
}

function closeHistoryPanel(){
  const panel = document.getElementById('history-panel')
  if(!panel) return
  // remove overlay
  const overlay = document.getElementById('history-overlay')
  if(overlay) try{ overlay.parentNode.removeChild(overlay) }catch(e){}
  panel.classList.remove('open')
  panel.setAttribute('aria-hidden','true')
  const toggle = document.getElementById('history-toggle')
  const histStat = document.getElementById('history-stat')
  if(histStat) histStat.setAttribute('aria-expanded','false')
}

const historyStat = document.getElementById('history-stat')
if(historyStat){
  const activate = ()=>{
    const expanded = historyStat.getAttribute('aria-expanded') === 'true'
    historyStat.setAttribute('aria-expanded', String(!expanded))
    let panel = document.getElementById('history-panel')
    if(!panel){ renderHistoryPanel(); panel = document.getElementById('history-panel') }
    if(!expanded){
      // Create overlay that blurs backdrop and closes on click
      let overlay = document.getElementById('history-overlay')
      if(!overlay){
        overlay = document.createElement('div')
        overlay.id = 'history-overlay'
        overlay.className = 'history-overlay'
        overlay.addEventListener('click', closeHistoryPanel)
        document.body.appendChild(overlay)
      }
      // Center the panel on screen
      panel.style.left = '50%'
      panel.style.top = '50%'
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
      panel.style.transform = 'translate(-50%, -50%)'
      panel.classList.add('open')
      panel.setAttribute('aria-hidden','false')
      renderHistoryPanel()
    } else {
      // remove overlay when closing
      const overlay = document.getElementById('history-overlay')
      if(overlay) try{ overlay.parentNode.removeChild(overlay) }catch(e){}
      panel.classList.remove('open')
      panel.setAttribute('aria-hidden','true')
    }
  }

  historyStat.addEventListener('click', activate)
  historyStat.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
  })
}
