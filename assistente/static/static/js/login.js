document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and add to clicked button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Hide all tab contents and show the active one
      tabContents.forEach(content => content.classList.add('hidden'));
      const targetTabId = button.dataset.tab;
      document.getElementById(targetTabId).classList.remove('hidden');
    });
  });

  // Script from login.html for fake login form submission
  document.getElementById('fake-login-form').addEventListener('submit', function(event) {
      event.preventDefault();
      window.location.href = 'principal.html';
  });
});