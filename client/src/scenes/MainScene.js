//플레이어(캐릭터), 몬스터 클래스를 import하고 각 객체를 생성
//맵의 물리 법칙, 몬스터 스폰, 투사체와 몬스터 사이 충돌 판정...등 월드 관리를 하는 파일
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
        //[타일맵]
        this.load.tilemapTiledJSON('map', 'assets/tile/backgroundMap.json');
        this.load.image('tiles', 'assets/tile/tilemap.png')
        //[마우스 포인터]
        this.load.spritesheet('mouse', 'assets/MousePointer.png', {frameWidth: 32, frameHeight: 32});
        //[브금]
        this.load.audio('bgm', 'assets/sounds/firstBGM.mp3');
        //프로필
        this.load.spritesheet('profile', `assets/${job}Profile.png`,{frameWidth: 64, frameHeight: 64});
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
        //[몹]
        this.load.spritesheet('alien', 'assets/alien.png',{frameWidth: 16, frameHeight: 16});
    }
    
    create(){//로드된 재료로 화면에 배치하고 로직을 연결(딱 한 번 실행) 아래 순서 중요
        
        // 1. 애니메이션 생성 (플레이어, 이펙트 등 모든 애니메이션)
        // MainScene에서 한 번만 만들어두면, Player 클래스에서도 갖다 쓸 수 있습니다.
        this.createAnimations();
        
        //HUD 생성
        this.scene.launch('HudScene');
        
        //2-1.타일맵 적용
        const map = this.make.tilemap({key:'map'});//맵 데이터 생성
        const tileset = map.addTilesetImage('tileset', 'tiles');//타일셋 이미지 연결
        const dungeonLayer = map.createLayer('Dungeon', tileset, 0, 0);//레이어 생성
        const objectsLayer = map.createLayer('Objects', tileset, 0, 0);
        
        //1.물리 세계 설정(화면 크기 대응었는데 맵 크기 대응으로 수정)
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // 3. 캐릭터 
        this.player = new Player(this, 400, 400);
        
        //2-2
        dungeonLayer.setCollisionByProperty({ collides: true });//충돌 설정
        objectsLayer.setCollisionByProperty({ collides: true });
        
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);//카메라 설정
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setRoundPixels(true);//픽셀 깨짐 방지

        this.scale.on('resize', (gameSize) => {
            // 창 크기가 홀수(예: 721px)면 중앙 계산 시 360.5px가 되어 선이 생깁니다.
            // Math.ceil(... / 2) * 2 를 통해 무조건 짝수 크기로 맞춥니다.
            const width = Math.ceil(gameSize.width / 2) * 2;
            const height = Math.ceil(gameSize.height / 2) * 2;
            // 카메라 크기 업데이트
            this.cameras.main.setViewport(0, 0, width, height);

        });

        
        //3브금
        // [소리 문제 해결] 브라우저 정책 때문에 클릭 시 오디오 컨텍스트를 재개합니다.
        if (this.sound.locked) {
            this.input.once('pointerdown', () => {
                this.sound.context.resume();
            });
        }
        this.sound.play('bgm',{loop: true, volume: 0.5});//loop:true는 무한 반복
        //4마우스 커서
        this.input.mouse.disableContextMenu();
        this.input.setDefaultCursor('none');

        this.input.mouse.disableContextMenu();
        this.input.setDefaultCursor('none');
        // this.customCursor = this.add.sprite(0, 0, 'mouse');
        // this.customCursor.setDepth(9999);
        // this.customCursor.setScale(1);
        // this.customCursor.play('mouse');
        

        //6.배경색
        // this.cameras.main.setBackgroundColor('#2c3e50');   

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


        const mapArea = map.widthInPixels * map.heightInPixels;//맵 전체 면적
        const monsterSize = 32 * 32;//몬스터 크기
        const spawnCount = Math.floor((mapArea / monsterSize) / 100);// {(맵 크기/ 몬스터 크기)/30} 만큼 소환
        for (let i = 0; i < spawnCount; i++) {
            this.spawnMonster();
        }

        // 충돌 로직 (단일기 투사체 vs 몬스터)
        this.physics.add.overlap(this.singleProjectiles, this.monsters, (projectile, monster) => {
            // 0.안전장치1: 투사체나 몬스터가 이미 죽었으면(active false),
            // 이 코드가 없으면 "Cannot read properties of undefined" 에러가 뜨며 캐릭터가 멈출 수 있습니다.
            if (!projectile.active || !monster.active) return;
            
            // 1.안전장치2: 이미 충돌 처리가 된 투사체라면 무시 (중복 데미지 방지)
            // body.enable이 false라면 이미 어딘가에 부딪힌 상태입니다.
            if (!projectile.body.enable) 
                return;
            // 2. 투사체의 물리 판정을 끈다
            projectile.body.enable= false;

            monster.takeDamage(10); 
            if (monster.isDead == true && !monster.isRespawning) {
                monster.isRespawning = true;
                // [리스폰 로직] 10초(10000ms) 뒤에 spawnMonster 함수 실행
                this.time.delayedCall(10000, () => {
                    this.spawnMonster();
                });
            }
            // 3. [핵심] 애니메이션이 재생 중이라면, 끝난 뒤에 삭제
            if (projectile.anims & projectile.anims.isPlaying) {
                // 'once'는 이벤트를 딱 한 번만 실행한다는 뜻입니다.
                projectile.once('animationcomplete', () => {
                    projectile.destroy();
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

            if(monster.isDead == true && !monster.isRespawning){
                //isRespawning은 다수기가 몹을 hp = 0으로 만들어서 spawnMonster()를 호출했지만
                //여전히 다수기랑 몹이 overlap인 짧은 순간(1초에 60번)에 spawnMonster()또 호출할 수 있다.
                //그러면 우리가 8마리로 제한한 것보다 더 생성될 수 있다. 그걸 방지하기위한 변수 
                monster.isRespawning = true;
                this.time.delayedCall(10000, () => {
                    this.spawnMonster();
                }); 
            }
            
        })

        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.collider(this.player, this.monsters);
        this.physics.add.collider(this.player, dungeonLayer);//캐릭터와 충돌 레이어 연결 (이제 캐릭터가 장애물을 못 지나감)
        this.physics.add.collider(this.player, objectsLayer);
        this.physics.add.collider(this.monsters, dungeonLayer);
        this.physics.add.collider(this.monsters, objectsLayer);
        this.physics.add.collider(this.singleProjectiles, dungeonLayer, this.handleProjectileWallCollision, null, this);
        this.physics.add.collider(this.singleProjectiles, objectsLayer, this.handleProjectileWallCollision, null, this);
        
        this.physics.add.collider(this.multiProjectiles, dungeonLayer, this.handleProjectileWallCollision, null, this);
        this.physics.add.collider(this.multiProjectiles, objectsLayer, this.handleProjectileWallCollision, null, this);
      
    }

    // [추가됨] 투사체가 벽에 부딪혔을 때 실행되는 함수
    handleProjectileWallCollision(projectile, tile) {
        // 투사체 제거
        projectile.destroy();
    }

    update(){//무한루프, 1초에 60번씩 움직임을 처리
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

        // HUD에 플레이어 정보 전달
        const hud = this.scene.get('HudScene');
        if (hud && this.player) {
            hud.updatePlayerStatus(
                this.player.hp, 
                this.player.maxHp, 
                this.player.exp, 
                this.player.maxExp, 
                this.player.level
            );
        }
    }

    // [추가] 몬스터 스폰 함수
    spawnMonster() {
        // [수정 추천] 스폰 위치도 맵 전체 크기 내에서 랜덤으로 잡아야 합니다.
        // 기존: const x = Phaser.Math.Between(50, this.scale.width - 50);
        // 수정: this.physics.world.bounds.width 사용
        
        const worldWidth = this.physics.world.bounds.width;
        const worldHeight = this.physics.world.bounds.height;

        const x = Phaser.Math.Between(50, worldWidth - 50);
        const y = Phaser.Math.Between(50, worldHeight - 50);

        const monster = new Monster(this, x, y);
        this.monsters.add(monster);
    }













    // 코드가 너무 길어지니 애니메이션 생성 부분은 함수로 뺐습니다.
    createAnimations() {
        //프로필
        this.anims.create({
            key:'profile',
            frames: this.anims.generateFrameNumbers('profile', {start:0, end: 5}),
            frameRate: 8,
            repeat:-1
        })
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