import Phaser from 'phaser';

export default class Actor extends Phaser.Physics.Arcade.Sprite{
    constructor(scene,x,y,texture, hp = 100){
        super(scene, x, y, texture);//super는 부모 생성자를 먼저 실행하라는 뜻

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = hp;
        this.maxHp = hp;
        this.isDead = false;

        //몬스터가 피격당하면 잠시 멈추게하기 위한 플래그
        this.isHitted = false;
        this.damageColor = '#ff0000';
        this.setCollideWorldBounds(true);
    }

    takeDamage(amount){
        if (this.isDead)
            return ;

        this.hp -= amount;
        this.isHitted = true;
        this.setVelocity(0,0);

        if (this.anims)
            this.anims.pause();
        //몬스터, 플레이어 자식클래스 각각이 구현한 피격 함수호출
        this.playHitEffect();

        //데미지 텍스트 띄우기
        this.showDamageText(amount);
        //상태 복구 타이머
        this.scene.time.delayedCall(200, () => {
            if (this.active && !this.isDead) {
                this.recoverHitEffect();      //피격함수 호출 후 복구 함수
                this.isHitted = false; // 스턴 해제
                if (this.anims) this.anims.resume(); // 애니메이션 다시 재생
            }
        });

        if (this.hp <= 0)
            this.die();
    }
    // 1. 피격 효과 (기본값: 몬스터처럼 깜빡임)
    playHitEffect() {
        this.setTintFill(0xffffff); // 흰색으로 깜빡
    }
    // 2. 피격 복구 (기본값: 색상 복구)
    recoverHitEffect() {
        this.clearTint();
    }

    //데미지 텍스트 생성 및 애니메이션
    showDamageText(amount) {
        // 텍스트 생성 (위치: 머리 위쪽)
        const damageText = this.scene.add.text(this.x, this.y - 20, amount.toString(), {
            fontSize: '16px',
            fontFamily: 'monospace',
            fill: this.damageColor,     // 빨간 글씨
            stroke: '#ffffff',   // 흰색 테두리
            strokeThickness: 2
        }).setOrigin(0.5);

        // 애니메이션 (위로 떠오르며 사라짐)
        this.scene.tweens.add({
            targets: damageText,
            y: this.y - 50,      // 위로 30px 이동
            alpha: 0,            // 투명해짐
            duration: 800,       // 0.8초 동안
            onComplete: () => {
                damageText.destroy(); // 끝나면 삭제
            }
        });
    }

    die(){
        this.isDead = true;
        this.setVelocity(0,0);//Phaser.Physics.Arcade.Sprite에서 상속받은 변수
        this.setTint(0xff0000);//Phaser.Physics.Arcade.Sprite에서 상속받은 변수
        if(this.texture.key !== 'player_front'){
            this.destroy();
        }
    }
}
