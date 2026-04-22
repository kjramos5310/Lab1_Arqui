import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { libroService } from '../services/libroService';

const Libros = () => {
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    useEffect(() => {
        loadLibros();
    }, []);

    const loadLibros = async () => {
        try {
            setLoading(true);
            const data = await libroService.getLibros();
            setLibros(data);
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los libros', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-white">Catálogo de Libros</span>
        </div>
    );

    return (
        <div className="glass-card p-4">
            <Toast ref={toast} />
            <DataTable value={libros} dataKey="id" paginator rows={10} loading={loading} header={header} emptyMessage="No hay libros registrados." className="p-datatable-sm shadow-2">
                <Column field="titulo" header="Título" sortable style={{ minWidth: '14rem' }}></Column>
                <Column field="isbn" header="ISBN" sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="anio_publicacion" header="Año" sortable style={{ minWidth: '8rem' }}></Column>
                <Column field="edicion" header="Edición" sortable style={{ minWidth: '8rem' }}></Column>
                <Column body={(rowData) => `${rowData.nombre || ''} ${rowData.apellido || ''}`} header="Autor" sortable style={{ minWidth: '14rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default Libros;
