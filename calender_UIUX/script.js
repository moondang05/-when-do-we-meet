// 달력 다시 그리기용 변수를 위로 빼서 onSnapshot이 접근 가능하도록 수정 필요
let renderCalendarFunc;

document.addEventListener('DOMContentLoaded', () => {

    const fixedHolidays = {
        '01-01': true, '03-01': true, '05-05': true,
        '06-06': true, '08-15': true, '10-03': true,
        '10-09': true, '12-25': true
    };

    const dynamicHolidays2026 = {
        '2026-02-16': true, '2026-02-17': true, '2026-02-18': true,
        '2026-03-02': true,
        '2026-05-24': true, '2026-05-25': true,
        '2026-06-03': true,
        '2026-08-17': true,
        '2026-09-24': true, '2026-09-25': true, '2026-09-26': true,
        '2026-09-28': true,
        '2026-10-05': true
    };

    const themes = ['', 'theme-green', 'theme-purple', 'theme-pink', 'theme-yellow', 'theme-blue', 'theme-orange'];
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    // currentDate를 전역 개체(window)에 저장하여 onSnapshot에서도 현재 보고 있는 달을 유지할 수 있도록 함
    window.currentDate = new Date();

    renderCalendarFunc = function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // 🌟 핵심: '월(month)' 숫자를 기준으로 테마를 고정 배정!
        // 이렇게 하면 같은 달 안에서 점을 찍을 땐 색상이 안 변하고 고정되지만, 
        // ◀ ▶ 버튼을 눌러서 '다음 달'로 넘어가면 테마가 확 달마다 바뀌게 됩니다.
        const themeIndex = month % themes.length;
        document.body.className = themes[themeIndex];

        document.getElementById('year-display').textContent = year;
        document.getElementById('month-display').textContent = monthNames[month];
        document.getElementById('month-num-display').textContent = String(month + 1).padStart(2, '0');

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        weekdays.forEach(day => {
            const div = document.createElement('div');
            div.className = 'cal-cell weekday';
            div.textContent = day;
            grid.appendChild(div);
        });

        let firstDay = new Date(year, month, 1).getDay();
        let emptyDays = firstDay === 0 ? 6 : firstDay - 1;

        const prevLastDate = new Date(year, month, 0).getDate();
        const lastDate = new Date(year, month + 1, 0).getDate();

        // 이전 달 빈칸
        for (let i = emptyDays - 1; i >= 0; i--) {
            const div = document.createElement('div');
            div.className = 'cal-cell dimmed';
            div.textContent = prevLastDate - i;
            grid.appendChild(div);
        }

        // 이번 달 날짜
        for (let i = 1; i <= lastDate; i++) {
            const div = document.createElement('div');
            div.className = 'cal-cell';
            div.textContent = i;

            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const fixedKey = `${monthStr}-${dayStr}`;
            const dynamicKey = `${year}-${monthStr}-${dayStr}`;
            
            // 날짜 저장 (점 찍기 용도)
            div.dataset.date = dynamicKey;

            const isHoliday = dynamicHolidays2026[dynamicKey] || fixedHolidays[fixedKey];
            const isSunday = new Date(year, month, i).getDay() === 0;

            if (isHoliday || isSunday) {
                div.classList.add('selected');
            }
            
            // 기존에 찍어둔 점이 있다면 불러오기!
            if (window.pointMarks && window.pointMarks[dynamicKey]) {
                const container = document.createElement('div');
                container.className = 'dot-container';
                window.pointMarks[dynamicKey].forEach(color => {
                    const dot = document.createElement('div');
                    dot.className = 'status-dot';
                    dot.style.backgroundColor = color;
                    container.appendChild(dot);
                });
                div.appendChild(container);
            }

            grid.appendChild(div);
        }

        // 다음 달 빈칸 (딱 필요한 줄까지만!)
        const currentMonthCells = emptyDays + lastDate;
        const totalRows = Math.ceil(currentMonthCells / 7);
        const totalCells = totalRows * 7;

        let nextDays = totalCells - currentMonthCells;

        if (nextDays > 0) {
            for (let i = 1; i <= nextDays; i++) {
                const div = document.createElement('div');
                div.className = 'cal-cell dimmed';
                div.textContent = i;
                grid.appendChild(div);
            }
        }
    }

    renderCalendarFunc(window.currentDate);

    document.getElementById('prev-btn').addEventListener('click', () => {
        window.currentDate.setMonth(window.currentDate.getMonth() - 1);
        renderCalendarFunc(window.currentDate);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        window.currentDate.setMonth(window.currentDate.getMonth() + 1);
        renderCalendarFunc(window.currentDate);
    });

});

// --- [새로 추가] 모드 상태와 내 색상 저장 변수 ---
let canEdit = false;
let userColor = '';
window.pointMarks = {}; // 날짜별로 찍힌 점들의 색상을 저장

// --- [새로 추가] 부모 화면(main)에서 보내는 '모드 전환' 메시지 받기 ---
window.addEventListener('message', (e) => {
    if (e.data.type === 'TOGGLE_MODE') {
        canEdit = e.data.isEditMode;
        userColor = e.data.myColor;
    }
});

// 달력 전체 영역에 이벤트 위임 방식으로 클릭 이벤트 설정
document.getElementById('calendar-grid').addEventListener('click', (e) => {
    if (!canEdit) return; // 수정 모드가 아니면 종료

    // 클릭한 곳이 날짜 칸(.cal-cell)인지 확인 (dimmed 처리된 칸이나 요일 칸은 생략하려면 처리 가능)
    const cell = e.target.closest('.cal-cell');
    if (!cell || !cell.dataset.date) return; // 유효한 날짜가 없으면 무시

    const dateKey = cell.dataset.date;

    // 해당 칸에 점들을 담을 박스(dot-container)가 없으면 만들기
    let container = cell.querySelector('.dot-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'dot-container';
        cell.appendChild(container);
    }
    
    // 점 정보가 없으면 빈 배열 생성
    if (!window.pointMarks[dateKey]) {
        window.pointMarks[dateKey] = [];
    }

    // 이미 내(userColor) 색상의 점이 배열에 있는지 확인
    const existingIndex = window.pointMarks[dateKey].findIndex(c =>
        c === userColor || hexToRgb(c) === hexToRgb(userColor)
    );

    if (existingIndex !== -1) {
        // 배열에서 토글(삭제)
        window.pointMarks[dateKey].splice(existingIndex, 1);
        
        // 화면의 DOM 요소 삭제
        const existingDot = Array.from(container.children).find(dot =>
            dot.style.backgroundColor === hexToRgb(userColor) || dot.style.backgroundColor === userColor
        );
        if (existingDot) existingDot.remove();
        
    } else {
        // 배열에 추가
        window.pointMarks[dateKey].push(userColor);
        
        // 화면의 DOM에 새로 추가
        const dot = document.createElement('div');
        dot.className = 'status-dot';
        dot.style.backgroundColor = userColor;
        container.appendChild(dot);
    }
    
    // 점을 찍거나 지운 상태를 내 파이어베이스 서버로 전송 (저장!)
    savePointsToDB(); 
});

// 색상 비교를 위한 변환 함수
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
}

// =========================================
const firebaseConfig = {
    apiKey: "AIzaSyApFzJeuqBdAP-ASIA80KsVi_FbqMNM70s",
    authDomain: "when-do-we-meet-4a7c7.firebaseapp.com",
    projectId: "when-do-we-meet-4a7c7",
    storageBucket: "when-do-we-meet-4a7c7.firebasestorage.app",
    messagingSenderId: "875040112018",
    appId: "1:875040112018:web:3b5c4d51a95a0ad74ed54b",
    measurementId: "G-55MHRKX2PF"
};

// 파이어베이스 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// "여름 휴가(XY78Z9)" 하나의 프로젝트로 가정하고 연결
// 🌟 이제 고정된 'XY78Z9'가 아니라 현재 활성화된 프로젝트 코드를 사용 (기본 프로젝트)
let currentProjectRef = db.collection('projects').doc('XY78Z9');
let unsubscribeSnapshot = null;

// 파이어베이스에서 데이터를 받아오는 메인 리스너 시작 함수
function startDBListener(docRef) {
    if (unsubscribeSnapshot) unsubscribeSnapshot(); // 기존 연결 끊기
    
    unsubscribeSnapshot = docRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.pointMarks) {
                window.pointMarks = data.pointMarks;
            } else {
                window.pointMarks = {};
            }
            if (renderCalendarFunc) {
                renderCalendarFunc(window.currentDate || new Date()); 
            }
            
            // 부모 프레임에게 변경된 점 데이터를 전달
            window.parent.postMessage({
                type: 'POINTS_UPDATED',
                pointMarks: window.pointMarks
            }, '*');
        } else {
            // 문서가 없을 경우 빈 문서 생성
            docRef.set({ pointMarks: {} });
            window.pointMarks = {};
            if (renderCalendarFunc) renderCalendarFunc(window.currentDate || new Date()); 
            
            window.parent.postMessage({
                type: 'POINTS_UPDATED',
                pointMarks: window.pointMarks
            }, '*');
        }
    });
}
startDBListener(currentProjectRef); // 최초 1회 실행

// 2. 점을 찍거나 지운 뒤에 DB에 저장하는 함수
function savePointsToDB() {
    currentProjectRef.update({
        pointMarks: window.pointMarks
    }).catch(error => {
        console.error("데이터 저장 실패: ", error);
    });
}

// 🌟 [추가] 부모 화면(main)에서 새 코드로 이동하라고 알려오면 연결 DB 갈아타기
window.addEventListener('message', (e) => {
    if (e.data.type === 'CHANGE_PROJECT') {
        const newCode = e.data.projectCode;
        if (newCode) {
            currentProjectRef = db.collection('projects').doc(newCode);
            startDBListener(currentProjectRef); // 새 코드로 연결 시작
        }
    }
});