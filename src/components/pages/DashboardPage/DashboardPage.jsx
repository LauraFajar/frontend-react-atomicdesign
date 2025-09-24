import React, { useState, useEffect, useRef } from 'react'
import './DashboardPage.css'

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState('inicio')
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideInterval = useRef()

  useEffect(() => {
    const images = [
      "./images/img-campesino-1.jpg",
      "./images/img-campesino-2.jpg",
      "./images/img-campesino-3.jpeg"
    ];

    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    const startCarousel = () => {
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev === 2 ? 0 : prev + 1));
      }, 3000);
    };
    
    startCarousel();
    return () => clearInterval(slideInterval.current);
  }, []);

  const getSlideClass = (index) => {
    return `carousel-item ${index === currentSlide ? 'active' : ''}`
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <div className="dashboard-content">
            <div className="welcome-section">
              <div className="welcome-card">
                <div className="welcome-text">
                  <h2 className="welcome-title">AgroTic</h2>
                  <p className="welcome-description">
                    Bienvenido a AgroTic, la plataforma líder en tecnología para el sector agrícola. 
                    Conectamos a productores, proveedores y expertos para mejorar la eficiencia y 
                    productividad en el campo.
                  </p>
                  
                  <div className="objectives-section">
                    <h3 className="objectives-title">Nuestro objetivo</h3>
                    <ul className="objectives-list">
                      <li>Mejorar la productividad y competitividad</li>
                      <li>Acceder a innovaciones y tecnologías emergentes</li>
                      <li>Conectar con la comunidad agrícola</li>
                      <li>Optimizar procesos y reducir costos</li>
                    </ul>
                  </div>
                </div>
                
                <div className="welcome-image">
                  <div className="image-carousel">
                    <div className="carousel-inner">
                      <div className={getSlideClass(0)}>
                        <img 
                          src="./images/img-campesino-1.jpg" 
                          alt="SENA Agrícola 1" 
                          className="carousel-image"
                        />
                      </div>
                      <div className={getSlideClass(1)}>
                        <img 
                          src="./images/img-campesino-2.jpg" 
                          alt="SENA Agrícola 2" 
                          className="carousel-image"
                        />
                      </div>
                      <div className={getSlideClass(2)}>
                        <img 
                          src="./images/img-campesino-3.jpeg" 
                          alt="SENA Agrícola 3" 
                          className="carousel-image"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'perfil':
        return <div className="dashboard-content"><h2>Perfil</h2></div>
      case 'configuracion':
        return <div className="dashboard-content"><h2>Configuración</h2></div>
      default:
        return <div className="dashboard-content"><h2>Inicio</h2></div>
    }
  }

  return (
    <div className="main-content">
      {renderContent()}
    </div>
  )
}

export default DashboardPage

