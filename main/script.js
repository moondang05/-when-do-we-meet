// 1. 라우팅 로직 (화면 이동)
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
    
    // 목록 화면으로 올 때 비어있는지 체크
    if (nextScreenId === 'list-screen') {
        checkEmptyProjects();
    }
}

function checkEmptyProjects() {
    const grid = document.querySelector('.project-grid');
    const existingEmptyMsg = document.getElementById('empty-project-msg');
    
    if (Object.keys(projectsData).length === 0) {
        if (!existingEmptyMsg) {
            const msg = document.createElement('div');
            msg.id = 'empty-project-msg';
            msg.style.textAlign = 'center';
            msg.style.color = '#777';
            msg.style.marginTop = '50px';
            msg.style.width = '100%';
            msg.style.fontSize = '1.1rem';
            msg.textContent = '참여하는 프로젝트가 없습니다.';
            grid.appendChild(msg);
        }
    } else {
        if (existingEmptyMsg) {
            existingEmptyMsg.remove();
        }
    }
}

// 2. 편집 모드 로직
let isEditMode = false;
let currentProjectCode = "XY78Z9"; // 기본 예시 프로젝트 코드

function handleCardClick(cardElement) {
    if (isEditMode) {
        cardElement.classList.toggle('selected');
    } else {
        // 프로젝트 코드 가져오기 (없으면 기본값)
        const paramCode = cardElement.dataset.code || "XY78Z9";
        
        // 날짜 겹침(도장 완료) 상태이고 아직 출발 시간이 정해지지 않았다면 커스텀 시간 입력 팝업 띄우기
        if (projectsData[paramCode] && projectsData[paramCode].finalDate && !projectsData[paramCode].finalTime) {
            showTimePopup(paramCode, cardElement);
            return; // 팝업에서 확인을 누르면 알아서 진입하도록 여기서 중단
        }

        proceedToDetailScreen(paramCode, cardElement);
    }
}

function proceedToDetailScreen(paramCode, cardElement) {
    currentProjectCode = paramCode;
    currentInviteCode = paramCode; // 팝업 띄울때 쓸 초대코드도 동기화

    // 클릭한 카드의 테마 컬러를 가져와서 상세 페이지에 적용
    const themeColor = cardElement.style.getPropertyValue('--theme-color');
    const detailScreen = document.getElementById('detail-screen');

    if (themeColor) {
        detailScreen.style.setProperty('--theme-color', themeColor);
    } else {
        detailScreen.style.setProperty('--theme-color', '#F6E6AA'); // 기본값
    }

    // 해당 코드로 파이어베이스 연결을 바꾸기 위해 iframe에 메시지 전송
    const calendarIframe = document.querySelector('.calendar-placeholder');
    if (calendarIframe && calendarIframe.contentWindow) {
        calendarIframe.contentWindow.postMessage({
            type: 'CHANGE_PROJECT',
            projectCode: currentProjectCode
        }, '*');
    }

    // 참가자 정보 연동
    if (projectsData[currentProjectCode]) {
        participantData = projectsData[currentProjectCode].participants;
        totalParticipants = participantData.length;
        respondedParticipants = projectsData[currentProjectCode].respondedParticipants;
        hasResponded = projectsData[currentProjectCode].hasResponded;
        updateGauge();
    }

    navigate('detail-screen');
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

// 3. 삭제 팝업 제어
function showPopup() {
    if (document.querySelectorAll('.project-card.selected').length === 0) return alert("삭제할 항목을 선택해주세요.");
    document.getElementById('delete-popup').classList.add('show');
}
function closePopup() { document.getElementById('delete-popup').classList.remove('show'); }
function confirmDelete() {
    document.querySelectorAll('.project-card.selected').forEach(c => {
        const code = c.getAttribute('data-code');
        if (code) delete projectsData[code];
        c.remove();
    });
    closePopup(); 
    toggleEditMode();
    checkEmptyProjects();
}

// 4. 새 프로젝트 생성 로직
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

// 여러 프로젝트의 데이터를 저장하는 변수 (임시 DB 역할)
let projectsData = {};

function addProject() {
    const nameInput = document.getElementById('new-project-name');
    const name = nameInput.value.trim();
    const destInput = document.getElementById('new-project-dest');
    const destination = destInput.value.trim();

    if (!name || !destination) return alert("프로젝트 이름과 도착지를 모두 입력해주세요!");

    // 난수로 고유 6자리 초대 암호 코드 생성 (예: AFK9B2)
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newCode = '';
    for(let i=0; i<6; i++) {
        newCode += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // 프로젝트별 내 색상 고정 생성
    const distinctColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#9D4EDD', '#2EC4B6', '#E71D36'];
    const myColor = distinctColors[Math.floor(Math.random() * distinctColors.length)];

    // 'host만 들어있는' 새 프로젝트 데이터 저장
    projectsData[newCode] = {
        name: name,
        destination: destination,
        participants: [
            { name: myName, color: myColor, isMe: true } // 처음엔 나 혼자
        ],
        respondedParticipants: 0, // 처음엔 아무도 응답 안 함
        hasResponded: false       // 본인도 아직 미응답
    };

    // 랜덤 좌석 번호 생성 (게이트는 참가자 수 반영)
    const participantCount = projectsData[newCode].participants.length;
    const randomSeat = (Math.floor(Math.random() * 30) + 1) + String.fromCharCode(65 + Math.floor(Math.random() * 6));

    const grid = document.querySelector('.project-grid');
    const newCard = document.createElement('div');
    newCard.className = 'project-card boarding-pass';
    newCard.setAttribute('onclick', 'handleCardClick(this)');
    newCard.setAttribute('data-code', newCode); // DOM에 코드 숨겨놓기
    newCard.style.setProperty('--theme-color', selectedThemeColor);

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
                <div class="bp-item"><label>Gate(인원)</label><span class="date-val">${participantCount}명</span></div>
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

// 5. 정렬 기능
function sortProjects() {
    const grid = document.querySelector('.project-grid');
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    if (document.getElementById('project-sort').value === 'name') cards.sort((a, b) => a.querySelector('.bp-passenger').textContent.localeCompare(b.querySelector('.bp-passenger').textContent));
    cards.forEach(c => grid.appendChild(c));
}


/* =========================================
   🌟 6. 참가자 목록 및 이름 수정 로직
========================================= */

/* =========================================
   🌟 6. 참가자 목록, 색상 고정 및 모드 전환 로직
========================================= */

// --- [추가/수정] 1. 참가자 데이터와 색상 고정 ---
let myName = "구민서";
const otherNames = ['김철수', '이영희', '박지민', '최동원'];
let participantData = []; // 참가자 정보를 고정해둘 배열

// 앱 실행 시 색상을 딱 한 번만 배정해서 고정시키는 함수
function initParticipants() {
    const distinctColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#9D4EDD', '#2EC4B6', '#E71D36'];
    let availableColors = [...distinctColors].sort(() => 0.5 - Math.random());

    // 메인(기본) 프로젝트 데이터 세팅
    participantData.push({ name: myName, color: availableColors.pop(), isMe: true });
    otherNames.forEach(name => {
        participantData.push({ name: name, color: availableColors.pop(), isMe: false });
    });

    // 기본 프로젝트를 변수에 저장
    projectsData["XY78Z9"] = {
        name: "여름 휴가 계획",
        participants: participantData,
        respondedParticipants: 3, // 초기 기본 응답자
        hasResponded: false       // 본인 응답 여부
    };
}
initParticipants(); // 함수 바로 실행

// --- [수정] 2. 팝업 띄울 때 고정된 색상(participantData) 사용 ---
function showParticipantsPopup() {
    const list = document.getElementById('participant-list');
    list.innerHTML = '';

    participantData.forEach((p) => {
        const li = document.createElement('li');
        li.className = `participant-item ${p.isMe ? 'is-me' : ''}`;

        if (p.isMe) {
            li.onclick = editMyName; // 나일 때만 수정 가능
            li.innerHTML = `
                <div class="participant-color" style="background-color: ${p.color};"></div>
                <span class="participant-name" id="display-my-name">${p.name}</span>
                <span class="participant-me-badge">ME</span>
            `;
        } else {
            li.innerHTML = `
                <div class="participant-color" style="background-color: ${p.color};"></div>
                <span class="participant-name">${p.name}</span>
            `;
        }
        list.appendChild(li);
    });

    document.getElementById('participants-popup').classList.add('show');
}

// 이름 수정 팝업 관련 (이전과 동일)
function editMyName() {
    const nameInput = document.getElementById('edit-name-input');
    nameInput.value = myName;
    document.getElementById('edit-name-popup').classList.add('show');
}
function closeEditNamePopup() { document.getElementById('edit-name-popup').classList.remove('show'); }
function closeParticipantsPopup() { document.getElementById('participants-popup').classList.remove('show'); }

function saveMyName() {
    const newNameInput = document.getElementById('edit-name-input');
    const newName = newNameInput.value.trim();
    if (newName && newName !== "") {
        myName = newName;
        // 배열(participantData) 안의 내 이름도 업데이트!
        const myData = participantData.find(p => p.isMe);
        if (myData) myData.name = myName;

        const nameDisplay = document.getElementById('display-my-name');
        if (nameDisplay) nameDisplay.textContent = myName;
        closeEditNamePopup();
    } else {
        alert("이름을 입력해주세요!");
    }
}

// --- [새로 추가] 3. 모드 전환 및 달력(iframe)으로 통신 ---
let isCalendarEditMode = false;
let totalParticipants = 5;       // 총 인원 (임시 데이터)
let respondedParticipants = 3;   // 기존 응답 완료 인원 (임시 데이터)
let hasResponded = false;        // 본인(ME)의 제출 여부

// iframe에서 보내는 점 데이터 수신
window.addEventListener('message', (e) => {
    if (e.data.type === 'POINTS_UPDATED') {
        if (projectsData[currentProjectCode]) {
            projectsData[currentProjectCode].pointMarks = e.data.pointMarks;
            checkOverlapAndStamp(currentProjectCode);
        }
    }
});

function checkOverlapAndStamp(code) {
    const project = projectsData[code];
    if (!project || !project.pointMarks) return;

    const totalParticipants = project.participants.length;
    // 모든 인원이 응답했는지 확인
    if (project.respondedParticipants >= totalParticipants && totalParticipants > 0) {
        let overlappingDates = [];
        for (const [date, marks] of Object.entries(project.pointMarks)) {
            if (marks.length === totalParticipants) {
                console.log(date, marks);
                overlappingDates.push(date);
            }
        }

        if (overlappingDates.length > 0) {
            // 가장 빠른 날짜 찾기
            overlappingDates.sort();
            const finalDate = overlappingDates[0];
            project.finalDate = finalDate;

            // 화면에 도장 및 Date 반영
            const card = document.querySelector(`.project-card[data-code="${code}"]`);
            if (card) {
                // Date 업데이트 (MM/DD 형식)
                const dateSpan = card.querySelector('.ticket-details-grid .bp-item:nth-child(3) .date-val');
                if (dateSpan) {
                    const dateObj = new Date(finalDate);
                    // format as MM/DD
                    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(dateObj.getDate()).padStart(2, '0');
                    dateSpan.textContent = `${mm}/${dd}`;
                }

                // Stamp 표시
                let stamp = card.querySelector('.overlap-stamp');
                if (!stamp) {
                    stamp = document.createElement('img');
                    stamp.src = '../img/stamp.png'; // 상위 폴더 img 접근
                    stamp.className = 'overlap-stamp';
                    stamp.style.position = 'absolute';
                    stamp.style.bottom = '10px';
                    stamp.style.left = '30%';
                    stamp.style.width = '100px';
                    stamp.style.opacity = '0.8';
                    stamp.style.transform = 'rotate(-15deg)';
                    stamp.style.pointerEvents = 'none';
                    card.appendChild(stamp);
                }
            }
        }
    }
}

// 게이지 업데이트 함수
function updateGauge() {
    const gaugeText = document.querySelector('.gauge-container div');
    const gaugeBar = document.querySelector('.gauge-container progress');
    if (gaugeText && gaugeBar) {
        gaugeText.innerText = `참가자 응답 (${respondedParticipants}/${totalParticipants})`;
        gaugeBar.value = (respondedParticipants / totalParticipants) * 100;
    }
}

function toggleCalendarMode() {
    isCalendarEditMode = !isCalendarEditMode;
    const modeBtn = document.querySelector('.mode-btn');
    const calendarIframe = document.querySelector('.calendar-placeholder');

    // 동적으로 최종 제출 둥둥 떠있는 버튼 생성 (없으면 만들기)
    let submitBtn = document.getElementById('final-submit-btn');
    if (!submitBtn) {
        submitBtn = document.createElement('button');
        submitBtn.id = 'final-submit-btn';
        submitBtn.innerText = '✅ 일정 최종 제출';
        
        // 화면 아래쪽에 눈에 띄게 배치
        submitBtn.style.position = 'absolute';
        submitBtn.style.bottom = '80px';
        submitBtn.style.left = '50%';
        submitBtn.style.transform = 'translateX(-50%)';
        submitBtn.style.padding = '15px 30px';
        submitBtn.style.backgroundColor = '#1A535C'; // 목록화면 느낌의 짙은 초록색
        submitBtn.style.color = 'white';
        submitBtn.style.border = '4px solid #FFE66D'; // 목록화면 느낌의 노란색 테두리
        submitBtn.style.borderRadius = '50px'; // 둥근 모양 (알약 형태)
        submitBtn.style.fontWeight = 'bold';
        submitBtn.style.fontSize = '1.1rem';
        submitBtn.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
        submitBtn.style.zIndex = '100';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.display = 'none'; // 처음엔 안보임
        
        // 최종 제출 버튼 눌렀을 때 동작
        submitBtn.onclick = () => {
            if (!hasResponded) {
                hasResponded = true;
                respondedParticipants++;

                // 🌟 현재 접속 중인 프로젝트(방)의 게이지 상태도 저장! (다른 방 누르고 와도 유지되도록)
                if (projectsData[currentProjectCode]) {
                    projectsData[currentProjectCode].hasResponded = true;
                    projectsData[currentProjectCode].respondedParticipants = respondedParticipants;
                    // 제출과 동시에 겹치는 날짜가 확인 가능한지 체크
                    setTimeout(() => {
                        checkOverlapAndStamp(currentProjectCode);
                    }, 500);
                }

                updateGauge();
                alert('내 일정이 최종 제출되었습니다!');
            }
            submitBtn.style.display = 'none'; // 버튼 끄기
        };
        
        document.getElementById('detail-screen').appendChild(submitBtn);
    }

    if (isCalendarEditMode) {
        // 수정 모드로 진입 시
        modeBtn.style.boxShadow = "inset 0 2px 5px rgba(0,0,0,0.2)";
        modeBtn.innerText = "수정 완료";
        submitBtn.style.display = 'none'; // 수정 중엔 제출 버튼 숨기기
    } else {
        // 수정을 완료하고 일반 모드로 돌아왔을 때
        modeBtn.style.boxShadow = "none";
        modeBtn.innerText = "모드 전환";
        
        // 제출 전이라면 버튼을 딱! 나타나게 하기
        if (!hasResponded) {
            submitBtn.style.display = 'block';
        }
    }

    // 내 색상 찾기
    const myData = participantData.find(p => p.isMe);

    // 달력(iframe) 안으로 메시지 쏴주기!
    if (calendarIframe && calendarIframe.contentWindow) {
        calendarIframe.contentWindow.postMessage({
            type: 'TOGGLE_MODE',
            isEditMode: isCalendarEditMode,
            myColor: myData.color
        }, '*');
    }
}

// 기존 footer에 있던 모드 전환 버튼에 클릭 이벤트 연결
document.querySelector('.mode-btn').onclick = toggleCalendarMode;

// 🌟 [추가] 팝업 닫기 함수
function closeEditNamePopup() {
    document.getElementById('edit-name-popup').classList.remove('show');
}

// 🌟 [추가] 변경된 이름 저장 및 화면 업데이트 함수
function saveMyName() {
    const newNameInput = document.getElementById('edit-name-input');
    const newName = newNameInput.value.trim();

    if (newName && newName !== "") {
        myName = newName; // 변수 업데이트

        // 참가자 목록 창에 떠 있는 내 이름 즉시 변경
        const nameDisplay = document.getElementById('display-my-name');
        if (nameDisplay) {
            nameDisplay.textContent = myName;
        }

        // 팝업 닫기
        closeEditNamePopup();
        console.log("이름이 변경되었습니다:", myName);
    } else {
        alert("이름을 입력해주세요!");
        newNameInput.focus();
    }
}

/* =========================================
   🌟 7. 프라이빗 초대 및 참여 시스템 로직
========================================= */

// 임시 고유 초대 코드
let currentInviteCode = "XY78Z9";

// 1. 하단 푸터 '🔗 초대' 버튼에 이벤트 연결
const inviteBtn = document.querySelector('.footer button:first-child');
if (inviteBtn && inviteBtn.innerText.includes('초대')) {
    inviteBtn.onclick = showInvitePopup;
}

// 2. 초대 팝업 띄우기
function showInvitePopup() {
    let popup = document.getElementById('invite-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'invite-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-box" style="text-align: center;">
                <h3 style="font-family: 'OkMallangB'; color: var(--main-dark-green); margin-bottom: 10px;">프라이빗 초대</h3>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 20px;">친구들에게 아래 코드를 공유하여<br>프로젝트에 초대하세요!</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 1.5rem; letter-spacing: 4px; font-weight: 900; color: var(--point-color, #E74C3C); margin-bottom: 20px;">
                    ${currentInviteCode}
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn yes" onclick="copyInviteCode()" style="background-color: var(--point-color, #E74C3C); color: white; border: none;">복사하기</button>
                    <button class="popup-btn no" onclick="closeInvitePopup()">닫기</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }
    setTimeout(() => popup.classList.add('show'), 10);
}

function closeInvitePopup() {
    const popup = document.getElementById('invite-popup');
    if (popup) popup.classList.remove('show');
}

function copyInviteCode() { 
    navigator.clipboard.writeText(currentInviteCode).then(() => {
        alert('초대 코드가 복사되었습니다! 카카오톡 등으로 공유해주세요.');
        closeInvitePopup();
    }).catch(() => {
        alert('복사에 실패했습니다. 코드를 직접 복사해주세요.');
    });
}

// 3. 리스트 화면(홈)에 '🔑 코드 참여' 버튼 띄우기
const originFabBtn = document.getElementById('fab-btn'); 
if (originFabBtn) {
    let joinFab = document.createElement('button');
    joinFab.id = 'join-fab-btn';
    joinFab.className = 'fab-button';
    joinFab.innerText = '🔑 코드 참여';
    joinFab.onclick = showJoinPopup;
    
    // CSS의 !important 속성을 이기기 위해 setProperty 사용
    joinFab.style.setProperty('bottom', '95px', 'important'); 
    joinFab.style.backgroundColor = '#457B9D'; 
    joinFab.style.color = 'white'; 
    
    document.getElementById('list-screen').appendChild(joinFab);

    // 편집 모드 토글 시 이 버튼도 숨김 처리 되도록 기존 함수 덮어쓰기
    const oldToggleEdit = toggleEditMode;
    window.toggleEditMode = function() {
        oldToggleEdit(); 
        joinFab.style.display = isEditMode ? 'none' : 'block';
    };
}

// 4. 참여 팝업창 띄우기
function showJoinPopup() {
    let popup = document.getElementById('join-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'join-popup';
        popup.className = 'popup-overlay create-overlay';
        popup.innerHTML = `
            <div class="create-popup-box" style="text-align: center;">
                <p class="create-popup-title">코드로 참여</p>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 20px;">친구에게 받은 6자리 코드를 입력하세요.</p>
                <div class="input-group">
                    <input type="text" id="join-code-input" class="create-input" placeholder="XY78Z9" style="text-align: center; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">
                </div>
                <div class="popup-buttons" style="margin-top: 20px;">
                    <button class="popup-btn yes" onclick="submitJoinCode()" style="background-color: #457B9D; color: white; border: none;">입장</button>
                    <button class="popup-btn no" onclick="closeJoinPopup()">취소</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }
    document.getElementById('join-code-input').value = '';
    setTimeout(() => popup.classList.add('show'), 10);
}

function closeJoinPopup() {
    const popup = document.getElementById('join-popup');
    if (popup) popup.classList.remove('show');
}

// 5. 코드 확인 및 상세 화면 자동 진입
function submitJoinCode() {
    const code = document.getElementById('join-code-input').value.trim().toUpperCase();
    if (!code) {
        alert("코드를 입력해주세요.");
        return;
    }
    
    // DB(projectsData)에 해당 프로젝트가 존재하는지 확인!
    if (projectsData[code]) {
        // 이미 참가한 사람은 중복으로 넣지 않기 위한 처리
        const isAlreadyJoined = projectsData[code].participants.some(p => p.name === myName);
        if (!isAlreadyJoined) {
            // 프로젝트에 나(자신) 추가
            const distinctColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#9D4EDD', '#2EC4B6', '#E71D36'];
            const myColor = distinctColors[Math.floor(Math.random() * distinctColors.length)];
            projectsData[code].participants.push({ name: myName, color: myColor, isMe: true });
            
            // 게이트(인원) 표시 업데이트
            const targetCard = document.querySelector(`.project-grid .project-card[data-code="${code}"]`);
            if (targetCard) {
                const gateCountSpan = targetCard.querySelector('.ticket-stub .bp-item:first-child .date-val');
                if (gateCountSpan) {
                    gateCountSpan.textContent = projectsData[code].participants.length + '명';
                }
            }
        }

        alert("프로젝트에 성공적으로 참여했습니다!");
        closeJoinPopup();
        
        // 홈 화면에 있는 해당 코드 프로젝트 카드를 찾아서 클릭
        const targetCard = document.querySelector(`.project-grid .project-card[data-code="${code}"]`) || document.querySelector('.project-grid .project-card');
        if (targetCard) {
            handleCardClick(targetCard); 
        } else {
            proceedToDetailScreen(code, document.querySelector('.project-grid .project-card'));
        }
    } else {
        alert("유효하지 않은 코드이거나 아직 생성되지 않은 프로젝트입니다.");
    }
}

// Custom Time Popup Logic
function showTimePopup(paramCode, cardElement) {
    let popup = document.getElementById('time-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'time-popup';
        popup.className = 'create-popup';
        popup.innerHTML = `
            <div class="create-popup-content" style="text-align: center; border-radius: 20px; padding: 30px;">
                <h2 style="margin-top:0; font-size: 1.4rem; color: #333;">🎉 일정 확정 🎉</h2>
                <p style="font-size: 0.95rem; color: #666; margin-bottom: 20px;">모든 인원의 일정이 맞았습니다!<br>출발 시간을 입력해주세요.</p>
                <div class="input-group">
                    <input type="time" id="time-input-field" class="create-input" style="font-size: 1.2rem; text-align: center;">
                </div>
                <div class="popup-buttons" style="margin-top: 20px; justify-content: center; gap: 15px; display: flex;">
                    <button class="popup-btn yes" id="time-submit-btn" style="background-color: #2EC4B6; color: white; border: none; padding: 10px 25px; border-radius: 15px;">확인</button>
                    <button class="popup-btn no" id="time-skip-btn" style="background-color: #ccc; color: white; border: none; padding: 10px 25px; border-radius: 15px;">나중에</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
    document.getElementById('time-input-field').value = '10:00';
    setTimeout(() => popup.classList.add('show'), 10);

    document.getElementById('time-submit-btn').onclick = () => {
        const timeVal = document.getElementById('time-input-field').value;
        if (timeVal) {
            projectsData[paramCode].finalTime = timeVal;
            const timeSpan = cardElement.querySelector('.ticket-details-grid .bp-item:nth-child(4) .date-val');
            if (timeSpan) timeSpan.textContent = timeVal;
        }
        popup.classList.remove('show');
        proceedToDetailScreen(paramCode, cardElement);
    };

    document.getElementById('time-skip-btn').onclick = () => {
        popup.classList.remove('show');
        proceedToDetailScreen(paramCode, cardElement);
    };
}