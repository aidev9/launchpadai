import {
  Avatar,
  AvatarFallback,
  // AvatarImage, // Removed unused import
} from "@/components/ui/avatar";

interface Sale {
  id: string;
  customer: {
    name: string;
    email: string;
    initials: string;
  };
  amount: string;
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{sale.customer.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.customer.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.customer.email}
            </p>
          </div>
          <div className="ml-auto font-medium">{sale.amount}</div>
        </div>
      ))}
    </div>
  );
}
