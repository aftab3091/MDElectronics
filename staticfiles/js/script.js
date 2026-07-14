(function () {
    // Theme toggle and language switcher logic
    // Running theme check immediately to prevent flicker
    const savedTheme = localStorage.getItem('md_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
    } else {
        document.documentElement.classList.remove('light-theme');
    }

    // Running language check immediately
    const savedLang = localStorage.getItem('md_lang') || 'en';
    document.documentElement.setAttribute('lang', savedLang);

    document.addEventListener('DOMContentLoaded', () => {
        // --- Theme Switcher Logic ---
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const body = document.body;

        // Apply initial class on body as well
        if (localStorage.getItem('md_theme') === 'light') {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const isLight = body.classList.toggle('light-theme');
                document.documentElement.classList.toggle('light-theme', isLight);
                const themeName = isLight ? 'light' : 'dark';
                localStorage.setItem('md_theme', themeName);
            });
        }

        // --- Mobile Navigation Toggle ---
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        if (navToggle && navLinks) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navToggle.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                    navToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }

        // --- Language Switcher Logic ---
        const langSelector = document.getElementById('langSelector');
        
        function applyLanguage(lang) {
            // Set lang attribute
            document.documentElement.setAttribute('lang', lang);
            localStorage.setItem('md_lang', lang);
            
            // Set active class on body
            body.classList.remove('lang-en', 'lang-te');
            body.classList.add('lang-' + lang);

            // Sync selector value if elements are present
            if (langSelector) {
                langSelector.value = lang;
            }
        }

        if (langSelector) {
            langSelector.addEventListener('change', (e) => {
                applyLanguage(e.target.value);
            });
        }

        // Apply language on load
        applyLanguage(savedLang);
    });
})();
