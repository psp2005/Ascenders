const player = document.getElementById('player');

// [수정 1] 수치 밸런스 데이터: Offset(판정 중심 이동 거리) 추가 및 범위 조정
const STATS = {
    speed: 2, 
    dashDist: 240, 
    enemySpeed: 1.0,
    
    // 채찍: 짧게 앞쪽으로 이동
    whipRange: 100,  // 판정 원의 반지름
    whipDmg: 3, 
    whipOffset: 80,  // 판정 중심을 앞으로 80px 이동

    // 낫: 아주 멀리 앞쪽으로 이동
    scytheRange: 200, // 판정 원의 반지름 (이펙트 너비 고려)
    scytheDmg: 1,
    scytheOffset: 150, // 판정 중심을 앞으로 150px 이동 (등 뒤 안 맞게 함)

    enemyMaxHp: 5,
    stunTime: 500, 
    spawnRate: 2500, 
    maxEnemies: 8
};

// 게임 상태 변수
let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let keys = {}, mouseButtons = {}, enemies = [];
let isDashing = false, isAttacking = false, lastDir = 'front';

// 우클릭 방지
window.addEventListener('contextmenu', e => e.preventDefault());

// 입력 리스너
window.addEventListener('keydown', e => { 
    keys[e.code] = true;
    if (e.code === 'Space' && !isDashing) dash();
});
window.addEventListener('keyup', e => keys[e.code] = false);

window.addEventListener('mousedown', e => {
    mouseButtons[e.button] = true;
    if (!isAttacking && !isDashing) {
        if (e.button === 0) attackWhip();
        else if (e.button === 2) attackScythe();
    }
});
window.addEventListener('mouseup', e => mouseButtons[e.button] = false);

// 몬스터 시스템
function spawnEnemy() {
    if (enemies.length >= STATS.maxEnemies) return;
    const eObj = {
        hp: STATS.enemyMaxHp, 
        x: Math.random() < 0.5 ? -70 : window.innerWidth + 70, 
        y: Math.random() * window.innerHeight,
        isStunned: false, 
        el: document.createElement('div'), 
        hpBar: document.createElement('div')
    };
    eObj.el.className = 'enemy'; 
    eObj.el.style.backgroundImage = "url('alien.png')";
    
    const hpBg = document.createElement('div'); 
    hpBg.className = 'hp-bar-bg';
    eObj.hpBar.className = 'hp-bar-fill'; 
    hpBg.appendChild(eObj.hpBar);
    eObj.el.appendChild(hpBg); 
    
    document.body.appendChild(eObj.el);
    enemies.push(eObj);
}

// [수정 2] 전투 판정 로직 업그레이드 (Offset 적용)
// offset 인자를 추가하여 공격 중심점을 이동시킴
function hitCheck(range, dmg, single = false, offset = 0) {
    
    // 1. 판정의 중심점(centerX, centerY) 계산
    let centerX = pos.x + 32; // 캐릭터 중심 X
    let centerY = pos.y + 32; // 캐릭터 중심 Y

    // 바라보는 방향(lastDir)으로 중심점을 이동시킴
    if (lastDir === 'front') centerY += offset;
    else if (lastDir === 'back') centerY -= offset;
    else if (lastDir === 'left') centerX -= offset;
    else if (lastDir === 'right') centerX += offset;

    // 2. 이동된 중심점을 기준으로 거리 계산
    let targets = enemies.map(e => {
        // 몬스터 중심 좌표
        const enemyX = e.x + 32;
        const enemyY = e.y + 32;

        const dx = enemyX - centerX;
        const dy = enemyY - centerY;
        
        return { e, dist: Math.sqrt(dx * dx + dy * dy) };
    }).filter(t => t.dist < range); // 범위 안에 들어온 적만 필터링

    if (single && targets.length > 0) {
        targets.sort((a, b) => a.dist - b.dist);
        applyDmg(targets[0].e, dmg);
    } else {
        targets.forEach(t => applyDmg(t.e, dmg));
    }
}

function applyDmg(e, dmg) {
    e.hp -= dmg; 
    e.isStunned = true;
    e.el.style.filter = 'brightness(3) saturate(5)';
    
    setTimeout(() => { 
        e.isStunned = false; 
        e.el.style.filter = 'none'; 
    }, STATS.stunTime);
    
    // STATS 데이터를 참조하여 HP바 업데이트
    e.hpBar.style.width = Math.max(0, (e.hp / STATS.enemyMaxHp) * 100) + '%';
    
    if (e.hp <= 0) {
        e.el.remove();
        enemies = enemies.filter(item => item !== e);
    }
}

// 스킬 로직
function attackWhip() {
    isAttacking = true;
    const vfx = document.createElement('div');
    vfx.className = `whip-vfx whip-animation whip-vfx-${lastDir}`;
    player.appendChild(vfx);
    
    // [수정 3] Offset 값 전달
    hitCheck(STATS.whipRange, STATS.whipDmg, true, STATS.whipOffset);
    
    vfx.addEventListener('animationend', () => {
        vfx.remove(); 
        isAttacking = false;
        if (mouseButtons[0] && !isDashing) attackWhip();
    }, { once: true });
}

function attackScythe() {
    isAttacking = true;
    const dir = lastDir;
    const sw = document.createElement('div'); sw.className = `scythe-swing scythe-${dir}`;
    const ef = document.createElement('div'); ef.className = `scythe-effect-vfx effect-${dir}`;
    ef.style.left = pos.x + 'px'; ef.style.top = pos.y + 'px';
    
    player.appendChild(sw); 
    document.body.appendChild(ef);
    
    // [수정 4] Offset 값 전달
    hitCheck(STATS.scytheRange, STATS.scytheDmg, false, STATS.scytheOffset);
    
    sw.addEventListener('animationend', () => sw.remove());
    ef.addEventListener('animationend', () => {
        ef.remove(); 
        isAttacking = false;
        if (mouseButtons[2] && !isDashing) attackScythe();
    }, { once: true });
}

// 이동 및 대시
function dash() {
    isDashing = true;
    let dx = 0, dy = 0;
    if (keys['KeyW']) dy -= 1; if (keys['KeyS']) dy += 1;
    if (keys['KeyA']) dx -= 1; if (keys['KeyD']) dx += 1;
    
    if (dx === 0 && dy === 0) {
        if (lastDir === 'front') dy = 1; else if (lastDir === 'back') dy = -1;
        else if (lastDir === 'left') dx = -1; else dx = 1;
    }
    
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const moveX = (dx / len) * STATS.dashDist, moveY = (dy / len) * STATS.dashDist;
    
    createVFX('vfx-start', pos.x, pos.y);
    player.classList.add('hidden');
    pos.x += moveX; pos.y += moveY;
    pos.x = Math.max(0, Math.min(window.innerWidth - 64, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight - 64, pos.y));
    
    setTimeout(() => {
        player.style.left = pos.x + 'px'; player.style.top = pos.y + 'px';
        createVFX('vfx-end', pos.x, pos.y, () => {
            player.classList.remove('hidden'); 
            isDashing = false;
        });
    }, 120);
}

function createVFX(type, x, y, cb) {
    const d = document.createElement('div'); d.className = `vfx ${type}`;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => { if (cb) cb(); d.remove(); }, { once: true });
}

// 메인 루프
function loop() {
    if (!isDashing) {
        let dx = 0, dy = 0;
        if (keys['KeyW']) { dy -= STATS.speed; lastDir = 'back'; }
        else if (keys['KeyS']) { dy += STATS.speed; lastDir = 'front'; }
        if (keys['KeyA']) { dx -= STATS.speed; lastDir = 'left'; }
        else if (keys['KeyD']) { dx += STATS.speed; lastDir = 'right'; }

        if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
        pos.x += dx; pos.y += dy;
        pos.x = Math.max(0, Math.min(window.innerWidth - 64, pos.x));
        pos.y = Math.max(0, Math.min(window.innerHeight - 64, pos.y));
        
        player.style.left = pos.x + 'px'; player.style.top = pos.y + 'px';
        
        if (lastDir === 'front') player.style.backgroundImage = "url('demon_front_2.png')";
        else if (lastDir === 'back') player.style.backgroundImage = "url('demon_back_2.png')";
        else if (lastDir === 'left') player.style.backgroundImage = "url('demon_side.png')";
        else player.style.backgroundImage = "url('demon_right_side.png')";

        if (dx !== 0 || dy !== 0) player.classList.add('walking');
        else player.classList.remove('walking');
    }

    enemies.forEach(e => {
        if (e.isStunned) return;
        const edx = pos.x - e.x, edy = pos.y - e.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        if (edist > 10) {
            e.x += (edx / edist) * STATS.enemySpeed; e.y += (edy / edist) * STATS.enemySpeed;
            e.el.style.left = e.x + 'px'; e.el.style.top = e.y + 'px';
        }
    });

    requestAnimationFrame(loop);
}

// 실행
setInterval(spawnEnemy, STATS.spawnRate);
loop();