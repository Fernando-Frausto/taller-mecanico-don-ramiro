import { AppProvider, useApp } from './ui/store';
import { DemoBar } from './ui/components/DemoBar';
import { DemoBanner } from './ui/components/DemoBanner';
import { NoticeBanner } from './ui/components/NoticeBanner';
import { useHashRoute } from './ui/router';
import { VehicleList } from './ui/taller/VehicleList';
import { VehicleDetail } from './ui/taller/VehicleDetail';
import { NewVehicleForm } from './ui/taller/NewVehicleForm';
import { CatalogEditor } from './ui/taller/CatalogEditor';
import { ClientView } from './ui/cliente/ClientView';

function AppContent() {
  const { notice, dismissNotice } = useApp();
  const route = useHashRoute();

  const renderRouteContent = () => {
    switch (route.kind) {
      case 'taller_list':
        return <VehicleList filterDelivered={false} />;
      case 'taller_delivered':
        return <VehicleList filterDelivered={true} />;
      case 'taller_new':
        return <NewVehicleForm />;
      case 'taller_catalog':
        return <CatalogEditor />;
      case 'taller_vehicle':
        return <VehicleDetail vehicleId={route.vehicleId} />;
      case 'cliente':
        return <ClientView token={route.token} />;
      case 'not_found':
      default:
        return (
          <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '1rem' }}>
            <h2>Página no encontrada</h2>
            <p style={{ color: '#64748b' }}>La dirección especificada no es válida.</p>
            <a
              href="#/taller"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Volver al taller
            </a>
          </div>
        );
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <DemoBanner />
      <DemoBar />
      <NoticeBanner notice={notice} onDismiss={dismissNotice} />
      <header
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          Taller Mecánico Don Ramiro
        </h1>
      </header>
      <main style={{ paddingBottom: '3rem' }}>{renderRouteContent()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
