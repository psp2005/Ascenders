import Phaser from 'phaser';
import Actor from './Actor';

export default class Monster extends Actor {
    constructor(scene, x, y) {
        super(scene, x, y, 'alien', 15); // alien 이미지를 쓴다면 'alien'으로 변경
        // this.setScale(2);
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

        this.isRespawning = false;
    }

    // [핵심 기능] 플레이어를 추적하는 함수
    trace(player) {
        if(this.isHitted || this.isDead){//피격 당하거나 죽으면 움직이지 않음
            this.setVelocity(0,0);
            return ;
        }
        this.play('alien', true);
        // 1. 바라보는 방향(Flip) 결정
        if (player.x < this.x) {
            this.setFlipX(true);  // 왼쪽 봄
        } else {
            this.setFlipX(false); // 오른쪽 봄
        }

        // 2. 거리 계산 (너무 딱 붙으면 덜덜 떨리는 현상 방지)
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // 3. 이동 로직
        if (distance < 30) {
            // 너무 가까우면 멈춤 (공격 사거리)
            this.setVelocity(0);
            // 여기에 '공격 애니메이션' 실행 코드를 넣으면 됩니다.
        } else {
            // 거리가 멀면 쫓아감 (속도 50)
            // moveToObject(이동할놈, 목표물, 속도)
            this.scene.physics.moveToObject(this, player, 30);
        }
    }
    
}