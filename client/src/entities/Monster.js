import Phaser from 'phaser';
import Actor from './Actor';

export default class Monster extends Actor {
    constructor(scene, x, y) {
        super(scene, x, y, 'alien', 15); // alien 이미지를 쓴다면 'alien'으로 변경
        this.setScale(2);

        //spawn된 위치를 기억하고 적 감지 범위 200픽셀로 설정
        this.spawnX = x;
        this.spawnY = y;
        this.aggroRange = 200;
        //몬스터 경험치
        this.expReward = 10;

        //MainScene에서 this.physics.add.collider(this.monsters, this.monsters);을 통해 
        //몹끼리 겹치지 않게했지만 몸체가 기본 박스형태라서 겹칠 때도 있다 이를 방지하기 위해
        
        // 1. 몸체를 네모에서 '동그라미'로 변경
        //    setCircle(반지름, offsetX, offsetY)
        //    16px 스프라이트 기준 반지름 6 정도면 적당합니다.
        this.body.setCircle(6, 2, 2); 

        // 2. 서로 부딪혔을 때 살짝 튕겨나가게 설정 (0 ~ 1 사이 값)
        //    1에 가까울수록 탱탱볼처럼 튕깁니다. 0.5 정도 줍니다.
        this.setBounce(0.5);

        // 3. 서로 비집고 들어갈 때 미끄러지도록 마찰력 줄이기 (선택)
        this.setDrag(100); // 밀려난 뒤에 금방 멈추도록 저항 설정

        //4. hp바 그래픽 생성
        this.hpBar = scene.add.graphics();
        this.isRespawning = false;
    }
    //Actor.js의 die() 오버라이딩
    die(){
        if(this.scene.player && !this.scene.player.isDead){
            this.scene.player.gainExp(this.expReward);
        }
        //부모(Actor)의 die()호출 -> destroy()됨
        super.die();
    }

    // [핵심] Phaser Sprite의 내장 업데이트 함수 (매 프레임 실행됨)
    preUpdate(time, delta) {
        // 부모의 업데이트 로직 유지 (애니메이션 재생 등을 위해 필수)
        super.preUpdate(time, delta);

        // HP바 업데이트 및 위치 동기화
        this.updateHpBar();
    }

    updateHpBar() {
        // HP바 초기화
        this.hpBar.clear();
        
        if (this.isDead) {
            this.hpBar.destroy();
            return;
        }

        const width = 30;  // 바 너비
        const height = 4;  // 바 높이
        const x = this.x - width / 2; // 몬스터 중앙 정렬
        const y = this.y - 25;        // 몬스터 머리 위

        // 1. 검은색 배경 (백그라운드)
        this.hpBar.fillStyle(0x000000);
        this.hpBar.fillRect(x, y, width, height);

        // 2. 현재 체력 (초록색)
        // 체력 비율 계산 (0 ~ 1)
        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        
        this.hpBar.fillStyle(0x00ff00);
        this.hpBar.fillRect(x, y, width * hpPercent, height);
    }

    // [추가] 몬스터가 삭제될 때 HP바도 같이 삭제
    destroy(fromScene) {
        if (this.hpBar) {
            this.hpBar.destroy();
        }
        super.destroy(fromScene);
    }

    // [핵심 기능] 플레이어를 추적하는 함수
    trace(player) {
        if(this.isHitted || this.isDead){//피격 당하거나 죽으면 움직이지 않음
            this.setVelocity(0,0);
            return ;
        }

        this.play('alien', true);

        //  플레이어랑 몹 사이 거리 계산 (너무 딱 붙으면 덜덜 떨리는 현상 방지)
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        //스폰된 위치와 거리 계산(플레이어가 멀리 도망치면 다시 스폰위치로 돌아갈 때 사용)
        const distToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY)
        //플레이어가 몹의 감지 범위에 들어오면 추격하고, 충분히 가까워지면 정지
        if(distance <= this.aggroRange){
            //  이동 로직
            if (distance < 15) {
                // 너무 가까우면 멈춤 (공격 사거리)
                this.setVelocity(0);
                // 나중에 여기에 '공격 애니메이션' 실행 코드를 넣으면 됨
            } else {//어그로 범위에 캐릭터가 들어올때만 바라보는 방향 잡고 쫗아감
                // 거리가 멀면 쫓아감 (속도 20)
                // moveToObject(이동할놈, 목표물, 속도)
                this.scene.physics.moveToObject(this, player, 20);
                //바라보는 방향
                this.setFlipX(player.x < this.x);
            }
        }
        else{
            if(distToSpawn > 5){
                this.scene.physics.moveTo(this, this.spawnX, this.spawnY, 20)
                this.setFlipX(this.spawnX < this.x);
            }
            else{
                this.setVelocity(0);
            }
        }

    }
    
}