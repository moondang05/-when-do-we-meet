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

    let currentDate = new Date();

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        document.getElementById('year-display').textContent = year;
        document.getElementById('month-display').textContent = monthNames[month];
        document.getElementById('month-num-display').textContent = String(month + 1).padStart(2, '0');

        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        document.body.className = randomTheme;

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

            const isHoliday = dynamicHolidays2026[dynamicKey] || fixedHolidays[fixedKey];
            const isSunday = new Date(year, month, i).getDay() === 0;

            if (isHoliday || isSunday) {
                div.classList.add('selected');
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

    renderCalendar(currentDate);

    document.getElementById('prev-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

});