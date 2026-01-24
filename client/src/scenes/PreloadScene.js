//게임에 필요한 이미지, 사운드 등 무거운 자원을 미리 로딩하고 로딩 바를 보여준다. 
//로딩이 끝나면 SelectScene을 시작한다
import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // 1. 화면 중앙에 로딩 텍스트 표시
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        // 2. 로딩 바 그래픽 생성
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

        // 3. 로딩 진행률 이벤트 리스너 (Phaser 제공)
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // 4. 모든 무거운 리소스를 여기서 미리 다 로드해버립니다!
        // SelectScene과 MainScene에서 쓸 것들을 한꺼번에 로딩하세요.
        
        //[마우스 포인터]
        this.load.spritesheet('mouse', 'assets/MousePointer.png', {frameWidth: 32, frameHeight: 32});
        //[브금]
        this.load.audio('bgm', 'assets/sounds/firstBGM.mp3');

        //이펙트
        this.load.spritesheet('player_front', `assets/demon_front.png`,{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_back', `assets/demon_back.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_left', `assets/demon_left.png`,{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_right', `assets/demon_right.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_start', `assets/demon_moving_start.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_end', `assets/demon_moving_end.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('skill1', `assets/demon_skill1.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('skill2', `assets/demon_skill2.png`, {frameWidth: 64, frameHeight: 64});
        //[효과음]
        this.load.audio('moving', `assets/sounds/demon_moving_sound.wav`);
        this.load.audio('skill1_sound', `assets/sounds/demon_skill1_sound.wav`);
        this.load.audio('skill2_sound', `assets/sounds/demon_skill2_sound.wav`);
        //몹
        this.load.spritesheet('alien', 'assets/alien.png',{frameWidth: 16, frameHeight: 16});
    }

    create() {
        // 로딩이 끝나면 바로 선택창으로 이동!
        this.scene.start('SelectScene');
    }
}