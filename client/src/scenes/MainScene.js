import Phaser from 'phaser';
import Player from '../entities/Player';
import Monster from '../entities/Monster';

export default class MainScene extends Phaser.Scene{
    constructor(){
        super('MainScene');
    }
    init(data){
        //받아온 job이 있으면 그걸 쓰고, 없으면 기본값 'demon'을 사용
        this.selectedJob = data.job || 'demon';
    }
    preload(){
        const job = this.selectedJob;
         // =========================================================
        // [1. 로딩 바 만들기] (아직 리소스 로딩 전이므로 코드로 그립니다)
        // =========================================================
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        
        // 회색 박스 (배경)
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5);

        // =========================================================
        // [2. 이벤트 리스너] (로딩 진행 상황에 따라 바 채우기)
        // =========================================================
        this.load.on('progress', (value) => {
            // value는 0.0 ~ 1.0 사이의 숫자입니다.
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });

        this.load.on('complete', () => {
            // 로딩이 끝나면 로딩 바와 글자를 지웁니다.
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            console.log("로딩 완료!");
        });

        ///////////////////////////////////////////////////////////////////
        //[마우스 포인터]
        this.load.spritesheet('mouse', 'assets/MousePointer.png', {frameWidth: 32, frameHeight: 32});
        //[브금]
        this.load.audio('bgm', 'assets/sounds/firstBGM.mp3');

        //이펙트
        this.load.spritesheet('player_front', `assets/${job}_front.png`,{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_back', `assets/${job}_back.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_left', `assets/${job}_left.png`,{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_right', `assets/${job}_right.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_start', `assets/${job}_moving_start.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_end', `assets/${job}_moving_end.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('skill1', `assets/${job}_skill1.png`, {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('skill2', `assets/${job}_skill2.png`, {frameWidth: 64, frameHeight: 64});
        //[효과음]
        this.load.audio('moving', `assets/sounds/${job}_moving_sound.wav`);
        this.load.audio('skill1_sound', `assets/sounds/${job}_skill1_sound.wav`);
        this.load.audio('skill2_sound', `assets/sounds/${job}_skill2_sound.wav`);
        //몹
        this.load.spritesheet('alien', 'assets/alien.png',{frameWidth: 16, frameHeight: 16});
    }
    
    create(){
        //1.물리 세계 설정(화면 크기 대응)
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            // 카메라 크기 업데이트
            this.cameras.main.setViewport(0, 0, width, height);
            // 물리 세계 벽 위치 업데이트
            this.physics.world.setBounds(0, 0, width, height);
        });
        // 2. 애니메이션 생성 (플레이어, 이펙트 등 모든 애니메이션)
        // MainScene에서 한 번만 만들어두면, Player 클래스에서도 갖다 쓸 수 있습니다.
        this.createAnimations();
        //3브금
        this.sound.play('bgm',{loop: true, volume: 0.5});//loop:true는 무한 반복
        //4마우스 커서
        this.input.mouse.disableContextMenu();
        this.input.setDefaultCursor('none');
        this.customCursor = this.add.sprite(0, 0, 'mouse');
        this.customCursor.setDepth(9999);
        this.customCursor.setScale(1);
        this.customCursor.play('mouse');
        //5배경색
        this.cameras.main.setBackgroundColor('#2c3e50');   

        // 6. 캐릭터 
        this.player = new Player(this, 400, 400);

        // 7 모든 투사체(destroyOnWall이라는 꼬리표를 붙여준다)에 대하여 벽에 부딪히면 사라지도록 전역 이벤트를 등록
        this.physics.world.on('worldbounds', (body) => {
            // 부딪힌 물체에게 'destroyOnWall'이라는 데이터가 true로 설정되어 있다면?
            if (body.gameObject && body.gameObject.getData('destroyOnWall')) {
                body.gameObject.destroy();
            }
        });
        ////////////////////////////////////////////////////




















        //  투사체 그룹 생성 (Player가 스킬을 쓸 때 여기에 넣어야 함)
        // Player.js에서 this.scene.projectiles.add(skillEffect)를 해줘야 합니다.
        this.projectiles = this.physics.add.group();



        //  몬스터 그룹 생성 및 초기화
        this.monsters = this.physics.add.group();

        // 처음에 8마리 생성
        for (let i = 0; i < 8; i++) {
            this.spawnMonster();
        }
        //  [핵심] 충돌 로직 (투사체 vs 몬스터)
        this.physics.add.overlap(this.projectiles, this.monsters, (projectile, monster) => {
            // 투사체는 닿자마자 사라짐
            projectile.destroy();

            // 몬스터 데미지 처리
            monster.takeDamage(10); 

            // 몬스터 사망 체크
            if (monster.hp <= 0) {
                // 즉시 화면에서 제거
                monster.destroy();
                console.log("몬스터 사망! 10초 뒤 리스폰됩니다.");

                // [리스폰 로직] 10초(10000ms) 뒤에 spawnMonster 함수 실행
                this.time.delayedCall(10000, () => {
                    this.spawnMonster();
                });
            }
        });
        





















    }
    update(){
        if (this.customCursor) {
            // worldX, worldY를 써야 카메라가 움직여도 정확한 위치에 따라옵니다.
            this.customCursor.x = this.input.activePointer.worldX;
            this.customCursor.y = this.input.activePointer.worldY;
        }

        // 각도 계산을 여기서 해서 넘겨주거나, Player 내부에서 계산하게 해도 됩니다.
        // 여기서는 넘겨주는 방식을 유지하겠습니다.
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, 
            this.input.activePointer.worldY
        );

        this.player.update(angle);

        //몬스터가 플레이어 쳐다보고 따라가도록
        this.monsters.getChildren().forEach(monster => {
            if (monster.trace) {
                monster.trace(this.player);
            } else if (monster.lookAt) {
                monster.lookAt(this.player.x);
            }
        });
    }

    // [추가] 몬스터 스폰 함수
    spawnMonster() {
        // 화면 가장자리를 제외한 랜덤 위치 계산
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(50, this.scale.height - 50);

        // 몬스터 생성
        const monster = new Monster(this, x, y);
        
        // 그룹에 추가 (충돌 검사를 위해 필수)
        this.monsters.add(monster);
    }
    // 코드가 너무 길어지니 애니메이션 생성 부분은 함수로 뺐습니다.
    createAnimations() {
        this.anims.create({
            key:'mouse',
            frames: this.anims.generateFrameNumbers('mouse', {start: 0, end: 5}),
            frameRate:8,
            repeat: -1
        })
        this.anims.create({
            key: 'player_front',
            frames: this.anims.generateFrameNumbers('player_front', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'player_back',
            frames: this.anims.generateFrameNumbers('player_back', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'player_left',
            frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'player_right',
            frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 3 }),
            frameRate: 8, repeat: -1
        });
        this.anims.create({
            key: 'player_move_start',
            frames: this.anims.generateFrameNumbers('player_move_start', {start: 0, end: 3}),
            frameRate:16,
            repeat: 0
        });
        this.anims.create({
            key: 'player_move_end',
            frames: this.anims.generateFrameNumbers('player_move_end', {start: 0, end: 3}),
            frameRate:16,
            repeat: 0
        });
        
        this.anims.create({
            key: 'skill1',
            frames: this.anims.generateFrameNumbers('skill1', {start: 0, end: 3}),
            frameRate: 24, repeat: 0
        });

        this.anims.create({
            key: 'skill2',
            frames: this.anims.generateFrameNumbers('skill2', {start: 0, end: 3}),
            frameRate: 16, repeat: -1
        });
    }
}