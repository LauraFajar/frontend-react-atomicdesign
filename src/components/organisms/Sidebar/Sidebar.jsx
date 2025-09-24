import React from 'react'
import { FiHome, FiZap, FiPackage, FiDroplet, FiDollarSign, FiBox } from 'react-icons/fi'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: <FiHome size={20} />, path: '/' },
    { id: 'iot', label: 'IoT', icon: <FiZap size={20} />, path: '/iot' },
    { id: 'cultivos', label: 'Cultivos', icon: <FiDroplet size={20} />, path: '/cultivos' },
    { id: 'fitosanitario', label: 'Fitosanitario', icon: <FiPackage size={20} />, path: '/fitosanitario' },
    { id: 'finanzas', label: 'Finanzas', icon: <FiDollarSign size={20} />, path: '/finanzas' },
    { id: 'inventario', label: 'Inventario', icon: <FiBox size={20} />, path: '/inventario' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <Link to="/" className="sidebar__logo">
          <img src="/logos/logo.svg" alt="AgroTIC" className="sidebar__logo-img" />
        </Link>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar__menu-item">
              <Link
                to={item.path}
                className={`sidebar__menu-button ${
                  location.pathname === item.path ? 'sidebar__menu-button--active' : ''
                }`}
              >
                <span className="sidebar__menu-icon">{item.icon}</span>
                <span className="sidebar__menu-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
