import Phaser from 'phaser';

export default class HudScene extends Phaser.Scene{
    constructor(){
        super('HudScene');
    }

    create(){
        //브라우저의 크기에 반응해 hud를 중앙에 정렬하기 위한 사전준비
        // 1. UI 요소들을 담을 큰 바구니(Container) 생성
        this.uiContainer = this.add.container(0, 0);

        this.maskGraphics = this.make.graphics();//마스크용 그래픽 객체를 미리 만들어둠(컨테이너에 넣지 않음)

        // 2. UI 그리기 (함수로 분리하여 관리)
        this.createHudElements();

        // 3. 처음 시작할 때 위치 잡기
        this.repositionHud();

        // 4. [핵심] 브라우저 창 크기가 바뀔 때마다 실행될 이벤트 등록
        this.scale.on('resize', () => {
            this.repositionHud();
        });

        this.customCursor = this.add.sprite(0, 0, 'mouse')
            .setDepth(9999) // 혹시 모르니 depth를 높게 설정
            .setScale(1)
            .play('mouse');
    }

    createHudElements() {
        // 위치 계산을 위해 임시 변수 사용 (컨테이너 기준이므로 0을 중심으로 설계)
        const radius = 90;

        // 배경 바
        this.bgBar = this.add.graphics()
            .fillStyle(0x000000, 0.5)
            .fillRect(-300, -50, 600, 100);

        // 프로필 (가운데 0, 0 기준)
        this.portrait = this.add.sprite(0, 0, 'profile').setScale(3).play('profile');

        // 마스크 생성
        const mask = this.maskGraphics.createGeometryMask();
        this.portrait.setMask(mask);

        // 테두리
        this.border = this.add.graphics()
            .lineStyle(4, 0xffffff, 1)
            .strokeCircle(0, 0, radius);

        // HP 바 영역
        this.hpBar = this.add.graphics();
        this.updateBar(this.hpBar, -280, 0, 0xff0000, 1);
        this.hpText = this.add.text(-280, -40, 'HP', { fontSize: '14px', fill: '#fff' });

        // EXP 바 영역
        this.expBar = this.add.graphics();
        this.updateBar(this.expBar, 130, 0, 0x00ff00, 0.5);
        this.expText = this.add.text(130, -40, 'EXP', { fontSize: '14px', fill: '#fff' });


        //레벨 텍스트
        this.levelText = this.add.text(0, 60, 'Lv.1', {
            fontSize: '20px', fill:'#ffff00', stroke: '#000', strokeThickness: 3, fontWeight: 'bold'
        }).setOrigin(0.5);
        
        //부활버튼 (처음엔 숨김)
        this.respawnBtn = this.add.text(0, -150, '부활하기',{
            fontSize: '32px', fill:'#ffffff', backgroundColor: '#333333', padding: 10    
        }).setOrigin(0.5).setInteractive().setVisible(false).on('pointerdown', ()=>this.handleRespawn());

        // 모든 요소를 컨테이너에 추가 (순서대로 쌓임)
        this.uiContainer.add([
            this.bgBar, 
            this.portrait, 
            this.border, 
            this.hpBar, 
            this.hpText, 
            this.expBar, 
            this.expText,
            this.levelText,
            this.respawnBtn
        ]);
    }

    

    // MainScene update에서 호출할 데이터 갱신 함수
    updatePlayerStatus(hp, maxHp, exp, maxExp, level) {
        // HP바 갱신
        this.updateBar(this.hpBar, -280, 0, 0xff0000, hp / maxHp);
        this.hpText.setText(`HP ${Math.floor(hp)}/${maxHp}`);

        // EXP바 갱신
        this.updateBar(this.expBar, 130, 0, 0x00ff00, exp / maxExp);
        this.expText.setText(`EXP ${Math.floor(exp)}/${maxExp}`);

        // 레벨 텍스트 갱신
        this.levelText.setText(`Lv.${level}`);
    }

    repositionHud() {
        // 현재 브라우저의 실제 크기 가져오기
        const { width, height } = this.scale;
        
        // 컨테이너를 화면 하단 중앙으로 이동
        // bottomY를 120 정도로 주어 원 크기에 맞춰 여백 확보
        const bottomY = height - 120;

        this.uiContainer.setPosition(width / 2, bottomY);

        // 마스크 위치 수동 업데이트 (중요: 마스크는 컨테이너에 속해도 좌표가 자동 갱신되지 않음)
        // 기존 마스크를 지우고 새로 생성하거나 좌표를 직접 찍어줘야 합니다.
        // 여기서는 가장 간단하게 portrait의 마스크 좌표를 갱신하는 방식을 씁니다.
        if(this.maskGraphics){
            this.maskGraphics.clear();
            this.maskGraphics.fillStyle(0xffffff);
            this.maskGraphics.fillCircle(width / 2, bottomY, 88);
        }
      
    }

    updateBar(graphics, x, y, color, percentage) {
        
        const barY = y - 7
        graphics.clear();
        graphics.fillStyle(0x333333); // 배경색
        graphics.fillRect(x, barY, 150, 15);
        graphics.fillStyle(color); // 게이지색
        graphics.fillRect(x, barY, 150 * percentage, 15);

        //percentage가 음수가 되지 않게 Clamp
        const validPercentage = Phaser.Math.Clamp(percentage, 0, 1);
        graphics.fillRect(x, barY, 150 * validPercentage, 15);
    }

    // 부활 버튼 보이기 - Player.js 속 die함수에서 호출
    showRespawnButton() {
        this.respawnBtn.setVisible(true);
        this.respawnBtn.setInteractive(); // 클릭 가능하게
    }

    // 부활 처리
    handleRespawn() {
        const mainScene = this.scene.get('MainScene');
        if (mainScene && mainScene.player) {
            mainScene.player.respawn(); // 플레이어 부활 함수 호출
            this.respawnBtn.setVisible(false); // 버튼 숨김
        }
    }

    update(){
        // 마우스 포인터 따라다니기
        // HudScene은 고정된 화면이므로 worldX가 아니라 그냥 x, y를 씁니다.
        if (this.customCursor) {
            this.customCursor.x = this.input.activePointer.x;
            this.customCursor.y = this.input.activePointer.y;
        }
    }
    
}