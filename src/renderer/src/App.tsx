import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import EditPage from './EditPage'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* HomePage 路由 */}
        <Route path="/" element={<HomePage />} />
        {/* EditPage 路由 */}
        <Route path="/edit" element={<EditPage />} />
      </Routes>
    </Router>
  )
}

export default App
