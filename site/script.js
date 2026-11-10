document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggle-dark-mode");
  const body = document.body;
  const wordmark = document.getElementById("wordmark");
  const favicon = document.getElementById("favicon");

  // Helper function to toggle dark mode
  const setDarkMode = (isDark) => {
    body.classList.toggle("dark", isDark);
    if (wordmark) {
      wordmark.src = isDark
        ? "personal-website-v3-assets/images/wordmarks/wordmark_dark.svg"
        : "personal-website-v3-assets/images/wordmarks/wordmark_light.svg";
    }
    favicon.href = isDark
      ? "/personal-website-v3-assets/images/favicon/favicon-dark.ico"
      : "/personal-website-v3-assets/images/favicon/favicon-light.ico";
    localStorage.setItem("darkMode", isDark);
  };

  // New: update copyright year in the footer
  const updateYear = () => {
    const yearEl = document.getElementById("year");
    if (!yearEl) return;
    const now = new Date();
    yearEl.textContent = now.getFullYear();
  };

  // Initialize dark mode based on stored preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (toggle) {
    toggle.checked = isDarkMode;
    setDarkMode(isDarkMode);

    // Add event listener for toggle
    toggle.addEventListener("change", () => setDarkMode(toggle.checked));
  }

  // Call the year updater
  updateYear();

  // Randomly select a GIF for the error page
  const errorGif = document.querySelector(".error-gif");
  if (errorGif) {
    const gifLinks = [
      "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3ByNGhod2pyZTkzMm56bnp3cjkxMjNoN3hzcjQyYWtod3o0dXZydSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UFGGh3jilI1ZRjozP3/giphy.webp",
      "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHZ1amRsdjR5bHZmaXpmOXd6d2kyM2FrM3F1eG1zbG56Z3Fxa2tjeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/320CTKqBlnDgihL0GK/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWx0eW5kMDJ6ZXgxMGp6MGI1OGQ4Z2o2c3Qxb2pwdHBmeGYxMzA1ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qZgHBlenHa1zKqy6Zn/giphy.gif"
    ];
    const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];
    errorGif.src = randomGif;
  }
});

// Handle sequential animations
window.addEventListener("load", () => {
  const elements = [
    document.getElementById("portrait-pic"),
    document.getElementById("wordmark"),
    document.getElementById("description"),
    document.getElementById("link-stack"),
  ].filter(Boolean); // Filter out null elements

  elements.forEach((el, index) => {
    setTimeout(() => el.classList.add("loaded"), index * 500);
  });
});