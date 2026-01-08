import Phaser from 'phaser';
import Player from '../entities/Player';
import Monster from '../entities/Monster';
/*
<주요 내장 속성>
Phaser.Scene에 있는 것들
this.add - 게임 오브젝트(이미지,텍스트) 공장
this.load - 파일 로딩 담당자
this.physics - 물리 엔진 담당자
this.input - 키보드/마우스 입력관리자
this.cameras - 카메라 관리자
this.anims - 애니메이션 관리자(전역)
this.time - 타이머 및 시간 관리자
this.sound - 오디오 관리자
<사용자 정의 속성 - 우리가 만든 것>
this.player - 플레이어 객체
this.monsters - 몬스터 그룹
this.profjectiles - 투사체 그룹
this.customCursor - 커서 이미지
*/
export default class MainScene extends Phaser.Scene{
    constructor(){
        super('MainScene');
    }
    init(data){
        //받아온 job이 있으면 그걸 쓰고, 없으면 기본값 'demon'을 사용
        this.selectedJob = data.job || 'demon';
    }
    preload(){//이미지, 소리 파일...등을 메모리에 로드
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
    
    create(){//로드된 재료로 화면에 배치하고 로직을 연결(딱 한 번 실행)
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

        //  투사체 그룹 생성 (Player가 스킬을 쓸 때 여기에 넣어야 함)
        this.singleProjectiles = this.physics.add.group();
        this.multiProjectiles = this.physics.add.group();
        //  몬스터 그룹 생성 및 초기화
        this.monsters = this.physics.add.group();

        // 처음에 8마리 생성
        for (let i = 0; i < 8; i++) {
            this.spawnMonster();
        }
        // 충돌 로직 (단일기 투사체 vs 몬스터)
        this.physics.add.overlap(this.singleProjectiles, this.monsters, (projectile, monster) => {
            projectile.destroy();
            monster.takeDamage(10); 
            if (monster.isDead == true) {
                // [리스폰 로직] 10초(10000ms) 뒤에 spawnMonster 함수 실행
                this.time.delayedCall(10000, () => {
                    this.spawnMonster();
                });
            }
        });
        this.physics.add.overlap(this.multiProjectiles, this.monsters, (projectile,monster)=>{
            //다수기는 벽이아닌 몬스터가 닿이면 없어지지 않아서 무한타격이 된다
            //이를 방지하기위해 각 다수기별로 어떤 몬스터를 히트했는지 기억하는 장부를 만든다
            if(!projectile.hitHistory){//장부 없으면 새로 만들기
                projectile.hitHistory = new Map()
            }
            const now = this.time.now;
            const lastHitTime = projectile.hitHistory.get(monster);
            if(lastHitTime && now < lastHitTime + 500)//아직 0.5초 미경과면 타격x
                    return;
            //그렇지 않으면 그냥 타격하고 장부에 타격 시간 작성
            monster.takeDamage(5); 
            projectile.hitHistory.set(monster,now);

         
          
            if(!monster.isRespawning){
                //isRespawning은 다수기가 몹을 hp = 0으로 만들어서 spawnMonster()를 호출했지만
                //여전히 다수기랑 몹이 overlap인 짧은 순간(1초에 60번)에 spawnMonster()또 호출할 수 있다.
                //그걸 방지하기위한 변수 
                monster.isRespawning = true;
                this.time.delayedCall(10000, () => {
                    this.spawnMonster();
                }); 
            }
            
        })

        this.physics.add.collider(this.monsters, this.monsters);
        console.log("@@@@@@@@@@@@@@this 속 내용물 : ", this);
    }


    update(){//무한루프, 1초에 60번씩 움직임을 처리
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
            //getChildren은 그룹(monsters)이 가진 모든 구성원(배열)을 내놓으라는 Phaser명령어
            if (monster.trace) {
                monster.trace(this.player);//trace는 alien 속 메서드
            } else if (monster.lookAt) {
                monster.lookAt(this.player.x);//lookAt는 alien 속 메서드
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
        this.anims.create({
            key: 'alien',
            frames: this.anims.generateFrameNumbers('alien', {start: 0, end: 3}),
            frameRate: 4, repeat: -1
        });
    }
}