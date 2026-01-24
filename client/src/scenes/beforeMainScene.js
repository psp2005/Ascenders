// 맨 처음 개발시작한 파일, 모든 로직이 한 곳에 섞인 곳이다.
import Phaser from 'phaser';
// Phaser.Scene이라는 기본 도안을 복사해서(extends) 나만의 'MainScene'을 설계합니다(class).
// export default는 이 파일을 다른 곳에서 불러다 쓸 수 있게 허용한다는 뜻입니다.
export default class MainScene extends Phaser.Scene{
    //extends는 상속, Phaser.scene는 Phaser엔진이 미레 만든 '기본 게임 장면 설계도'
    //여기에는 화면그리기,소리내기,물리 법칙..등 복잡한 기초 기능들이 있다

    constructor(){
        super('MainScene')//Scene 이름을 등록한다. GameCanvas에서 사용할 이름
        this.isDashing = false;
        this.isAttacking = false;
        //스킬별 쿨타임 변수
        this.coolTime1 = false;
        this.coolTime2 = false;
    }

    // 게임을 시작하기 전, 이미지나 사운드 같은 리소스를 미리 메모리에 올리는 단계입니다.
    preload(){
        //캐릭터가 16*16 4장이면 frameWidth를 16으로 명시
        //[중요] public 폴더는 서버의 루트(/)이므로 경로는 'assets/...'로 시작합니다.
        //public/assets (현재 사용 중): 여기에 있는 파일들은 Vite가 빌드할 때 건드리지 않고 그대로 복사합니다. 브라우저에서 /assets/파일명 경로로 직접 접근할 수 있습니다. Phaser에서 이미지를 로드할 때 가장 추천하는 방식입니다.
        // 'player'라는 이름으로 이미지를 불러옵니다.
        // {frameWidth: 16}은 "이 긴 띠 형태의 그림을 16px 단위로 쪼개줘!"라는 핵심 명령어입니다.
        this.load.spritesheet('player_front', 'assets/demon_front_2.png',{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_back', 'assets/demon_back_2.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_left', 'assets/demon_left_side.png',{frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_right', 'assets/demon_right_side.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_start', 'assets/demon_moving_start.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('player_move_end', 'assets/demon_moving_end.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('whisp', 'assets/NewWhisp.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('scythe_effect', 'assets/scythe_effect2.png', {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('mouse', 'assets/MousePointer.png', {frameWidth: 32, frameHeight: 32});
        //[브금]
        this.load.audio('bgm', 'assets/sounds/firstBGM.mp3');
        //[효과음]
        this.load.audio('slash', 'assets/sounds/slashkut.wav');
        this.load.audio('moving', 'assets/sounds/swooshMoving.wav');
        this.load.audio('whip', 'assets/sounds/whipCrack.wav');
    }

    // preload가 끝나면 딱 한 번 실행됩니다. 화면에 물체를 배치하고 설정을 잡습니다.
    create(){
        // [1] 물리 엔진의 세계관(World) 크기를 현재 화면 크기만큼 늘려줍니다.
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // [2] 화면 크기가 실시간으로 변할 때(창 조절), 물리 세계 크기도 같이 변하게 설정
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;

            // 카메라 크기 업데이트
            this.cameras.main.setViewport(0, 0, width, height);
            
            // 물리 세계 벽 위치 업데이트
            this.physics.world.setBounds(0, 0, width, height);
        });

        // 위에서 16px로 쪼갠 이미지들을 0번부터 3번까지 연결해서 'walk'라는 애니메이션을 만듭니다.
        this.anims.create({
            key: 'walk_front', // 이 애니메이션의 이름은 'walk'입니다.
            frames: this.anims.generateFrameNumbers('player_front', { start: 0, end: 3 }), // 0,1,2,3번 프레임 사용
            frameRate: 8, // 1초에 8번 바뀝니다.
            repeat: -1,   // 무한 반복합니다.
        });
        this.anims.create({
            key: 'walk_back',
            frames: this.anims.generateFrameNumbers('player_back', { start: 0, end: 3 }),
            frameRate: 8, 
            repeat: -1,   
        });
       this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 3 }),
            frameRate: 8, 
            repeat: -1,   
        });
        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 3 }),
            frameRate: 8, 
            repeat: -1,   
        });
        this.anims.create({
            key: 'move_start',
            frames: this.anims.generateFrameNumbers('player_move_start', {start: 0, end: 3}),
            frameRate:16,
            repeat: 0
        });
        this.anims.create({
            key: 'move_end',
            frames: this.anims.generateFrameNumbers('player_move_end', {start: 0, end: 3}),
            frameRate:16,
            repeat: 0
        });
        this.anims.create({
            key: 'whisp',
            frames: this.anims.generateFrameNumbers('whisp', {start: 0, end: 3}),
            frameRate:24,
            repeat: 0
        });
        this.anims.create({
            key: 'scythe_effect',
            frames: this.anims.generateFrameNumbers('scythe_effect', {start: 0, end: 3}),
            frameRate:16,
            repeat: -1
        });
        this.anims.create({
            key:'mouse',
            frames: this.anims.generateFrameNumbers('mouse', {start: 0, end: 5}),
            frameRate:8,
            repeat: -1
        })
        //배경음악은 게임 시작하자마자 재생해야하니깐 create에 
        this.sound.play('bgm',{loop: true, volume: 0.5});//loop:true는 무한 반복


        //마우스 왼쪽,오른쪽 클릭시 브라우저가 메뉴가 뜨는 걸 방지
        this.input.mouse.disableContextMenu();
        //윈도우 기본 마우스 커서 숨기기
        this.input.setDefaultCursor('none');
        //커서 스프라이트 생성, 일단 (0,0)에 생성
        this.customCursor = this.add.sprite(0, 0, 'mouse');
        // [3] 중요: 커서가 캐릭터나 맵 뒤로 숨으면 안 되겠죠? 
        // depth(Z-index)를 아주 높게 설정해서 무조건 맨 위에 보이게 합니다.
        this.customCursor.setDepth(9999);
        //  커서 크기 조절
        this.customCursor.setScale(1);
        // 마우스 애니메이션을 실행시켜야 합니다!
        this.customCursor.play('mouse');

        // 카메라의 배경색을 짙은 남색(#2c3e50)으로 칠합니다.
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // 물리 엔진이 적용된 캐릭터(sprite)를 화면 좌표 (400, 300)에 생성합니다.
        this.player = this.physics.add.sprite(400, 400, 'player_front');
        
        // 16px은 너무 작으므로 4배(64px 크기)로 키웁니다.
        this.player.setScale(2);
        
        // 키보드 입력 매니저로부터 W, A, S, D, 스페이스바 키 객체를 생성합니다.
        // Phaser.Input.Keyboard.addKeys는 특정 키들의 상태를 추적할 수 있게 해줍니다.
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // 참격 이펙트가 "벽에 부딪히면 사라져라" 라는 전역 이벤트를 등록합니다.
        this.physics.world.on('worldbounds', (body) => {
            // 부딪힌 물체가 'scythe_effect' 그림이면 제거
            if (body.gameObject && body.gameObject.texture.key === 'scythe_effect') {
                body.gameObject.destroy();
                console.log("발사체 벽 충돌로 삭제됨");
            }
        });
    }
    useSkill1(angle){
        if(this.isDashing || this.isAttacking || this.coolTime1)
            return ;
        //효과음
        this.sound.play('whip', {volume: 0.8 , late: 1.5});

        this.coolTime1 = true;//쿨타임 걸기
        this.time.delayedCall(500, () => {
            this.coolTime1 = false; // 쿨타임 해제 1초 뒤에 다시 사용 가능
        });
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.isAttacking = true;
        this.player.stop();
        if (angleDeg >= -45 && angleDeg <= 45) {
            // 오른쪽
            this.player.setTexture('player_right');
            this.player.setFrame(0); // 0번이 서 있는 자세
        } 
        else if (angleDeg > 45 && angleDeg < 135) {
            // 아래쪽 (정면)
            this.player.setTexture('player_front');
            this.player.setFrame(0);
        } 
        else if (angleDeg >= -135 && angleDeg <= -45) {
            // 위쪽 (뒷면)
            this.player.setTexture('player_back');
            this.player.setFrame(0);
        } 
        else {
            // 왼쪽
            this.player.setTexture('player_left');
            this.player.setFrame(0);
        }
        // ----------------------------------------------------
        //  스킬 이펙트 생성 (핵심!)
        const offset = 40; // 캐릭터 몸에서 얼마나 떨어질지 (픽셀 단위)
        // 캐릭터 위치에서 각도(angle) 방향으로 offset만큼 떨어진 좌표 계산
        // Math.cos는 X축, Math.sin은 Y축 거리를 구해줍니다.
        const effectX = this.player.x + Math.cos(angle) * offset;
        const effectY = this.player.y + Math.sin(angle) * offset;
        // 1. 계산된 위치에 '이펙트 스프라이트' 생성 ('whisp'은 preload한 이미지 키)
        //스킬 이펙트용 스프라이트를 만든다 아니면 캐릭터가 이펙트로 바뀐다
        // physics.add.sprite를 써야 나중에 몬스터와 충돌 검사가 가능합니다.
        const skillEffect = this.physics.add.sprite(effectX, effectY, 'whisp');
        
        // 2. 이펙트 크기 조절 (필요하다면)
        skillEffect.setScale(4);
        // 3. 이펙트가 마우스 방향을 보게 회전
        // Phaser의 rotation은 라디안 값을 사용
        // 만약 그림이 위쪽을 보고 그려졌다면 + 90도(Math.PI/2) 보정이 필요할 수 있습니다.
        skillEffect.setRotation(angle);

        // 4. 이펙트 애니메이션 재생 ('whisp_anim'은 create에서 만든 애니메이션 키)
        skillEffect.play('whisp');

        // 5. 애니메이션이 끝나면 이펙트 삭제 (메모리 정리)
        skillEffect.once('animationcomplete-whisp', () => {
            skillEffect.destroy(); // 화면에서 완전히 제거
            this.isAttacking = false;
        });
    }
    useSkill2(angle){
        if(this.isDashing || this.isAttacking || this.coolTime2)
            return ;
        this.sound.play('slash', {volume: 0.8 , late: 1.5});
        this.coolTime2 = true;
        this.time.delayedCall(500, () => {
            this.coolTime2 = false; // 1초 뒤에 다시 사용 가능
        });
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.isAttacking = true;
        this.player.stop();
        if (angleDeg >= -45 && angleDeg <= 45) {
            this.player.setTexture('player_right');
            this.player.setFrame(0);
        } 
        else if (angleDeg > 45 && angleDeg < 135) {
            this.player.setTexture('player_front');
            this.player.setFrame(0);
        } 
        else if (angleDeg >= -135 && angleDeg <= -45) {
            this.player.setTexture('player_back');
            this.player.setFrame(0);
        } 
        else {
            this.player.setTexture('player_left');
            this.player.setFrame(0);
        }
        const offset = 40;
        const effectX = this.player.x + Math.cos(angle) * offset;
        const effectY = this.player.y + Math.sin(angle) * offset;
        const skillEffect = this.physics.add.sprite(effectX, effectY, 'scythe_effect');
        skillEffect.setScale(4);
        skillEffect.setRotation(angle);
        skillEffect.play('scythe_effect');
        
        // 물리 엔진으로 속도 부여 (이 방향으로 날아가라!)
        // 400은 날아가는 속도입니다. 숫자가 클수록 빠릅니다.
        this.physics.velocityFromRotation(angle, 400, skillEffect.body.velocity);

        // 이펙트 벽 충돌 설정
        skillEffect.setCollideWorldBounds(true); // 벽에 부딪히게 설정
        skillEffect.body.onWorldBounds = true;   // 부딪히면 create에서 만든 worldbounds 이벤트를 발동시켜라
        
        // skillEffect.once('animationcomplete-scythe_effect', () => {
        //     skillEffect.destroy(); // 화면에서 완전히 제거
        //     this.isAttacking = false;
        // });
        this.time.delayedCall(100, () => {
            this.isAttacking = false; 
        });
    }
    // update는 Phaser 엔진이 초당 약 60번(60FPS) 호출하는 무한 루프 함수입니다.
    // 여기서 실시간으로 키가 눌렸는지 체크하고 캐릭터의 위치(속도)를 바꿉니다.
    update() {
        // 마우스 커서 스프라이트 위치 동기화
        if (this.customCursor) {
            // worldX, worldY를 써야 카메라가 움직여도 정확한 위치에 따라옵니다.
            this.customCursor.x = this.input.activePointer.worldX;
            this.customCursor.y = this.input.activePointer.worldY;
        }
        if(this.isDashing )//중복 대시, 대시중 이동을 무시함
            return ;
        //캐릭터와 마우스 사이의 각도 계산
        const angle = Phaser.Math.Angle.Between(
            this.player.x, 
            this.player.y,
            this.input.activePointer.worldX,
            this.input.activePointer.worldY
        );
        //왼쪽 클릭
        if(this.input.activePointer.leftButtonDown()){
            this.useSkill1(angle);
        }
        //오른쪽 클릭
        if(this.input.activePointer.rightButtonDown()){
            this.useSkill2(angle);
        }
        const speed = 100;
        const dashDistance = 120;
        this.player.setVelocity(0);

        if(this.isAttacking)
            return ;
        let isLeft = this.keys.A.isDown;
        let isRight = this.keys.D.isDown;
        let isUp = this.keys.W.isDown;
        let isDown = this.keys.S.isDown;

        // 1. 방향 벡터(Direction Vector) 계산
        let direction = new Phaser.Math.Vector2(0, 0);

        if (isLeft) 
            direction.x = -1;
        else if (isRight) 
            direction.x = 1;

        if (isUp) 
            direction.y = -1;
        else if (isDown) 
            direction.y = 1;

        //스페이스바 눌렸을 때
        if(Phaser.Input.Keyboard.JustDown(this.spaceBar) && direction.length() > 0 ){//스페이스바 눌렀고, 현재 움직이고 있을때만
            this.sound.play('moving', { 
                volume: 0.6, 
                rate: 1.5   // 1.0이 기본속도, 1.5는 1.5배속입니다. (더 높을수록 빨라짐)
            });
            direction.normalize(); // 대각선 거리 보정
            this.isDashing = true; // 대시 시작! (중복 실행 방지)

            // A. 시작 애니메이션 재생
            this.player.play('move_start', true);

            // B. 시작 애니메이션이 끝나면 실행될 이벤트
            this.player.once('animationcomplete-move_start', () => {
                // 위치를 순식간에 이동시킵니다.
                this.player.x += direction.x * dashDistance;
                this.player.y += direction.y * dashDistance;

                // C. 종료 애니메이션 재생
                this.player.play('move_end', true);

                // D. 종료 애니메이션까지 끝나면 다시 움직일 수 있게 함
                this.player.once('animationcomplete-move_end', () => {
                    this.player.setTexture('player_front');
                    this.player.setFrame(0);
                    this.isDashing = false; // 이제 다시 대시 가능!
                });
            });
            
            return; // 대시를 시작했으므로 이번 프레임의 나머지 코드는 실행 안 함
        }
        // 2. 대각선 이동 시 속도 보정 (루트 계산 포함)
        // .normalize()는 벡터의 길이를 1로 만듭니다. (0,0일 때는 제외)
        // 그 후 .scale(speed)를 하면 어떤 방향이든 항상 200의 속도가 됩니다.
        if (direction.length() > 0) {
            direction.normalize().scale(speed);
            this.player.setVelocity(direction.x, direction.y);
        }

        // 2. 애니메이션 우선순위 결정 (이 부분이 핵심입니다)
        if (isDown) {
            // [남쪽 계열] S가 눌려있다면 (S만, 혹은 S+A, S+D 모두) 무조건 정면 애니메이션
            this.player.play('walk_front', true);
        } 
        else if (isUp) {
            // [북쪽 계열] W가 눌려있을 때
            if (isLeft) {
                this.player.play('walk_left', true); // 서북: 왼쪽
            } else if (isRight) {
                this.player.play('walk_right', true); // 동북: 오른쪽
            } else {
                this.player.play('walk_back', true); // 정북: 뒷모습
            }
        } 
        else if (isLeft) {
            // [순수 서쪽] A만 눌렸을 때
            this.player.play('walk_left', true);
        } 
        else if (isRight) {
            // [순수 동쪽] D만 눌렸을 때
            this.player.play('walk_right', true);
        } 
        else {
            // 아무것도 안 눌렀을 때, 나중에 정지상태일때 생동감있게 스프라이트 만들어서 넣자 stop()사용하지말고
            this.player.stop();
        }
    }
}
