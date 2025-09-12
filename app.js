;(function(){
  const STORAGE_KEY = 'weblop82_students_v2'

  /**
   * @typedef {{ sum:number, count:number }} RatingStats
   * @typedef {{ id:string, name:string, myRating?:number, stats:RatingStats }} Student
   */

  /** @type {Student[]} */
  let students = load()

  const form = document.getElementById('student-form')
  const nameInput = document.getElementById('name')
  const listEl = document.getElementById('student-list')
  const searchInput = document.getElementById('search')

  let editingId = null

  function uid(){
    return Math.random().toString(36).slice(2,9)
  }

  function normalizeName(raw){
    return (raw || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip Vietnamese diacritics
      .replace(/\s+/g, ' ')
      .trim()
  }

  function load(){
    try{
      const rawV2 = localStorage.getItem(STORAGE_KEY)
      if(rawV2){
        return JSON.parse(rawV2)
      }
      // migrate from v1 if exists
      const rawV1 = localStorage.getItem('weblop82_students_v1')
      if(rawV1){
        /** @type {any[]} */
        const old = JSON.parse(rawV1)
        const migrated = old.map(o=>({ id:o.id, name:o.name, myRating: o.rating || 0, stats: { sum: o.rating || 0, count: o.rating ? 1 : 0 } }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        return migrated
      }
      return []
    }catch(e){
      console.error('Load failed', e)
      return []
    }
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }

  function render(list = students){
    const q = (searchInput.value || '').toLowerCase().trim()
    const filtered = q ? list.filter(s => s.name.toLowerCase().includes(q)) : list
    listEl.innerHTML = ''
    filtered
      .slice()
      .sort((a,b)=> a.name.localeCompare(b.name, 'vi'))
      .forEach(student => listEl.appendChild(renderItem(student)))
  }

  function renderItem(student){
    const tpl = document.getElementById('student-item-template')
    const node = tpl.content.cloneNode(true)
    const li = node.querySelector('li')
    li.dataset.id = student.id
    li.querySelector('.name').textContent = student.name
    // no student code

    // average
    const avg = getAverage(student)
    const avgEl = li.querySelector('.avg')
    const avgStars = avgEl.querySelector('.avg-stars')
    const avgValueEl = avgEl.querySelector('.avg-value')
    const votesEl = avgEl.querySelector('.votes')
    avgStars.style.setProperty('--value', String(avg))
    avgValueEl.textContent = avg.toFixed(1)
    votesEl.textContent = `(${student.stats.count} bình chọn)`

    const ratingEl = li.querySelector('.rating')
    ratingEl.appendChild(buildStars(student))

    li.querySelector('.edit').addEventListener('click', ()=> startEdit(student))
    li.querySelector('.delete').addEventListener('click', ()=> removeStudent(student.id))
    return li
  }

  function buildStars(student){
    const frag = document.createDocumentFragment()
    for(let i=1;i<=5;i++){
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'star' + (i <= (student.myRating || 0) ? ' active' : '')
      btn.setAttribute('role', 'radio')
      btn.setAttribute('aria-checked', String(i === (student.myRating || 0)))
      btn.setAttribute('aria-label', `${i} tim`)
      btn.textContent = '❤'
      btn.addEventListener('click', ()=> setRating(student.id, i))
      frag.appendChild(btn)
    }
    return frag
  }

  function setRating(id, rating){
    const s = students.find(s=>s.id===id)
    if(!s) return
    const prev = s.myRating || 0
    if(!s.stats) s.stats = { sum: 0, count: 0 }
    if(prev === 0){
      // first vote from this device
      s.stats.sum += rating
      s.stats.count += 1
    }else{
      // update existing vote
      s.stats.sum += (rating - prev)
    }
    s.myRating = rating
    save()
    render()
  }

  function getAverage(student){
    const sum = student.stats?.sum || 0
    const count = student.stats?.count || 0
    if(count === 0) return 0
    const avg = sum / count
    // clamp 0-5 and round to one decimal for text; stars bar uses raw value
    return Math.max(0, Math.min(5, avg))
  }

  function startEdit(student){
    editingId = student.id
    nameInput.value = student.name
    nameInput.focus()
  }

  function removeStudent(id){
    students = students.filter(s=>s.id!==id)
    save()
    render()
  }

  form.addEventListener('submit', function(e){
    e.preventDefault()
    const name = nameInput.value.trim()
    if(!name) return
    // unique name check (case-insensitive, ignore accents & extra spaces)
    const norm = normalizeName(name)
    const hasDuplicate = students.some(s => normalizeName(s.name) === norm && s.id !== editingId)
    if(hasDuplicate){
      nameInput.setCustomValidity('Tên này đã tồn tại trong danh sách')
      nameInput.reportValidity()
      setTimeout(()=> nameInput.setCustomValidity(''), 1500)
      return
    }
    if(editingId){
      const s = students.find(s=>s.id===editingId)
      if(s){
        s.name = name
      }
      editingId = null
    }else{
      students.push({ id: uid(), name, myRating: 0, stats: { sum: 0, count: 0 } })
    }
    save()
    form.reset()
    render()
  })

  searchInput.addEventListener('input', ()=> render())

  // Seed sample if empty
  if(students.length === 0){
    students = [
      { id: uid(), name: 'Nguyễn Văn An', myRating: 0, stats: { sum: 0, count: 0 } },
      { id: uid(), name: 'Trần Thị Bình', myRating: 0, stats: { sum: 0, count: 0 } },
      { id: uid(), name: 'Phạm Gia Huy', myRating: 0, stats: { sum: 0, count: 0 } }
    ]
    save()
  }

  render()
})()


