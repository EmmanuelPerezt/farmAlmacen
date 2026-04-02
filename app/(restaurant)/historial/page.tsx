import { requireSession } from "@/lib/auth";
import { OrderHistory } from "@/components/restaurant/order-history";
import { listOrders } from "@/lib/db";

export default async function HistorialPage() {
  await requireSession();
  const orders = await listOrders({ status: ["paid", "cancelled"], limit: 100 });
  return <OrderHistory orders={orders} />;
}
