import React, { useState, useEffect } from 'react';
import TabsFitosanitario from '../../molecules/fitosanitario/fitosanitario';
import { getEpas, createEpa } from '../../../services/epaService';
import { getTratamientos, createTratamiento } from '../../../services/tratamientoService';

import './Fitosanitario.css';

const FitosanitarioPage = () => {
  const [tab, setTab] = useState('epa');
  const [data, setData] = useState([]);

  // campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);

  // cargar datos cuando cambie tab
  useEffect(() => {
    if (tab === 'epa') {
      getEpas().then(setData);
    } else {
      getTratamientos().then(setData);
    }
  }, [tab]);

  const handleSubmit = async () => {
    if (tab === 'epa') {
      await createEpa({
        nombre_epa: nombre,
        descripcion,
        imagen_referencia: imagen, // aquí va el file
      });
      const epas = await getEpas();
      setData(epas);
    } else {
      await createTratamiento({ nombre_tratamiento: nombre, descripcion });
      const tratamientos = await getTratamientos();
      setData(tratamientos);
    }
    setNombre('');
    setDescripcion('');
    setImagen(null);
  };

  return (
    <div className="fitosanitario-container">
      <h1 className="fitosanitario-title">Gestión Fitosanitario</h1>

      <TabsFitosanitario tab={tab} setTab={setTab} />

      <div className="fitosanitario-content">
        <div className="fitosanitario-card">
          <h2 className="fitosanitario-card-title">
            {tab === 'epa' ? 'Lista de EPA' : 'Lista de Tratamientos'}
          </h2>

          {data.length === 0 ? (
            <p>No hay registros de {tab === 'epa' ? 'EPA' : 'tratamientos'}</p>
          ) : (
            <table className="fitosanitario-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  {tab === 'epa' && <th>Foto</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={tab === 'epa' ? item.id_epa : item.id_tratamiento}
                  >
                    <td>{tab === 'epa' ? item.id_epa : item.id_tratamiento}</td>
                    <td>
                      {tab === 'epa'
                        ? item.nombre_epa
                        : item.nombre_tratamiento}
                    </td>
                    <td>{item.descripcion}</td>
                    {tab === 'epa' && (
                      <td>
                        {item.imagen_referencia ? (
                          <img
                            src={`http://localhost:3001${item.imagen_referencia}`}
                            alt="foto"
                            className="fitosanitario-foto"
                          />
                        ) : (
                          'Sin foto'
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="fitosanitario-card">
          <h2 className="fitosanitario-card-title">
            {tab === 'epa' ? 'Registrar EPA' : 'Registrar Tratamiento'}
          </h2>

          <input
            className="fitosanitario-input"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="fitosanitario-input"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          {tab === 'epa' && (
            <input
              type="file"
              className="fitosanitario-input"
              onChange={(e) => setImagen(e.target.files[0])}
            />
          )}

          <button className="fitosanitario-btn" onClick={handleSubmit}>
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FitosanitarioPage;
