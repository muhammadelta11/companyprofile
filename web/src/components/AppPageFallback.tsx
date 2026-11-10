import { AppPage } from "@/components/AppPage";

/** Placeholder Suspense untuk halaman menu (hindari blocking prerender). */
export function AppPageFallback() {
  return (
    <AppPage>
      <div className="apage-body detail detail--skeleton" aria-hidden="true">
        <div className="detail__skel detail__skel--media" />
        <div className="detail__skel detail__skel--line" />
        <div className="detail__skel detail__skel--line detail__skel--short" />
      </div>
    </AppPage>
  );
}
