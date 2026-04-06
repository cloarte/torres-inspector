import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InspectorLayout } from "@/components/InspectorLayout";
import RutasDelDia from "@/pages/RutasDelDia";
import ControlSalida from "@/pages/ControlSalida";
import ControlRetorno from "@/pages/ControlRetorno";
import HistorialRetornos from "@/pages/HistorialRetornos";
import AlertasVencimiento from "@/pages/AlertasVencimiento";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/inspector/rutas" replace />} />
          <Route path="/inspector/rutas" element={<InspectorLayout><RutasDelDia /></InspectorLayout>} />
          <Route path="/inspector/rutas/:rutaId/salida" element={<InspectorLayout><ControlSalida /></InspectorLayout>} />
          <Route path="/inspector/rutas/:rutaId/retorno" element={<InspectorLayout><ControlRetorno /></InspectorLayout>} />
          <Route path="/inspector/historial" element={<InspectorLayout><HistorialRetornos /></InspectorLayout>} />
          <Route path="/inspector/alertas" element={<InspectorLayout><AlertasVencimiento /></InspectorLayout>} />
          {/* Legacy redirects */}
          <Route path="/entrega/retornos" element={<Navigate to="/inspector/rutas" replace />} />
          <Route path="/entrega/retornos/historial" element={<Navigate to="/inspector/historial" replace />} />
          <Route path="/vencidos/alertas" element={<Navigate to="/inspector/alertas" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
