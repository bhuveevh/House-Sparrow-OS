document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const desktop = document.getElementById('desktop');
    const iconsContainer = document.getElementById('icons-container');
    const osNameTrigger = document.getElementById('os-name-trigger');

    const popupModal = document.getElementById('popup-modal');
    const popupHeader = popupModal.querySelector('.popup-header');
    const closePopupButton = document.getElementById('close-popup');
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const popupIframe = document.getElementById('popup-iframe');
    const popupTitle = document.getElementById('popup-title');
    const loadingBar = popupModal.querySelector('.loading-bar');

    const settingsModal = document.getElementById('settings-modal');
    const settingsHeader = document.getElementById('settings-header');
    const closeSettingsBtn = document.getElementById('close-settings');
    const addSiteForm = document.getElementById('add-site-form');
    const wallpaperOptionsContainer = document.getElementById('wallpaper-options');
    const wallpaperUpload = document.getElementById('wallpaper-upload');
    const iconUploadInput = document.getElementById('icon-upload');

    // --- Initial Data and State Variables ---
    const defaultSites = [
        { id: 'site_1', name: 'Google', url: 'https://www.google.com/webhp?igu=1', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
        { id: 'site_2', name: 'YouTube', url: 'https://www.youtube.com', icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
    ];
    // Replaced Pixabay page with direct image URL
    const wallpapers = [
        'https://cdn.pixabay.com/photo/2024/05/18/17/25/mountain-lake-9278324_1280.jpg',
        'https://source.unsplash.com/random/1920x1080?city,night',
        'https://source.unsplash.com/random/1920x1080?space,galaxy',
        'https://source.unsplash.com/random/1920x1080?abstract,art'
    ];

    let sites = JSON.parse(localStorage.getItem('sparrowOS_sites')) || defaultSites;
    let activeSite = null;
    let isMaximized = false;
    let originalSize, originalPosition;

    // --- Core Functions ---
    const saveSites = () => localStorage.setItem('sparrowOS_sites', JSON.stringify(sites));
    
    const setWallpaper = (url) => {
        desktop.style.backgroundImage = `url(${url})`;
        localStorage.setItem('sparrowOS_wallpaper', url);
        document.querySelector('.wallpaper-thumb.selected')?.classList.remove('selected');
        const index = wallpapers.indexOf(url);
        if (index > -1) {
            wallpaperOptionsContainer.children[index]?.classList.add('selected');
        }
    };

    const renderIcons = () => {
        iconsContainer.innerHTML = '';
        sites.forEach(site => {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'icon';
            iconDiv.innerHTML = `<img src="${site.icon}" alt="${site.name}"><p>${site.name}</p>`;
            iconDiv.addEventListener('click', () => openSite(site));
            iconDiv.addEventListener('contextmenu', (e) => removeSite(e, site));
            iconsContainer.appendChild(iconDiv);
        });
    };

    const openSite = (site) => {
        if (activeSite?.id === site.id && popupModal.classList.contains('hidden')) {
            popupModal.classList.remove('hidden'); // Restore minimized window
            return;
        }
        activeSite = site;
        popupTitle.textContent = site.name;
        popupModal.classList.remove('hidden');
        loadingBar.classList.add('loading');
        // A small delay ensures the iframe exists before setting src
        setTimeout(() => { popupIframe.src = site.url; }, 50);
    };
    
    const removeSite = (e, site) => {
        e.preventDefault();
        if (confirm(`Are you sure you want to remove "${site.name}"?`)) {
            sites = sites.filter(s => s.id !== site.id);
            saveSites();
            renderIcons();
            if (activeSite?.id === site.id) closeApp();
        }
    };
    
    const closeApp = () => {
        popupModal.classList.add('hidden');
        popupIframe.src = 'about:blank';
        activeSite = null;
    };

    // --- Event Listeners ---
    closePopupButton.addEventListener('click', closeApp);
    minimizeBtn.addEventListener('click', () => popupModal.classList.add('hidden'));

    maximizeBtn.addEventListener('click', () => {
        if (isMaximized) {
            popupModal.classList.remove('maximized');
        } else {
            popupModal.classList.add('maximized');
        }
        isMaximized = !isMaximized;
    });

    popupIframe.addEventListener('load', () => loadingBar.classList.remove('loading'));

    osNameTrigger.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    // Wallpaper Upload Listener
    wallpaperUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                setWallpaper(dataUrl); // This will also save it to localStorage
            };
            reader.readAsDataURL(file);
        }
    });

    addSiteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const siteName = document.getElementById('site-name').value;
        const siteUrl = document.getElementById('site-url').value;
        const iconUrl = document.getElementById('icon-url').value;
        const iconFile = iconUploadInput.files[0];

        const createNewSite = (icon) => {
            sites.push({ id: 'site_' + Date.now(), name: siteName, url: siteUrl, icon });
            saveSites();
            renderIcons();
            addSiteForm.reset();
            iconUploadInput.value = ''; // Clear file input
            settingsModal.classList.add('hidden');
        };

        if (iconFile) {
            const reader = new FileReader();
            reader.onload = (event) => createNewSite(event.target.result);
            reader.readAsDataURL(iconFile);
        } else if (iconUrl) {
            createNewSite(iconUrl);
        } else {
            const domain = new URL(siteUrl).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            createNewSite(faviconUrl);
        }
    });
    
    // --- Draggable Windows (Improved) ---
    const makeDraggable = (modal, header) => {
        let isDragging = false, offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn') || modal.classList.contains('maximized')) return;
            
            isDragging = true;
            offsetX = e.clientX - modal.offsetLeft;
            offsetY = e.clientY - modal.offsetTop;
            
            // This is key: remove transform for smooth direct positioning
            if (modal.style.transform !== 'none') modal.style.transform = 'none';

            header.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            modal.style.left = `${e.clientX - offsetX}px`;
            modal.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            header.style.cursor = 'move';
            document.body.style.cursor = 'default';
        });
    };

    // --- Initialization ---
    wallpapers.forEach(url => {
        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumb';
        thumb.style.backgroundImage = `url(${url})`;
        thumb.addEventListener('click', () => setWallpaper(url));
        wallpaperOptionsContainer.appendChild(thumb);
    });
    
    const savedWallpaper = localStorage.getItem('sparrowOS_wallpaper') || wallpapers[0];
    setWallpaper(savedWallpaper);
    renderIcons();
    makeDraggable(popupModal, popupHeader);
    makeDraggable(settingsModal, settingsHeader);
});
