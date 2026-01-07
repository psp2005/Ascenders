import Phaser from 'phaser';

export default class Actor extends Phaser.Physics.Arcade.Sprite{
    constructor(scene,x,y,texture, hp = 100){
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = hp;
        this.maxHp = hp;
        this.isDead = false;

        this.setCollideWorldBounds(true);
    }

    takeDamage(amount){
        if (this.isDead)
            return ;

        this.hp -= amount;

        //Juice : 피격시 빨갛게 깜빡임 (Tween 사용)
        this.scene.tweens.add({
            targets: this,//애니메이션 적용할 대상
            alpha: 0.5,//투명도
            duration: 100,
            yoyo: true,//투명해졌다가 다시 원래대로
            repeat: 1
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