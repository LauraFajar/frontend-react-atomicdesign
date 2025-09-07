import React from 'react'
import './Button.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const buttonClass = `btn btn--${variant} btn--${size} ${className} ${disabled ? 'btn--disabled' : ''}`

  return (
    <button 
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
