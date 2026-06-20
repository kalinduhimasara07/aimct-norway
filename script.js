document.documentElement.classList.add("js-enabled");

(function () {
  const isPortuguesePage = document.documentElement.lang.toLowerCase().startsWith("pt");
  const localizedValue = (item, key) => {
    if (!item || typeof item !== "object") {
      return "";
    }

    const localizedKey = isPortuguesePage ? `${key}_pt` : key;
    const value = typeof item[localizedKey] === "string" && item[localizedKey].trim()
      ? item[localizedKey]
      : item[key];

    return typeof value === "string" ? value.trim() : "";
  };

  const resolveLocalAssetPath = (assetPath) => {
    if (!assetPath || /^(?:https?:)?\/\//i.test(assetPath)) {
      return assetPath;
    }

    const normalized = assetPath.replace(/^\.?\//, "");

    if (normalized.startsWith("assets/")) {
      return `${isPortuguesePage ? "../" : "./"}${normalized}`;
    }

    return assetPath;
  };

  const DATA_CACHE_BUST_KEY = Date.now().toString(36);
  const FRESH_DATA_FETCH_OPTIONS = { cache: "no-store" };
  const shouldBypassAssetCache = (assetPath) => {
    const normalizedPath = typeof assetPath === "string" ? assetPath.replace(/^\.?\//, "") : "";

    return (
      normalizedPath.startsWith("assets/data/") ||
      normalizedPath === "assets/images/speaker-images-from-json/_copy-report.json"
    );
  };

  const resolveVersionedAssetPath = (assetPath) => {
    const resolvedPath = resolveLocalAssetPath(assetPath);

    if (!resolvedPath || !shouldBypassAssetCache(assetPath) || /^(?:https?:)?\/\//i.test(resolvedPath)) {
      return resolvedPath;
    }

    return `${resolvedPath}${resolvedPath.includes("?") ? "&" : "?"}v=${DATA_CACHE_BUST_KEY}`;
  };

  const initSiteNav = () => {
    const nav = document.querySelector("[data-site-nav]");
    const toggles = nav ? Array.from(nav.querySelectorAll(".site-nav__toggle")) : [];
    const menu = nav ? nav.querySelector(".site-nav__menu") : null;

    if (!nav || !toggles.length || !menu) {
      return;
    }

    const setToggleState = (isOpen) => {
      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    };

    const closeMenu = () => {
      nav.classList.remove("is-open");
      setToggleState(false);
    };

    const toggleMenu = () => {
      const isOpen = nav.classList.toggle("is-open");
      setToggleState(isOpen);
    };

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", toggleMenu);
    });

    nav.querySelectorAll(".site-nav__link, .site-nav__cta, .site-nav__bar-cta").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (nav.classList.contains("is-open") && !nav.contains(event.target)) {
        closeMenu();
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 993px)");
    const handleDesktopSwitch = (event) => {
      if (event.matches) {
        closeMenu();
      }
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopSwitch);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopSwitch);
    }

    nav.querySelectorAll(".site-nav__partners").forEach((partners) => {
      if (partners.querySelector(".site-nav__partners-track")) {
        return;
      }

      const partnerItems = Array.from(partners.querySelectorAll(":scope > .site-nav__partner"));
      const track = document.createElement("div");
      track.className = "site-nav__partners-track";
      partners.dataset.partnerCount = String(partnerItems.length);

      partnerItems.forEach((item) => {
        track.appendChild(item);
      });

      partners.appendChild(track);

      if (partnerItems.length > 3) {
        partners.classList.add("site-nav__partners--marquee");
        partnerItems.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          track.appendChild(clone);
        });
      }
    });

    const hero = document.querySelector(".hero");
    const topPanel = nav.querySelector(".site-nav__top");
    const bar = nav.querySelector(".site-nav__bar");
    let scrollFrame = null;

    const updatePageOffset = () => {
      if (!document.body.classList.contains("register-page")) {
        return;
      }

      const expandedHeight = (topPanel ? topPanel.scrollHeight : 0) + (bar ? bar.offsetHeight : 0);
      document.documentElement.style.setProperty("--register-nav-offset", `${Math.ceil(expandedHeight + 32)}px`);
    };

    const updateCompactState = () => {
      scrollFrame = null;

      if (!hero) {
        const compactAfter = topPanel ? Math.max(topPanel.offsetHeight * 0.78, 96) : 120;
        nav.classList.toggle("is-compact", window.scrollY > compactAfter);
        return;
      }

      nav.classList.toggle("is-compact", window.scrollY > window.innerHeight * 0.82);
    };

    const requestCompactUpdate = () => {
      if (scrollFrame === null) {
        scrollFrame = window.requestAnimationFrame(updateCompactState);
      }
    };

    if (hero && "IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          nav.classList.toggle("is-compact", !entry.isIntersecting);
        },
        { threshold: 0 }
      );

      heroObserver.observe(hero);
    } else {
      window.addEventListener("scroll", requestCompactUpdate, { passive: true });
    }
    window.addEventListener("resize", () => {
      updatePageOffset();
      requestCompactUpdate();
    });

    updatePageOffset();
    updateCompactState();
    window.addEventListener("load", updatePageOffset, { once: true });

    const sectionLinks = Array.from(menu.querySelectorAll(".site-nav__link[href^='#']"));
    const sectionMap = sectionLinks.reduce((map, link) => {
      const id = link.getAttribute("href").slice(1);
      const section = id ? document.getElementById(id) : null;

      if (section) {
        map.set(section, link);
      }

      return map;
    }, new Map());

    if (sectionMap.size && "IntersectionObserver" in window) {
      const setCurrentLink = (activeLink) => {
        sectionLinks.forEach((link) => {
          link.classList.toggle("is-current", link === activeLink);
        });
      };

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visible) {
            setCurrentLink(sectionMap.get(visible.target));
          }
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
      );

      sectionMap.forEach((_link, section) => sectionObserver.observe(section));
    }
  };

  initSiteNav();

  const initHeroVideoPlayback = () => {
    const heroVideo = document.querySelector(".hero__video");

    if (!heroVideo) {
      return;
    }

    const setPlaybackRate = () => {
      heroVideo.playbackRate = 0.80;
    };

    setPlaybackRate();
    heroVideo.addEventListener("loadedmetadata", setPlaybackRate, { once: true });
  };

  const initSplashScreen = (reduceMotion) => {
    const splash = document.querySelector("[data-splash]");
    const splashVideo = splash ? splash.querySelector(".splash__video") : null;

    if (!splash) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("has-splash");

    const splashDuration = 2500;
    const exitDuration = reduceMotion ? 260 : 520;
    let hasClosed = false;

    const closeSplash = () => {
      if (hasClosed) {
        return;
      }

      hasClosed = true;
      splash.classList.add("is-leaving");

      window.setTimeout(() => {
        splash.remove();
        root.classList.remove("has-splash");
        root.classList.add("is-loaded");
      }, exitDuration);
    };

    if (splashVideo && typeof splashVideo.play === "function") {
      const playPromise = splashVideo.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    window.setTimeout(closeSplash, splashDuration);
  };

  const initHeroChipCycle = (reduceMotion) => {
    if (reduceMotion) {
      return;
    }

    const chipsWrap = document.querySelector(".hero__eyebrow-meta");
    const chips = chipsWrap ? Array.from(chipsWrap.querySelectorAll(".hero__chip")) : [];

    if (!chipsWrap || chips.length < 2) {
      return;
    }

    let activeIndex = chips.findIndex((chip) => chip.classList.contains("hero__chip--accent"));

    if (activeIndex < 0) {
      activeIndex = 0;
      chips[0].classList.add("hero__chip--accent");
    }

    let timerId = null;

    const rotate = () => {
      chips[activeIndex].classList.remove("hero__chip--accent");
      activeIndex = (activeIndex + 1) % chips.length;
      chips[activeIndex].classList.add("hero__chip--accent");
    };

    const stop = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const start = () => {
      if (timerId === null) {
        timerId = window.setInterval(rotate, 2200);
      }
    };

    chipsWrap.addEventListener("mouseenter", stop);
    chipsWrap.addEventListener("mouseleave", start);
    chipsWrap.addEventListener("focusin", stop);
    chipsWrap.addEventListener("focusout", (event) => {
      if (!chipsWrap.contains(event.relatedTarget)) {
        start();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  };

  const initVideoPopup = ({
    popupSelector,
    iframeSelector,
    closeSelector,
    openSelector = null,
    openDelay = null,
    autoplay = false
  }) => {
    const popup = document.querySelector(popupSelector);
    const dialog = popup ? popup.querySelector(".timed-video-popup__dialog") : null;
    const iframe = popup ? popup.querySelector(iframeSelector) : null;
    const openTriggers = openSelector ? Array.from(document.querySelectorAll(openSelector)) : [];
    const closeTriggers = popup ? Array.from(popup.querySelectorAll(closeSelector)) : [];

    if (!popup || !dialog || !iframe || closeTriggers.length === 0) {
      return;
    }

    const configuredSrc = iframe.dataset.src || iframe.getAttribute("src") || "";

    if (!configuredSrc) {
      return;
    }

    const videoSrc = autoplay
      ? `${configuredSrc}${configuredSrc.includes("?") ? "&" : "?"}autoplay=1`
      : configuredSrc;
    let timerId = null;
    let activeTrigger = null;
    let hasAutoOpened = false;

    const hasOpenVideoPopup = () =>
      Array.from(document.querySelectorAll(".timed-video-popup")).some((node) => !node.hidden && node !== popup);

    const closePopup = () => {
      if (popup.hidden) {
        return;
      }

      popup.classList.remove("is-open");

      window.setTimeout(() => {
        popup.hidden = true;
        iframe.setAttribute("src", "");

        const anyPopupOpen = Array.from(document.querySelectorAll(".timed-video-popup")).some((node) => !node.hidden);

        if (!anyPopupOpen) {
          document.body.classList.remove("timed-video-popup-open");
        }

        if (activeTrigger) {
          activeTrigger.focus();
          activeTrigger = null;
        }

        popup.dispatchEvent(new CustomEvent("video-popup:closed", { bubbles: true }));
      }, 180);
    };

    const openPopup = (trigger = null) => {
      if (!popup.hidden) {
        return true;
      }

      if (hasOpenVideoPopup()) {
        return false;
      }

      activeTrigger = trigger instanceof HTMLElement ? trigger : null;
      iframe.setAttribute("src", videoSrc);

      popup.hidden = false;
      document.body.classList.add("timed-video-popup-open");

      requestAnimationFrame(() => {
        popup.classList.add("is-open");
        dialog.focus();
      });

      return true;
    };

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closePopup);
    });

    openTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        if (timerId !== null) {
          window.clearTimeout(timerId);
          timerId = null;
        }

        openPopup(trigger);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePopup();
      }
    });

    const scheduleAutoOpen = (delay) => {
      timerId = window.setTimeout(() => {
        timerId = null;

        if (openPopup()) {
          hasAutoOpened = true;
          return;
        }

        scheduleAutoOpen(1200);
      }, delay);
    };

    const startTimer = () => {
      if (typeof openDelay !== "number" || timerId !== null || hasAutoOpened) {
        return;
      }

      scheduleAutoOpen(openDelay);
    };

    if (typeof openDelay === "number") {
      if (document.readyState === "complete") {
        startTimer();
      } else {
        window.addEventListener("load", startTimer, { once: true });
      }
    }
  };

  const initTimedVideoPopup = () => {
    initVideoPopup({
      popupSelector: "[data-timed-video-popup]",
      iframeSelector: "[data-timed-video-iframe]",
      closeSelector: "[data-timed-video-close]",
      openDelay: 10000
    });
  };

  const initOverviewVideoPopup = () => {
    initVideoPopup({
      popupSelector: "[data-overview-video-popup]",
      iframeSelector: "[data-overview-video-iframe]",
      closeSelector: "[data-overview-video-close]",
      openSelector: "[data-overview-video-open]",
      autoplay: true
    });
  };

  const initLinkedInFollowCard = () => {
    const card = document.querySelector("[data-linkedin-follow-card]");
    const timedPopup = document.querySelector("[data-timed-video-popup]");
    const closeButton = card ? card.querySelector("[data-linkedin-follow-close]") : null;

    if (!card || !timedPopup || !closeButton) {
      return;
    }

    let hasShown = false;

    const showCard = () => {
      if (hasShown) {
        return;
      }

      hasShown = true;
      card.hidden = false;

      requestAnimationFrame(() => {
        card.classList.add("is-visible");
      });
    };

    const hideCard = () => {
      card.classList.remove("is-visible");

      window.setTimeout(() => {
        card.hidden = true;
      }, 220);
    };

    timedPopup.addEventListener("video-popup:closed", () => {
      window.setTimeout(showCard, 420);
    });

    closeButton.addEventListener("click", hideCard);
  };

  const initLazyIframes = () => {
    const iframes = Array.from(document.querySelectorAll("[data-lazy-iframe][data-src]"));

    if (!iframes.length) {
      return;
    }

    const loadIframe = (iframe) => {
      const src = iframe.dataset.src;

      if (src && iframe.getAttribute("src") !== src) {
        iframe.setAttribute("src", src);
      }
    };

    if (!("IntersectionObserver" in window)) {
      iframes.forEach(loadIframe);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          loadIframe(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "600px 0px" }
    );

    iframes.forEach((iframe) => observer.observe(iframe));
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  initSplashScreen(reduceMotion);
  initHeroVideoPlayback();
  initHeroChipCycle(reduceMotion);
  initTimedVideoPopup();
  initOverviewVideoPopup();
  initLinkedInFollowCard();
  initLazyIframes();
  const hasGsap = typeof window.gsap !== "undefined";
  const gsap = hasGsap ? window.gsap : null;
  const ScrollTrigger = hasGsap ? window.ScrollTrigger : null;

  if (hasGsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const loadGlobalEventsData = async () => {
    try {
      const response = await fetch(resolveVersionedAssetPath("./assets/data/global-events.json"), FRESH_DATA_FETCH_OPTIONS);

      if (!response.ok) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const payload = await response.json();
      const rawEvents = Array.isArray(payload) ? payload : payload.events;

      if (!Array.isArray(rawEvents)) {
        return [];
      }

      return rawEvents
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          name: typeof item.name === "string" ? item.name.trim() : "",
          desc: typeof item.desc === "string" ? item.desc.trim() : "",
          place: typeof item.place === "string" ? item.place.trim() : "",
          date: typeof item.date === "string" ? item.date.trim() : "",
          src: resolveVersionedAssetPath(typeof item.src === "string" ? item.src.trim() : ""),
          alt: typeof item.alt === "string" ? item.alt.trim() : "",
          url: typeof item.url === "string" ? item.url.trim() : "",
          flagSrc: resolveVersionedAssetPath(typeof item.flagSrc === "string" ? item.flagSrc.trim() : ""),
          flagAlt: typeof item.flagAlt === "string" ? item.flagAlt.trim() : "",
          pinFirst: item.pinFirst === true,
          status: typeof item.status === "string" ? item.status.trim().toLowerCase() : ""
        }))
        .filter((item) => item.name && item.desc && item.place && item.date && item.src && item.alt && item.url);
    } catch (error) {
      console.error("Failed to load global events data.", error);
      return [];
    }
  };

  const initGlobalEventsCarousel = async () => {
    const stage = document.querySelector(".global-events__stage");
    const cardsTrack = stage ? stage.querySelector(".global-events__cards") : null;
    const section = stage ? stage.closest(".global-events") : null;
    const prevControl = section ? section.querySelector("[data-global-events-prev]") : null;
    const nextControl = section ? section.querySelector("[data-global-events-next]") : null;
    const mobileViewportQuery = window.matchMedia("(max-width: 768px)");
    const cards = Array.from(document.querySelectorAll(".global-events__card"));

    if (!stage || !cardsTrack || cards.length === 0) {
      return;
    }

    const rawEvents = await loadGlobalEventsData();

    if (rawEvents.length === 0) {
      if (prevControl) {
        prevControl.disabled = true;
      }
      if (nextControl) {
        nextControl.disabled = true;
      }
      return;
    }

    const monthIndexMap = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11
    };

    const parseEventDate = (value = "") => {
      const normalized = value
        .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
        .replace(/\s+/g, " ")
        .trim();

      const dayMonthYearMatch = normalized.match(
        /\b(\d{1,2})\s*(?:&|and|-|to)?\s*(?:\d{1,2})?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s*,?\s*(\d{4})\b/i
      );

      if (dayMonthYearMatch) {
        const day = Number(dayMonthYearMatch[1]);
        const month = monthIndexMap[dayMonthYearMatch[2].toLowerCase()];
        const year = Number(dayMonthYearMatch[3]);
        return new Date(year, month, day);
      }

      const monthDayYearMatch = normalized.match(
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\s*(?:-|to)?\s*(?:\d{1,2})?\s*,?\s*(\d{4})\b/i
      );

      if (monthDayYearMatch) {
        const month = monthIndexMap[monthDayYearMatch[1].toLowerCase()];
        const day = Number(monthDayYearMatch[2]);
        const year = Number(monthDayYearMatch[3]);
        return new Date(year, month, day);
      }

      const fallback = new Date(normalized);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTime = startOfToday.getTime();

    const events = rawEvents
      .map((eventItem, index) => {
        const parsedDate = parseEventDate(eventItem.date);
        const parsedTime = parsedDate ? parsedDate.getTime() : null;
        const fallbackStatus = eventItem.status === "upcoming" || eventItem.status === "past" ? eventItem.status : "past";
        const status = parsedTime === null ? fallbackStatus : parsedTime >= todayTime ? "upcoming" : "past";

        return {
          ...eventItem,
          status,
          parsedTime,
          index
        };
      })
      .sort((a, b) => {
        if (a.pinFirst !== b.pinFirst) {
          return a.pinFirst ? -1 : 1;
        }

        if (a.status !== b.status) {
          return a.status === "upcoming" ? -1 : 1;
        }

        if (a.parsedTime === null && b.parsedTime === null) {
          return a.index - b.index;
        }

        if (a.parsedTime === null) {
          return 1;
        }

        if (b.parsedTime === null) {
          return -1;
        }

        if (a.status === "upcoming") {
          return a.parsedTime - b.parsedTime;
        }

        return b.parsedTime - a.parsedTime;
      });

    events.forEach((eventItem) => {
      const img = new Image();
      img.src = eventItem.src;

      if (eventItem.flagSrc) {
        const flagImg = new Image();
        flagImg.src = eventItem.flagSrc;
      }
    });

    const slots = cards.map((card) => ({
      link: card,
      flow: card.querySelector(".global-events__flow"),
      image: card.querySelector(".global-events__cover"),
      name: card.querySelector(".global-events__name"),
      status: card.querySelector(".global-events__status"),
      desc: card.querySelector(".global-events__desc"),
      flag: card.querySelector(".global-events__flag"),
      place: card.querySelector(".global-events__place"),
      date: card.querySelector(".global-events__date")
    }));

    if (
      slots.some(
        (slot) =>
          !slot.link ||
          !slot.flow ||
          !slot.image ||
          !slot.name ||
          !slot.status ||
          !slot.desc ||
          !slot.flag ||
          !slot.place ||
          !slot.date
      )
    ) {
      return;
    }

    const applyEventToSlot = (slot, eventItem) => {
      slot.image.src = eventItem.src;
      slot.image.alt = eventItem.alt;
      slot.name.textContent = eventItem.name;
      slot.status.textContent = eventItem.status === "upcoming" ? "Upcoming" : "Past";
      slot.status.classList.toggle("is-upcoming", eventItem.status === "upcoming");
      slot.status.classList.toggle("is-past", eventItem.status !== "upcoming");
      slot.desc.textContent = eventItem.desc;
      if (eventItem.flagSrc) {
        slot.flag.src = eventItem.flagSrc;
        slot.flag.alt = eventItem.flagAlt || `${eventItem.place} flag`;
        slot.flag.classList.remove("is-hidden");
      } else {
        slot.flag.alt = "";
        slot.flag.removeAttribute("src");
        slot.flag.classList.add("is-hidden");
      }
      slot.place.textContent = eventItem.place;
      slot.date.textContent = eventItem.date;
      slot.link.href = eventItem.url;
      slot.link.setAttribute(
        "aria-label",
        `${eventItem.name} - ${eventItem.place} - ${eventItem.date}`
      );
    };

    const flowEls = slots.map((slot) => slot.flow);
    const hasOverflowEvents = events.length > cards.length;
    const canAnimate = hasGsap && !reduceMotion && hasOverflowEvents;
    const isMobileViewport = () => mobileViewportQuery.matches;
    const mobileTrackShift = -(100 / cards.length);
    const carouselEase = "power2.out";
    let visibleCoverIndices = cards.map((_, index) => index % events.length);
    let isAnimating = false;

    if (prevControl) {
      prevControl.disabled = !hasOverflowEvents;
    }
    if (nextControl) {
      nextControl.disabled = !hasOverflowEvents;
    }

    const paintCards = (indices) => {
      slots.forEach((slot, slotIndex) => {
        const eventItem = events[indices[slotIndex]];
        if (!eventItem) {
          return;
        }
        applyEventToSlot(slot, eventItem);
      });
    };

    const getNextVisibleIndices = (direction) => {
      if (direction < 0) {
        const previousIndex = (visibleCoverIndices[0] - 1 + events.length) % events.length;
        return [previousIndex, ...visibleCoverIndices.slice(0, -1)];
      }

      const nextIndex = (visibleCoverIndices[visibleCoverIndices.length - 1] + 1) % events.length;
      return [...visibleCoverIndices.slice(1), nextIndex];
    };

    paintCards(visibleCoverIndices);

    if (canAnimate) {
      gsap.set(cardsTrack, { xPercent: 0 });
      gsap.set(flowEls, { x: 0, autoAlpha: 1 });
    }

    const cycleCards = (direction = 1) => {
      if (!hasOverflowEvents || isAnimating) {
        return;
      }

      const normalizedDirection = direction < 0 ? -1 : 1;
      const nextVisible = getNextVisibleIndices(normalizedDirection);

      if (!canAnimate) {
        visibleCoverIndices = nextVisible;
        paintCards(visibleCoverIndices);
        return;
      }

      isAnimating = true;
      const travelDistance = normalizedDirection > 0 ? -24 : 24;

      const timeline = gsap.timeline({
        defaults: { ease: carouselEase },
        onComplete: () => {
          visibleCoverIndices = nextVisible;
          isAnimating = false;
        }
      });

      if (isMobileViewport()) {
        timeline
          .to(
            cardsTrack,
            {
              xPercent: mobileTrackShift * normalizedDirection,
              duration: 0.45,
              ease: carouselEase
            },
            0
          )
          .add(() => {
            paintCards(nextVisible);
            gsap.set(cardsTrack, { xPercent: 0 });
            gsap.set(flowEls, { x: 0, autoAlpha: 1 });
          });

        return;
      }

      timeline
        .to(
          flowEls,
          {
            x: travelDistance,
            autoAlpha: 0,
            duration: 0.22,
            stagger: 0.03
          },
          0
        )
        .add(() => {
          paintCards(nextVisible);
          gsap.set(flowEls, { x: -travelDistance, autoAlpha: 0 });
        })
        .to(
          flowEls,
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.32,
            stagger: 0.03
          },
          ">-0.05"
        );
    };

    if (prevControl) {
      prevControl.addEventListener("click", () => {
        cycleCards(-1);
      });
    }

    if (nextControl) {
      nextControl.addEventListener("click", () => {
        cycleCards(1);
      });
    }

    const handleViewportSwitch = () => {
      if (!canAnimate) {
        return;
      }

      gsap.killTweensOf(cardsTrack);
      gsap.killTweensOf(flowEls);
      isAnimating = false;

      paintCards(visibleCoverIndices);
      gsap.set(cardsTrack, { xPercent: 0 });
      gsap.set(flowEls, { x: 0, autoAlpha: 1 });
    };

    if (typeof mobileViewportQuery.addEventListener === "function") {
      mobileViewportQuery.addEventListener("change", handleViewportSwitch);
    } else if (typeof mobileViewportQuery.addListener === "function") {
      mobileViewportQuery.addListener(handleViewportSwitch);
    }
  };

  const initStrategicCarousel = () => {
    const strategicSection = document.querySelector(".strategic");
    const carousel = strategicSection ? strategicSection.querySelector("[data-strategic-carousel]") : null;
    if (!strategicSection || !carousel) {
      return;
    }

    const slides = Array.from(carousel.querySelectorAll(".strategic-slide"));
    const dots = Array.from(strategicSection.querySelectorAll(".strategic__dot"));
    const prevButton = strategicSection.querySelector(".strategic__arrow--prev");
    const nextButton = strategicSection.querySelector(".strategic__arrow--next");

    if (slides.length === 0 || dots.length !== slides.length || !prevButton || !nextButton) {
      return;
    }

    let activeIndex = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains("is-active"))
    );

    const updateSlides = (nextIndex) => {
      slides.forEach((slide, index) => {
        const isActive = index === nextIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach((dot, index) => {
        const isActive = index === nextIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
        dot.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      activeIndex = nextIndex;
    };

    const goToSlide = (index) => {
      const nextIndex = (index + slides.length) % slides.length;
      if (nextIndex === activeIndex) {
        return;
      }

      updateSlides(nextIndex);
    };

    prevButton.addEventListener("click", () => {
      goToSlide(activeIndex - 1);
    });

    nextButton.addEventListener("click", () => {
      goToSlide(activeIndex + 1);
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goToSlide(Number(dot.dataset.slide));
      });
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      }
    });

    updateSlides(activeIndex);
  };

  const initAttendCarousel = () => {
    const section = document.querySelector(".attend");
    const carousel = section ? section.querySelector("[data-attend-carousel]") : null;
    const track = carousel ? carousel.querySelector("[data-attend-track]") : null;

    if (!section || !carousel || !track) {
      return;
    }

    track.querySelectorAll(".attend-card--clone").forEach((clone) => clone.remove());

    const baseCards = Array.from(track.querySelectorAll(".attend-card")).filter(
      (card) => !card.classList.contains("attend-card--clone")
    );
    if (baseCards.length < 2) {
      return;
    }

    const clones = baseCards.map((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("attend-card--clone");
      clone.setAttribute("aria-hidden", "true");
      return clone;
    });

    clones.forEach((clone) => {
      track.appendChild(clone);
    });

    section.classList.add("attend--ready");
  };

  const initSeriesSponsorsSlider = () => {
    const marquee = document.querySelector("[data-series-sponsors]");
    const track = marquee ? marquee.querySelector(".series-sponsors__track") : null;

    if (!marquee || !track) {
      return;
    }

    initInfiniteMarquee({
      marquee,
      track,
      itemSelector: ".series-sponsors__logo",
      cloneClass: "series-sponsors__logo--clone",
      distanceVar: "--series-sponsors-distance",
      durationVar: "--series-sponsors-duration",
      minDuration: 18,
      pixelsPerSecond: 76
    });
  };

  const initInfiniteMarquee = ({
    marquee,
    track,
    itemSelector,
    cloneClass,
    distanceVar,
    durationVar,
    minDuration,
    pixelsPerSecond
  }) => {
    if (!marquee || !track) {
      return;
    }

    track.querySelectorAll(`.${cloneClass}`).forEach((clone) => clone.remove());

    const baseItems = Array.from(track.querySelectorAll(itemSelector)).filter(
      (item) => !item.classList.contains(cloneClass)
    );

    if (baseItems.length < 2) {
      return;
    }

    const clones = baseItems.map((item) => {
      const clone = item.cloneNode(true);
      clone.classList.add(cloneClass);
      clone.setAttribute("aria-hidden", "true");
      return clone;
    });

    clones.forEach((clone) => {
      track.appendChild(clone);
    });

    const duration = Math.max((baseItems.length * 180) / pixelsPerSecond, minDuration);
    marquee.style.setProperty(durationVar, `${duration}s`);
    marquee.classList.add("is-ready");
  };

  const initSeriesSpeakersSlider = async () => {
    const marquee = document.querySelector("[data-series-speakers]");
    const track = marquee ? marquee.querySelector(".series-speakers__track") : null;

    if (!marquee || !track) {
      return;
    }

    const useExistingSpeakerCards = () => {
      if (track.querySelectorAll(".series-speakers__card").length < 2) {
        return false;
      }

      initInfiniteMarquee({
        marquee,
        track,
        itemSelector: ".series-speakers__card",
        cloneClass: "series-speakers__card--clone",
        distanceVar: "--series-speakers-distance",
        durationVar: "--series-speakers-duration",
        minDuration: 24,
        pixelsPerSecond: 68
      });

      return true;
    };

    const normalizeSpeakerKey = (value = "") =>
      value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const speakerIdentityKey = (name = "") =>
      normalizeSpeakerKey(name)
        .replace(/\b(dr|mr|mrs|ms|eng|prof|ir|phd)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    let speakersPayload = [];

    try {
      const response = await fetch(resolveVersionedAssetPath("./assets/data/speakers-data.json"), FRESH_DATA_FETCH_OPTIONS);

      if (!response.ok) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const payload = await response.json();
      speakersPayload = Array.isArray(payload) ? payload : payload.speakers;
    } catch (error) {
      console.error("Failed to load speakers data.", error);
      useExistingSpeakerCards();
      return;
    }

    const seenSpeakerKeys = new Set();
    const speakers = Array.isArray(speakersPayload)
      ? speakersPayload
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            name: typeof item.name === "string" ? item.name.trim() : "",
            title: typeof item.title === "string" ? item.title.trim() : "",
            company: typeof item.company === "string" ? item.company.trim() : "",
            imageUrl: typeof item.image_url === "string" ? item.image_url.trim() : ""
          }))
          .filter((item) => item.name)
          .filter((item) => {
            const key = speakerIdentityKey(item.name);

            if (!key || seenSpeakerKeys.has(key)) {
              return false;
            }

            seenSpeakerKeys.add(key);
            return true;
          })
      : [];

    if (speakers.length < 2) {
      useExistingSpeakerCards();
      return;
    }

    const imageByName = new Map();
    const imageBySource = new Map();

    try {
      const mapResponse = await fetch(resolveVersionedAssetPath("./assets/images/speaker-images-from-json/_copy-report.json"), FRESH_DATA_FETCH_OPTIONS);

      if (mapResponse.ok) {
        const report = await mapResponse.json();

        if (Array.isArray(report)) {
          report
            .filter((entry) => entry && typeof entry === "object")
            .forEach((entry) => {
              const outputName = typeof entry.output === "string" ? entry.output.trim() : "";

              if (!outputName) {
                return;
              }

              const resolvedPath = resolveVersionedAssetPath(`./assets/images/speaker-images-from-json/${outputName}`);

              if (typeof entry.name === "string") {
                const nameKey = normalizeSpeakerKey(entry.name);
                if (nameKey && !imageByName.has(nameKey)) {
                  imageByName.set(nameKey, resolvedPath);
                }
              }

              if (typeof entry.source === "string" && entry.source.trim() && !imageBySource.has(entry.source.trim())) {
                imageBySource.set(entry.source.trim(), resolvedPath);
              }
            });
        }
      }
    } catch (error) {
      console.warn("Could not load speaker image mapping report.", error);
    }

    const resolveSpeakerImage = (speaker) => {
      const keyByName = normalizeSpeakerKey(speaker.name);
      const mappedByName = imageByName.get(keyByName);

      if (mappedByName) {
        return mappedByName;
      }

      const mappedBySource = imageBySource.get(speaker.imageUrl);
      if (mappedBySource) {
        return mappedBySource;
      }

      if (/^(https?:)?\/\//i.test(speaker.imageUrl)) {
        return speaker.imageUrl;
      }

      if (speaker.imageUrl && /^(?:\.\/)?assets\//i.test(speaker.imageUrl)) {
        return resolveVersionedAssetPath(speaker.imageUrl);
      }

      return resolveVersionedAssetPath("./assets/images/logo.webp");
    };

    const cards = speakers.map((speaker) => {
      const card = document.createElement("article");
      card.className = "series-speakers__card";

      const imageWrap = document.createElement("figure");
      imageWrap.className = "series-speakers__image";

      const image = document.createElement("img");
      image.src = resolveSpeakerImage(speaker);
      image.alt = `${speaker.name}${speaker.title ? `, ${speaker.title}` : ""}${speaker.company ? ` at ${speaker.company}` : ""} - AIMCT speaker`;
      image.loading = "eager";
      image.decoding = "async";
      imageWrap.appendChild(image);

      const content = document.createElement("div");
      content.className = "series-speakers__content";

      const name = document.createElement("p");
      name.className = "series-speakers__name";
      name.textContent = speaker.name;

      const role = document.createElement("p");
      role.className = "series-speakers__role";
      role.textContent = [speaker.title, speaker.company].filter(Boolean).join(" | ") || "Series Speaker";

      content.append(name, role);
      card.append(imageWrap, content);

      return card;
    });

    track.replaceChildren(...cards);

    initInfiniteMarquee({
      marquee,
      track,
      itemSelector: ".series-speakers__card",
      cloneClass: "series-speakers__card--clone",
      distanceVar: "--series-speakers-distance",
      durationVar: "--series-speakers-duration",
      minDuration: 24,
      pixelsPerSecond: 68
    });
  };

  const HIDE_PLACEHOLDER_AVATAR_SPEAKERS = true;
  const PLACEHOLDER_AVATAR_IMAGE = "assets/images/speakers/avatar.webp";
  const normalizeAssetPath = (path = "") => path.replace(/^\.?\//, "").trim().toLowerCase();
  const isPlaceholderAvatarSpeaker = (speaker) =>
    normalizeAssetPath(speaker.image) === PLACEHOLDER_AVATAR_IMAGE;

  const loadSpeakerShowcaseData = async () => {
    try {
      const response = await fetch(resolveVersionedAssetPath("./assets/data/speaker-showcase.json"), FRESH_DATA_FETCH_OPTIONS);

      if (!response.ok) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const payload = await response.json();
      const sections = Array.isArray(payload.sections) ? payload.sections : [];

      return {
        title: localizedValue(payload, "title"),
        intro: localizedValue(payload, "intro"),
        sections: sections
          .filter((section) => section && typeof section === "object")
          .map((section) => ({
            id: typeof section.id === "string" ? section.id.trim() : "",
            label: localizedValue(section, "label") || "Speaker Group",
            style: typeof section.style === "string" ? section.style.trim().toLowerCase() : "general",
            description: localizedValue(section, "description"),
            speakers: Array.isArray(section.speakers)
              ? section.speakers
                  .filter((speaker) => speaker && typeof speaker === "object")
                  .map((speaker) => ({
                    id: typeof speaker.id === "string" ? speaker.id.trim() : "",
                    name: typeof speaker.name === "string" ? speaker.name.trim() : "",
                    designation: localizedValue(speaker, "designation"),
                    company: localizedValue(speaker, "company"),
                    image: typeof speaker.image === "string" ? speaker.image.trim() : "",
                    logo: typeof speaker.logo === "string" ? speaker.logo.trim() : "",
                    logoAlt: typeof speaker.logoAlt === "string" ? speaker.logoAlt.trim() : "",
                    bio: localizedValue(speaker, "bio")
                  }))
                  .filter(
                    (speaker) =>
                      speaker.name &&
                      (!HIDE_PLACEHOLDER_AVATAR_SPEAKERS || !isPlaceholderAvatarSpeaker(speaker))
                  )
              : []
          }))
          .filter((section) => section.speakers.length > 0)
      };
    } catch (error) {
      console.error("Failed to load speaker showcase data.", error);
      return { title: "", intro: "", sections: [] };
    }
  };

  const initSpeakerShowcase = async () => {
    const section = document.querySelector(".speaker-showcase");
    const groupsHost = section ? section.querySelector("[data-speaker-groups]") : null;
    const headEl = section ? section.querySelector(".speaker-showcase__head") : null;
    const titleEl = section ? section.querySelector(".speaker-showcase__title") : null;
    const introEl = section ? section.querySelector("[data-speaker-showcase-intro]") : null;
    const modal = section ? section.querySelector("[data-speaker-modal]") : null;

    if (!section || !groupsHost || !modal) {
      return;
    }

    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    const modalDialog = modal.querySelector(".speaker-modal__dialog");
    const modalImage = modal.querySelector("[data-speaker-modal-image]");
    const modalSection = modal.querySelector("[data-speaker-modal-section]");
    const modalName = modal.querySelector("[data-speaker-modal-name]");
    const modalRole = modal.querySelector("[data-speaker-modal-role]");
    const modalCompany = modal.querySelector("[data-speaker-modal-company]");
    const modalBio = modal.querySelector("[data-speaker-modal-bio]");
    const closeTriggers = Array.from(modal.querySelectorAll("[data-speaker-modal-close]"));

    if (!modalDialog || !modalImage || !modalSection || !modalName || !modalRole || !modalCompany || !modalBio) {
      return;
    }

    const { title, intro, sections } = await loadSpeakerShowcaseData();

    if (titleEl) {
      titleEl.hidden = sections.length > 0;
      titleEl.textContent = title || "Speaker Lineup";
    }

    if (introEl) {
      if (intro) {
        introEl.hidden = false;
        introEl.textContent = intro;
      } else {
        introEl.textContent = "";
        introEl.hidden = true;
      }
    }

    if (sections.length === 0) {
      if (introEl) {
        introEl.hidden = false;
        introEl.textContent = "Speaker profiles will be announced soon.";
      }
      return;
    }

    const speakerMap = new Map();
    const fragment = document.createDocumentFragment();

    const splitCompanyAndNotice = (companyHtml = "") => {
      if (!companyHtml) {
        return { companyHtml: "" };
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = companyHtml;
      const noticeRegex = /awaiting official confirmation as per gdpr regulations/i;

      const noticeNode = Array.from(wrapper.querySelectorAll("*")).find((node) =>
        noticeRegex.test((node.textContent || "").trim())
      );

      if (!noticeNode) {
        return { companyHtml };
      }

      noticeNode.remove();

      while (
        wrapper.lastChild &&
        ((wrapper.lastChild.nodeType === Node.TEXT_NODE && !(wrapper.lastChild.textContent || "").trim()) ||
          (wrapper.lastChild.nodeType === Node.ELEMENT_NODE && wrapper.lastChild.nodeName === "BR"))
      ) {
        wrapper.removeChild(wrapper.lastChild);
      }

      return {
        companyHtml: wrapper.innerHTML.trim()
      };
    };

    const hasSpeakerLogo = (speaker) => Boolean((speaker.logo || "").trim());
    const resolveSpeakerLogo = (speaker) => ({
      src: resolveVersionedAssetPath((speaker.logo || "").trim()),
      alt: speaker.logoAlt || `${speaker.name || "Speaker"} logo`
    });

    sections.forEach((group, groupIndex) => {
      const style = group.style === "technical" ? "technical" : "general";
      const groupEl = document.createElement("article");
      groupEl.className = `speaker-group speaker-group--${style}`;

      const grid = document.createElement("div");
      grid.className = "speaker-group__grid";

      group.speakers.forEach((speaker, speakerIndex) => {
        const key = `${group.id || `group-${groupIndex}`}-${speaker.id || `speaker-${speakerIndex}`}`;

        const card = document.createElement("button");
        card.type = "button";
        card.className = `speaker-card speaker-card--${style}`;
        card.dataset.speakerCard = key;

        const figure = document.createElement("figure");
        figure.className = "speaker-card__media";
        const { companyHtml } = splitCompanyAndNotice(speaker.company || "");
        const companyText = companyHtml
          ? companyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
          : "";

        const image = document.createElement("img");
        image.src = resolveVersionedAssetPath(speaker.image || "./assets/images/logo.webp");
        image.alt = `${speaker.name}${speaker.designation ? `, ${speaker.designation}` : ""}${companyText ? ` at ${companyText}` : ""} - AIMCT Norway 2026 speaker`;
        image.loading = "lazy";
        image.decoding = "async";
        figure.appendChild(image);

        const body = document.createElement("div");
        body.className = "speaker-card__body";

        const name = document.createElement("p");
        name.className = "speaker-card__name";
        name.textContent = speaker.name;

        const role = document.createElement("p");
        role.className = "speaker-card__role";
        role.textContent = speaker.designation || "Speaker";

        const company = document.createElement("p");
        company.className = "speaker-card__company";
        company.innerHTML = companyHtml || "Conference Delegate";

        body.append(name, role, company);

        if (hasSpeakerLogo(speaker)) {
          const logo = document.createElement("div");
          logo.className = "speaker-card__logo";

          const logoImage = document.createElement("img");
          const { src: speakerLogoSrc, alt: speakerLogoAlt } = resolveSpeakerLogo(speaker);
          logoImage.src = speakerLogoSrc;
          logoImage.alt = speakerLogoAlt;
          logoImage.loading = "lazy";
          logoImage.decoding = "async";
          logo.appendChild(logoImage);

          body.appendChild(logo);
        }
        card.append(figure, body);
        grid.appendChild(card);

        speakerMap.set(key, {
          ...speaker,
          groupLabel: group.label
        });
      });

      const groupHead = document.createElement("header");
      groupHead.className = "speaker-showcase__head speaker-group__head";

      const groupTitle = document.createElement("h3");
      groupTitle.className = "speaker-showcase__title speaker-group__title";
      groupTitle.textContent = group.label || `Speaker Group ${groupIndex + 1}`;

      groupHead.appendChild(groupTitle);

      if (group.description) {
        const groupDescription = document.createElement("p");
        groupDescription.className = "speaker-showcase__intro speaker-group__description";
        groupDescription.textContent = group.description;
        groupHead.appendChild(groupDescription);
      }

      groupEl.appendChild(groupHead);
      groupEl.appendChild(grid);
      fragment.appendChild(groupEl);
    });

    groupsHost.replaceChildren(fragment);
    if (headEl) {
      headEl.classList.add("speaker-showcase__head--kicker-only");
    }
    section.classList.add("speaker-showcase--ready");

    let lastFocusedElement = null;
    let lockedScrollY = 0;
    let bodyScrollLocked = false;

    const lockBodyScroll = () => {
      if (bodyScrollLocked) {
        return;
      }

      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add("speaker-modal-open");
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      bodyScrollLocked = true;
    };

    const unlockBodyScroll = () => {
      if (!bodyScrollLocked) {
        return;
      }

      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      document.body.classList.remove("speaker-modal-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo({ top: lockedScrollY, left: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
      bodyScrollLocked = false;
    };

    const closeModal = () => {
      if (modal.hidden) {
        return;
      }

      modal.classList.remove("is-open");

      window.setTimeout(() => {
        modal.hidden = true;
        unlockBodyScroll();
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
          lastFocusedElement.focus();
        }
      }, 180);
    };

    const openModal = (speaker, triggerEl) => {
      if (!speaker) {
        return;
      }

      lastFocusedElement = triggerEl || document.activeElement;

      modalImage.src = resolveVersionedAssetPath(speaker.image || "./assets/images/logo.webp");
      modalSection.textContent = speaker.groupLabel || "Speaker Profile";
      modalName.textContent = speaker.name || "Speaker";
      modalRole.textContent = speaker.designation || "Designation";
      const { companyHtml } = splitCompanyAndNotice(speaker.company || "");
      modalCompany.innerHTML = companyHtml || "<span>Company</span>";
      modalImage.alt = `${speaker.name}${speaker.designation ? `, ${speaker.designation}` : ""}${modalCompany.textContent ? ` at ${modalCompany.textContent}` : ""} - AIMCT Norway 2026 speaker`;
      modalBio.innerHTML = speaker.bio || "<span>Bio details will be shared soon.</span>";

      modal.hidden = false;
      lockBodyScroll();

      requestAnimationFrame(() => {
        modal.classList.add("is-open");
        modalDialog.focus();
      });
    };

    groupsHost.addEventListener("click", (event) => {
      const card = event.target.closest("[data-speaker-card]");
      if (!card) {
        return;
      }

      const speaker = speakerMap.get(card.dataset.speakerCard || "");
      openModal(speaker, card);
    });

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  };

  const runAfterInitialPaint = (callback) => {
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(callback, { timeout: 1600 });
      } else {
        window.setTimeout(callback, 900);
      }
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
  };

  runAfterInitialPaint(() => {
    initGlobalEventsCarousel();
    initSpeakerShowcase();
    initAttendCarousel();
    initSeriesSpeakersSlider();
    initSeriesSponsorsSlider();
  });

  const initMotionEffects = () => {
    if (reduceMotion || !hasGsap) {
      return;
    }

    initStrategicCarousel();

  if (document.documentElement.classList.contains("has-splash")) {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTimeline
      .from(
        ".hero__eyebrow-meta",
        {
          y: 28,
          autoAlpha: 0,
          duration: 0.8
        },
        "<0.15"
      )
      .from(
        [".hero__kicker", ".hero__title"],
        {
          y: 52,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.08
        },
        "<0.05"
      )
      .from(
        [".hero__intro", ".hero__actions"],
        {
          y: 26,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.08
        },
        "<0.2"
      )
      .from(
        ".marquee",
        {
          y: 36,
          autoAlpha: 0,
          duration: 0.9
        },
        "<0.1"
      );
  }

  if (!ScrollTrigger) {
    return;
  }

  // Kicker underline scroll animation
  const kickerSelectors = [
    ".speaker-showcase__kicker",
    ".series-speakers__kicker",
    ".supporting-partners__kicker",
    ".series-sponsors__kicker",
    ".global-events__kicker",
    ".legacy-highlights__kicker",
    ".numbers__kicker",
    ".integrity-moment__kicker",
    ".strategic__kicker",
    ".matter__kicker",
    ".in-room__kicker",
    ".topics__kicker",
    ".attend__kicker",
    ".testimonials__kicker",
    ".final-register-cta__kicker"
  ];

  document.querySelectorAll(kickerSelectors.join(",")).forEach((kicker) => {
    ScrollTrigger.create({
      trigger: kicker,
      start: "top 88%",
      onEnter: () => kicker.classList.add("is-active"),
      onLeaveBack: () => kicker.classList.remove("is-active")
    });
  });

  gsap.from([".global-events__kicker", ".global-events__title", ".global-events__intro"], {
    y: 38,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".global-events",
      start: "top 78%"
    }
  });

  gsap.from(".global-events__card", {
    autoAlpha: 0,
    duration: 0.7,
    stagger: {
      each: 0.08,
      from: "center"
    },
    ease: "power3.out",
    scrollTrigger: {
        trigger: ".global-events__stage",
        start: "top 82%"
      }
    });

  gsap.from([".legacy-highlights__kicker", ".legacy-highlights__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".legacy-highlights",
      start: "top 80%"
    }
  });

  gsap.from(".legacy-highlights__media", {
    y: 24,
    autoAlpha: 0,
    duration: 0.85,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".legacy-highlights__media",
      start: "top 82%"
    }
  });

  gsap.from([".overview__kicker", ".overview__title", ".overview__fact"], {
    y: 42,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".overview",
      start: "top 74%"
    }
  });

  gsap.from([".overview__lead", ".overview__intro"], {
    y: 28,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".overview__content",
      start: "top 78%"
    }
  });

  gsap.from(".overview__highlights li", {
    y: 18,
    autoAlpha: 0,
    duration: 0.55,
    stagger: 0.07,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".overview__highlights",
      start: "top 85%"
    }
  });

  gsap.fromTo(
    ".overview-image img",
    {
      scale: 1.08,
      yPercent: 5,
      autoAlpha: 0.85
    },
    {
      scale: 1,
      yPercent: 0,
      autoAlpha: 1,
      duration: 1.35,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".overview-image",
        start: "top 76%"
      }
    }
  );

  gsap.from(".overview-image__theme-kicker", {
    y: 16,
    autoAlpha: 0,
    duration: 0.72,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".overview-image",
      start: "top 76%"
    }
  });

  gsap.from(".overview-image__theme-line", {
    yPercent: 34,
    clipPath: "inset(0 0 100% 0)",
    autoAlpha: 0,
    filter: "blur(10px)",
    duration: 0.95,
    stagger: 0.16,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".overview-image",
      start: "top 74%"
    }
  });

  gsap.from(".overview-image__industries", {
    y: 20,
    autoAlpha: 0,
    filter: "blur(6px)",
    duration: 0.82,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".overview-image",
      start: "top 72%"
    }
  });

  gsap.from(".overview-image__video-cta", {
    scale: 0.78,
    autoAlpha: 0,
    duration: 0.92,
    ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: ".overview-image",
      start: "top 74%"
    }
  });

  gsap.from([".speaker-showcase__kicker", ".speaker-showcase__title", ".speaker-showcase__intro"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".speaker-showcase",
      start: "top 80%"
    }
  });

  gsap.from([".speaker-group", ".speaker-card"], {
    y: 20,
    autoAlpha: 0,
    duration: 0.65,
    stagger: 0.05,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".speaker-showcase__groups",
      start: "top 82%"
    }
  });

  gsap.from([".strategic__kicker", ".strategic__title"], {
    y: 34,
    autoAlpha: 0,
    duration: 0.85,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".strategic",
      start: "top 78%"
    }
  });

  gsap.from([".strategic__carousel", ".strategic__controls"], {
    y: 22,
    autoAlpha: 0,
    duration: 0.75,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".strategic__carousel",
      start: "top 82%"
    }
  });

  gsap.from([".matter__kicker", ".matter__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.82,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".matter",
      start: "top 80%"
    }
  });

  gsap.from([".matter__lead", ".matter__closing", ".matter__list li", ".matter__scope"], {
    y: 22,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.07,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".matter__layout",
      start: "top 82%"
    }
  });

  gsap.from([".in-room__kicker", ".in-room__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.82,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".in-room",
      start: "top 80%"
    }
  });

  gsap.from([".in-room__line", ".in-room__item"], {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".in-room__layout",
      start: "top 82%"
    }
  });

  gsap.from([".topics__kicker", ".topics__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.82,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".topics",
      start: "top 80%"
    }
  });

  gsap.from(".topics__item", {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".topics__grid",
      start: "top 82%"
    }
  });

  gsap.from([".attend__kicker", ".attend__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.82,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".attend",
      start: "top 80%"
    }
  });

  gsap.from([".attend__carousel", ".attend-card:not(.attend-card--clone)"], {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".attend__carousel",
      start: "top 82%"
    }
  });

  gsap.from([".series-speakers__kicker", ".series-speakers__title", ".series-sponsors__kicker", ".series-sponsors__title"], {
    y: 30,
    autoAlpha: 0,
    duration: 0.82,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".series-sponsors",
      start: "top 80%"
    }
  });

  gsap.from(".series-speakers__marquee", {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".series-speakers__marquee",
      start: "top 82%"
    }
  });

  gsap.from([".series-sponsors__marquee", ".series-sponsors__logo"], {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.04,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".series-sponsors__marquee",
      start: "top 82%"
    }
  });

  // Strategic Partner Animation
  const strategicTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".strategic-slide_div",
      start: "top 82%",
      once: true
    }
  });

  strategicTimeline
    .from("#strategic-partner-title", {
      y: 30,
      autoAlpha: 0,
      duration: 1.2,
      ease: "power3.out"
    })
    .from(".strategic-slide_div + .supporting-partners__logos .supporting-partners__logo", {
      y: 40,
      scale: 0.95,
      autoAlpha: 0,
      duration: 1.8,
      stagger: 0.25,
      ease: "power2.out"
    }, "-=0.6");

  // Supporting Partners Animation
  const supportingTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: "#supporting-partners",
      start: "top 82%",
      once: true
    }
  });

  supportingTimeline
    .from("#supporting-partners .supporting-partners__title", {
      y: 30,
      autoAlpha: 0,
      duration: 1.2,
      ease: "power3.out"
    })
    .from("#supporting-partners .supporting-partners__logo", {
      y: 40,
      scale: 0.95,
      autoAlpha: 0,
      duration: 1.8,
      stagger: 0.25,
      ease: "power2.out"
    }, "-=0.6");

  // Series Supporting Partners Animation
  const partnersTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: "#series-supporting-partners",
      start: "top 82%",
      once: true
    }
  });

  partnersTimeline
    .from("#series-supporting-partners .supporting-partners__title", {
      y: 30,
      autoAlpha: 0,
      duration: 1.2,
      ease: "power3.out"
    })
    .from("#series-supporting-partners .supporting-partners__logo", {
      y: 40,
      scale: 0.95,
      autoAlpha: 0,
      duration: 1.8,
      stagger: 0.25,
      ease: "power2.out"
    }, "-=0.6");

  gsap.from([".numbers__kicker", ".numbers__title", ".numbers__intro"], {
    y: 36,
    autoAlpha: 0,
    duration: 0.85,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".numbers",
      start: "top 78%"
    }
  });

  gsap.from(".numbers__card", {
    y: 30,
    autoAlpha: 0,
    duration: 0.75,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".numbers__grid",
      start: "top 82%"
    }
  });

  document.querySelectorAll(".numbers__count").forEach((el) => {
    const target = Number(el.dataset.target);

    if (!Number.isFinite(target)) {
      return;
    }

    ScrollTrigger.create({
      trigger: el.closest(".numbers__card"),
      start: "top 82%",
      once: true,
      onEnter: () => {
        const counter = { value: 0 };
        el.textContent = "0";

        gsap.to(counter, {
          value: target,
          duration: 1.7,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.floor(counter.value).toLocaleString();
          },
          onComplete: () => {
            el.textContent = target.toLocaleString();
          }
        });
      }
    });
  });gsap.from([".testimonials__kicker", ".testimonials__title", ".testimonials__intro"], {
    y: 30,
    autoAlpha: 0,
    duration: 1,
    stagger: 0.15,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".testimonials",
      start: "top 80%"
    }
  });

  const initTestimonialsMarquee = () => {
    const marquee = document.querySelector("[data-testimonials-marquee]");
    const track = marquee ? marquee.querySelector(".testimonials__track") : null;

    if (!marquee || !track) return;

    initInfiniteMarquee({
      marquee,
      track,
      itemSelector: ".testimonial-card",
      cloneClass: "testimonial-card--clone",
      distanceVar: "--testimonials-distance",
      durationVar: "--testimonials-duration",
      minDuration: 72,
      pixelsPerSecond: 34
    });
  };

  initTestimonialsMarquee();
  };

  const runAfterInteraction = (callback) => {
    let hasRun = false;

    const run = () => {
      if (hasRun) {
        return;
      }

      hasRun = true;
      window.removeEventListener("scroll", run);
      window.removeEventListener("pointerdown", run);
      window.removeEventListener("keydown", run);
      callback();
    };

    window.addEventListener("scroll", run, { passive: true, once: true });
    window.addEventListener("pointerdown", run, { passive: true, once: true });
    window.addEventListener("keydown", run, { once: true });
  };

  runAfterInteraction(initMotionEffects);
})();

