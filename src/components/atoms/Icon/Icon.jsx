import React from 'react'
import './Icon.css'

const Icon = ({ 
  name, 
  size = 'medium', 
  color = 'default',
  className = '',
  onClick,
  ...props 
}) => {
  const iconClass = `icon icon--${size} icon--${color} ${className} ${onClick ? 'icon--clickable' : ''}`

  // Mapeo de iconos usando caracteres Unicode y CSS
  const iconMap = {
    // Navegación
    home: '🏠',
    dashboard: '📊',
    menu: '☰',
    close: '✕',
    back: '←',
    forward: '→',
    
    // Usuario y autenticación
    user: '👤',
    profile: '👤',
    logout: '🚪',
    login: '🔑',
    
    // Notificaciones y alertas
    bell: '🔔',
    notification: '🔔',
    alert: '⚠️',
    warning: '⚠️',
    success: '✓',
    error: '✕',
    info: 'ℹ️',
    
    // Agricultura e IoT
    plant: '🌱',
    sensor: '📡',
    temperature: '🌡️',
    humidity: '💧',
    soil: '🌍',
    
    // Gestión
    inventory: '📦',
    finance: '💰',
    activity: '📋',
    calendar: '📅',
    report: '📄',
    
    // Acciones
    add: '+',
    edit: '✏️',
    delete: '🗑️',
    save: '💾',
    search: '🔍',
    filter: '🔽',
    settings: '⚙️',
    
    // Estados
    active: '🟢',
    inactive: '🔴',
    pending: '🟡'
  }

  const iconSymbol = iconMap[name] || '?'

  return (
    <span 
      className={iconClass}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {iconSymbol}
    </span>
  )
}

export default Icon
