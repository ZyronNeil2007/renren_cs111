/**
 * Lightbox / Fullscreen Image Viewer Modal
 * Pure Vanilla JavaScript — works seamlessly across all memory pages
 */
(function () {
    // Build Modal DOM elements once on DOM ready
    function initLightbox() {
        // Prevent double init
        if (document.getElementById('image-lightbox-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'image-lightbox-modal';
        modal.className = 'lightbox-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Full screen photo viewer');

        modal.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-container">
                <button type="button" class="lightbox-close" aria-label="Close full screen view" title="Close (Esc)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="lightbox-content">
                    <img class="lightbox-img" src="" alt="Expanded preview">
                    <div class="lightbox-caption"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const imgEl = modal.querySelector('.lightbox-img');
        const captionEl = modal.querySelector('.lightbox-caption');
        const closeBtn = modal.querySelector('.lightbox-close');
        const backdrop = modal.querySelector('.lightbox-backdrop');

        function openModal(img) {
            // Find appropriate caption text from nearest figcaption if present, or alt text
            let captionHTML = '';
            const figure = img.closest('figure');
            if (figure) {
                const figcaption = figure.querySelector('figcaption');
                if (figcaption) {
                    captionHTML = figcaption.innerHTML;
                }
            }
            if (!captionHTML && img.alt) {
                captionHTML = `<strong>${img.alt}</strong>`;
            }

            imgEl.src = img.currentSrc || img.src;
            imgEl.alt = img.alt || 'Full screen preview';

            if (captionHTML) {
                captionEl.innerHTML = captionHTML;
                captionEl.style.display = 'block';
            } else {
                captionEl.style.display = 'none';
            }

            modal.classList.add('active');
            document.body.classList.add('lightbox-open');
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.classList.remove('lightbox-open');
            setTimeout(() => {
                if (!modal.classList.contains('active')) {
                    imgEl.src = '';
                }
            }, 300);
        }

        // Close handlers
        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        // Delegate click for content images (excluding small folder icon images on index.html)
        document.addEventListener('click', (e) => {
            const img = e.target.closest('img');
            if (!img) return;

            // Don't expand folder icons or modal's own image
            if (img.classList.contains('folder-card-icon') || img.classList.contains('lightbox-img')) {
                return;
            }

            // Expandable targets: .photo-card img, figure img, or any content image
            if (img.closest('.photo-card') || img.closest('figure') || img.closest('.recipe-card') || img.closest('.movie-card') || img.closest('.song-card')) {
                e.preventDefault();
                openModal(img);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLightbox);
    } else {
        initLightbox();
    }
})();
