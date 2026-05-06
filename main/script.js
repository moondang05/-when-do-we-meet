// 현재 화면과 다음 화면을 제어하는 로직 (방향 추가)
function navigate(nextScreenId, direction = 'forward') {
    const currentScreen = document.querySelector('.screen:not(.hidden-below):not(.hidden-above)');
    const nextScreen = document.getElementById(nextScreenId);

    if (!currentScreen || currentScreen === nextScreen) return;

    if (direction === 'forward') {
        // 🌟 [앞으로 가기] 다음 화면이 아래에서 위로 올라옴
        nextScreen.classList.remove('hidden-above');
        nextScreen.classList.add('hidden-below');

        setTimeout(() => {
            currentScreen.classList.add('hidden-above'); // 현재 화면은 위로 밀려남
            nextScreen.classList.remove('hidden-below'); // 새 화면이 올라옴
        }, 50);

    } else if (direction === 'back') {
        // 🌟 [뒤로 가기] 이전 화면이 위에서 아래로 내려옴
        nextScreen.classList.remove('hidden-below');
        nextScreen.classList.add('hidden-above');

        setTimeout(() => {
            currentScreen.classList.add('hidden-below'); // 현재 화면은 밑으로 내려감
            nextScreen.classList.remove('hidden-above'); // 이전 화면이 다시 제자리로 내려옴
        }, 50);
    }
}

// 초기 세팅 (HTML에 직접 적용했으므로 window.onload 스크립트는 삭제!)