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
        this.setCollideWorldBounds(true);
    }

    takeDamage(amount){
        if (this.isDead)
            return ;

        this.hp -= amount;
        this.setTintFill(0xffffff);
        this.isHitted = true;
        this.setVelocity(0,0);
        if (this.anims)
            this.anims.pause();

        this.scene.time.delayedCall(200, () => {
            if (this.active && !this.isDead) {
                this.clearTint();      // 색 복구
                this.isStunned = false; // 스턴 해제
                if (this.anims) this.anims.resume(); // 애니메이션 다시 재생
            }
        });

        

        

        if (this.hp <= 0)
            this.die();
    }

    die(){
        this.isDead = true;
        this.setVelocity(0,0);//Phaser.Physics.Arcade.Sprite에서 상속받은 변수
        this.setTint(0xff0000);//Phaser.Physics.Arcade.Sprite에서 상속받은 변수
        this.destroy();
    }
}