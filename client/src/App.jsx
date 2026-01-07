//전체 화면의 레이아웃을 잡는다. 게임 화면 외에 UI(점수 등)를 배치한다
import { useState } from 'react'
import './App.css'
import GameCanvas from './component/GameCanvas'
function App() {
  return (
    <>
      <GameCanvas/>
    </>
  )
}

export default App
