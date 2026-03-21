import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InspectorLayout } from "@/components/InspectorLayout";
import RetornosPendientes from "@/pages/RetornosPendientes";
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
          <Route path="/" element={<Navigate to="/entrega/retornos" replace />} />
          <Route
            path="/entrega/retornos"
            element={
              <InspectorLayout>
                <RetornosPendientes />
              </InspectorLayout>
            }
          />
          <Route
            path="/entrega/retornos/historial"
            element={
              <InspectorLayout>
                <HistorialRetornos />
              </InspectorLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
