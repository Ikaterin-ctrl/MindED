document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const headerNav = document.querySelector('.header-nav');
    const navCloseBtn = document.querySelector('.nav-close-btn');

    console.log('hamburgerMenu:', hamburgerMenu);
    console.log('headerNav:', headerNav);
    console.log('navCloseBtn:', navCloseBtn);

    if (hamburgerMenu && headerNav && navCloseBtn) {
        hamburgerMenu.addEventListener('click', () => {
            console.log('Hamburger menu clicked');
            headerNav.classList.add('active');
            document.body.classList.add('no-scroll');
        });

        navCloseBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            headerNav.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    }
});
