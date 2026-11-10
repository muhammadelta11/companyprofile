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
  return <DashNav name={user.name} role={user.role} />;
}
