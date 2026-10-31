// Nav background on scroll
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll);
onScroll();

// Mobile menu
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
toggle.addEventListener("click", () => {
  toggle.classList.toggle("open");
  links.classList.toggle("open");
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    toggle.classList.remove("open");
    links.classList.remove("open");
  })
);

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Contact form: sends each message to Kerr's inbox via FormSubmit (formsubmit.co)
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  data._subject = `New ${data.type} enquiry from ${data.name}`;
  data._template = "table";
  btn.disabled = true;
  btn.textContent = "Sending…";
  note.textContent = "";
  try {
    const res = await fetch("https://formsubmit.co/ajax/thedakwahenepodcast@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || json.success === false || json.success === "false") throw new Error(json.message);
    note.textContent = "Thank you! Your message has been sent. I'll be in touch soon.";
    form.reset();
  } catch {
    // Keep the visitor's message: offer it pre-filled in their own email app
    const mailto = `mailto:thedakwahenepodcast@gmail.com?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(`${data.message}\n\n${data.name}\n${data.email}`)}`;
    note.innerHTML = `Sorry, the form couldn't send your message just now. <a href="${mailto}">Send it by email instead</a>, it's already written for you.`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Message";
  }
});

// "Book for Speaking" etc. pre-select the enquiry type
document.querySelectorAll("[data-enquiry]").forEach((a) =>
  a.addEventListener("click", () => (form.elements.type.value = a.dataset.enquiry))
);

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Podcast episode player (one click handler on the list, so episodes loaded from the feed work too)
const episodeList = document.querySelector(".episodes");
const audio = new Audio();
let current = null;
const setPlaying = (li, playing) => {
  const btn = li.querySelector(".episodes__play");
  btn.textContent = playing ? "❚❚" : "▶";
  btn.classList.toggle("playing", playing);
  btn.setAttribute("aria-label", btn.getAttribute("aria-label").replace(/^(Play|Pause)/, playing ? "Pause" : "Play"));
};
episodeList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-src]");
  if (!li) return;
  if (e.target.closest(".episodes__play")) {
    if (current === li) {
      audio.paused ? audio.play() : audio.pause();
      return;
    }
    if (current) {
      setPlaying(current, false);
      current.classList.remove("active");
    }
    current = li;
    li.classList.add("active");
    audio.src = li.dataset.src;
    audio.play();
  } else if (e.target.closest(".episodes__progress") && current === li && audio.duration) {
    const rect = e.target.closest(".episodes__progress").getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  }
});
audio.addEventListener("play", () => current && setPlaying(current, true));
audio.addEventListener("pause", () => current && setPlaying(current, false));
audio.addEventListener("timeupdate", () => {
  if (current && audio.duration)
    current.querySelector(".episodes__progress span").style.width = (audio.currentTime / audio.duration) * 100 + "%";
});

// Latest 3 episodes from the podcast RSS feed; the episodes in the HTML stay if the feed can't be reached
(async () => {
  try {
    const res = await fetch("https://anchor.fm/s/fd09308c/podcast/rss");
    const xml = new DOMParser().parseFromString(await res.text(), "text/xml");
    const items = [...xml.querySelectorAll("item")]
      .filter((item) => item.querySelector("enclosure"))
      .slice(0, 3);
    if (!items.length || current) return;
    episodeList.replaceChildren(
      ...items.map((item) => {
        const raw = item.querySelector("title").textContent.trim();
        const [, no, title] = raw.match(/^episode\s*(\d+)\s*[_:\-–]?\s*(.*)$/i) || [, "", raw];
        const [h, m, sec] = (item.getElementsByTagName("itunes:duration")[0]?.textContent || "").split(":").map(Number).reverse().concat(0, 0, 0).slice(0, 3).reverse();
        const mins = Math.round(h * 60 + m + sec / 60);
        const li = document.createElement("li");
        li.dataset.src = item.querySelector("enclosure").getAttribute("url");
        li.innerHTML = `<span class="episodes__no"></span><span class="episodes__title"><small></small></span>
          <button type="button" class="episodes__play">▶</button><span class="episodes__progress"><span></span></span>`;
        li.querySelector(".episodes__no").textContent = no ? `EP. ${no}` : "NEW";
        li.querySelector(".episodes__title").prepend(title);
        li.querySelector("small").textContent = mins ? `${mins} min` : "";
        li.querySelector(".episodes__play").setAttribute("aria-label", `Play ${no ? `episode ${no}` : title}`);
        return li;
      })
    );
  } catch {}
})();
