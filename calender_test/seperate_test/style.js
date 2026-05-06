document.addEventListener('DOMContentLoaded', () => {
    // 요일이나 이전/다음 달(dimmed) 날짜가 아닌 실제 날짜 셀만 선택
    const dateCells = document.querySelectorAll('.cal-cell:not(.weekday):not(.dimmed)');
    
    dateCells.forEach(cell => {
        cell.addEventListener('click', () => {
            // 클릭할 때마다 'selected' 클래스를 넣었다 뺐다 함 (토글)
            cell.classList.toggle('selected');
        });
    });
});