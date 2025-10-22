// Simple Exercise Tracker
const LS_KEY = 'exercise-tracker:v1'
let exercises = []

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
  const item = { id: uid(), name, reps, status }
  exercises.unshift(item)
  save();
  render();
  form.reset();
  nameInput.focus();
})

// init
exercises = load()
render()

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
