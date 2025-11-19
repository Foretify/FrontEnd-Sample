// Main application controller
class App {
    constructor() {
        this.currentPage = 'instructions';
        this.pages = {};
        this.init();
    }

    async init() {
        // Initialize all page modules
        this.pages.instructions = new InstructionsPage();
        this.pages.upload = new UploadPage();
        this.pages.compare = new ComparePage();

        // Initialize each page
        await this.pages.instructions.init();
        this.pages.upload.init();
        this.pages.compare.init();

        // Setup navigation
        this.setupNavigation();
        
        // Load initial page
        this.loadPage('instructions');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = link.getAttribute('data-page');
                this.loadPage(pageName);
                
                // Update active state on nav links
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    loadPage(pageName) {
        // Call onPageHide for current page
        if (this.currentPage && this.pages[this.currentPage]) {
            this.pages[this.currentPage].onPageHide();
        }

        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));

        // Show selected page
        const selectedPage = document.getElementById(pageName);
        if (selectedPage) {
            selectedPage.classList.add('active');
            this.currentPage = pageName;

            // Call onPageShow for new page
            if (this.pages[pageName]) {
                this.pages[pageName].onPageShow();
            }
        }
    }

    getPage(pageName) {
        return this.pages[pageName];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
