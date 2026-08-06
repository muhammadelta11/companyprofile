(() => {
  const projects = window.PORTFOLIO_PROJECTS || [];
  const trips = window.TRIP_PACKAGES || [];
  const grid = document.getElementById("project-grid");
  const tripGrid = document.getElementById("trip-grid");
  const lightbox = document.getElementById("lightbox");
  const titleEl = document.getElementById("lightbox-title");
  const tagEl = document.getElementById("lightbox-tag");
  const summaryEl = document.getElementById("lightbox-summary");
  const mainEl = document.getElementById("gallery-main");
  const thumbsEl = document.getElementById("gallery-thumbs");
  const actionsEl = document.getElementById("lightbox-actions");
  const closeBtn = lightbox?.querySelector(".lightbox__close");
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  const nav = document.querySelector(".site-nav");
  const filterBtns = document.querySelectorAll(".filter-btn:not(.filter-btn--trip)");
  const tripFilterBtns = document.querySelectorAll(".filter-btn--trip");
  const tabLinks = document.querySelectorAll(".tabbar a, .nav-links a");
  const sections = document.querySelectorAll("main section[id], #top");

  let activeFilter = "all";
  let tripFilter = "all";
  let activeItem = null;
  let activeKind = "project";
  let imageIndex = 0;

  const initials = (title) =>
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  const photoCountLabel = (images) => {
    const n = images?.length || 0;
    return n ? `${n} foto` : "foto segera";
  };

  const ensureMeta = () => {
    let meta = document.getElementById("lightbox-meta");
    let chips = document.getElementById("lightbox-chips");
    if (!meta) {
      meta = document.createElement("div");
      meta.id = "lightbox-meta";
      meta.className = "lightbox__meta";
      summaryEl.after(meta);
    }
    if (!chips) {
      chips = document.createElement("ul");
      chips.id = "lightbox-chips";
      chips.className = "lightbox__chips";
      meta.after(chips);
    }
    return { meta, chips };
  };

  const renderCards = () => {
    if (!grid) return;
    const list =
      activeFilter === "all"
        ? projects
        : projects.filter((p) => p.category === activeFilter);

    grid.innerHTML = list
      .map((p) => {
        const cover = p.images?.[0];
        const media = cover
          ? `<img src="${cover}" alt="${p.title}" loading="lazy" />`
          : `<div class="project-card__placeholder">${initials(p.title)}</div>`;
        return `
          <button class="project-card reveal is-visible" type="button" data-id="${p.id}">
            <div class="project-card__media">
              ${media}
              <span class="project-card__count">${photoCountLabel(p.images)}</span>
            </div>
            <div class="project-card__body">
              <span class="tag">${p.tag}</span>
              <h3>${p.title}</h3>
              <p>${p.summary}</p>
            </div>
          </button>`;
      })
      .join("");

    grid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", () => {
        const project = projects.find((p) => p.id === card.dataset.id);
        if (project) openLightbox(project, "project");
      });
    });
  };

  const renderTrips = () => {
    if (!tripGrid) return;
    const list =
      tripFilter === "all"
        ? trips
        : trips.filter((t) => t.category === tripFilter);

    tripGrid.innerHTML = list
      .map((t) => {
        const cover = t.images?.[0];
        const media = cover
          ? `<img src="${cover}" alt="${t.title}" loading="lazy" />`
          : `<div class="trip-card__placeholder">${initials(t.title)}</div>`;
        return `
          <button class="trip-card reveal is-visible" type="button" data-id="${t.id}">
            <div class="trip-card__media">
              ${media}
              <span class="trip-card__count">${photoCountLabel(t.images)}</span>
            </div>
            <div class="trip-card__body">
              <span class="tag">${t.tag}</span>
              <h3>${t.title}</h3>
              <p>${t.summary}</p>
              <div class="trip-card__meta">
                <span>${t.duration}</span>
                <strong>${t.price}</strong>
              </div>
            </div>
          </button>`;
      })
      .join("");

    tripGrid.querySelectorAll(".trip-card").forEach((card) => {
      card.addEventListener("click", () => {
        const trip = trips.find((t) => t.id === card.dataset.id);
        if (trip) openLightbox(trip, "trip");
      });
    });
  };

  const renderGallery = () => {
    if (!activeItem || !mainEl || !thumbsEl) return;
    const images = activeItem.images || [];
    const folder = activeKind === "trip" ? "trips" : "projects";
    const fileHint = activeKind === "trip" ? "trips.js" : "projects.js";

    if (!images.length) {
      mainEl.innerHTML = `
        <div class="gallery__empty">
          <strong>${initials(activeItem.title)}</strong>
          <span>Folder siap: assets/img/${folder}/${activeItem.id}/</span>
          <span>Tambahkan foto lalu daftar di ${fileHint}</span>
        </div>`;
      thumbsEl.innerHTML = "";
      prevBtn.hidden = true;
      nextBtn.hidden = true;
      return;
    }

    prevBtn.hidden = images.length < 2;
    nextBtn.hidden = images.length < 2;
    const src = images[imageIndex];
    mainEl.innerHTML = `<img src="${src}" alt="${activeItem.title} — foto ${imageIndex + 1}" />`;
    thumbsEl.innerHTML = images
      .map(
        (img, i) => `
        <button type="button" class="${i === imageIndex ? "is-active" : ""}" data-index="${i}" aria-label="Foto ${i + 1}">
          <img src="${img}" alt="" />
        </button>`
      )
      .join("");

    thumbsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        imageIndex = Number(btn.dataset.index);
        renderGallery();
      });
    });
  };

  const openLightbox = (item, kind) => {
    activeItem = item;
    activeKind = kind;
    imageIndex = 0;
    titleEl.textContent = item.title;
    tagEl.textContent = item.tag;
    summaryEl.textContent = item.summary;

    const { meta, chips } = ensureMeta();
    if (kind === "trip") {
      meta.hidden = false;
      chips.hidden = false;
      meta.innerHTML = `<span>Durasi: <strong>${item.duration || "-"}</strong></span><span>Harga: <strong>${item.price || "-"}</strong></span>`;
      chips.innerHTML = (item.highlights || [])
        .map((h) => `<li class="chip">${h}</li>`)
        .join("");
      actionsEl.innerHTML = `
        <a class="btn btn--trip btn--sm" href="https://wa.me/6285647121046?text=${encodeURIComponent("Halo, saya tertarik paket " + item.title + ". Mohon info detail & ketersediaan.")}" target="_blank" rel="noopener noreferrer">Booking via WA</a>
        <a class="btn btn--ghost btn--sm" href="https://mbareptour.id" target="_blank" rel="noopener noreferrer">mbareptour.id</a>`;
    } else {
      meta.hidden = true;
      chips.hidden = true;
      meta.innerHTML = "";
      chips.innerHTML = "";
      actionsEl.innerHTML = item.link
        ? `<a class="btn btn--primary btn--sm" href="${item.link}" target="_blank" rel="noopener noreferrer">Buka situs</a>
           <a class="btn btn--ghost btn--sm" href="https://wa.me/6285647121046?text=${encodeURIComponent("Halo, saya tertarik proyek " + item.title)}" target="_blank" rel="noopener noreferrer">Tanya proyek ini</a>`
        : `<a class="btn btn--primary btn--sm" href="https://wa.me/6285647121046?text=${encodeURIComponent("Halo, saya ingin tanya tentang " + item.title)}" target="_blank" rel="noopener noreferrer">Tanya via WA</a>`;
    }

    renderGallery();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeItem = null;
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeFilter = btn.dataset.filter;
      renderCards();
    });
  });

  tripFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tripFilterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      tripFilter = btn.dataset.tripFilter;
      renderTrips();
    });
  });

  closeBtn?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
    if (!activeItem) return;
    const n = activeItem.images?.length || 0;
    if (n < 2) return;
    if (e.key === "ArrowRight") {
      imageIndex = (imageIndex + 1) % n;
      renderGallery();
    }
    if (e.key === "ArrowLeft") {
      imageIndex = (imageIndex - 1 + n) % n;
      renderGallery();
    }
  });

  prevBtn?.addEventListener("click", () => {
    const n = activeItem?.images?.length || 0;
    if (n < 2) return;
    imageIndex = (imageIndex - 1 + n) % n;
    renderGallery();
  });

  nextBtn?.addEventListener("click", () => {
    const n = activeItem?.images?.length || 0;
    if (n < 2) return;
    imageIndex = (imageIndex + 1) % n;
    renderGallery();
  });

  const setScrolled = () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  const markActive = () => {
    const y = window.scrollY + 140;
    let current = "top";
    sections.forEach((section) => {
      if (section.id && section.offsetTop <= y) current = section.id;
    });
    tabLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : "";
      link.classList.toggle("is-active", id === current);
    });
  };
  markActive();
  window.addEventListener("scroll", markActive, { passive: true });

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  renderCards();
  renderTrips();
})();
