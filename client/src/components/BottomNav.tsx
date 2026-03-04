import { useLocation, Link } from "wouter";

const navItems = [
  { path: "/", label: "주식\n현황판", labelLine1: "주식", labelLine2: "현황판" },
  { path: "/subsidiary", label: "계열사\n보유현황", labelLine1: "계열사", labelLine2: "보유현황" },
  { path: "/stocks", label: "종목별\n보유현황", labelLine1: "종목별", labelLine2: "보유현황" },
  { path: "/holding-company", label: "금융지주\n보유현황", labelLine1: "금융지주", labelLine2: "보유현황" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                data-testid={`nav-${item.labelLine1}`}
                className={`flex flex-col items-center justify-center px-2 py-2 transition-colors rounded-md min-w-[70px] ${
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-transparent text-muted-foreground border border-border hover:bg-muted"
                }`}
              >
                <span className={`text-[10px] leading-tight text-center ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.labelLine1}
                </span>
                <span className={`text-[10px] leading-tight text-center ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.labelLine2}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
}
