// ===== App State =====
let currentChapter = null;
let currentSection = null;
let bookmarks = JSON.parse(localStorage.getItem('katusaBookmarks')) || [];

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
    renderChapterList();
    renderQuickNav();
    setupEventListeners();
    loadDarkModePreference();
    loadFontSizePreference();
    updateBookmarkList();
    calculateTotalSections();

    // Hide loading screen after content is ready
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 800);
}

// ===== Render Chapter List in Sidebar =====
function renderChapterList() {
    chapterList.innerHTML = chapters.map((chapter, index) => `
        <li class="chapter-item">
            <button class="chapter-btn" onclick="selectChapter(${index})" data-chapter="${index}">
                <span class="chapter-icon">${chapterIcons[index] || '📄'}</span>
                <span>${chapter.title}</span>
                <span class="chapter-number">${chapter.sections.length}</span>
            </button>
        </li>
    `).join('');
}

// ===== Render Quick Navigation =====
function renderQuickNav() {
    quickNavGrid.innerHTML = chapters.map((chapter, index) => `
        <button class="quick-btn" onclick="selectChapter(${index})">
            <span class="icon">${chapterIcons[index] || '📄'}</span>
            <span>${chapter.title.replace(/\(.*\)/, '').trim()}</span>
        </button>
    `).join('');
}

// ===== Calculate Total Sections =====
function calculateTotalSections() {
    const total = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    document.getElementById('totalSections').textContent = total;
}

// ===== Select Chapter =====
function selectChapter(index) {
    currentChapter = index;
    currentSection = 0;

    // Update active state in sidebar
    document.querySelectorAll('.chapter-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    // Show content display, hide welcome screen
    welcomeScreen.style.display = 'none';
    searchResults.style.display = 'none';
    contentDisplay.style.display = 'block';

    // Update chapter title and description
    chapterTitle.textContent = chapters[index].title;
    chapterDesc.textContent = chapterDescriptions[index] || '';

    // Update breadcrumb
    breadcrumb.style.display = 'flex';
    breadcrumbChapter.textContent = chapters[index].title;
    breadcrumbSep2.style.display = 'none';
    breadcrumbSection.textContent = '';

    // Update bookmark button
    updateBookmarkBtn();

    // Render section buttons
    renderSectionButtons(index);

    // Show first section
    showSection(0);

    // Close sidebar on mobile
    closeSidebar();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Render Section Buttons =====
function renderSectionButtons(chapterIndex) {
    const chapter = chapters[chapterIndex];
    sectionButtons.innerHTML = chapter.sections.map((section, index) => `
        <button class="section-btn ${index === 0 ? 'active' : ''}" onclick="showSection(${index})" data-section="${index}">
            ${section.title}
        </button>
    `).join('');
}

// ===== Show Section Content =====
function showSection(index) {
    currentSection = index;
    const chapter = chapters[currentChapter];
    const section = chapter.sections[index];

    // Update active button
    document.querySelectorAll('.section-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    // Update breadcrumb
    breadcrumbSep2.style.display = 'inline';
    breadcrumbSection.textContent = section.title;

    // Render section content with animation
    sectionContent.style.opacity = '0';
    setTimeout(() => {
        sectionContent.innerHTML = `
            <h3>${section.title}</h3>
            <div class="section-text">${formatContent(section.content)}</div>
        `;
        sectionContent.style.opacity = '1';
    }, 150);

    // Update navigation buttons
    updateNavButtons();

    // Scroll section into view
    sectionContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Update Navigation Buttons =====
function updateNavButtons() {
    const chapter = chapters[currentChapter];
    prevSectionBtn.disabled = currentSection === 0;
    nextSectionBtn.disabled = currentSection === chapter.sections.length - 1;
}

// ===== Navigate Sections =====
function navigatePrev() {
    if (currentSection > 0) {
        showSection(currentSection - 1);
    }
}

function navigateNext() {
    const chapter = chapters[currentChapter];
    if (currentSection < chapter.sections.length - 1) {
        showSection(currentSection + 1);
    }
}

// ===== Format Content =====
function formatContent(content) {
    if (!content) return '<p>내용이 없습니다.</p>';

    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map(para => {
        // Check if it starts with a bullet point
        if (para.trim().startsWith('-') || para.trim().startsWith('•')) {
            const items = para.split('\n').filter(item => item.trim());
            return '<ul>' + items.map(item => `<li>${item.replace(/^[-•]\s*/, '')}</li>`).join('') + '</ul>';
        }
        // Check if it's a numbered list
        if (/^\d+[\.\)]\s/.test(para.trim())) {
            const items = para.split('\n').filter(item => item.trim());
            return '<ol>' + items.map(item => `<li>${item.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('') + '</ol>';
        }
        // Check if it's a header-like line
        if (para.includes(':') && para.indexOf(':') < 30 && !para.includes('\n')) {
            const [header, ...rest] = para.split(':');
            return `<h4>${header.trim()}</h4><p>${rest.join(':').trim()}</p>`;
        }
        // Regular paragraph
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

// ===== Show Welcome Screen =====
function showWelcome() {
    currentChapter = null;
    currentSection = null;

    welcomeScreen.style.display = 'block';
    contentDisplay.style.display = 'none';
    searchResults.style.display = 'none';
    breadcrumb.style.display = 'none';

    document.querySelectorAll('.chapter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ===== Search Functionality =====
function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const results = [];

    chapters.forEach((chapter, chapterIndex) => {
        chapter.sections.forEach((section, sectionIndex) => {
            if (section.title.toLowerCase().includes(query) ||
                section.content.toLowerCase().includes(query)) {
                const snippet = getSnippet(section.content, query);
                results.push({
                    chapterIndex,
                    sectionIndex,
                    chapterTitle: chapter.title,
                    sectionTitle: section.title,
                    snippet
                });
            }
        });
    });

    displaySearchResults(results, query);
}

// ===== Get Snippet Around Search Term =====
function getSnippet(content, query) {
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query);
    if (index === -1) return content.substring(0, 150) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 100);
    let snippet = content.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    // Highlight the query
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    snippet = snippet.replace(regex, '<span class="highlight">$1</span>');

    return snippet;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== Display Search Results =====
function displaySearchResults(results, query) {
    welcomeScreen.style.display = 'none';
    contentDisplay.style.display = 'none';
    searchResults.style.display = 'block';
    breadcrumb.style.display = 'none';

    const resultsList = document.getElementById('searchResultsList');

    if (results.length === 0) {
        resultsList.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="font-size: 3rem; margin-bottom: 1rem;">🔍</p>
                <p style="color: var(--text-secondary);">"${query}"에 대한 검색 결과가 없습니다.</p>
            </div>
        `;
        return;
    }

    resultsList.innerHTML = `
        <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.95rem;">
            "<strong>${query}</strong>"에 대해 <strong>${results.length}개</strong>의 결과를 찾았습니다.
        </p>
        ${results.map(result => `
            <div class="search-result-item" onclick="goToResult(${result.chapterIndex}, ${result.sectionIndex})">
                <h4>${result.chapterTitle} › ${result.sectionTitle}</h4>
                <p>${result.snippet}</p>
            </div>
        `).join('')}
    `;

    // Close sidebar on mobile
    closeSidebar();
}

// ===== Close Search Results =====
function closeSearchResults() {
    showWelcome();
    searchInput.value = '';
}

// ===== Go to Search Result =====
function goToResult(chapterIndex, sectionIndex) {
    selectChapter(chapterIndex);
    setTimeout(() => showSection(sectionIndex), 150);
}

// ===== Dark Mode Toggle =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    document.getElementById('darkIcon').style.display = isDark ? 'none' : 'block';
    document.getElementById('lightIcon').style.display = isDark ? 'block' : 'none';

    localStorage.setItem('darkMode', isDark);
}

// ===== Load Dark Mode Preference =====
function loadDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkIcon').style.display = 'none';
        document.getElementById('lightIcon').style.display = 'block';
    }
}

// ===== Font Size Controls =====
function toggleFontSizePanel() {
    const isVisible = fontSizePanel.style.display === 'block';
    fontSizePanel.style.display = isVisible ? 'none' : 'block';
}

function setFontSize(size) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size}`);

    document.querySelectorAll('.font-size-options button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });

    localStorage.setItem('fontSize', size);
    fontSizePanel.style.display = 'none';
}

function loadFontSizePreference() {
    const size = localStorage.getItem('fontSize') || 'medium';
    setFontSize(size);
}

// ===== Bookmark Functions =====
function toggleBookmark() {
    if (currentChapter === null) return;

    const bookmarkId = `${currentChapter}-${currentSection}`;
    const existingIndex = bookmarks.findIndex(b => b.id === bookmarkId);

    if (existingIndex >= 0) {
        bookmarks.splice(existingIndex, 1);
    } else {
        bookmarks.push({
            id: bookmarkId,
            chapterIndex: currentChapter,
            sectionIndex: currentSection,
            title: chapters[currentChapter].sections[currentSection].title
        });
    }

    localStorage.setItem('katusaBookmarks', JSON.stringify(bookmarks));
    updateBookmarkBtn();
    updateBookmarkList();
}

function updateBookmarkBtn() {
    if (currentChapter === null) return;

    const bookmarkId = `${currentChapter}-${currentSection}`;
    const isBookmarked = bookmarks.some(b => b.id === bookmarkId);
    bookmarkChapterBtn.classList.toggle('active', isBookmarked);
}

function updateBookmarkList() {
    const list = document.getElementById('bookmarkList');

    if (bookmarks.length === 0) {
        list.innerHTML = '<li class="empty-bookmark">저장된 북마크가 없습니다</li>';
        return;
    }

    list.innerHTML = bookmarks.map(b => `
        <li onclick="goToResult(${b.chapterIndex}, ${b.sectionIndex})">${b.title}</li>
    `).join('');
}

// ===== Sidebar Controls =====
function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    menuToggle.classList.toggle('active');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    menuToggle.classList.remove('active');
}

// ===== Scroll Functions =====
function handleScroll() {
    // Scroll to top button visibility
    const shouldShow = window.scrollY > 300;
    scrollTopBtn.classList.toggle('visible', shouldShow);

    // Reading progress
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    readingProgress.style.width = scrolled + '%';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Print Function =====
function printContent() {
    window.print();
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    closeSearchBtn.addEventListener('click', closeSearchResults);

    // Dark mode
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Menu toggle
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Scroll
    window.addEventListener('scroll', handleScroll);
    scrollTopBtn.addEventListener('click', scrollToTop);

    // Font size
    fontSizeToggle.addEventListener('click', toggleFontSizePanel);

    // Print
    printBtn.addEventListener('click', printContent);

    // Bookmark
    bookmarkChapterBtn.addEventListener('click', toggleBookmark);

    // Navigation buttons
    prevSectionBtn.addEventListener('click', navigatePrev);
    nextSectionBtn.addEventListener('click', navigateNext);

    // Close font panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!fontSizePanel.contains(e.target) && e.target !== fontSizeToggle) {
            fontSizePanel.style.display = 'none';
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        if (e.key === 'ArrowLeft' && currentChapter !== null) {
            navigatePrev();
        } else if (e.key === 'ArrowRight' && currentChapter !== null) {
            navigateNext();
        } else if (e.key === 'Escape') {
            closeSidebar();
            fontSizePanel.style.display = 'none';
        }
    });
}

// ===== Initialize on DOM Ready =====
document.addEventListener('DOMContentLoaded', init);
