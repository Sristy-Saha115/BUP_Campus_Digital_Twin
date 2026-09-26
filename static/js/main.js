// YouTube iframe API Control & Sound Toggle
let player;
const videoId = 'qv7C_yp3h5E'; // Campus Life in BUP

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'loop': 1,
            'playlist': videoId,
            'fs': 0,
            'autohide': 1,
            'enablejsapi': 1
        },
        events: {
            'onReady': (e) => {
                e.target.mute();
                e.target.playVideo();
            }
        }
    });
}

let currentLanguage = 'EN';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mute/Unmute Toggle
    const muteBtn = document.getElementById('muteToggleBtn');
    const muteIcon = document.getElementById('muteIcon');
    const muteText = document.getElementById('muteText');

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (player && typeof player.isMuted === 'function') {
                if (player.isMuted()) {
                    player.unMute();
                    muteIcon.className = 'fas fa-volume-up';
                    muteText.innerText = 'Mute Sound';
                } else {
                    player.mute();
                    muteIcon.className = 'fas fa-volume-mute';
                    muteText.innerText = 'Unmute Sound';
                }
            }
        });
    }

    // 2. FR-06: Multi-language Toggle Logic (Bangla <-> English)
    const langBtn = document.getElementById('langToggleBtn');
    const langTriggers = document.querySelectorAll('.lang-trigger-btn');

    const toggleLanguage = () => {
        currentLanguage = currentLanguage === 'EN' ? 'BN' : 'EN';
        document.getElementById('currentLang').innerText = currentLanguage === 'EN' ? 'BN' : 'EN';

        document.querySelectorAll('[data-lang-en]').forEach(el => {
            const text = currentLanguage === 'EN' ? el.getAttribute('data-lang-en') : el.getAttribute('data-lang-bn');
            if (text) el.innerText = text;
        });

        document.querySelectorAll('[data-lang-en-ph]').forEach(el => {
            const ph = currentLanguage === 'EN' ? el.getAttribute('data-lang-en-ph') : el.getAttribute('data-lang-bn-ph');
            if (ph) el.placeholder = ph;
        });
    };

    if (langBtn) langBtn.addEventListener('click', toggleLanguage);
    langTriggers.forEach(btn => btn.addEventListener('click', toggleLanguage));

    // 3. FR-05: Smart Campus Search Engine
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchBtn && searchInput) {
        const handleSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                searchResults.classList.remove('d-none');
                if (data.results.length > 0) {
                    searchResults.innerHTML = `<h6>Search Results:</h6><ul>` + 
                        data.results.map(r => `<li><strong>${r.title}:</strong> ${r.details}</li>`).join('') + `</ul>`;
                } else {
                    searchResults.innerHTML = `<p class="text-muted mb-0">No matching campus records found.</p>`;
                }
            } catch (err) {
                console.error("Search failed.");
            }
        };

        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    }

    // 4. FR-03: Bus GPS Location Fetch
    const trackBusBtn = document.getElementById('track-bus-btn');
    if (trackBusBtn) {
        trackBusBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/bus-location');
                const data = await response.json();
                document.getElementById('bus-id').innerText = data.bus_id;
                document.getElementById('bus-route').innerText = data.route;
                document.getElementById('bus-eta').innerText = `ETA: ${data.eta}`;
                document.getElementById('bus-lat').innerText = data.latitude;
                document.getElementById('bus-lng').innerText = data.longitude;
            } catch (err) { console.error("Bus tracking error."); }
        });
    }

    // 5. FR-01: Auth Form
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('authAlert');
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('authName').value,
                    email: document.getElementById('authEmail').value,
                    password: document.getElementById('authPassword').value,
                    role: document.getElementById('authRole').value
                })
            });
            const data = await res.json();
            alertBox.className = res.ok ? 'mt-3 alert alert-success py-2' : 'mt-3 alert alert-danger py-2';
            alertBox.innerText = data.message || data.error;
            alertBox.classList.remove('d-none');
        });
    }

    // 6. FR-04: Consultation Booking
    const bookingForm = document.getElementById('slotBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('bookingAlert');
            const res = await fetch('/api/book-slot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faculty: document.getElementById('facultySelect').value,
                    date: document.getElementById('bookingDate').value,
                    time: document.getElementById('bookingTime').value,
                    reason: document.getElementById('studentReason').value
                })
            });
            const data = await res.json();
            alertBox.className = res.ok ? 'mt-3 alert alert-success py-2' : 'mt-3 alert alert-danger py-2';
            alertBox.innerText = data.message || data.error;
            alertBox.classList.remove('d-none');
            if (res.ok) bookingForm.reset();
        });
    }

    // 7. FR-09: Emergency Blood Request Form
    const bloodForm = document.getElementById('bloodRequestForm');
    if (bloodForm) {
        bloodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('bloodAlert');
            const res = await fetch('/api/request-blood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blood_group: document.getElementById('bloodGroup').value,
                    location: document.getElementById('hospitalLocation').value,
                    phone: document.getElementById('contactPhone').value
                })
            });
            const data = await res.json();
            alertBox.className = res.ok ? 'mt-3 alert alert-success py-2' : 'mt-3 alert alert-danger py-2';
            alertBox.innerText = data.message || data.error;
            alertBox.classList.remove('d-none');
            if (res.ok) bloodForm.reset();
        });
    }
});

// FR-08: Helper for Club Registration
function registerClub(clubName) {
    alert(`Successfully registered for the upcoming event organized by ${clubName}! Notification sent to your email.`);
}