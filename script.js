// ============================================================
// GTMB - Firebase Script (Full Data + Auth + Storage + Sanitizer)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    orderBy,
    addDoc,
    writeBatch,
    onSnapshot,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCQ8UCCkgFxoDU7_KRd8oAQrWdX3yNcqmk",
    authDomain: "gtmb-6d336.firebaseapp.com",
    projectId: "gtmb-6d336",
    storageBucket: "gtmb-6d336.firebasestorage.app",
    messagingSenderId: "939319709519",
    appId: "1:939319709519:web:4612b9e5ceccccd7573f3a"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable offline persistence (Firestore only)
try {
    await enableIndexedDbPersistence(db);
    console.log('🔥 Firestore persistence enabled');
} catch (err) {
    console.warn('⚠️ Persistence not available:', err);
}

// ============================================================
// EXPORT INSTANCES
// ============================================================
export { app, db, auth, storage };

// ============================================================
// DEFAULT EXECUTIVE ROLES (built-in, non-deletable)
// ============================================================
export const DEFAULT_EXECUTIVE_ROLES = {
    inaugural: { label: 'Inaugural Excos', icon: '🏆' },
    president: { label: 'President', icon: '✅' },
    major:     { label: 'Major', icon: '🥁' },
    provost:   { label: 'Provost', icon: '🧑🏾‍✈️' },
    pro:       { label: 'P.R.O.', icon: '📢' },
    dos:       { label: 'D.O.S.', icon: '📸' },
    gs:        { label: 'General Secretary', icon: '✍🏽' },
    ags:       { label: 'A.G.S.', icon: '📝' },
    brass:     { label: 'Chief Brass', icon: '🎺' },
    bass:      { label: 'Chief Bass', icon: '💣' },
    tenor:     { label: 'Chief Tenor', icon: '💯' }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/** Escape HTML to prevent XSS (for plain text) */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Sanitize HTML – allow only safe tags and attributes (for rich text) */
export function sanitizeHtml(html) {
    if (!html) return '';
    const allowedTags = [
        'br', 'strong', 'em', 'u', 'p', 'ul', 'li', 'ol',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'span', 'div', 'a', 'b', 'i', 'sub', 'sup',
        'blockquote', 'pre', 'code'
    ];

    const div = document.createElement('div');
    div.innerHTML = html;

    function sanitizeNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (!allowedTags.includes(tag)) {
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.remove();
                return;
            }
            if (tag === 'a') {
                const href = node.getAttribute('href');
                if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
                    node.setAttribute('href', href);
                } else {
                    node.removeAttribute('href');
                }
                [...node.attributes].forEach(attr => {
                    if (attr.name !== 'href') node.removeAttribute(attr.name);
                });
            } else {
                [...node.attributes].forEach(attr => node.removeAttribute(attr.name));
            }
            [...node.childNodes].forEach(child => sanitizeNode(child));
        }
    }

    [...div.childNodes].forEach(child => sanitizeNode(child));
    return div.innerHTML;
}

/** Toast notification */
export function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) {
        const toastEl = document.createElement('div');
        toastEl.id = 'toast';
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
        setTimeout(() => showToast(message, isError), 50);
        return;
    }
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
        return true;
    } catch (error) {
        return false;
    }
}

export function getCurrentUser() {
    return auth.currentUser;
}

export async function isAdmin(user) {
    if (!user) return false;
    try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'admin') {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function createAdminUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// Legacy password login (kept for fallback)
export async function adminLogin(password) {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
        if (settingsDoc.exists() && settingsDoc.data().password === password) {
            localStorage.setItem('gtmb_admin_logged_in', 'true');
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// ============================================================
// STORAGE — IMAGE UPLOAD / DELETE
// ============================================================

/**
 * Upload an image file to Firebase Storage.
 * @param {File} file - The file object from an <input type="file">
 * @param {string} path - Storage path, e.g. "executives/inaugural/0"
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export async function uploadImage(file, path) {
    if (!file) return { success: false, error: 'No file provided' };
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Only image files are allowed' };
    }
    if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: 'File must be under 2MB' };
    }
    try {
        // Add a timestamp so replacing a photo doesn't clash with the old one
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${path}_${Date.now()}.${ext}`;
        const fileRef = storageRef(storage, filename);

        await uploadBytes(fileRef, file, { contentType: file.type });
        const url = await getDownloadURL(fileRef);

        return { success: true, url, path: filename };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a file from Firebase Storage by its full path.
 * Silently ignores missing files.
 */
export async function deleteImage(path) {
    if (!path) return { success: true };
    try {
        const fileRef = storageRef(storage, path);
        await deleteObject(fileRef);
        return { success: true };
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            return { success: true };
        }
        console.error('Error deleting image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Extract the storage path from a Firebase Storage download URL.
 * Returns null if the URL doesn't look like a Firebase Storage URL.
 */
export function extractStoragePath(downloadUrl) {
    if (!downloadUrl || typeof downloadUrl !== 'string') return null;
    try {
        const url = new URL(downloadUrl);
        if (!url.hostname.includes('firebasestorage.googleapis.com')) return null;
        const match = url.pathname.match(/\/o\/(.+)$/);
        if (!match) return null;
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

// ============================================================
// PHOTO HELPERS (Inaugural Executives)
// ============================================================

/**
 * Upload a new photo for an inaugural executive (by index), store its URL
 * in Firestore, and delete the old photo file from Storage if any.
 */
export async function uploadInauguralPhoto(index, file) {
    try {
        const docRef = doc(db, 'executives', 'all');
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            return { success: false, error: 'Executives doc not found' };
        }
        const execs = snap.data();
        if (!execs.inaugural || !execs.inaugural[index]) {
            return { success: false, error: 'Executive index out of range' };
        }

        // Upload new file to Storage
        const uploadResult = await uploadImage(file, `executives/inaugural/${index}`);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
        }

        // Delete old photo from Storage (if it was a Firebase URL)
        const oldPhoto = execs.inaugural[index].photo;
        const oldPath = extractStoragePath(oldPhoto);
        if (oldPath) {
            await deleteImage(oldPath);
        }

        // Update Firestore with new URL
        execs.inaugural[index].photo = uploadResult.url;
        await setDoc(docRef, execs);

        return { success: true, url: uploadResult.url };
    } catch (error) {
        console.error('Error uploading inaugural photo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove an inaugural executive's photo from Firestore and Storage.
 */
export async function removeInauguralPhoto(index) {
    try {
        const docRef = doc(db, 'executives', 'all');
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            return { success: false, error: 'Executives doc not found' };
        }
        const execs = snap.data();
        if (!execs.inaugural || !execs.inaugural[index]) {
            return { success: false, error: 'Executive index out of range' };
        }

        // Delete file from Storage
        const oldPhoto = execs.inaugural[index].photo;
        const oldPath = extractStoragePath(oldPhoto);
        if (oldPath) {
            await deleteImage(oldPath);
        }

        // Clear the field in Firestore
        execs.inaugural[index].photo = null;
        await setDoc(docRef, execs);

        return { success: true };
    } catch (error) {
        console.error('Error removing inaugural photo:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Convenience: load only inaugural executives (with photos).
 */
export async function loadInauguralExecutives() {
    try {
        const docRef = doc(db, 'executives', 'all');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            return (data.inaugural || []).map(item => ({
                ...item,
                photo: item.photo || null
            }));
        }
        return [];
    } catch (error) {
        console.error('Error loading inaugural executives:', error);
        return [];
    }
}

// ============================================================
// CUSTOM ROLES
// ============================================================

export async function loadCustomRoles() {
    try {
        const ref = doc(db, 'config', 'customRoles');
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data().roles || {};
        }
        return {};
    } catch (error) {
        console.error('Error loading custom roles:', error);
        return {};
    }
}

export async function saveCustomRoles(customRoles) {
    try {
        const ref = doc(db, 'config', 'customRoles');
        await setDoc(ref, { roles: customRoles || {} }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error saving custom roles:', error);
        return false;
    }
}

export async function addCustomRole(key, label, icon = '🏅') {
    try {
        const customRoles = await loadCustomRoles();
        if (customRoles[key]) {
            return { success: false, error: 'Role key already exists' };
        }
        customRoles[key] = { label, icon };
        await saveCustomRoles(customRoles);
        return { success: true, roles: customRoles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteCustomRole(key) {
    try {
        const customRoles = await loadCustomRoles();
        if (!customRoles[key]) {
            return { success: false, error: 'Role not found' };
        }
        delete customRoles[key];
        await saveCustomRoles(customRoles);

        const execRef = doc(db, 'executives', 'all');
        const execSnap = await getDoc(execRef);
        if (execSnap.exists()) {
            const execs = execSnap.data();
            if (execs[key]) {
                delete execs[key];
                await setDoc(execRef, execs);
            }
        }
        return { success: true, roles: customRoles };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getAllRoles() {
    const customRoles = await loadCustomRoles();
    return { ...DEFAULT_EXECUTIVE_ROLES, ...customRoles };
}

// ============================================================
// DEFAULT DATA STRUCTURE
// ============================================================
export const DEFAULT_DATA = {
    pages: {
        home: {
            heroTitle: 'Glorious Tunes Musical Band',
            heroTagline: 'Ex-Banders of Osun State Parade Band, united in harmony — promoting musical excellence, camaraderie, and a shared purpose.',
            heroBadgeTitle: 'Since 2017',
            heroBadgeItems: ['Founded by Ex-NYSC Parade Band Members', 'Promoting Unity & Musical Excellence', 'Annual Reunion & AGM'],
            featureCards: [
                { icon: '📖', title: 'About Us', desc: 'Learn about our mission, values, and the passionate individuals behind GTMB.', link: 'about.html' },
                { icon: '🏛️', title: 'Know Your History', desc: 'Explore past executives, their tenures, and the journey that shaped GTMB.', link: 'history.html' },
                { icon: '📅', title: 'Events', desc: 'Stay updated on reunions, performances, and special GTMB gatherings.', link: 'events.html' },
                { icon: '🧩', title: 'Trivia Archive', desc: 'Test your knowledge with our collection of past trivia questions and answers.', link: 'trivia.html' }
            ],
            constitutionHighlights: [
                'We, the Ex-Banders of Osun State Parade Band, now forming the Glorious Tunes Musical Band, in order to promote unity, excellence, and teamwork in our musical endeavours…',
                'Promote musical excellence, foster unity, enhance our image, and provide entertainment and morale-boosting services.',
                'Eligibility: Ex-Banders from NYSC Parade Band, Osun, with maturity, musical talent, and shared interest in GTMB\'s objectives.',
                'Conferred upon individuals who have demonstrated exceptional support, commitment, or contribution to GTMB.'
            ],
            honoraryCards: [
                { icon: '⭐', title: 'Distinguished Supporter', desc: 'Significant financial or material contributions to GTMB.' },
                { icon: '🤝', title: 'Special Friend', desc: 'Consistent moral support, advocacy, and encouragement.' },
                { icon: '👑', title: 'Honorary Patron', desc: 'Highest honour for individuals with exceptional influence or stature.' }
            ],
            triviaTeaser: {
                question: '"In what year was GTMB officially founded?"',
                answer: '2020 — Find more in the Trivia Archive →'
            }
        },
        about: {
            heroTitle: 'About Glorious Tunes',
            heroDesc: 'Discover the story, mission, and people behind GTMB — a family of ex-NYSC band members united by music and purpose.',
            storyParagraphs: [
                'Glorious Tunes Musical Band (GTMB) was born out of the shared passion of ex-members of the NYSC Parade Band, Osun State. For over ten years, we have come together to keep the spirit of music alive, fostering unity and excellence among our members.',
                'Although our roots run deep, GTMB was officially registered as an association just two years ago, solidifying our commitment to structure, growth, and a lasting legacy. Today, we continue to perform, train, and inspire each other and our community.',
                'Our journey is a testament to the enduring power of music and the bonds formed through shared experience. We invite you to be part of our story.'
            ],
            storyImageText: '10+ Years of Music',
            storyImageSub: 'Founded by Ex-NYSC Parade Band members<br />Officially registered since 2024',
            missionCards: [
                { icon: '🎵', title: 'Promote Musical Excellence', desc: 'We strive for the highest standard in our performances and rehearsals, continually improving our craft.' },
                { icon: '🤝', title: 'Foster Unity & Teamwork', desc: 'We believe in the strength of collaboration, building a supportive family of band members.' },
                { icon: '🌟', title: 'Enhance Our Image', desc: 'Through public performances and activities, we showcase the talent and spirit of GTMB.' },
                { icon: '🎉', title: 'Entertain & Inspire', desc: 'We provide morale-boosting services to our members and the public, spreading joy through music.' }
            ],
            membershipItems: [
                { title: 'Regular Members', desc: 'Ex-Banders from NYSC Parade Band, Osun, who possess maturity, musical talent, and shared interest in GTMB\'s objectives.' },
                { title: 'Associate Members', desc: 'Individuals who support the band but may not meet all regular membership criteria.' },
                { title: 'Honorary Members', desc: 'Conferred upon individuals who have demonstrated exceptional support, commitment, or contribution to GTMB (Article 2.4).' }
            ],
            leadershipItems: [
                { icon: '🏛️', title: 'Board of Directors (BOD)', desc: 'Composition: 5–7 members including Chairman, Secretary, Treasurer.<br />Role: Strategic direction, oversight, financial accountability.<br />Term: 2-year staggered terms, elected by regular members.' },
                { icon: '⚙️', title: 'Executive Committee (EC)', desc: 'Composition: President, Vice-President, Musical Director, Committee Chairs.<br />Role: Implement BOD decisions, manage daily operations, coordinate committees.<br />Term: 1-year terms, elected by regular members, approved by BOD.' },
                { icon: '📋', title: 'Committees', desc: 'Standing: Finance, Programs, Public Relations, Training & Development.<br />Ad-Hoc: Formed as needed for special projects.<br />Role: Execute specific tasks and support EC and BOD.' }
            ],
            ctaTitle: 'Join the Glorious Family',
            ctaDesc: 'Whether you\'re an ex-NYSC band member or a passionate supporter, there\'s a place for you at GTMB.',
            anthem: `With every beat, our hearts unite as one.
Discipline guides us, day and night.
We create a symphony divine.
(×2)

Glorious Tunes
Beautiful Sound

We move as one in perfect harmony and sync`
        },
        history: {
            heroTitle: 'Know Your History',
            heroDesc: 'Explore the legacy of GTMB through the dedicated executives who have served the parade band across the years.'
        },
        events: {
            heroTitle: 'Our Events',
            heroDesc: 'From reunions to performances — stay connected with the GTMB community.',
            upcomingEvents: [
                {
                    id: 1,
                    title: 'KHAKI TO LEGACY',
                    subtitle: 'The 10th Reunion of Glorious Tunes Musical Band',
                    label: 'Upcoming',
                    sectionTitle: '10th Reunion — Khaki to Legacy',
                    sectionDesc: 'Join us as we celebrate a decade of music, camaraderie, and excellence.',
                    features: ['Drum Battle', 'Soccer Match', 'Games', 'Menu', 'Apartment/Pool Party', 'Meet & Greet'],
                    details: [
                        { label: 'Day 1 – 2nd October 2026', venue: 'Methodist Church Sport field', location: 'Isale Aro, Osogbo', time: '2PM – 5PM' },
                        { label: 'Friday Meet & Greet', venue: 'Royal Vintage Hotel', location: 'Ofatedo, Osogbo', time: '6PM PROMPT' },
                        { label: 'Day 2 – 3rd October 2026', venue: 'Fakunle Comprehensive High School Sports Ground', location: 'Fakunle, Osogbo', time: '9AM – 4PM' },
                        { label: 'Saturday After Party', venue: 'Royal Vintage Hotel', location: 'Ofatedo, Osogbo', time: '10pm till Mama calls' }
                    ],
                    ctaText: 'Let us know you\'re coming →',
                    flyerImage: null
                }
            ],
            pastEvents: [
                { year: '2025', title: '9th Reunion – En Paz (In Peace)', desc: 'Osogbo • 2-day event with performances and workshops.' },
                { year: '2024', title: '8th Reunion – Vittoria', desc: 'Osogbo • Featured inter-band collaboration and awards.' },
                { year: '2023', title: '7th Reunion – 7th Ensemble', desc: 'Osogbo • Celebrated with a grand concert and dinner.' },
                { year: '2022', title: '6th Reunion – Nostalgia: Homecoming', desc: 'Osogbo • Focused on team building and musical revival.' },
                { year: '2021', title: '5th Reunion – Unity', desc: 'Osogbo • Celebrated the bond of brotherhood and sisterhood.' },
                { year: '2020', title: '4th Reunion – Harmony', desc: 'Osogbo • A night of melodious reunion and shared memories.' },
                { year: '2019', title: '3rd Reunion – For the Love of Our Beats', desc: 'Osogbo • Celebrated the rhythm that unites us all.' },
                { year: '2018', title: '2nd Reunion – Festival of Sounds', desc: 'Osogbo • A vibrant festival showcasing diverse musical talents.' },
                { year: '2017', title: '1st Reunion – Festival of Sounds', desc: 'Osogbo • The inaugural reunion that started it all.' }
            ]
        },
        trivia: {
            heroTitle: 'Trivia Archive',
            heroDesc: 'Test your knowledge with our collection of past trivia questions and answers from GTMB events and gatherings.'
        }
    },
    trivia: [],
    executives: {
        president: [],
        major: [],
        provost: [],
        pro: [],
        dos: [],
        gs: [],
        ags: [],
        brass: [],
        bass: [],
        tenor: [],
        inaugural: []
    },
    customRoles: {},
    settings: {
        password: 'admin123'
    }
};

// ============================================================
// DATA LOADING
// ============================================================

export async function loadAllData() {
    try {
        const data = { pages: {}, trivia: [], executives: {}, customRoles: {}, settings: {} };

        const pagesSnapshot = await getDocs(collection(db, 'pages'));
        pagesSnapshot.forEach(doc => { data.pages[doc.id] = doc.data(); });

        const triviaSnapshot = await getDocs(query(collection(db, 'trivia'), orderBy('id')));
        triviaSnapshot.forEach(doc => { data.trivia.push(doc.data()); });

        const execDoc = await getDoc(doc(db, 'executives', 'all'));
        if (execDoc.exists()) data.executives = execDoc.data();

        if (data.executives.inaugural && Array.isArray(data.executives.inaugural)) {
            data.executives.inaugural = data.executives.inaugural.map(item => ({
                ...item, photo: item.photo || null
            }));
        }

        const customRolesDoc = await getDoc(doc(db, 'config', 'customRoles'));
        if (customRolesDoc.exists()) data.customRoles = customRolesDoc.data().roles || {};

        const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
        if (settingsDoc.exists()) data.settings = settingsDoc.data();

        return mergeWithDefaults(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}

export async function loadPage(pageName) {
    try {
        const docSnap = await getDoc(doc(db, 'pages', pageName));
        if (docSnap.exists()) return docSnap.data();
        return DEFAULT_DATA.pages[pageName] || null;
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        return DEFAULT_DATA.pages[pageName] || null;
    }
}

export async function loadTrivia() {
    try {
        const snapshot = await getDocs(query(collection(db, 'trivia'), orderBy('id')));
        const trivia = [];
        snapshot.forEach(doc => trivia.push(doc.data()));
        return trivia.length > 0 ? trivia : DEFAULT_DATA.trivia;
    } catch (error) {
        console.error('Error loading trivia:', error);
        return DEFAULT_DATA.trivia;
    }
}

export async function loadExecutives() {
    try {
        const docSnap = await getDoc(doc(db, 'executives', 'all'));
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.inaugural && Array.isArray(data.inaugural)) {
                data.inaugural = data.inaugural.map(item => ({
                    ...item, photo: item.photo || null
                }));
            }
            return data;
        }
        return DEFAULT_DATA.executives;
    } catch (error) {
        console.error('Error loading executives:', error);
        return DEFAULT_DATA.executives;
    }
}

export async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'admin'));
        if (docSnap.exists()) return docSnap.data();
        return { password: 'admin123' };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { password: 'admin123' };
    }
}

// ============================================================
// DATA SAVING
// ============================================================

export async function saveAllData(data) {
    try {
        const batch = writeBatch(db);

        for (const [pageName, pageData] of Object.entries(data.pages)) {
            batch.set(doc(db, 'pages', pageName), pageData, { merge: true });
        }

        const triviaRef = collection(db, 'trivia');
        const snapshot = await getDocs(triviaRef);
        snapshot.forEach(doc => batch.delete(doc.ref));
        for (const item of data.trivia) {
            batch.set(doc(triviaRef), item);
        }

        batch.set(doc(db, 'executives', 'all'), data.executives || {});
        batch.set(doc(db, 'config', 'customRoles'), { roles: data.customRoles || {} }, { merge: true });
        batch.set(doc(db, 'settings', 'admin'), data.settings, { merge: true });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

export async function savePage(pageName, pageData) {
    try {
        await setDoc(doc(db, 'pages', pageName), pageData, { merge: true });
        return true;
    } catch (error) {
        console.error(`Error saving page ${pageName}:`, error);
        return false;
    }
}

export async function addTriviaItem(question, answer) {
    try {
        const triviaRef = collection(db, 'trivia');
        const snapshot = await getDocs(triviaRef);
        let maxId = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.id && data.id > maxId) maxId = data.id;
        });
        const newId = maxId + 1;
        await addDoc(triviaRef, { id: newId, question, answer });
        return { id: newId, question, answer };
    } catch (error) {
        console.error('Error adding trivia:', error);
        return null;
    }
}

export async function deleteTriviaItem(questionId) {
    try {
        const triviaRef = collection(db, 'trivia');
        const snapshot = await getDocs(triviaRef);
        for (const docSnap of snapshot.docs) {
            if (docSnap.data().id === questionId) {
                await deleteDoc(docSnap.ref);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error deleting trivia:', error);
        return false;
    }
}

export async function updateExecutives(executivesData) {
    try {
        await setDoc(doc(db, 'executives', 'all'), executivesData);
        return true;
    } catch (error) {
        console.error('Error updating executives:', error);
        return false;
    }
}

export async function updatePassword(newPassword) {
    try {
        await setDoc(doc(db, 'settings', 'admin'), { password: newPassword }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        return false;
    }
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

export function subscribeToPage(pageName, callback) {
    return onSnapshot(doc(db, 'pages', pageName), (docSnap) => {
        callback(docSnap.exists() ? docSnap.data() : (DEFAULT_DATA.pages[pageName] || null));
    });
}

export function subscribeToTrivia(callback) {
    return onSnapshot(query(collection(db, 'trivia'), orderBy('id')), (snapshot) => {
        const trivia = [];
        snapshot.forEach(doc => trivia.push(doc.data()));
        callback(trivia);
    });
}

export function subscribeToExecutives(callback) {
    return onSnapshot(doc(db, 'executives', 'all'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.inaugural && Array.isArray(data.inaugural)) {
                data.inaugural = data.inaugural.map(item => ({
                    ...item, photo: item.photo || null
                }));
            }
            callback(data);
        } else {
            callback(DEFAULT_DATA.executives);
        }
    });
}

export function subscribeToCustomRoles(callback) {
    return onSnapshot(doc(db, 'config', 'customRoles'), (docSnap) => {
        callback(docSnap.exists() ? (docSnap.data().roles || {}) : {});
    });
}

// ============================================================
// MERGE
// ============================================================
function mergeWithDefaults(data) {
    const merged = {
        pages: { ...DEFAULT_DATA.pages, ...data.pages },
        trivia: data.trivia.length > 0 ? data.trivia : DEFAULT_DATA.trivia,
        executives: { ...DEFAULT_DATA.executives, ...data.executives },
        customRoles: { ...(data.customRoles || {}) },
        settings: { ...DEFAULT_DATA.settings, ...data.settings }
    };
    for (const role of Object.keys(DEFAULT_DATA.executives)) {
        if (!merged.executives[role]) merged.executives[role] = [];
    }
    for (const roleKey of Object.keys(merged.customRoles)) {
        if (!merged.executives[roleKey]) merged.executives[roleKey] = [];
    }
    if (Array.isArray(merged.executives.inaugural)) {
        merged.executives.inaugural = merged.executives.inaugural.map(item => ({
            ...item, photo: item.photo || null
        }));
    }
    return merged;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
    app, db, auth, storage,
    signIn, signOut, getCurrentUser, isAdmin, createAdminUser, onAuthChange,
    adminLogin,
    loadAllData, loadPage, loadTrivia, loadExecutives, loadSettings,
    loadCustomRoles, getAllRoles, loadInauguralExecutives,
    saveAllData, savePage, addTriviaItem, deleteTriviaItem,
    updateExecutives, updatePassword,
    addCustomRole, deleteCustomRole, saveCustomRoles,
    // Storage / photo helpers
    uploadImage, deleteImage, extractStoragePath,
    uploadInauguralPhoto, removeInauguralPhoto,
    subscribeToPage, subscribeToTrivia, subscribeToExecutives, subscribeToCustomRoles,
    escapeHtml, sanitizeHtml, showToast,
    DEFAULT_DATA, DEFAULT_EXECUTIVE_ROLES
};
