;(function(){
  const STORAGE_KEY = 'weblop82_students_v3'
  const MY_RATINGS_KEY = 'weblop82_myRatings_v2'
  const ADMIN_SESSION_KEY = 'weblop82_admin_session'
  const THEME_KEY = 'weblop82_theme'

  let students = []
  let comments = {} // { studentId: [text, ...] }
  let myRatings = loadMyRatings()
  let isAdminLoggedIn = false
  let currentTheme = localStorage.getItem(THEME_KEY) || 'theme-pink'

  const USE_REMOTE = Boolean(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey)
  let db = null
  if(USE_REMOTE){
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG)
      db = firebase.firestore()
      subscribeRemote()
      subscribeComments()
    } catch(e) {
      console.warn('Firebase failed', e)
      students = loadLocal()
      render()
    }
  } else {
    students = loadLocal()
  }

  // DOM Elements
  const form = document.getElementById('student-form')
  const nameInput = document.getElementById('name')
  const bdayInput = document.getElementById('birthday')
  const groupSelect = document.getElementById('group-select')
  const listEl = document.getElementById('student-list')
  const leaderboardEl = document.getElementById('leaderboard-list')
  const searchInput = document.getElementById('search')
  const sortSelect = document.getElementById('sort-select')
  const themeToggle = document.getElementById('theme-toggle')

  // Comment Elements
  const commentModal = document.getElementById('comment-modal')
  const commentForm = document.getElementById('comment-form')
  const commentInput = document.getElementById('comment-input')
  const commentList = document.getElementById('comment-list')
  let currentCommentTarget = null

  let editingId = null

  // --- Birthday Logic ---

  function getDaysUntilBirthday(bdayStr) {
    if (!bdayStr) return 999
    const bday = new Date(bdayStr)
    const now = new Date()
    const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
    if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1)
    return Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24))
  }

  // --- Comment Logic ---

  function subscribeComments() {
    db.collection('comments').onSnapshot(snap => {
      const data = {}
      snap.forEach(doc => {
        const d = doc.data()
        if (!data[d.studentId]) data[d.studentId] = []
        data[d.studentId].push({ id: doc.id, text: d.text, time: d.time })
      })
      comments = data
      if (currentCommentTarget) openCommentModal(currentCommentTarget)
    })
  }

  function openCommentModal(studentId) {
    currentCommentTarget = studentId
    const s = students.find(s => s.id === studentId)
    document.getElementById('comment-target-name').textContent = `Lời nhắn cho ${s.name}`
    commentModal.classList.add('show')
    
    const list = comments[studentId] || []
    commentList.innerHTML = list.length ? '' : '<p class="muted" style="text-align:center">Chưa có lời nhắn nào. Hãy là người đầu tiên!</p>'
    list.sort((a,b) => a.time - b.time).forEach(c => {
      const div = document.createElement('div')
      div.className = 'comment-item'
      div.textContent = c.text
      commentList.appendChild(div)
    })
    commentList.scrollTop = commentList.scrollHeight
  }

  commentForm.onsubmit = async e => {
    e.preventDefault()
    const text = commentInput.value.trim()
    if (!text || !currentCommentTarget) return
    
    if (USE_REMOTE) {
      await db.collection('comments').add({
        studentId: currentCommentTarget,
        text,
        time: Date.now()
      })
    }
    commentInput.value = ''
    showToast('Đã gửi lời nhắn yêu thương!')
  }

  document.getElementById('close-comment').onclick = () => {
    commentModal.classList.remove('show')
    currentCommentTarget = null
  }

  // --- Rendering ---

  function render() {
    const q = (searchInput.value || '').toLowerCase().trim()
    const sort = sortSelect.value

    let filtered = students.filter(s => s.name.toLowerCase().includes(q))

    // Sorting logic
    filtered.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name, 'vi')
      if (sort === 'rating-desc') return getAverage(b) - getAverage(a)
      if (sort === 'votes-desc') return (b.stats?.count || 0) - (a.stats?.count || 0)
      if (sort === 'birthday') return getDaysUntilBirthday(a.birthday) - getDaysUntilBirthday(b.birthday)
      return 0
    })

    listEl.innerHTML = ''
    filtered.forEach(s => listEl.appendChild(renderItem(s)))
    renderLeaderboard()
  }

  function renderItem(student) {
    const tpl = document.getElementById('student-item-template')
    const node = tpl.content.cloneNode(true)
    const li = node.querySelector('li')
    
    li.querySelector('.group-badge').textContent = `Tổ ${student.group}`
    li.querySelector('.name').textContent = student.name
    
    // Birthday display
    const bdayTag = li.querySelector('.bday-tag')
    if (student.birthday) {
      const days = getDaysUntilBirthday(student.birthday)
      if (days === 0 || days === 365) {
        bdayTag.textContent = '🎂 Chúc mừng sinh nhật!'
        bdayTag.classList.add('bday-upcoming')
      } else if (days <= 7) {
        bdayTag.textContent = `🎉 Còn ${days} ngày nữa là sinh nhật!`
        bdayTag.classList.add('bday-upcoming')
      } else {
        const d = new Date(student.birthday)
        bdayTag.textContent = `📅 ${d.getDate()}/${d.getMonth() + 1}`
      }
    }

    li.querySelector('.msg-btn').onclick = () => openCommentModal(student.id)
    
    const avg = getAverage(student)
    const avgEl = li.querySelector('.avg')
    avgEl.querySelector('.avg-stars').style.setProperty('--value', String(avg))
    avgEl.querySelector('.avg-value').textContent = avg.toFixed(1)
    avgEl.querySelector('.votes').textContent = `(${student.stats?.count || 0})`

    const ratingEl = li.querySelector('.rating')
    for(let i=1; i<=5; i++) {
      const btn = document.createElement('button')
      btn.className = 'star' + (i <= student.myRating ? ' active' : '')
      btn.innerHTML = '❤'
      btn.onclick = () => setRating(student.id, i)
      ratingEl.appendChild(btn)
    }

    const editBtn = li.querySelector('.edit')
    const deleteBtn = li.querySelector('.delete')
    if(isAdminLoggedIn) {
      editBtn.onclick = () => startEdit(student)
      deleteBtn.onclick = () => removeStudent(student.id)
    } else {
      editBtn.style.display = 'none'
      deleteBtn.style.display = 'none'
    }

    return li
  }

  // --- Existing Logic Updates ---

  function subscribeRemote() {
    db.collection('students').onSnapshot(snap => {
      const list = []
      snap.forEach(doc => {
        const d = doc.data()
        list.push({
          id: doc.id,
          name: d.name || '',
          group: d.group || '1',
          birthday: d.birthday || '',
          stats: { sum: d.sum || 0, count: d.count || 0 },
          myRating: myRatings[doc.id] || 0
        })
      })
      students = list
      render()
    })
  }

  form.addEventListener('submit', async e => {
    e.preventDefault()
    if(!isAdminLoggedIn) return showToast('Vui lòng đăng nhập Admin!', 'danger')
    
    const name = nameInput.value.trim()
    const group = groupSelect.value
    const birthday = bdayInput.value
    if(!name) return

    if(editingId) {
      if(USE_REMOTE) {
        await db.collection('students').doc(editingId).update({ name, group, birthday })
      } else {
        const s = students.find(s => s.id === editingId)
        if(s) { s.name = name; s.group = group; s.birthday = birthday }
      }
      editingId = null
      showToast('Đã cập nhật thành công!')
    } else {
      if(USE_REMOTE) {
        await db.collection('students').add({ name, group, birthday, sum: 0, count: 0 })
      } else {
        const newId = Math.random().toString(36).slice(2,9)
        students.push({ id: newId, name, group, birthday, stats: {sum:0, count:0}, myRating: 0 })
      }
      showToast(`Đã thêm ${name} vào danh sách!`, 'success')
    }
    
    form.reset()
    if(!USE_REMOTE) { saveLocal(); render() }
  })

  function startEdit(s) {
    editingId = s.id
    nameInput.value = s.name
    groupSelect.value = s.group
    bdayInput.value = s.birthday || ''
    nameInput.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function removeStudent(id) {
    if(!confirm('Bạn chắc chắn muốn xoá học sinh này?')) return
    if(USE_REMOTE) {
      await db.collection('students').doc(id).delete()
    } else {
      students = students.filter(s => s.id !== id)
      saveLocal(); render()
    }
    showToast('Đã xoá học sinh')
  }

  // --- Admin Logic ---

  function checkAdmin() {
    const session = localStorage.getItem(ADMIN_SESSION_KEY)
    if(session) isAdminLoggedIn = true
    updateAdminUI()
  }

  function updateAdminUI() {
    document.body.classList.toggle('admin-mode', isAdminLoggedIn)
    const adminBtn = document.getElementById('admin-btn')
    if(isAdminLoggedIn) {
      adminBtn.textContent = '© 2026 Admin Dashboard (Đăng xuất)'
      adminBtn.style.color = 'var(--primary)'
      adminBtn.style.opacity = '1'
    } else {
      adminBtn.textContent = '© 2026 Quản trị viên'
      adminBtn.style.color = ''
      adminBtn.style.opacity = '0.5'
    }
  }

  document.getElementById('admin-btn').onclick = () => {
    if(isAdminLoggedIn) {
      if(confirm('Bạn muốn đăng xuất?')) {
        isAdminLoggedIn = false
        localStorage.removeItem(ADMIN_SESSION_KEY)
        updateAdminUI()
        render()
        showToast('Đã đăng xuất!')
      }
    } else {
      const user = prompt('Tên đăng nhập:')
      const pass = prompt('Mật khẩu:')
      // Simple logic (nên dùng Firebase Auth để bảo mật thực sự)
      if(user === 'admin' && pass === 'admin123') {
        isAdminLoggedIn = true
        localStorage.setItem(ADMIN_SESSION_KEY, 'true')
        updateAdminUI()
        render()
        showToast('Chào mừng Admin!', 'success')
      } else {
        showToast('Sai tài khoản hoặc mật khẩu!', 'danger')
      }
    }
  }

  // --- Initialization ---

  searchInput.oninput = render
  sortSelect.onchange = render
  applyTheme(currentTheme)
  checkAdmin()
  if(!USE_REMOTE) render()

})()