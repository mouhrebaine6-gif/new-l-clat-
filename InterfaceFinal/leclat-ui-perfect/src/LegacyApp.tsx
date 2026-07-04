import "./App.css";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { I18nProvider, text, useI18n } from "@/lib/i18n";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";

const FragmentsPage = lazy(() => import("./pages/FragmentsPage"));
const FragmentDetailPage = lazy(() => import("./pages/FragmentDetailPage"));
const VoilePage = lazy(() => import("./pages/VoilePage"));
const BoutiquePage = lazy(() => import("./pages/BoutiquePage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const LorePage = lazy(() => import("./pages/LorePage"));
const HistoirePage = lazy(() => import("./pages/HistoirePage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const DressingPage = lazy(() => import("./pages/DressingPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const RevelationsPage = lazy(() => import("./pages/RevelationsPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const CompagnonPage = lazy(() => import("./pages/CompagnonPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// HashRouter pour Unity WebView ou hébergement local sans fallback SPA.
// BrowserRouter sinon (Vercel / Cloudflare Pages avec rewrites).
const useHashRouter =
  import.meta.env.VITE_UNITY_WEBVIEW === "1" ||
  (typeof window !== "undefined" && window.location.protocol === "file:");
const Router = useHashRouter ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AppLayout>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/fragments" element={<FragmentsPage />} />
                <Route path="/fragments/:id" element={<FragmentDetailPage />} />
                <Route path="/fragments/voile/:id" element={<VoilePage />} />
                <Route path="/boutique" element={<BoutiquePage />} />
                <Route path="/boutique/:id" element={<ProductPage />} />
                <Route path="/lore" element={<LorePage />} />
                <Route path="/histoire" element={<HistoirePage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/profil" element={<ProfilPage />} />
                <Route path="/dressing" element={<DressingPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/confirmation" element={<ConfirmationPage />} />
                <Route path="/commande/:ref" element={<OrderTrackingPage />} />
                <Route path="/revelations" element={<RevelationsPage />} />
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="/compagnon" element={<CompagnonPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </Router>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;

const fallbackCopy = text("Le Voile s'ouvre", "The Veil is opening", "السِّتار ينفتح");

const PageFallback = () => {
  const { tr } = useI18n();
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto mb-5 h-px w-32 bg-laiton/50 anim-respire" />
        <p className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
          {tr(fallbackCopy)}
        </p>
      </div>
    </div>
  );
};
