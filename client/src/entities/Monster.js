import Phaser from 'phaser';
import Actor from './Actor';

export default class Monster extends Actor {
    constructor(scene, x, y) {
        super(scene, x, y, 'alien', 50); // alien 이미지를 쓴다면 'alien'으로 변경
        this.setScale(2);
    }

    // [핵심 기능] 플레이어를 추적하는 함수
    trace(player) {
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
            this.scene.physics.moveToObject(this, player, 50);
        }
    }
    
    // 데미지 입는 함수는 기존 유지
    takeDamage(damage) {
        // ... (기존 코드) ...
    }
}