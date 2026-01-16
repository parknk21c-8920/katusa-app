// ===== App State =====
var currentChapter = null;
var currentSection = null;
var bookmarks = [];

// LocalStorage safety check
var storage = {
    getItem: function (key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: function (key, value) {
        try { localStorage.setItem(key, value); } catch (e) { }
    }
};

// Load initial bookmarks
try {
    var saved = storage.getItem('katusaBookmarks');
    bookmarks = saved ? JSON.parse(saved) : [];
} catch (e) {
    bookmarks = [];
}

// ===== DOM Elements =====
var chapterList, contentDisplay, welcomeScreen, searchResults, chapterTitle, chapterDesc;
var sectionButtons, sectionContent, searchInput, searchBtn, darkModeToggle, menuToggle;
var sidebar, sidebarOverlay, scrollTopBtn, loadingScreen, breadcrumb, breadcrumbChapter;
var breadcrumbSection, breadcrumbSep2, readingProgress, fontSizeToggle, fontSizePanel;
var printBtn, bookmarkChapterBtn, closeSearchBtn, prevSectionBtn, nextSectionBtn, quickNavGrid, downloadBtn;

function cacheElements() {
    chapterList = document.getElementById('chapterList');
    contentDisplay = document.getElementById('contentDisplay');
    welcomeScreen = document.getElementById('welcomeScreen');
    searchResults = document.getElementById('searchResults');
    chapterTitle = document.getElementById('chapterTitle');
    chapterDesc = document.getElementById('chapterDesc');
    sectionButtons = document.getElementById('sectionButtons');
    sectionContent = document.getElementById('sectionContent');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    darkModeToggle = document.getElementById('darkModeToggle');
    menuToggle = document.getElementById('menuToggle');
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebarOverlay');
    scrollTopBtn = document.getElementById('scrollTop');
    loadingScreen = document.getElementById('loadingScreen');
    breadcrumb = document.getElementById('breadcrumb');
    breadcrumbChapter = document.getElementById('breadcrumbChapter');
    breadcrumbSection = document.getElementById('breadcrumbSection');
    breadcrumbSep2 = document.getElementById('breadcrumbSep2');
    readingProgress = document.getElementById('readingProgress');
    fontSizeToggle = document.getElementById('fontSizeToggle');
    fontSizePanel = document.getElementById('fontSizePanel');
    printBtn = document.getElementById('printBtn');
    downloadBtn = document.getElementById('downloadBtn');
    bookmarkChapterBtn = document.getElementById('bookmarkChapterBtn');
    closeSearchBtn = document.getElementById('closeSearch');
    prevSectionBtn = document.getElementById('prevSection');
    nextSectionBtn = document.getElementById('nextSection');
    quickNavGrid = document.getElementById('quickNavGrid');
}

// Chapter Icons & Descriptions
var chapterIcons = ['📋', '📜', '👥', '📝', '💼', '🎯', '📦'];
var chapterDescriptions = [
    '규정의 목적, 참고 문헌, 용어 설명',
    '카투사 제도의 역사, 사명, 책임',
    '인력 인가, 자격 요건, 복무기간',
    '포상, 근무 평정, 휴가 및 외출',
    '보건, 감찰, PX 및 복지 시설',
    '훈련 목적, 책임, 교육 요건',
    '피복, 장비, 숙소 관리'
];

// ===== Initialize App =====
function init() {
    cacheElements();

    // Ensure data is loaded from window.chapters
    if (!window.chapters && typeof chapters !== 'undefined') {
        window.chapters = chapters;
    }

    try {
        renderChapterList();
        renderQuickNav();
        setupEventListeners();
        loadDarkModePreference();
        loadFontSizePreference();
        updateBookmarkList();
        calculateTotalSections();
    } catch (err) {
        console.log("App Init Error:", err);
    }

    // Safety Force Hide Loading
    setTimeout(function () {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(function () { loadingScreen.style.display = 'none'; }, 500);
        }
    }, 1000);
}

// ===== Rendering =====
function renderChapterList() {
    if (!chapterList || !window.chapters) return;
    var html = '';
    for (var i = 0; i < window.chapters.length; i++) {
        var ch = window.chapters[i];
        html += '<li class="chapter-item">' +
            '<button class="chapter-btn" onclick="selectChapter(' + i + ')">' +
            '<span class="chapter-icon">' + (chapterIcons[i] || '📄') + '</span>' +
            '<span>' + ch.title + '</span>' +
            '<span class="chapter-number">' + ch.sections.length + '</span>' +
            '</button></li>';
    }
    chapterList.innerHTML = html;
}

function renderQuickNav() {
    if (!quickNavGrid || !window.chapters) return;
    var html = '';
    for (var i = 0; i < window.chapters.length; i++) {
        var ch = window.chapters[i];
        html += '<button class="quick-btn" onclick="selectChapter(' + i + ')">' +
            '<span class="icon">' + (chapterIcons[i] || '📄') + '</span>' +
            '<span>' + ch.title.split('(')[0] + '</span></button>';
    }
    quickNavGrid.innerHTML = html;
}

function calculateTotalSections() {
    var el = document.getElementById('totalSections');
    if (!el || !window.chapters) return;
    var total = 0;
    for (var i = 0; i < window.chapters.length; i++) { total += window.chapters[i].sections.length; }
    el.textContent = total;
}

// ===== Core Logic =====
function selectChapter(index) {
    if (!window.chapters || !window.chapters[index]) return;
    currentChapter = index;
    currentSection = 0;

    var btns = document.querySelectorAll('.chapter-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (i === index) btns[i].classList.add('active');
    }

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
    if (contentDisplay) contentDisplay.style.display = 'block';

    if (chapterTitle) chapterTitle.textContent = window.chapters[index].title;
    if (chapterDesc) chapterDesc.textContent = chapterDescriptions[index] || '';

    if (breadcrumb) breadcrumb.style.display = 'flex';
    if (breadcrumbChapter) breadcrumbChapter.textContent = window.chapters[index].title;
    if (breadcrumbSep2) breadcrumbSep2.style.display = 'none';
    if (breadcrumbSection) breadcrumbSection.textContent = '';

    updateBookmarkBtn();
    renderSectionButtons(index);
    showSection(0);
    closeSidebar();
    window.scrollTo(0, 0);
}

function renderSectionButtons(chapterIndex) {
    if (!sectionButtons) return;
    var sections = window.chapters[chapterIndex].sections;
    var html = '';
    for (var i = 0; i < sections.length; i++) {
        html += '<button class="section-btn ' + (i === 0 ? 'active' : '') + '" onclick="showSection(' + i + ')">' +
            sections[i].title + '</button>';
    }
    sectionButtons.innerHTML = html;
}

function showSection(index) {
    if (currentChapter === null || !window.chapters[currentChapter].sections[index]) return;
    currentSection = index;
    var section = window.chapters[currentChapter].sections[index];

    var btns = document.querySelectorAll('.section-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (i === index) btns[i].classList.add('active');
    }

    if (breadcrumbSep2) breadcrumbSep2.style.display = 'inline';
    if (breadcrumbSection) breadcrumbSection.textContent = section.title;

    if (sectionContent) {
        sectionContent.innerHTML = '<h3>' + section.title + '</h3>' +
            '<div class="section-text">' + formatContent(section.content) + '</div>';
    }

    updateNavButtons();
    if (contentDisplay) contentDisplay.scrollIntoView();
}

function formatContent(content) {
    if (!content) return '<p>내용이 없습니다.</p>';
    var paragraphs = content.split('\n\n');
    var result = '';
    for (var i = 0; i < paragraphs.length; i++) {
        var para = paragraphs[i].trim();
        if (para.indexOf('-') === 0 || para.indexOf('•') === 0) {
            var items = para.split('\n');
            result += '<ul>';
            for (var j = 0; j < items.length; j++) {
                if (items[j].trim()) result += '<li>' + items[j].replace(/^[-•]\s*/, '') + '</li>';
            }
            result += '</ul>';
        } else if (para.match(/^\d+[\.\)]\s/)) {
            var items = para.split('\n');
            result += '<ol>';
            for (var j = 0; j < items.length; j++) {
                if (items[j].trim()) result += '<li>' + items[j].replace(/^\d+[\.\)]\s*/, '') + '</li>';
            }
            result += '</ol>';
        } else {
            result += '<p>' + para.replace(/\n/g, '<br>') + '</p>';
        }
    }
    return result;
}

function updateNavButtons() {
    if (!prevSectionBtn || !nextSectionBtn || currentChapter === null) return;
    var len = window.chapters[currentChapter].sections.length;
    prevSectionBtn.disabled = (currentSection === 0);
    nextSectionBtn.disabled = (currentSection === len - 1);
}

// ===== Events & Utilities =====
function navigatePrev() { if (currentSection > 0) showSection(currentSection - 1); }
function navigateNext() {
    if (currentChapter !== null && currentSection < window.chapters[currentChapter].sections.length - 1) {
        showSection(currentSection + 1);
    }
}

function toggleSidebar() {
    if (!sidebar || !sidebarOverlay) return;
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    var isDark = document.body.classList.contains('dark-mode');
    if (document.getElementById('darkIcon')) document.getElementById('darkIcon').style.display = isDark ? 'none' : 'block';
    if (document.getElementById('lightIcon')) document.getElementById('lightIcon').style.display = isDark ? 'block' : 'none';
    storage.setItem('darkMode', isDark);
}

function loadDarkModePreference() {
    if (storage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if (document.getElementById('darkIcon')) document.getElementById('darkIcon').style.display = 'none';
        if (document.getElementById('lightIcon')) document.getElementById('lightIcon').style.display = 'block';
    }
}

function setFontSize(size) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add('font-' + size);
    storage.setItem('fontSize', size);
    if (fontSizePanel) fontSizePanel.style.display = 'none';

    var btns = document.querySelectorAll('.font-size-options button');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (btns[i].getAttribute('onclick').indexOf(size) > -1) btns[i].classList.add('active');
    }
}

function loadFontSizePreference() {
    setFontSize(storage.getItem('fontSize') || 'medium');
}

function updateBookmarkBtn() {
    if (currentChapter === null || !bookmarkChapterBtn) return;
    var id = currentChapter + '-' + currentSection;
    var isBookmarked = false;
    for (var i = 0; i < bookmarks.length; i++) { if (bookmarks[i].id === id) isBookmarked = true; }
    bookmarkChapterBtn.classList.toggle('active', isBookmarked);
}

function updateBookmarkList() {
    var list = document.getElementById('bookmarkList');
    if (!list) return;
    if (bookmarks.length === 0) { list.innerHTML = '<li class="empty-bookmark">저장된 북마크가 없습니다</li>'; return; }
    var html = '';
    for (var i = 0; i < bookmarks.length; i++) {
        var b = bookmarks[i];
        html += '<li onclick="goToResult(' + b.chapterIndex + ',' + b.sectionIndex + ')">' + b.title + '</li>';
    }
    list.innerHTML = html;
}

function goToResult(c, s) { selectChapter(c); setTimeout(function () { showSection(s); }, 150); }

function handleScroll() {
    if (!scrollTopBtn || !readingProgress) return;
    scrollTopBtn.classList.toggle('visible', (window.pageYOffset || document.documentElement.scrollTop) > 300);
    var winScroll = document.documentElement.scrollTop || window.pageYOffset;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (height > 0) readingProgress.style.width = ((winScroll / height) * 100) + '%';
}

function downloadContent() {
    if (currentChapter === null) return;
    var ch = window.chapters[currentChapter];
    var sec = ch.sections[currentSection];
    var text = "KATUSA Regulations (USFK Reg 600-2)\n\n" +
        "Chapter: " + ch.title + "\n" +
        "Section: " + sec.title + "\n\n" +
        sec.content;

    var blob = new Blob([text], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "KATUSA_" + (currentChapter + 1) + "_" + (currentSection + 1) + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function setupEventListeners() {
    if (searchBtn) searchBtn.onclick = performSearch;
    if (darkModeToggle) darkModeToggle.onclick = toggleDarkMode;
    if (menuToggle) menuToggle.onclick = toggleSidebar;
    if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;
    if (scrollTopBtn) scrollTopBtn.onclick = function () { window.scrollTo(0, 0); };
    if (fontSizeToggle) fontSizeToggle.onclick = function () {
        if (fontSizePanel) fontSizePanel.style.display = (fontSizePanel.style.display === 'block' ? 'none' : 'block');
    };
    if (bookmarkChapterBtn) bookmarkChapterBtn.onclick = toggleBookmark;
    if (prevSectionBtn) prevSectionBtn.onclick = navigatePrev;
    if (nextSectionBtn) nextSectionBtn.onclick = navigateNext;
    if (printBtn) printBtn.onclick = function () { window.print(); };
    if (downloadBtn) downloadBtn.onclick = downloadContent;

    window.onscroll = handleScroll;

    document.onclick = function (e) {
        if (fontSizePanel && fontSizePanel.style.display === 'block' && !fontSizePanel.contains(e.target) && e.target !== fontSizeToggle) {
            fontSizePanel.style.display = 'none';
        }
    };
}

function performSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q || !window.chapters) return;
    var results = [];
    for (var i = 0; i < window.chapters.length; i++) {
        for (var j = 0; j < window.chapters[i].sections.length; j++) {
            var s = window.chapters[i].sections[j];
            if (s.title.toLowerCase().indexOf(q) > -1 || s.content.toLowerCase().indexOf(q) > -1) {
                results.push({ ci: i, si: j, ct: window.chapters[i].title, st: s.title });
            }
        }
    }
    displaySearchResults(results, q);
}

function displaySearchResults(res, q) {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (contentDisplay) contentDisplay.style.display = 'none';
    if (searchResults) searchResults.style.display = 'block';
    if (breadcrumb) breadcrumb.style.display = 'none';
    var list = document.getElementById('searchResultsList');
    if (!list) return;
    if (res.length === 0) { list.innerHTML = '<p style="padding:2rem;text-align:center;">결과가 없습니다.</p>'; }
    else {
        var html = '';
        for (var i = 0; i < res.length; i++) {
            html += '<div class="search-result-item" onclick="goToResult(' + res[i].ci + ',' + res[i].si + ')">' +
                '<h4>' + res[i].ct + ' > ' + res[i].st + '</h4></div>';
        }
        list.innerHTML = html;
    }
    closeSidebar();
    window.scrollTo(0, 0);
}

function toggleBookmark() {
    if (currentChapter === null) return;
    var id = currentChapter + '-' + currentSection;
    var idx = -1;
    for (var i = 0; i < bookmarks.length; i++) { if (bookmarks[i].id === id) idx = i; }
    if (idx > -1) bookmarks.splice(idx, 1);
    else bookmarks.push({ id: id, chapterIndex: currentChapter, sectionIndex: currentSection, title: window.chapters[currentChapter].sections[currentSection].title });
    storage.setItem('katusaBookmarks', JSON.stringify(bookmarks));
    updateBookmarkBtn();
    updateBookmarkList();
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js').then(function (reg) {
            console.log('SW Registered');
        }).catch(function (err) {
            console.log('SW Failed', err);
        });
    });
}

window.onload = function () {
    init();
};
