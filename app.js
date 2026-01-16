// ===== App State =====
let currentChapter = null;
let currentSection = null;
let bookmarks = [];

// LocalStorage safety check (fixes KakaoTalk/Mobile browser "SecurityError")
const storage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // fail silently
        }
    }
};

// Load initial bookmarks
try {
    const saved = storage.getItem('katusaBookmarks');
    bookmarks = saved ? JSON.parse(saved) : [];
} catch (e) {
    bookmarks = [];
}

// ===== DOM Elements =====
const chapterList = document.getElementById('chapterList');
const contentDisplay = document.getElementById('contentDisplay');
const welcomeScreen = document.getElementById('welcomeScreen');
const searchResults = document.getElementById('searchResults');
const chapterTitle = document.getElementById('chapterTitle');
const chapterDesc = document.getElementById('chapterDesc');
const sectionButtons = document.getElementById('sectionButtons');
const sectionContent = document.getElementById('sectionContent');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const scrollTopBtn = document.getElementById('scrollTop');
const loadingScreen = document.getElementById('loadingScreen');
const breadcrumb = document.getElementById('breadcrumb');
const breadcrumbChapter = document.getElementById('breadcrumbChapter');
const breadcrumbSection = document.getElementById('breadcrumbSection');
const breadcrumbSep2 = document.getElementById('breadcrumbSep2');
const readingProgress = document.getElementById('readingProgress');
const fontSizeToggle = document.getElementById('fontSizeToggle');
const fontSizePanel = document.getElementById('fontSizePanel');
const printBtn = document.getElementById('printBtn');
const bookmarkChapterBtn = document.getElementById('bookmarkChapterBtn');
const closeSearchBtn = document.getElementById('closeSearch');
const prevSectionBtn = document.getElementById('prevSection');
const nextSectionBtn = document.getElementById('nextSection');
const quickNavGrid = document.getElementById('quickNavGrid');

// Chapter Icons
const chapterIcons = ['📋', '📜', '👥', '📝', '💼', '🎯', '📦'];
const chapterDescriptions = [
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
    try {
        renderChapterList();
        renderQuickNav();
        setupEventListeners();
        loadDarkModePreference();
        loadFontSizePreference();
        updateBookmarkList();
        calculateTotalSections();
    } catch (err) {
        console.warn("Init Warning:", err);
    }

    // Safety check: hide loading screen regardless
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 1000);
}

// ===== Render Functions =====
function renderChapterList() {
    if (!chapterList || !window.chapters) return;
    chapterList.innerHTML = window.chapters.map((chapter, index) => `
        <li class="chapter-item">
            <button class="chapter-btn" onclick="selectChapter(${index})" data-chapter="${index}">
                <span class="chapter-icon">${chapterIcons[index] || '📄'}</span>
                <span class="chapter-title-text">${chapter.title}</span>
                <span class="chapter-number">${chapter.sections.length}</span>
            </button>
        </li>
    `).join('');
}

function renderQuickNav() {
    if (!quickNavGrid || !window.chapters) return;
    quickNavGrid.innerHTML = window.chapters.map((chapter, index) => `
        <button class="quick-btn" onclick="selectChapter(${index})">
            <span class="icon">${chapterIcons[index] || '📄'}</span>
            <span>${chapter.title.split('(')[0].trim()}</span>
        </button>
    `).join('');
}

function calculateTotalSections() {
    const el = document.getElementById('totalSections');
    if (!el || !window.chapters) return;
    const total = window.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    el.textContent = total;
}

// ===== Main Actions =====
function selectChapter(index) {
    if (!window.chapters || !window.chapters[index]) return;

    currentChapter = index;
    currentSection = 0;

    // Sidebar Active State
    document.querySelectorAll('.chapter-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    // Toggle Views
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
    if (contentDisplay) contentDisplay.style.display = 'block';

    // Update Titles
    if (chapterTitle) chapterTitle.textContent = window.chapters[index].title;
    if (chapterDesc) chapterDesc.textContent = chapterDescriptions[index] || '';

    // Breadcrumb
    if (breadcrumb) breadcrumb.style.display = 'flex';
    if (breadcrumbChapter) breadcrumbChapter.textContent = window.chapters[index].title;
    if (breadcrumbSep2) breadcrumbSep2.style.display = 'none';
    if (breadcrumbSection) breadcrumbSection.textContent = '';

    updateBookmarkBtn();
    renderSectionButtons(index);
    showSection(0);
    closeSidebar();

    // Reset Scroll - Simple version for mobile compatibility
    window.scrollTo(0, 0);
}

function renderSectionButtons(chapterIndex) {
    if (!sectionButtons || !window.chapters[chapterIndex]) return;
    const chapter = window.chapters[chapterIndex];
    sectionButtons.innerHTML = chapter.sections.map((section, index) => `
        <button class="section-btn ${index === 0 ? 'active' : ''}" onclick="showSection(${index})" data-section="${index}">
            ${section.title}
        </button>
    `).join('');
}

function showSection(index) {
    if (currentChapter === null || !window.chapters[currentChapter].sections[index]) return;

    currentSection = index;
    const section = window.chapters[currentChapter].sections[index];

    // Buttons Active State
    document.querySelectorAll('.section-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    // Breadcrumb Section
    if (breadcrumbSep2) breadcrumbSep2.style.display = 'inline';
    if (breadcrumbSection) breadcrumbSection.textContent = section.title;

    // Content Display
    if (sectionContent) {
        sectionContent.innerHTML = `
            <h3>${section.title}</h3>
            <div class="section-text">${formatContent(section.content)}</div>
        `;
    }

    updateNavButtons();

    // Jump to content top (safe version)
    if (contentDisplay) {
        contentDisplay.scrollIntoView();
    }
}

function formatContent(content) {
    if (!content) return '<p>내용이 없습니다.</p>';
    const paragraphs = content.split('\n\n');
    return paragraphs.map(para => {
        if (para.trim().startsWith('-') || para.trim().startsWith('•')) {
            const items = para.split('\n').filter(item => item.trim());
            return '<ul>' + items.map(item => `<li>${item.replace(/^[-•]\s*/, '')}</li>`).join('') + '</ul>';
        }
        if (/^\d+[\.\)]\s/.test(para.trim())) {
            const items = para.split('\n').filter(item => item.trim());
            return '<ol>' + items.map(item => `<li>${item.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('') + '</ol>';
        }
        if (para.includes(':') && para.indexOf(':') < 40 && !para.includes('\n')) {
            const parts = para.split(':');
            return `<h4>${parts[0].trim()}</h4><p>${parts.slice(1).join(':').trim()}</p>`;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

function updateNavButtons() {
    if (!prevSectionBtn || !nextSectionBtn || currentChapter === null) return;
    const chapter = window.chapters[currentChapter];
    prevSectionBtn.disabled = currentSection === 0;
    nextSectionBtn.disabled = currentSection === chapter.sections.length - 1;
}

// ===== Utility Actions =====
function navigatePrev() { if (currentSection > 0) showSection(currentSection - 1); }
function navigateNext() {
    if (currentChapter !== null && currentSection < window.chapters[currentChapter].sections.length - 1) {
        showSection(currentSection + 1);
    }
}

function toggleSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    menuToggle.classList.toggle('active');
}

function closeSidebar() {
    if (!sidebar || !sidebarOverlay || !menuToggle) return;
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    menuToggle.classList.remove('active');
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query || !window.chapters) return;

    const results = [];
    window.chapters.forEach((chapter, chapterIndex) => {
        chapter.sections.forEach((section, sectionIndex) => {
            if (section.title.toLowerCase().includes(query) || section.content.toLowerCase().includes(query)) {
                results.push({
                    chapterIndex, sectionIndex,
                    chapterTitle: chapter.title,
                    sectionTitle: section.title,
                    snippet: getSnippet(section.content, query)
                });
            }
        });
    });
    displaySearchResults(results, query);
}

function getSnippet(content, query) {
    const lContent = content.toLowerCase();
    const idx = lContent.indexOf(query);
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + query.length + 60);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return snippet.replace(regex, '<span class="highlight">$1</span>');
}

function displaySearchResults(results, query) {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (contentDisplay) contentDisplay.style.display = 'none';
    if (searchResults) searchResults.style.display = 'block';
    if (breadcrumb) breadcrumb.style.display = 'none';

    const list = document.getElementById('searchResultsList');
    if (!list) return;

    if (results.length === 0) {
        list.innerHTML = `<p style="text-align:center;padding:2rem;">"${query}" 검색 결과가 없습니다.</p>`;
    } else {
        list.innerHTML = results.map(r => `
            <div class="search-result-item" onclick="goToResult(${r.chapterIndex}, ${r.sectionIndex})">
                <h4>${r.chapterTitle} › ${r.sectionTitle}</h4>
                <p>${r.snippet}</p>
            </div>
        `).join('');
    }
    closeSidebar();
    window.scrollTo(0, 0);
}

function goToResult(cIdx, sIdx) {
    selectChapter(cIdx);
    setTimeout(() => showSection(sIdx), 150);
}

// ===== State Management =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
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
    document.body.classList.add(`font-${size}`);
    document.querySelectorAll('.font-size-options button').forEach(btn => btn.classList.toggle('active', btn.dataset.size === size));
    storage.setItem('fontSize', size);
}

function loadFontSizePreference() {
    setFontSize(storage.getItem('fontSize') || 'medium');
}

function toggleBookmark() {
    if (currentChapter === null) return;
    const id = `${currentChapter}-${currentSection}`;
    const idx = bookmarks.findIndex(b => b.id === id);
    if (idx >= 0) bookmarks.splice(idx, 1);
    else bookmarks.push({ id, chapterIndex: currentChapter, sectionIndex: currentSection, title: window.chapters[currentChapter].sections[currentSection].title });
    storage.setItem('katusaBookmarks', JSON.stringify(bookmarks));
    updateBookmarkBtn();
    updateBookmarkList();
}

function updateBookmarkBtn() {
    if (currentChapter === null || !bookmarkChapterBtn) return;
    const isBookmarked = bookmarks.some(b => b.id === `${currentChapter}-${currentSection}`);
    bookmarkChapterBtn.classList.toggle('active', isBookmarked);
}

function updateBookmarkList() {
    const list = document.getElementById('bookmarkList');
    if (!list) return;
    if (bookmarks.length === 0) { list.innerHTML = '<li class="empty-bookmark">목록 없음</li>'; return; }
    list.innerHTML = bookmarks.map(b => `<li onclick="goToResult(${b.chapterIndex}, ${b.sectionIndex})">${b.title}</li>`).join('');
}

// ===== UI Logic =====
function handleScroll() {
    if (!scrollTopBtn || !readingProgress) return;
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    readingProgress.style.width = ((winScroll / height) * 100) + '%';
}

function setupEventListeners() {
    if (searchBtn) searchBtn.onclick = performSearch;
    if (searchInput) searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    if (darkModeToggle) darkModeToggle.onclick = toggleDarkMode;
    if (menuToggle) menuToggle.onclick = toggleSidebar;
    if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;
    if (scrollTopBtn) scrollTopBtn.onclick = () => window.scrollTo(0, 0);
    if (fontSizeToggle) fontSizeToggle.onclick = () => { if (fontSizePanel) fontSizePanel.style.display = fontSizePanel.style.display === 'block' ? 'none' : 'block'; };
    if (printBtn) printBtn.onclick = () => window.print();
    if (bookmarkChapterBtn) bookmarkChapterBtn.onclick = toggleBookmark;
    if (prevSectionBtn) prevSectionBtn.onclick = navigatePrev;
    if (nextSectionBtn) nextSectionBtn.onclick = navigateNext;

    window.onscroll = handleScroll;

    document.addEventListener('click', (e) => {
        if (fontSizePanel && fontSizePanel.style.display === 'block' && !fontSizePanel.contains(e.target) && e.target !== fontSizeToggle) {
            fontSizePanel.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
