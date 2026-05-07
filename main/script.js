// 라우팅 로직
function navigate(nextScreenId, direction = 'forward') {
    const currentScreen = document.querySelector('.screen:not(.hidden-below):not(.hidden-above)');
    const nextScreen = document.getElementById(nextScreenId);
    if (!currentScreen || currentScreen === nextScreen) return;

    if (direction === 'forward') {
        nextScreen.classList.remove('hidden-above');
        nextScreen.classList.add('hidden-below');
        setTimeout(() => {
            currentScreen.classList.add('hidden-above');
            nextScreen.classList.remove('hidden-below');
        }, 50);
    } else {
        nextScreen.classList.remove('hidden-below');
        nextScreen.classList.add('hidden-above');
        setTimeout(() => {
            currentScreen.classList.add('hidden-below');
            nextScreen.classList.remove('hidden-above');
        }, 50);
    }
}

let isEditMode = false;
function handleCardClick(cardElement) {
    if (isEditMode) cardElement.classList.toggle('selected');
    else navigate('detail-screen');
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const listScreen = document.getElementById('list-screen');
    const leftBtn = document.getElementById('list-left-btn');
    const rightBtn = document.getElementById('list-right-btn');
    const fabBtn = document.getElementById('fab-btn');

    if (isEditMode) {
        listScreen.classList.add('edit-mode');
        leftBtn.innerHTML = '🗑 삭제';
        leftBtn.onclick = showPopup;
        rightBtn.innerHTML = '완료';
        fabBtn.style.display = 'none';
    } else {
        listScreen.classList.remove('edit-mode');
        leftBtn.innerHTML = '◀ 홈';
        leftBtn.onclick = () => navigate('main-screen', 'back');
        rightBtn.innerHTML = '편집';
        fabBtn.style.display = 'block';
        document.querySelectorAll('.project-card.selected').forEach(c => c.classList.remove('selected'));
    }
}

// 팝업창 제어
function showPopup() {
    if (document.querySelectorAll('.project-card.selected').length === 0) return alert("삭제할 항목을 선택해주세요.");
    document.getElementById('delete-popup').classList.add('show');
}
function closePopup() { document.getElementById('delete-popup').classList.remove('show'); }
function confirmDelete() {
    document.querySelectorAll('.project-card.selected').forEach(c => c.remove());
    closePopup(); toggleEditMode();
}

let selectedThemeColor = '#F6E6AA';
function showCreatePopup() { document.getElementById('create-popup').classList.add('show'); }
function closeCreatePopup() {
    document.getElementById('create-popup').classList.remove('show');
    document.getElementById('new-project-name').value = '';
    document.getElementById('new-project-dest').value = '';
}
function selectColor(el, color) {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    selectedThemeColor = color;
}

// 🌟 진짜 프로젝트를 생성해서 목록에 박아넣는 함수! (체크박스 위치 복구 템플릿 적용)
function addProject() {
    const nameInput = document.getElementById('new-project-name');
    const name = nameInput.value.trim();
    const destInput = document.getElementById('new-project-dest');
    const destination = destInput.value.trim();

    if (!name || !destination) return alert("프로젝트 이름과 도착지를 모두 입력해주세요!");

    // 🌟 [추가] 게이트와 좌석 랜덤 생성 로직
    const gates = ['A', 'B', 'C', 'D', 'E'];
    const randomGate = gates[Math.floor(Math.random() * gates.length)] + (Math.floor(Math.random() * 20) + 1);
    const randomSeat = (Math.floor(Math.random() * 30) + 1) + String.fromCharCode(65 + Math.floor(Math.random() * 6));

    const grid = document.querySelector('.project-grid');
    const newCard = document.createElement('div');
    newCard.className = 'project-card boarding-pass';
    newCard.setAttribute('onclick', 'handleCardClick(this)');
    newCard.style.setProperty('--theme-color', selectedThemeColor);

    // 🌟 [수정] 날짜는 --/-- 로, 게이트와 좌석은 랜덤 변수로 적용
    newCard.innerHTML = `
        <div class="ticket-header">
            <span class="bp-type">BOARDING PASS ✈</span>
            <div class="checkbox"></div>
        </div>
        <div class="ticket-body">
            <div class="ticket-main">
                <div class="bp-item passenger"><label>PASSENGER</label><span class="card-title bp-passenger">${name}</span></div>
                <div class="ticket-details-grid">
                    <div class="bp-item"><label>From</label><span class="from-loc">HOME</span></div>
                    <div class="bp-item"><label>To</label><span class="to-loc">${destination}</span></div>
                    <div class="bp-item"><label>Date</label><span class="date-val">--/--</span></div>
                    <div class="bp-item"><label>Time</label><span class="date-val">--:--</span></div>
                </div>
            </div>
            <div class="ticket-stub">
                <div class="bp-item"><label>Gate</label><span class="date-val">${randomGate}</span></div>
                <div class="bp-item"><label>Seat</label><span class="date-val">${randomSeat}</span></div>
                <div class="bp-barcode-stub">
                    <div class="bp-barcode">
                        ${Array(10).fill().map(() => `<div class="barcode-line w${Math.floor(Math.random() * 3) + 1}"></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    grid.appendChild(newCard);
    closeCreatePopup();
}

// 정렬 기능
function sortProjects() {
    const grid = document.querySelector('.project-grid');
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    if (document.getElementById('project-sort').value === 'name') cards.sort((a, b) => a.querySelector('.bp-passenger').textContent.localeCompare(b.querySelector('.bp-passenger').textContent));
    cards.forEach(c => grid.appendChild(c));
}