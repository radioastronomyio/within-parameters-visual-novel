(function () {
  const data = window.SFX_PACK_INDEX;
  const grid = document.querySelector("#sound-grid");
  const categoryRow = document.querySelector("#category-row");
  const search = document.querySelector("#search");
  const categoryFilter = document.querySelector("#category-filter");
  const visibleCount = document.querySelector("#visible-count");
  const featuredTitle = document.querySelector("#featured-title");
  const featuredMeta = document.querySelector("#featured-meta");
  const featuredWaveform = document.querySelector("#featured-waveform");
  const playFeatured = document.querySelector("#play-featured");
  let selected = data.sounds[0];
  let currentAudio = null;

  document.querySelector("#stat-wav").textContent = data.stats.wav;
  document.querySelector("#stat-cat").textContent = data.stats.categories;

  categoryFilter.innerHTML = [`<option value="all">All categories</option>`]
    .concat(data.categories.map((category) => `<option value="${category.id}">${category.name}</option>`))
    .join("");

  categoryRow.innerHTML = data.categories.map((category) => {
    const count = data.sounds.filter((sound) => sound.category === category.id).length;
    return `<article class="category-card">
      <strong><i style="background:${category.color}"></i>${category.name} <span>${count}</span></strong>
      <p>${category.use}</p>
    </article>`;
  }).join("");

  function play(sound) {
    selected = sound;
    featuredTitle.textContent = sound.title;
    featuredMeta.textContent = `${sound.categoryName} / ${sound.durationMs} ms / ${sound.sampleRate} Hz`;
    featuredWaveform.src = sound.waveform;
    featuredWaveform.alt = `${sound.title} waveform`;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(sound.file);
    currentAudio.volume = 0.8;
    currentAudio.play().catch(() => {
      featuredMeta.textContent = "Click once to enable browser audio";
    });
  }

  function matches(sound) {
    const term = search.value.trim().toLowerCase();
    const categoryOk = categoryFilter.value === "all" || sound.category === categoryFilter.value;
    const haystack = [sound.id, sound.title, sound.categoryName, sound.recommendedUse].join(" ").toLowerCase();
    return categoryOk && (!term || haystack.includes(term));
  }

  function render() {
    const visible = data.sounds.filter(matches);
    visibleCount.textContent = visible.length;
    const fragment = document.createDocumentFragment();
    visible.forEach((sound) => {
      const card = document.createElement("article");
      card.className = "sound-card";
      card.innerHTML = `
        <header>
          <button class="play-button" type="button" aria-label="Play ${sound.title}" style="color:${sound.color};border-color:${sound.color}"><span></span></button>
          <div class="sound-title">
            <strong>${sound.title}</strong>
            <span>${sound.categoryName} / ${sound.durationMs} ms</span>
          </div>
        </header>
        <img src="${sound.waveform}" alt="${sound.title} waveform">
      `;
      card.querySelector("button").addEventListener("click", () => play(sound));
      fragment.appendChild(card);
    });
    grid.replaceChildren(fragment);
  }

  search.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  playFeatured.addEventListener("click", () => play(selected));
  selected = data.sounds[0];
  featuredTitle.textContent = selected.title;
  featuredMeta.textContent = `${selected.categoryName} / ${selected.durationMs} ms / ${selected.sampleRate} Hz`;
  featuredWaveform.src = selected.waveform;
  featuredWaveform.alt = `${selected.title} waveform`;
  render();
})();
