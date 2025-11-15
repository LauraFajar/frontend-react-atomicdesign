import React from 'react'
import { FiHome, FiZap, FiPackage, FiDroplet, FiDollarSign, FiBox, FiActivity, FiChevronDown, FiChevronRight, FiCalendar, FiMapPin, FiUsers, FiLayers, FiShield, FiMap } from 'react-icons/fi';
import { Link } from 'react-router-dom'
import './Sidebar.css'
import { useAuth } from '../../../contexts/AuthContext'

const Sidebar = ({ activeItem = 'inicio', onItemClick, expandedItems = {}, user }) => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const getFilteredMenuItems = () => {
    const allMenuItems = [
      { id: 'inicio', label: 'Inicio', icon: <FiHome size={20} /> },
      { id: 'iot', label: 'IoT', icon: <FiZap size={20} /> },
      {
        id: 'cultivos',
        label: 'Cultivos',
        icon: <FiDroplet size={20} />,
        submodules: [
          { id: 'cultivos-lista', label: 'Gestión de Cultivos', icon: <FiDroplet size={16} /> },
          { id: 'cultivos-mapa', label: 'Mapa de Lotes', icon: <FiMap size={16} /> },
          { id: 'cultivos-actividades', label: 'Actividades', icon: <FiActivity size={16} /> },
          { id: 'cultivos-calendario', label: 'Calendario', icon: <FiCalendar size={16} /> },
        ]
      },
      {
        id: 'fitosanitario',
        label: 'Fitosanitario',
        icon: <FiPackage size={20} />,
        submodules: [
          { id: 'fitosanitario-epas', label: 'Gestión de EPA', icon: <FiPackage size={16} /> },
          { id: 'fitosanitario-tratamientos', label: 'Tratamientos', icon: <FiShield size={16} /> }
        ]
      },
      { id: 'finanzas', label: 'Finanzas', icon: <FiDollarSign size={20} /> },
      {
        id: 'inventario',
        label: 'Inventario',
        icon: <FiBox size={20} />,
        submodules: [
          { id: 'inventario-gestion', label: 'Gestión de Inventario', icon: <FiBox size={16} /> },
          { id: 'inventario-almacenes', label: 'Almacenes', icon: <FiBox size={16} /> },
          { id: 'inventario-categorias', label: 'Categorías', icon: <FiLayers size={16} /> },
          { id: 'inventario-reportes', label: 'Reportes', icon: <FiActivity size={16} /> },
        ]
      },
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: <FiUsers size={20} />,
        adminOnly: true
      }
    ];

    if (!user) {
      console.log('[Sidebar] No user, returning only inicio');
      return allMenuItems.filter(item => item.id === 'inicio');
    }

    const userRole = user.role;
    const roleId = user.roleId;

    console.log('[Sidebar] User role:', userRole, 'Role ID:', roleId);

    if (roleId === 5 || userRole === 'invitado') {
      console.log('[Sidebar] Guest user, returning only inicio');
      return allMenuItems.filter(item => item.id === 'inicio');
    }

    if (roleId === 2 || userRole === 'aprendiz') {
      console.log('[Sidebar] Apprentice user, filtering modules');
      return allMenuItems.filter(item =>
        item.id === 'inicio' || 
        item.id === 'iot' ||
        item.id === 'cultivos' ||
        item.id === 'fitosanitario' ||
        item.id === 'inventario' ||
        (item.id === 'finanzas' && hasAnyPermission([
          'finanzas:*','finanzas:ver','finanzas:listar','finanzas:exportar'
        ])) ||
        (item.id === 'usuarios' && hasAnyPermission(['usuarios:ver','usuario:ver','usuarios:listar']))
      );
    }

    if (roleId === 3 || userRole === 'pasante') {
      console.log('[Sidebar] Intern user, filtering modules');
      return allMenuItems.filter(item =>
        item.id === 'inicio' ||
        item.id === 'iot' ||
        item.id === 'cultivos' ||
        item.id === 'fitosanitario' ||
        item.id === 'inventario' ||
        (item.id === 'finanzas' && hasAnyPermission([
          'finanzas:*','finanzas:ver','finanzas:listar','finanzas:exportar'
        ])) ||
        (item.id === 'usuarios' && hasAnyPermission(['usuarios:ver','usuario:ver','usuarios:listar']))
      );
    }

    console.log('[Sidebar] Admin/Instructor user, showing modules with permissions');
    return allMenuItems.filter(item =>
      !item.adminOnly ||
      roleId === 4 ||
      userRole === 'administrador' ||
      (item.id === 'usuarios' && hasAnyPermission([
        'usuarios:*','usuario:*',
        'usuarios:ver','usuario:ver','usuarios:listar'
      ]))
    );
  };

  const menuItems = getFilteredMenuItems();

  console.log('[Sidebar] User:', user);
  console.log('[Sidebar] Filtered menu items:', menuItems.map(item => ({ id: item.id, label: item.label, adminOnly: item.adminOnly })));

  const handleItemClick = (itemId, parentId = null) => {
    console.log('[Sidebar] Item clicked:', itemId, 'Parent:', parentId);

    if (onItemClick) {
      const item = menuItems.find(item => item.id === itemId);
      if (item && item.submodules) {
        console.log('[Sidebar] Item has submodules, calling onItemClick with parent');
        onItemClick(itemId, null);
      } else {
        console.log('[Sidebar] Item is standalone, calling onItemClick');
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
