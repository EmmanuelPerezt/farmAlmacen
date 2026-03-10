import { redirect } from "next/navigation";

import { PosReceipt } from "@/components/pos-receipt";
import { readSearchParam } from "@/lib/query";
import { findSaleById } from "@/lib/db";

export const dynamic = "force-dynamic";

type ReceiptPageProps = {
  searchParams?: Promise<{
    saleId?: string | string[];
  }>;
};

export default async function ReceiptPage({ searchParams }: ReceiptPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const saleId = readSearchParam(resolvedParams?.saleId);

  if (!saleId) {
    redirect("/pos");
  }

  let sale;
  try {
    sale = await findSaleById(saleId);
  } catch {
    redirect("/pos");
  }

  return <PosReceipt sale={sale} />;
}
