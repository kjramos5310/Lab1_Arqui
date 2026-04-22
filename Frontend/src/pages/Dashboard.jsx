import React from 'react';
import { Card } from 'primereact/card';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className="grid">
            <div className="col-12 text-center mb-4">
                <h1 className="text-5xl font-bold mb-2" style={{ background: '-webkit-linear-gradient(#3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Gestor Premium de Biblioteca
                </h1>
                <p className="text-lg text-gray-300">Administra libros, autores y préstamos con estilo puro.</p>
            </div>

            <div className="col-12 md:col-4 p-3">
                <Link to="/libros" style={{ textDecoration: 'none' }}>
                    <Card title="Libros" className="glass-card hover:shadow-6 cursor-pointer h-full">
                        <p className="m-0 text-gray-300">
                            Explora la colección entera, añade nuevos títulos y controla el stock.
                        </p>
                    </Card>
                </Link>
            </div>
            
            <div className="col-12 md:col-4 p-3">
                <Link to="/autores" style={{ textDecoration: 'none' }}>
                    <Card title="Autores" className="glass-card hover:shadow-6 cursor-pointer h-full">
                        <p className="m-0 text-gray-300">
                            Busca por coincidencia parcial y gestiona a las mentes detrás de los libros.
                        </p>
                    </Card>
                </Link>
            </div>

            <div className="col-12 md:col-4 p-3">
                <Link to="/prestamos" style={{ textDecoration: 'none' }}>
                    <Card title="Préstamos" className="glass-card hover:shadow-6 cursor-pointer h-full">
                        <p className="m-0 text-gray-300">
                            Presta libros a lectores, maneja devoluciones y evita cruces de concurrencia.
                        </p>
                    </Card>
                </Link>
            </div>
        </div>
    );
}

export default Dashboard;
