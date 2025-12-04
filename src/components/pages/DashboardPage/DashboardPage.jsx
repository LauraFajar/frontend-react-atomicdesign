import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../organisms/Sidebar/Sidebar';
import Header from '../../organisms/Header/Header';
import CropsPage from '../CropsPage/CropsPage';
import LotsPage from '../CropsPage/LotsPage';
import SublotsPage from '../SublotsPage/SublotsPage';
import ActivitiesPage from '../ActivitiesPage/ActivitiesPage';
import CalendarPage from '../CalendarPage/CalendarPage';
import UsersPage from '../UsersPage/UsersPage';
import EpasPage from '../EpasPage/EpasPage';
import TratamientosPage from '../TratamientosPage/TratamientosPage';
import InventoryPage from '../InventoryPage/InventoryPage';
import FinanceDashboard from '../FinanceDashboard/FinanceDashboard';
import AlmacenesPage from '../AlmacenesPage/AlmacenesPage';
import CategoriasPage from '../CategoriasPage/CategoriasPage';
import IotPage from '../IotPage/ModernIotPage';
import ReportesPage from '../ReportesPage/ReportesPage';
import { useAuth } from '../../../contexts/AuthContext';
import LotsMapPage from '../LotsMapPage/LotsMapPage';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, hasAnyPermission } = useAuth();
  const [activeSection, setActiveSection] = useState('inicio');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({ 'cultivos': true });
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef();

  const isAdmin = user?.role === 'administrador' || user?.roleId === 4;
  const isInstructor = user?.role === 'instructor' || user?.roleId === 1;
  const canIot = isAdmin || isInstructor || hasAnyPermission(['iot:*','iot:ver','sensores:*','sensores:ver','mqtt:*']);
  const canAlmacenes = isAdmin || isInstructor || hasAnyPermission(['almacenes:*','almacenes:ver','inventario:*']);
  const canCategorias = isAdmin || isInstructor || hasAnyPermission(['categorias:*','categorias:ver','inventario:*']);
  const canInventarioReportes = isAdmin || isInstructor || hasAnyPermission(['inventario:reportes','reportes:*','reportes:ver','inventario:*']);
  const canFinanzasDashboard = isAdmin || hasAnyPermission(['finanzas:*','finanzas:ver','finanzas:listar','finanzas:exportar']);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const images = [
      "/images/img-campesino-1.jpg",
      "/images/img-campesino-2.jpg",
      "/images/img-campesino-3.jpeg"
    ];

    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    const startCarousel = () => {
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev === 2 ? 0 : prev + 1));
      }, 4000);
    };
    
    startCarousel();
    return () => clearInterval(slideInterval.current);
  }, []);

  const getSlideClass = (index) => {
    return `carousel-item ${index === currentSlide ? 'active' : ''}`;
  };

  const handleSectionChange = (sectionId, parentId = null) => {
    console.log('[Dashboard] Section change:', sectionId, 'Parent:', parentId);
    console.log('[Dashboard] Current activeSection:', activeSection);

    if (sectionId === 'usuarios') {
      console.log('[Dashboard] Setting usuarios as active section');
      setActiveSection('usuarios');
      return;
    }

    if (parentId === null && sectionId === 'inventario') {
      setExpandedItems(prev => ({ ...prev, inventario: !prev.inventario }));
      return;
    }

    if (parentId === null && sectionId === 'finanzas') {
      setActiveSection('finanzas-dashboard');
      return;
    }
    if (parentId === null && (sectionId === 'cultivos' || sectionId === 'fitosanitario')) {
      console.log('[Dashboard] Expanding module:', sectionId);
      setExpandedItems(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
      return;
    }

    console.log('[Dashboard] Setting active section to:', sectionId);
    setActiveSection(sectionId);

    if (parentId) {
      setExpandedItems(prev => ({ ...prev, [parentId]: true }));
    }
  };

  const renderContent = () => {
    console.log('[Dashboard] Rendering content for section:', activeSection);

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
                          src="/images/img-campesino-1.jpg"
                          alt="Campesino trabajando en cultivo"
                          className="carousel-image"
                        />
                      </div>
                      <div className={getSlideClass(1)}>
                        <img
                          src="/images/img-campesino-2.jpg"
                          alt="Cultivo agrícola"
                          className="carousel-image"
                        />
                      </div>
                      <div className={getSlideClass(2)}>
                        <img
                          src="/images/img-campesino-3.jpeg"
                          alt="Manos de agricultor con tierra"
                          className="carousel-image"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );

      case 'calendario':
        return <CalendarPage />;
      case 'cultivos-lista':
        return <CropsPage />;
      case 'cultivos-lotes':
        return <LotsPage />;
      case 'cultivos-sublotes':
        return <SublotsPage />;
      case 'cultivos-mapa':
        return <LotsMapPage />;
      case 'cultivos-actividades':
        return <ActivitiesPage />;
      case 'cultivos-calendario':
        return <CalendarPage />;
      case 'iot':
        if (!canIot) {
          return (
            <div className="dashboard-content">
              <h2>Permisos</h2>
              <p>No tienes permisos para ver IoT</p>
            </div>
          );
        }
        return <IotPage />;
      case 'fitosanitario':
        return (
          <div className="dashboard-content">
            <h2>Control Fitosanitario</h2>
            <p>Gestión de enfermedades, plagas y arvenses</p>
          </div>
        );
      case 'fitosanitario-epas':
        return <EpasPage />;
      case 'fitosanitario-tratamientos':
        return <TratamientosPage currentUser={user} />;
      case 'finanzas':
        return (
          <div className="dashboard-content">
            <h2>Gestión Financiera</h2>
            <p>Control de ingresos, egresos y rentabilidad</p>
          </div>
        );
      case 'finanzas-dashboard':
        if (!canFinanzasDashboard) {
          return (
            <div className="dashboard-content">
              <h2>Permisos</h2>
              <p>No tienes permisos para ver Finanzas</p>
            </div>
          );
        }
        return <FinanceDashboard />;
      case 'inventario-reportes':
        if (!canInventarioReportes) {
          return (
            <div className="dashboard-content">
              <h2>Permisos</h2>
              <p>No tienes permisos para ver Reportes</p>
            </div>
          );
        }
        return <ReportesPage />;
      case 'inventario':
        return <InventoryPage />;
      case 'inventario-gestion':
        return <InventoryPage />;
      case 'almacenes':
      case 'inventario-almacenes':
        if (!canAlmacenes) {
          return (
            <div className="dashboard-content">
              <h2>Permisos</h2>
              <p>No tienes permisos para ver Almacenes</p>
            </div>
          );
        }
        return <AlmacenesPage />;
      case 'categorias':
      case 'inventario-categorias':
        if (!canCategorias) {
          return (
            <div className="dashboard-content">
              <h2>Permisos</h2>
              <p>No tienes permisos para ver Categorías</p>
            </div>
          );
        }
        return <CategoriasPage />;
      case 'usuarios':
        return <UsersPage />;
      default:
        return (
          <div className="dashboard-content">
            <h2>Sección no encontrada</h2>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar
        activeItem={activeSection}
        onItemClick={handleSectionChange}
        collapsed={sidebarCollapsed}
        expandedItems={expandedItems}
        user={user}
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
  );
};

export default DashboardPage;