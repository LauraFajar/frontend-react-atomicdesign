import React from 'react'
import { FiHome, FiZap, FiPackage, FiDroplet, FiDollarSign, FiBox } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = ({ activeItem = 'inicio', onItemClick }) => {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: <FiHome size={20} /> },
    { id: 'iot', label: 'IoT', icon: <FiZap size={20} /> },
    { id: 'cultivos', label: 'Cultivos', icon: <FiDroplet size={20} /> },
    { id: 'fitosanitario', label: 'Fitosanitario', icon: <FiPackage size={20} /> },
    { id: 'finanzas', label: 'Finanzas', icon: <FiDollarSign size={20} /> },
    { id: 'inventario', label: 'Inventario', icon: <FiBox size={20} /> }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <Link to="/" className="sidebar__logo">
          <img 
            src="/logos/logo.svg" 
            alt="AgroTIC" 
            className="sidebar__logo-img"
          />
        </Link>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar__menu-item">
              <button
                className={`sidebar__menu-button ${
                  activeItem === item.id ? 'sidebar__menu-button--active' : ''
                }`}
                onClick={() => onItemClick && onItemClick(item.id)}
              >
                <span className="sidebar__menu-icon">{item.icon}</span>
                <span className="sidebar__menu-text">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
