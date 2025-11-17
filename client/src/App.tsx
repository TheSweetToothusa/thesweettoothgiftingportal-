import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import UploadRecipients from "./pages/UploadRecipients";
import ValidateRecipients from "./pages/ValidateRecipients";
import ManualEntry from "./pages/ManualEntry";
import OrderComplete from "./pages/OrderComplete";
import SpreadsheetEditor from "./pages/SpreadsheetEditor";
import DeliveryDate from "./pages/DeliveryDate";
import Products from "./pages/Products";
import LogoBarUpsell from "./pages/LogoBarUpsell";
import { ChatbotWidget } from "./components/ChatbotWidget";
import ViewProductsButton from "./components/ViewProductsButton";
import ProductMenuDrawer from "./components/ProductMenuDrawer";
import { useState } from "react";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/orders/:id/delivery-date" component={DeliveryDate} />
      <Route path="/orders/:id/upload" component={UploadRecipients} />
      <Route path="/orders/:id/logo-bar" component={LogoBarUpsell} />
      <Route path="/orders/:id/spreadsheet" component={SpreadsheetEditor} />
      <Route path="/orders/:orderId/validate" component={ValidateRecipients} />
      <Route path="/orders/:orderId/manual" component={ManualEntry} />
      <Route path="/orders/:orderId/complete" component={OrderComplete} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);



  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatbotWidget />
          <ViewProductsButton 
            variant="white-pill" 
            onClick={() => setIsProductMenuOpen(true)} 
          />
          <ProductMenuDrawer
            isOpen={isProductMenuOpen}
            onClose={() => setIsProductMenuOpen(false)}
          />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
