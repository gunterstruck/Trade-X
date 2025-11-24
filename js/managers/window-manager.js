/**
 * WindowManager - Manages draggable window functionality
 * Allows the Trade-X interface to be displayed as a movable window
 */

const WindowManager = {
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    windowElement: null,
    titlebarElement: null,
    isMinimized: false,
    isMaximized: false,

    // Store original position for maximize/restore
    originalPosition: { x: 0, y: 0, width: 0, height: 0 },

    /**
     * Initialize the window manager
     */
    init() {
        console.log('WindowManager: Initializing...');
        this.windowElement = document.getElementById('draggable-window');
        this.titlebarElement = document.getElementById('window-titlebar');

        if (!this.windowElement || !this.titlebarElement) {
            console.error('WindowManager: Required elements not found', {
                window: this.windowElement,
                titlebar: this.titlebarElement
            });
            return;
        }

        console.log('WindowManager: Elements found, setting up listeners');
        this.setupEventListeners();
        this.loadWindowPosition();
        this.ensureWindowInViewport();
        console.log('WindowManager: Initialized successfully');
    },

    /**
     * Setup all event listeners for dragging
     */
    setupEventListeners() {
        // Drag functionality
        this.titlebarElement.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // Touch support for mobile
        this.titlebarElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Window control buttons
        const minimizeBtn = document.getElementById('window-minimize-btn');
        const maximizeBtn = document.getElementById('window-maximize-btn');
        const closeBtn = document.getElementById('window-close-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', this.minimize.bind(this));
        }
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', this.toggleMaximize.bind(this));
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', this.close.bind(this));
        }

        // Prevent text selection while dragging
        this.titlebarElement.addEventListener('selectstart', (e) => e.preventDefault());

        // Save position on window unload
        window.addEventListener('beforeunload', this.saveWindowPosition.bind(this));
    },

    /**
     * Mouse drag start
     */
    onDragStart(e) {
        if (this.isMaximized) return; // Don't allow dragging when maximized

        this.isDragging = true;
        const rect = this.windowElement.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;

        this.titlebarElement.style.cursor = 'grabbing';
        this.windowElement.style.transition = 'none'; // Disable transition during drag
    },

    /**
     * Mouse drag move
     */
    onDrag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const x = e.clientX - this.dragOffsetX;
        const y = e.clientY - this.dragOffsetY;

        this.setWindowPosition(x, y);
    },

    /**
     * Mouse drag end
     */
    onDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.titlebarElement.style.cursor = 'grab';
        this.windowElement.style.transition = ''; // Re-enable transitions

        this.saveWindowPosition();
        this.ensureWindowInViewport();
    },

    /**
     * Touch drag start
     */
    onTouchStart(e) {
        if (this.isMaximized) return;

        this.isDragging = true;
        const touch = e.touches[0];
        const rect = this.windowElement.getBoundingClientRect();
        this.dragOffsetX = touch.clientX - rect.left;
        this.dragOffsetY = touch.clientY - rect.top;

        this.windowElement.style.transition = 'none';
    },

    /**
     * Touch drag move
     */
    onTouchMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.clientX - this.dragOffsetX;
        const y = touch.clientY - this.dragOffsetY;

        this.setWindowPosition(x, y);
    },

    /**
     * Touch drag end
     */
    onTouchEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.windowElement.style.transition = '';

        this.saveWindowPosition();
        this.ensureWindowInViewport();
    },

    /**
     * Set window position
     */
    setWindowPosition(x, y) {
        this.windowElement.style.left = `${x}px`;
        this.windowElement.style.top = `${y}px`;
        this.windowElement.style.transform = 'none'; // Remove center transform
    },

    /**
     * Minimize window
     */
    minimize() {
        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            this.windowElement.classList.add('minimized');
        } else {
            this.windowElement.classList.remove('minimized');
        }
    },

    /**
     * Toggle maximize/restore window
     */
    toggleMaximize() {
        this.isMaximized = !this.isMaximized;

        if (this.isMaximized) {
            // Save current position
            const rect = this.windowElement.getBoundingClientRect();
            this.originalPosition = {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            };

            this.windowElement.classList.add('maximized');
            this.windowElement.style.left = '0';
            this.windowElement.style.top = '0';
            this.windowElement.style.transform = 'none';
        } else {
            // Restore original position
            this.windowElement.classList.remove('maximized');
            this.setWindowPosition(this.originalPosition.x, this.originalPosition.y);
        }

        // Update maximize button icon
        const maximizeBtn = document.getElementById('window-maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.textContent = this.isMaximized ? '❐' : '□';
            maximizeBtn.title = this.isMaximized ? 'Wiederherstellen' : 'Maximieren';
        }
    },

    /**
     * Close window (hide it)
     */
    close() {
        if (confirm('Trade-X Fenster schließen?')) {
            this.windowElement.style.display = 'none';
        }
    },

    /**
     * Ensure window stays within viewport
     */
    ensureWindowInViewport() {
        const rect = this.windowElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = rect.left;
        let y = rect.top;
        let adjusted = false;

        // Check right edge
        if (rect.right > viewportWidth) {
            x = viewportWidth - rect.width - 20;
            adjusted = true;
        }

        // Check left edge
        if (x < 20) {
            x = 20;
            adjusted = true;
        }

        // Check bottom edge
        if (rect.bottom > viewportHeight) {
            y = viewportHeight - rect.height - 20;
            adjusted = true;
        }

        // Check top edge (ensure titlebar is visible)
        if (y < 20) {
            y = 20;
            adjusted = true;
        }

        if (adjusted) {
            this.setWindowPosition(x, y);
        }
    },

    /**
     * Save window position to localStorage
     */
    saveWindowPosition() {
        if (this.isMaximized) return; // Don't save maximized position

        const rect = this.windowElement.getBoundingClientRect();
        const position = {
            x: rect.left,
            y: rect.top
        };

        try {
            localStorage.setItem('tradeXWindowPosition', JSON.stringify(position));
        } catch (error) {
            console.warn('Failed to save window position:', error);
        }
    },

    /**
     * Load window position from localStorage
     */
    loadWindowPosition() {
        try {
            const saved = localStorage.getItem('tradeXWindowPosition');
            if (saved) {
                const position = JSON.parse(saved);
                this.setWindowPosition(position.x, position.y);
            }
        } catch (error) {
            console.warn('Failed to load window position:', error);
        }
    },

    /**
     * Reset window to center
     */
    resetToCenter() {
        this.windowElement.style.left = '50%';
        this.windowElement.style.top = '50%';
        this.windowElement.style.transform = 'translate(-50%, -50%)';
        this.saveWindowPosition();
    }
};

// Note: WindowManager will be initialized in index.html after other managers
// This prevents initialization order issues
