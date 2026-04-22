import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { autorService } from '../services/autorService';

const Autores = () => {
    const [autores, setAutores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useRef(null);

    // Cargar todos inicialmente para ver algo
    useEffect(() => {
        loadAutores();
    }, []);

    const loadAutores = async () => {
        try {
            setLoading(true);
            const data = await autorService.getAutores();
            // Filtrar solo autores para la vista (por el flag esAutor)
            setAutores(data.filter(p => p.esAutor === 1));
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Problema al cargar la lista', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadAutores();
            return;
        }
        try {
            setLoading(true);
            const data = await autorService.buscarAutores(searchQuery);
            setAutores(data);
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Problema al buscar', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-white">Directorio de Autores</span>
            <div className="p-inputgroup" style={{maxWidth: '400px'}}>
                <InputText placeholder="Buscar por coincidencia (q)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                <Button icon="pi pi-search" onClick={handleSearch} />
            </div>
        </div>
    );

    return (
        <div className="glass-card p-4">
            <Toast ref={toast} />
            <DataTable value={autores} dataKey="id" paginator rows={10} loading={loading} header={header} emptyMessage="No se encontraron autores.">
                <Column field="nombre" header="Nombre" sortable></Column>
                <Column field="apellido" header="Apellido" sortable></Column>
                <Column field="nacionalidad" header="Nacionalidad" sortable></Column>
                <Column field="correo_electronico" header="Correo" sortable></Column>
            </DataTable>
        </div>
    );
};

export default Autores;
