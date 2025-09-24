import React, { useState } from 'react'
import Sidebar from '../organisms/Sidebar/Sidebar'
import Header from '../organisms/Header/Header'

const ProtectedLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sidebarWidth = sidebarCollapsed ? 80 : 260

  return (
    <div>
      <Sidebar collapsed={sidebarCollapsed} />
      <div
        className="main-content"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s'
        }}
      >
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}

export default ProtectedLayout