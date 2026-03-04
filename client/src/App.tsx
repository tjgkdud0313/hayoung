import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import SubsidiaryHoldings from "@/pages/SubsidiaryHoldings";
import StockHoldings from "@/pages/StockHoldings";
import HoldingCompanyView from "@/pages/HoldingCompanyView";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/subsidiary" component={SubsidiaryHoldings} />
      <Route path="/stocks" component={StockHoldings} />
      <Route path="/holding-company" component={HoldingCompanyView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background pb-20">
          <Router />
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
