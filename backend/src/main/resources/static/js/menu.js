document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');
  const header = document.querySelector('.main-header');
  const body = document.body;

  // Lógica para o menu hambúrguer (existing and new combined)
  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburgerMenu.toggleAttribute('aria-expanded');
      body.classList.toggle('no-scroll'); // Add/remove no-scroll for body
    });

    // Assuming navLinks also has a close button or clicking outside closes it
    // If there's a specific close button, its logic should be here
    // For now, let's assume clicking a nav link closes it (common pattern)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburgerMenu.removeAttribute('aria-expanded');
        body.classList.remove('no-scroll');
      });
    });
  }

  // Lógica para o cabeçalho com rolagem (existing)
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Lógica para fade-in sections (new from menu.html)
  const sections = document.querySelectorAll('.fade-in-section');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.1
  });

  sections.forEach(section => {
    observer.observe(section);
  });
});