//이 파일은 Phaser 게임 엔진을 React화면에 연결해주는 역할
//React의 생명주기와 Phaser의 실행 시점을 연결해주는 아주 중요한 브릿지 역할
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from '../game/MainScene'; 
//useRef - React에서 특정 HTML요소(DOM)를 직접 손으로 가리키는 집게
//실제 DOM의 주소를 useRef로 만든 변수에 넘기면서 React가 관리하는 가상 DOM에서 제외한다
//그래서 useRef로 지정한 곳은 React의 간섭 없이 직접 수정/관리할 수 있다
//useRef는 컴포넌트가 아무리 다시 호출되어도, 그 안의 값은 초기화되지 않고 유지된다.

/*
왜 쓰는가?: Phaser는 React가 관리하는 가상 세계가 아니라, 실제 HTML의 <canvas>라는 도화지에 직접 그림을 그립니다. React가 "여기다가 게임을 그려!"라고 Phaser에게 정확한 위치(div)를 알려줘야 하는데, 
그때 그 위치를 찜해두는 도구가 useRef입니다.

어떻게 쓰는가?: containerRef라는 변수를 만들어서 <div>에 연결해두면, Phaser 설정의 parent: containerRef.current를 통해 해당 div 안으로 게임 화면이 쏙 들어갑니다.

*/
// React 세계에서 Phaser라는 외부 엔진을 안전하게 조립하는 컴포넌트입니다.
export default function GameCanvas() {
    // containerRef: 실제 HTML 엘리먼트(div)를 가리키기 위한 '집게'입니다. Phaser가 이 안에 렌더링됩니다.
    const containerRef = useRef(null);
    
    // gameRef: 생성된 Phaser 게임 인스턴스를 저장합니다. 리렌더링되어도 게임이 중복 실행되지 않게 붙잡아둡니다.
    const gameRef = useRef(null);

    // useEffect: 컴포넌트가 화면에 나타날 때(Mount) 실행됩니다.
    useEffect(() => {
        // 만약 이미 게임이 실행 중(gameRef.current에 값이 있음)이라면 중복 생성을 막기 위해 그냥 나갑니다.
        if (gameRef.current)
            return;

        // config: Phaser 게임의 모든 환경 설정을 담은 객체입니다.
        const config = {
            // type: 렌더링 방식. 브라우저가 지원하면 WebGL을, 아니면 Canvas 방식을 자동으로 선택합니다.
            type: Phaser.AUTO,
            // width/height: 게임 화면의 크기를 현재 브라우저 창의 꽉 차는 크기로 설정합니다.
            width: window.innerWidth,
            height: window.innerHeight,
            // parent: Phaser가 그림을 그릴 '부모 도화지'입니다. 위에서 만든 containerRef(div)를 지정합니다.
            parent: containerRef.current,//
            // render: 그래픽 처리 방식 설정입니다.
            render: {
                pixelArt: true,  // 도트(Pixel) 그래픽이 흐릿하지 않고 선명하게 보이도록 설정합니다.
                antialias: true // 부드럽게 깎는 기능을 꺼서 도트의 각진 느낌을 살립니다.
            },
            scale: {
                // RESIZE: 브라우저 크기가 바뀔 때마다 게임 화면 크기도 실시간으로 맞춤
                mode: Phaser.Scale.RESIZE,
                // width와 height를 100%로 설정
                width: '100%',
                height: '100%',
                // (선택 사항) 화면 중앙 정렬
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            // physics: 게임 내 물리 엔진 설정입니다.
            physics: {
                default: 'arcade', // 가볍고 빠른 'Arcade' 물리 엔진을 사용합니다.
                arcade: {
                    debug: false,    // true로 바꾸면 충돌 박스(분홍색 선)가 눈에 보입니다. 개발 시 유용합니다.
                    gravity: { y: 0 } // 위에서 아래로 떨어지는 중력을 0으로 설정합니다 (탑다운 뷰).
                }
            },
            // scene: 사용할 게임 장면(Scene)들의 리스트입니다. 우리가 만든 MainScene을 등록합니다.
            scene: [MainScene]
        };

        // 설정값(config)을 바탕으로 실제 Phaser 게임 객체를 생성하여 gameRef에 보관합니다.
        gameRef.current = new Phaser.Game(config);

        // cleanup 함수: 컴포넌트가 화면에서 사라질 때(Unmount) 실행됩니다.
        return (() => {
            // 게임 객체가 존재한다면
            if (gameRef.current) {
                // 게임을 완전히 종료하고 메모리에서 삭제합니다. (중요: 이걸 안 하면 메모리 누수가 생깁니다.)
                gameRef.current.destroy(true);
                // 참조 값을 비워줍니다.
                gameRef.current = null;
            }
        });
    }, []); // 빈 배열 []: 이 코드는 컴포넌트가 처음 뜰 때 딱 한 번만 실행하라는 뜻입니다.

    // 실제 화면에 그려지는 부분입니다. ref={containerRef}를 통해 위의 설정과 이 div가 연결됩니다.
    return (
        <div 
            ref={containerRef} 
            style={{ width: '100%', height: '100%' }}
        />
    );
}