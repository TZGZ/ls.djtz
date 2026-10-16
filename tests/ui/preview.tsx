import React from 'react';
import {createRoot} from 'react-dom/client';
import StaffDashboard from '../../app/staff-dashboard';
import Showroom from '../../app/showroom';
import {catalog} from '../../app/catalog';
import '../../app/globals.css';
const role=new URL(location.href).searchParams.get('role')||'admin';
createRoot(document.getElementById('root')!).render(role==='public'?<Showroom packages={catalog} onDashboard={()=>{}}/>:<StaffDashboard role={role as 'admin'|'editor'|'viewer'} userName="Prueba local" isAdmin={role==='admin'} signOutUrl="/logout"/>);
