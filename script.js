document.addEventListener('DOMContentLoaded', () => {
    // --- Global Selections & State ---
    const desktop = document.getElementById('desktop');
    const iconsContainer = document.getElementById('icons-container');
    const windowContainer = document.getElementById('window-container');
    const tilingPreview = document.getElementById('tiling-preview');
    let highestZIndex = 1000;
    let sites = [];

    // --- Data Management ---
    const defaultSites = [
        { id: 'site_1', name: 'Google', url: 'https://www.google.com/webhp?igu=1', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
        { id: 'site_2', name: 'YouTube', url: 'https://www.youtube.com', icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
    ];
    const wallpapers = [
        'https://cdn.pixabay.com/photo/2024/05/18/17/25/mountain-lake-9278324_1280.jpg',
        'https://source.unsplash.com/random/1920x1080?city,night',
        'https://source.unsplash.com/random/1920x1080?space,galaxy'
    ];
    const saveSites = () => localStorage.setItem('sparrowOS_sites', JSON.stringify(sites));
    const loadSites = () => JSON.parse(localStorage.getItem('sparrowOS_sites')) || defaultSites;

    // --- Core UI Functions ---
    const setWallpaper = (url) => {
        desktop.style.backgroundImage = `url(${url})`;
        localStorage.setItem('sparrowOS_wallpaper', url);
        document.querySelectorAll('.wallpaper-thumb.selected').forEach(t => t.classList.remove('selected'));
        const index = wallpapers.indexOf(url);
        if (index > -1) {
            document.querySelector(`#wallpaper-options .wallpaper-thumb[data-url='${url}']`)?.classList.add('selected');
        }
    };

    const renderIcons = () => {
        iconsContainer.innerHTML = '';
        sites.forEach(site => {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'icon';
            iconDiv.innerHTML = `<img src="${site.icon}" alt="${site.name}" onerror="this.src='https://source.unsplash.com/random/60x60?technology'"><p>${site.name}</p>`;
            iconDiv.addEventListener('click', () => createWindowForSite(site));
            iconDiv.addEventListener('contextmenu', (e) => removeSite(e, site));
            iconsContainer.appendChild(iconDiv);
        });
    };

    const removeSite = (e, site) => {
        e.preventDefault();
        if (confirm(`Are you sure you want to remove "${site.name}"?`)) {
            sites = sites.filter(s => s.id !== site.id);
            saveSites();
            renderIcons();
        }
    };

    // --- Window Creation and Management ---
    const focusWindow = (windowEl) => {
        document.querySelectorAll('.modal.focused').forEach(el => el.classList.remove('focused'));
        windowEl.classList.add('focused');
        windowEl.style.zIndex = ++highestZIndex;
    };

    const createWindowForSite = (site) => {
        const windowEl = document.createElement('div');
        windowEl.className = 'modal app-window';
        windowEl.innerHTML = `
            <div class="popup-header">
                <span class="popup-title">${site.name}</span>
                <div class="loading-bar"></div>
                <div class="window-controls">
                    <button class="control-btn minimize-btn" title="Minimize">-</button>
                    <button class="control-btn maximize-btn" title="Maximize">□</button>
                    <button class="control-btn close-btn" title="Close">×</button>
                </div>
            </div>
            <div class="popup-content"><iframe class="popup-iframe" src="about:blank"></iframe></div>
        `;
        const openWindowsCount = windowContainer.children.length;
        windowEl.style.top = `${30 + openWindowsCount * 30}px`;
        windowEl.style.left = `${50 + openWindowsCount * 30}px`;
        windowContainer.appendChild(windowEl);
        focusWindow(windowEl);

        const iframe = windowEl.querySelector('.popup-iframe');
        const loadingBar = windowEl.querySelector('.loading-bar');
        loadingBar.classList.add('loading');
        iframe.onload = () => loadingBar.classList.remove('loading');
        iframe.src = site.url;

        windowEl.querySelector('.close-btn').onclick = () => windowEl.remove();
        windowEl.querySelector('.minimize-btn').onclick = () => windowEl.classList.add('hidden');
        windowEl.querySelector('.maximize-btn').onclick = () => {
            if (document.fullscreenElement === windowEl) {
                document.exitFullscreen();
            } else {
                windowEl.requestFullscreen().catch(err => console.error(`Fullscreen Error: ${err.message}`));
            }
        };
        makeDraggableAndSnappable(windowEl, windowEl.querySelector('.popup-header'));
        windowEl.addEventListener('mousedown', () => focusWindow(windowEl), true);
    };

    // --- Advanced Dragging & Tiling Logic ---
    const makeDraggableAndSnappable = (modal, header) => {
        let isDragging = false, offsetX, offsetY;
        header.onmousedown = (e) => {
            if (e.target.closest('.control-btn') || document.fullscreenElement) return;
            isDragging = true;
            offsetX = e.clientX - modal.offsetLeft;
            offsetY = e.clientY - modal.offsetTop;
            modal.style.transition = 'none'; // Disable transition while dragging for performance
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            modal.style.left = `${e.clientX - offsetX}px`;
            modal.style.top = `${e.clientY - offsetY}px`;

            tilingPreview.style.display = 'none';
            if (e.clientY < 5) { // Snap Top (Maximize)
                tilingPreview.style.cssText = 'display: block; top: 0; left: 0; width: 100%; height: 100%;';
            } else if (e.clientX < 5) { // Snap Left
                tilingPreview.style.cssText = 'display: block; top: 0; left: 0; width: 50%; height: 100%;';
            } else if (e.clientX > window.innerWidth - 5) { // Snap Right
                tilingPreview.style.cssText = 'display: block; top: 0; right: 0; left: auto; width: 50%; height: 100%;';
            }
        };

        document.onmouseup = (e) => {
            if (!isDragging) return;
            isDragging = false;
            modal.style.transition = 'all 0.2s ease'; // Re-enable transition

            if (tilingPreview.style.display === 'block') {
                modal.style.top = tilingPreview.style.top;
                modal.style.left = tilingPreview.style.left;
                modal.style.width = tilingPreview.style.width;
                modal.style.height = tilingPreview.style.height;
                tilingPreview.style.display = 'none';
            }
        };
    };

    // --- Settings Modal Setup ---
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('os-name-trigger').onclick = () => {
        settingsModal.classList.remove('hidden');
        focusWindow(settingsModal);
    };
    document.getElementById('close-settings').onclick = () => settingsModal.classList.add('hidden');
    makeDraggableAndSnappable(settingsModal, document.getElementById('settings-header'));
    settingsModal.addEventListener('mousedown', () => focusWindow(settingsModal), true);

    document.getElementById('wallpaper-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setWallpaper(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    document.getElementById('add-site-form').onsubmit = (e) => {
        e.preventDefault();
        const siteName = document.getElementById('site-name').value;
        const siteUrl = document.getElementById('site-url').value;
        let iconUrl = document.getElementById('icon-url').value;
        const iconFile = document.getElementById('icon-upload').files[0];

        const addNewSite = (icon) => {
            sites.push({ id: 'site_' + Date.now(), name: siteName, url: siteUrl, icon });
            saveSites(); renderIcons();
            e.target.reset(); document.getElementById('icon-upload').value = '';
            settingsModal.classList.add('hidden');
        };

        if (iconFile) {
            const reader = new FileReader();
            reader.onload = (event) => addNewSite(event.target.result);
            reader.readAsDataURL(iconFile);
        } else {
            if (!iconUrl) {
                try { iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(siteUrl).hostname}&sz=64`; }
                catch { iconUrl = ''; }
            }
            addNewSite(iconUrl);
        }
    };

    // --- Initialization ---
    const wallpaperOptionsContainer = document.getElementById('wallpaper-options');
    wallpapers.forEach(url => {
        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumb';
        thumb.style.backgroundImage = `url(${url})`;
        thumb.dataset.url = url; // Store URL for click handler
        thumb.onclick = () => setWallpaper(url);
        wallpaperOptionsContainer.appendChild(thumb);
    });

    sites = loadSites();
    setWallpaper(localStorage.getItem('sparrowOS_wallpaper') || wallpapers[0]);
    renderIcons();
});
