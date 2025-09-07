import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../../organisms/Sidebar/Sidebar'
import Header from '../../organisms/Header/Header'
import './DashboardPage.css'

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState('inicio')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideInterval = useRef()

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

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

  const goToSlide = (index) => {
    setCurrentSlide(index);

    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev === 2 ? 0 : prev + 1));
    }, 4000);
  };

  const nextSlide = () => {
    goToSlide(currentSlide === 2 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    goToSlide(currentSlide === 0 ? 2 : currentSlide - 1);
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
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
      case 'iot':
        return (
          <div className="dashboard-content">
            <h2>Módulo IoT</h2>
            <p>Monitoreo de sensores en tiempo real</p>
          </div>
        )
      case 'cultivos':
        return (
          <div className="dashboard-content">
            <h2>Gestión de Cultivos</h2>
            <p>Administra tus cultivos de plátano, cacao y cilantro</p>
          </div>
        )
      case 'fitosanitario':
        return (
          <div className="dashboard-content">
            <h2>Control Fitosanitario</h2>
            <p>Gestión de enfermedades, plagas y arvenses</p>
          </div>
        )
      case 'finanzas':
        return (
          <div className="dashboard-content">
            <h2>Gestión Financiera</h2>
            <p>Control de ingresos, egresos y rentabilidad</p>
          </div>
        )
      case 'inventario':
        return (
          <div className="dashboard-content">
            <h2>Control de Inventario</h2>
            <p>Gestión de insumos, herramientas y stock</p>
          </div>
        )
      default:
        return (
          <div className="dashboard-content">
            <h2>Sección no encontrada</h2>
          </div>
        )
    }
  }

  return (
    <div className="dashboard-page">
      <Sidebar 
        activeItem={activeSection} 
        onItemClick={handleSectionChange} 
        collapsed={sidebarCollapsed}
      />
      <div 
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
      >
        <Header onMenuClick={toggleSidebar} />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
