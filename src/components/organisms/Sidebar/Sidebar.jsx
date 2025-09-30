import React from 'react'
import { FiHome, FiZap, FiPackage, FiDroplet, FiDollarSign, FiBox, FiActivity, FiChevronDown, FiChevronRight, FiCalendar } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = ({ activeItem = 'inicio', onItemClick, expandedItems = {} }) => {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: <FiHome size={20} /> },
    { id: 'iot', label: 'IoT', icon: <FiZap size={20} /> },
    {
      id: 'cultivos',
      label: 'Cultivos',
      icon: <FiDroplet size={20} />,
      submodules: [
        { id: 'cultivos-lista', label: 'Gestión de Cultivos', icon: <FiDroplet size={16} /> },
        { id: 'cultivos-actividades', label: 'Actividades', icon: <FiActivity size={16} /> },
        { id: 'cultivos-calendario', label: 'Calendario', icon: <FiCalendar size={16} /> }
      ]
    },
    { id: 'fitosanitario', label: 'Fitosanitario', icon: <FiPackage size={20} /> },
    { id: 'finanzas', label: 'Finanzas', icon: <FiDollarSign size={20} /> },
    { id: 'inventario', label: 'Inventario', icon: <FiBox size={20} /> }
  ]

  const handleItemClick = (itemId, parentId = null) => {
    if (onItemClick) {
      const item = menuItems.find(item => item.id === itemId);
      if (item && item.submodules) {
        onItemClick(itemId, null);
      } else {
        onItemClick(itemId, parentId);
      }
    }
  };

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
                onClick={() => handleItemClick(item.id)}
              >
                <span className="sidebar__menu-icon">{item.icon}</span>
                <span className="sidebar__menu-text">{item.label}</span>
                {item.submodules && (
                  <span className="sidebar__menu-arrow">
                    {expandedItems[item.id] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </span>
                )}
              </button>

              {item.submodules && expandedItems[item.id] && (
                <ul className="sidebar__submenu">
                  {item.submodules.map((submodule) => (
                    <li key={submodule.id} className="sidebar__submenu-item">
                      <button
                        className={`sidebar__submenu-button ${
                          activeItem === submodule.id ? 'sidebar__submenu-button--active' : ''
                        }`}
                        onClick={() => handleItemClick(submodule.id, item.id)}
                      >
                        <span className="sidebar__submenu-icon">{submodule.icon}</span>
                        <span className="sidebar__submenu-text">{submodule.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
