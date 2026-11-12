import { AppPage } from "@/components/AppPage";

export default function ChatLoading() {
  return (
    <AppPage>
      <div className="apage-body mk-chat-page" aria-busy="true">
        <div className="mk-chat-page__skel">
          <div className="mk-chat-page__skel-back" />
          <div className="mk-chat-page__skel-product" />
          <div className="mk-chat-page__skel-pane" />
        </div>
        <p className="mk-chat-page__loading">Membuka chat…</p>
      </div>
    </AppPage>
  );
}
