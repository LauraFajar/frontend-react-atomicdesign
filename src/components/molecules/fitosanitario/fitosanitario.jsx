import React from 'react'
import './fitosanitario.css'

const TabsFitosanitario = ({ tab, setTab }) => (
  <div className="fitosanitario-tabs">
    <button
      className={`fitosanitario-tab ${tab === 'epa' ? 'active' : ''}`}
      onClick={() => setTab('epa')}
    >
      Enfermedades (EPA)
    </button>
    <button
      className={`fitosanitario-tab ${tab === 'tratamientos' ? 'active' : ''}`}
      onClick={() => setTab('tratamientos')}
    >
      Tratamientos
    </button>
  </div>
)

export default TabsFitosanitario