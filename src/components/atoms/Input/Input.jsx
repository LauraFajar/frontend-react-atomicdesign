import React from 'react'
import './Input.css'

const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  name,
  id,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props 
}) => {
  const inputId = id || name

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input ${error ? 'input--error' : ''} ${disabled ? 'input--disabled' : ''}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export default Input
