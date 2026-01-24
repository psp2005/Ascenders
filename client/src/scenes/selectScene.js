//캐릭터 선택화면, 선택한 캐릭터의 직업 데이터를 가지고 MainScene으로 넘어간다.
import Phaser from 'phaser';

export default class SelectScene extends Phaser.Scene {
    constructor() {
        super('SelectScene');
    }

    preload() {
        // [리소스 로드]
        // 선택창에서 보여줄 캐릭터의 '증명사진(Icon)'이나 '초상화'를 로드합니다.
        // 지금은 임시로 기존에 있는 demon 스프라이트를 사용하겠습니다.
        this.load.spritesheet('demon_icon', 'assets/demon_front.png', { frameWidth: 16, frameHeight: 16 });
        
        // 나중에 warrior 이미지가 생기면 여기서 로드하면 됩니다.
        // this.load.spritesheet('warrior_icon', 'assets/warrior_front.png', ...);
    }

    create() {
        // 1. 타이틀 텍스트
        this.add.text(400, 100, 'CHOOSE YOUR HERO', { 
            fontSize: '32px', 
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 2. 캐릭터 목록 데이터 (나중에 설정 파일로 뺄 수도 있습니다)
        const characters = [
            { id: 'demon', name: 'Demon', color: 0xff0000 }, // id: 실제 데이터 전달용, name: 화면 표시용
            { id: 'warrior', name: 'Paladin', color: 0x0000ff }     // 아직 전사 이미지가 없어도 버튼은 만들 수 있습니다.
        ];

        // 3. 반복문으로 캐릭터 선택 버튼 자동 생성
        characters.forEach((char, index) => {
            // 버튼 위치 계산 (중앙 정렬을 위해 간격 조정)
            const x = 250 + (index * 300); 
            const y = 300;

            // --- A. 캐릭터 모습 (아이콘) ---
            // 'demon_icon'을 공용으로 쓰되, tint(색조)로 임시 구분을 했습니다.
            // 나중에 char.id를 이용해 `assets/${char.id}_icon.png`를 로드하게 바꾸면 됩니다.
            const charBtn = this.add.sprite(x, y, 'demon_icon', 0)
                .setScale(6) // 16px은 너무 작으니 6배 확대
                .setInteractive({ cursor: 'pointer' }); // 마우스 올리면 손가락 모양

            // --- B. 텍스트 라벨 ---
            const label = this.add.text(x, y + 80, char.name, { fontSize: '20px' }).setOrigin(0.5);

            // --- C. 마우스 호버 효과 (쥬스!) ---
            charBtn.on('pointerover', () => {
                charBtn.setScale(7); // 커짐
                label.setColor('#ffff00'); // 글자색 노란색
            });

            charBtn.on('pointerout', () => {
                charBtn.setScale(6); // 원래 크기
                label.setColor('#ffffff'); // 원래 색
            });

            // --- D. 클릭 시 MainScene으로 이동 (핵심!) ---
            charBtn.on('pointerdown', () => {
                console.log(`${char.id} 선택됨!`);

                // [데이터 전달] { job: 'demon' } 형태의 보따리를 싸서 보냅니다.
                this.scene.start('MainScene', { job: char.id });
            });
        });
    }
}