import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { prestamoService, usuarioService } from '../services/prestamoService';
import { libroService } from '../services/libroService';

const Prestamos = () => {
    const [globalLoans, setGlobalLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [books, setBooks] = useState([]);
    const [formData, setFormData] = useState({ usuario_id: null, libro_id: null, fecha_devolucion_esperada: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [loansReq, usersReq, booksReq] = await Promise.all([
                prestamoService.getPrestamos(),
                usuarioService.getLectores(),
                libroService.getLibros()
            ]);
            setGlobalLoans(loansReq);
            // Formatear users para dropdown
            setUsers(usersReq.map(u => ({ label: `${u.nombre} ${u.apellido}`, value: u.id })));
            setBooks(booksReq.map(b => ({ label: b.titulo, value: b.id })));
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Problema sincronizando datos', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePrestamo = async () => {
        if(!formData.usuario_id || !formData.libro_id || !formData.fecha_devolucion_esperada) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Llene todos los campos', life: 3000 });
            return;
        }

        try {
            await prestamoService.createPrestamo({
                ...formData,
                fecha_devolucion_esperada: formData.fecha_devolucion_esperada.toISOString().split('T')[0]
            });
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Préstamo registrado exitosamente', life: 3000 });
            setShowModal(false);
            setFormData({ usuario_id: null, libro_id: null, fecha_devolucion_esperada: null });
            loadData();
        } catch (error) {
            // Aquí capturamos el Error 400 recién programado si hay concurrencia/libro ya prestado.
            toast.current.show({ severity: 'error', summary: 'Restricción', detail: error.message, life: 5000 });
        }
    };

    const handleDevolver = async (id) => {
        try {
            await prestamoService.devolverPrestamo(id);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Libro devuelto a la biblioteca', life: 3000 });
            loadData();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error al devolver el libro', life: 3000 });
        }
    };

    const statusBodyTemplate = (rowData) => {
        const isActive = rowData.estado === 'activo';
        return (
            <span style={{ 
                background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: isActive ? '#60a5fa' : '#4ade80',
                padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
                {isActive ? 'ACTIVO' : 'DEVUELTO'}
            </span>
        );
    };

    const actionBodyTemplate = (rowData) => {
        if(rowData.estado === 'activo') {
             return <Button icon="pi pi-check" rounded text severity="success" onClick={() => handleDevolver(rowData.id)} tooltip="Registrar Devolución"/>;
        }
        return <span className="text-gray-500"><i className="pi pi-verified"></i> Finalizado</span>;
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold text-white">Historial Global de Préstamos</span>
            <Button label="Nuevo Préstamo" icon="pi pi-plus" onClick={() => setShowModal(true)} />
        </div>
    );

    return (
        <div className="p-grid">
            <div className="col-12 p-3">
                <div className="glass-card p-4">
                    <Toast ref={toast} />
                    <DataTable value={globalLoans} dataKey="id" paginator rows={10} loading={loading} header={header}>
                        <Column field="id" header="ID" sortable style={{ width: '4rem' }}></Column>
                        <Column body={(r) => `${r.usuario_nombre} ${r.usuario_apellido}`} header="Usuario" sortable></Column>
                        <Column field="libro_titulo" header="Libro" sortable></Column>
                        <Column field="fecha_prestamo" header="F. Préstamo" sortable body={(r) => new Date(r.fecha_prestamo).toLocaleDateString()}></Column>
                        <Column body={statusBodyTemplate} header="Estado" sortable></Column>
                        <Column body={actionBodyTemplate} header="Acciones"></Column>
                    </DataTable>
                </div>
            </div>

            {/* Modal para Crear Préstamo */}
            <Dialog header="Registrar Nuevo Préstamo" visible={showModal} style={{ width: '450px' }} onHide={() => setShowModal(false)} className="p-fluid">
                <div className="field mb-4">
                    <label className="text-white block mb-2">Lector</label>
                    <Dropdown value={formData.usuario_id} options={users} onChange={(e) => setFormData({...formData, usuario_id: e.value})} placeholder="Seleccionar Lector" filter />
                </div>
                <div className="field mb-4">
                    <label className="text-white block mb-2">Libro a prestar</label>
                    <Dropdown value={formData.libro_id} options={books} onChange={(e) => setFormData({...formData, libro_id: e.value})} placeholder="Seleccionar Libro" filter />
                </div>
                <div className="field mb-4">
                    <label className="text-white block mb-2">Fecha Devolución Esperada</label>
                    <Calendar value={formData.fecha_devolucion_esperada} onChange={(e) => setFormData({...formData, fecha_devolucion_esperada: e.value})} minDate={new Date()} showIcon />
                </div>
                <Button label="Registrar Entrada" icon="pi pi-check" onClick={handleCreatePrestamo} />
            </Dialog>
        </div>
    );
};

export default Prestamos;
