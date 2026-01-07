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
        this.load.spritesheet('demon_icon', 'assets/demon_front_2.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('mouse', 'assets/MousePointer.png', { frameWidth: 32, frameHeight: 32 });
        this.load.audio('bgm', 'assets/sounds/firstBGM.mp3');
        this.load.audio('moving', 'assets/sounds/swooshMoving.wav');
        this.load.audio('skill1_sound', 'assets/sounds/whipCrack.wav');
        this.load.audio('skill2_sound', 'assets/sounds/slashkut.wav');
        // ... (나머지 공통 파일들도 다 여기 넣으세요)
    }

    create() {
        // 로딩이 끝나면 바로 선택창으로 이동!
        this.scene.start('SelectScene');
    }
}