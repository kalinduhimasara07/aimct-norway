(function () {
  const hero = document.querySelector("#hero");
  const ctas = Array.from(document.querySelectorAll(".floating-cta"));

  if (!hero || ctas.length === 0) {
    return;
  }

  const setVisible = (visible) => {
    ctas.forEach((cta) => {
      cta.classList.toggle("is-visible", visible);
    });
  };

  if (typeof window.IntersectionObserver === "function") {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(hero);
    return;
  }

  const updateVisibility = () => {
    const heroRect = hero.getBoundingClientRect();
    setVisible(heroRect.bottom <= 0);
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility);
})();
