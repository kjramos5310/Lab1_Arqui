import { Routes, Route, Link } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';

// Páginas (Se crearán a continuación)
import Dashboard from './pages/Dashboard';
import Libros from './pages/Libros';
import Autores from './pages/Autores';
import Prestamos from './pages/Prestamos';

function App() {
  const navItems = [
    { label: 'Inicio', icon: 'pi pi-fw pi-home', url: '/' },
    { label: 'Libros', icon: 'pi pi-fw pi-book', url: '/libros' },
    { label: 'Autores', icon: 'pi pi-fw pi-users', url: '/autores' },
    { label: 'Préstamos', icon: 'pi pi-fw pi-calendar-plus', url: '/prestamos' }
  ];

  return (
    <>
      {/* Navbar Premium */}
      <div className="card shadow-4 mb-4 st-navbar">
        <Menubar model={navItems} start={<h2 className="m-0 mr-4 text-blue-300"><i className="pi pi-bookmark mr-2"></i>BiblioApp</h2>} />
      </div>

      {/* Contenedor Principal con Routes */}
      <div className="p-m-4 layout-content p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/libros" element={<Libros />} />
          <Route path="/autores" element={<Autores />} />
          <Route path="/prestamos" element={<Prestamos />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
