import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { DashNav } from "./DashNav";

export const metadata = { title: "Dashboard" };

/** Auth + JWT memakai waktu request — tidak di-prerender sebagai shell instan. */
export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container dash dash--app">
      <Suspense fallback={<aside className="dash-side dash-side--loading" aria-hidden="true" />}>
        <DashSide />
      </Suspense>
      <section className="dash-main">{children}</section>
    </div>
  );
}

async function DashSide() {
  const user = await requireUser();
  const displayName =
    (user.role === "mitra" || user.role === "admin") && user.shop_name.trim()
      ? user.shop_name.trim()
      : user.name;
  return (
    <DashNav
      name={displayName}
      role={user.role}
      city={user.city || null}
      storeHref={user.role === "mitra" ? `/market/penjual/${user.id}` : null}
    />
  );
}
