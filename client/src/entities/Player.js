import Phaser from 'phaser';
import Actor from './Actor';

export default class Player extends Actor {
    constructor(scene, x, y){
        super(scene, x, y, 'player_front', 100);

        this.setScale(2);

        this.isDashing = false;
        this.isAttacking = false;
        this.coolTime1 = false;
        this.coolTime2 = false;

        //키보드 입력 설정
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
        this.spaceBar = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    //Player는 phaser의Scene이 아니고 Physics.Arcade.Sprite이라서 preload와 create를 하지 않는다
    
    update(angle){
        if(this.isDead)//Player가 상속받은 Actor에 있는 변수
            return ;
        if(this.isDashing)
            return;
        this.handleMovement();

        if(!this.isAttacking){
            const pointer = this.scene.input.activePointer;
            if(pointer.leftButtonDown()){
                this.useSkill1(angle);
            }else if(pointer.rightButtonDown()){
                this.useSkill2(angle);
            }
        }
    }
    handleMovement() {
        if (this.isAttacking || this.isDashing) {
            this.setVelocity(0);
            return;
        }

        // 키 입력 확인
        const isLeft = this.keys.A.isDown;
        const isRight = this.keys.D.isDown;
        const isUp = this.keys.W.isDown;
        const isDown = this.keys.S.isDown;

        // 방향 벡터 계산
        const direction = new Phaser.Math.Vector2(0, 0);
        if (isLeft) 
            direction.x = -1;
        else if (isRight) 
            direction.x = 1;
        if (isUp) 
            direction.y = -1;
        else if (isDown) 
            direction.y = 1;

        // 대시 (Spacebar)
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar) && direction.length() > 0) {
            this.dash(direction);
            return;
        }

        // 이동 실행
        const speed = 100;
        if (direction.length() > 0) {
            direction.normalize().scale(speed);
            this.setVelocity(direction.x, direction.y);
            this.playWalkAnimation(isLeft, isRight, isUp, isDown);
        } else {
            this.setVelocity(0);
            this.stop(); // 멈춤 (애니메이션 정지)
        }
    }

    dash(direction) {

        this.isDashing = true;
        this.setVelocity(0);
        this.scene.sound.play('moving', { volume: 0.6, rate: 1.5 }); // MainScene에 로드된 'moving' 소리 재생
        
        direction.normalize();
        const dashDistance = 120;

        // 대시 시작 애니메이션
        this.play('player_move_start', true);

        this.once('animationcomplete-player_move_start', () => {
            // 위치 순간 이동
            this.x += direction.x * dashDistance;
            this.y += direction.y * dashDistance;

            // 대시 끝 애니메이션
            this.play('player_move_end', true);
            
            this.once('animationcomplete-player_move_end', () => {
                this.isDashing = false;
                // 애니메이션 초기화 (정면 보기)
                this.setTexture('player_front'); 
            });
        });
    }

    playWalkAnimation(isLeft, isRight, isUp, isDown) {
        // 애니메이션 재생 (MainScene에서 만든 키 이름 사용: player_front 등)
        if (isDown) {
            this.play('player_front', true);
        } else if (isUp) {
            if (isLeft) this.play('player_left', true);
            else if (isRight) this.play('player_right', true);
            else this.play('player_back', true);
        } else if (isLeft) {
            this.play('player_left', true);
        } else if (isRight) {
            this.play('player_right', true);
        }
    }

    useSkill1(angle) {
         if(this.isDashing || this.isAttacking || this.coolTime1)
            return ;
        this.scene.sound.play('skill1_sound', {volume: 0.8 , late: 0});

        this.coolTime1 = true;//쿨타임 걸기
        this.scene.time.delayedCall(500, () => {
            this.coolTime1 = false; // 쿨타임 해제 1초 뒤에 다시 사용 가능
        });
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.isAttacking = true;
        this.stop();
        if (angleDeg >= -45 && angleDeg <= 45) {
            // 오른쪽
            this.setTexture('player_right');
            this.setFrame(0); // 0번이 서 있는 자세
        } 
        else if (angleDeg > 45 && angleDeg < 135) {
            // 아래쪽 (정면)
            this.setTexture('player_front');
            this.setFrame(0);
        } 
        else if (angleDeg >= -135 && angleDeg <= -45) {
            // 위쪽 (뒷면)
            this.setTexture('player_back');
            this.setFrame(0);
        } 
        else {
            // 왼쪽
            this.setTexture('player_left');
            this.setFrame(0);
        }
        // ----------------------------------------------------
        //  스킬 이펙트 생성 (핵심!)
        const offset = 40; // 캐릭터 몸에서 얼마나 떨어질지 (픽셀 단위)
        // 캐릭터 위치에서 각도(angle) 방향으로 offset만큼 떨어진 좌표 계산
        // Math.cos는 X축, Math.sin은 Y축 거리를 구해줍니다.
        const effectX = this.x + Math.cos(angle) * offset;
        const effectY = this.y + Math.sin(angle) * offset;
        // 1. 계산된 위치에 '이펙트 스프라이트' 생성 ('whisp'은 preload한 이미지 키)
        //스킬 이펙트용 스프라이트를 만든다 아니면 캐릭터가 이펙트로 바뀐다
        // physics.add.sprite를 써야 나중에 몬스터와 충돌 검사가 가능합니다.
        const skillEffect = this.scene.physics.add.sprite(effectX, effectY, 'skill1');
        // 단일기 이펙트 그룹에 넣기 - 이 그룹에 넣어야 MainScene속 this.physics.add.overlap이 인식하여 몬스터 타격가능
        this.scene.singleProjectiles.add(skillEffect);
        // 2. 이펙트 크기 조절 (필요하다면)
        skillEffect.setScale(4);
        // 3. 이펙트가 마우스 방향을 보게 회전
        // Phaser의 rotation은 라디안 값을 사용
        // 만약 그림이 위쪽을 보고 그려졌다면 + 90도(Math.PI/2) 보정이 필요할 수 있습니다.
        skillEffect.setRotation(angle);

        // 4. 이펙트 애니메이션 재생 ('whisp_anim'은 create에서 만든 애니메이션 키)
        skillEffect.play('skill1');

        // 5. 애니메이션이 끝나면 이펙트 삭제 (메모리 정리)
        skillEffect.once('animationcomplete-skill1', () => {
            skillEffect.destroy(); // 화면에서 완전히 제거
            
        });
        //6. 스킬이 벽이나 몬스터에 부딪혀서 사라지면 isAttacking 원복
        skillEffect.once('destroy',()=>{
            this.isAttacking = false;
        })
    }

    useSkill2(angle) {
        if(this.isDashing || this.isAttacking || this.coolTime2)
            return ;
        this.scene.sound.play('skill2_sound', {volume: 0.8 , late: 0});
        this.coolTime2 = true;
        this.scene.time.delayedCall(500, () => {
            this.coolTime2 = false; // 1초 뒤에 다시 사용 가능
        });
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.isAttacking = true;
        this.stop();
        if (angleDeg >= -45 && angleDeg <= 45) {
            this.setTexture('player_right');
            this.setFrame(0);
        } 
        else if (angleDeg > 45 && angleDeg < 135) {
            this.setTexture('player_front');
            this.setFrame(0);
        } 
        else if (angleDeg >= -135 && angleDeg <= -45) {
            this.setTexture('player_back');
            this.setFrame(0);
        } 
        else {
            this.setTexture('player_left');
            this.setFrame(0);
        }
        const offset = 40;
        const effectX = this.x + Math.cos(angle) * offset;
        const effectY = this.y + Math.sin(angle) * offset;
        const skillEffect = this.scene.physics.add.sprite(effectX, effectY, 'skill2');
        //skill2의 도화지는 64*64이지만 실제 그림은 작기때문에 충돌박스를 작게 조절해야함
        skillEffect.body.setSize(40,40)//너비,높이

        //다수기 이펙트 그룹에 넣기
        this.scene.multiProjectiles.add(skillEffect);
        skillEffect.setScale(4);
        skillEffect.setRotation(angle);
        skillEffect.play('skill2');
        ////////////////////////이 밑으로는 skill1과 다른 점//////////////////////////////////
        // 물리 엔진으로 속도 부여 (이 방향으로 날아가라!)
        // 400은 날아가는 속도입니다. 숫자가 클수록 빠릅니다.
        this.scene.physics.velocityFromRotation(angle, 400, skillEffect.body.velocity);

        // 이펙트 벽 충돌 설정
        skillEffect.setCollideWorldBounds(true); // 벽에 부딪히게 설정
        skillEffect.body.onWorldBounds = true;   // 부딪히면 create에서 만든 worldbounds 이벤트를 발동시켜라
        //MainScene이 알아볼 수 있는 '꼬리표(Data)' 붙이기
        // "나는 벽에 닿으면 사라져야 하는 애야"라고 적어두는 것
        skillEffect.setData('destroyOnWall', true);
        // skillEffect.once('animationcomplete-scythe_effect', () => {
        //     skillEffect.destroy(); // 화면에서 완전히 제거
        //     this.isAttacking = false;
        // });
        this.scene.time.delayedCall(100, () => {
            this.isAttacking = false; 
        });
    }
}