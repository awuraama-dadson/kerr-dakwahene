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

// Podcast episode player
const audio = new Audio();
let current = null;
const setPlaying = (li, playing) => {
  const btn = li.querySelector(".episodes__play");
  btn.textContent = playing ? "❚❚" : "▶";
  btn.classList.toggle("playing", playing);
  btn.setAttribute("aria-label", btn.getAttribute("aria-label").replace(/^(Play|Pause)/, playing ? "Pause" : "Play"));
};
document.querySelectorAll(".episodes li[data-src]").forEach((li) => {
  li.querySelector(".episodes__play").addEventListener("click", () => {
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
  });
  li.querySelector(".episodes__progress").addEventListener("click", (e) => {
    if (current !== li || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
});
audio.addEventListener("play", () => current && setPlaying(current, true));
audio.addEventListener("pause", () => current && setPlaying(current, false));
audio.addEventListener("timeupdate", () => {
  if (current && audio.duration)
    current.querySelector(".episodes__progress span").style.width = (audio.currentTime / audio.duration) * 100 + "%";
});
