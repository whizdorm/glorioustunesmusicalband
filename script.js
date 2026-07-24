// ============================================================
// GTMB - Firebase Script (Full Data + Auth)
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
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// ============================================================
// FIREBASE CONFIG - REPLACE WITH YOUR OWN
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

// Enable offline persistence
try {
    await enableIndexedDbPersistence(db);
    console.log('🔥 Firestore persistence enabled');
} catch (err) {
    console.warn('⚠️ Persistence not available:', err);
}

// ============================================================
// EXPORT INSTANCES
// ============================================================
export { app, db, auth };

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
// AUTHENTICATION FUNCTIONS
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
            ctaDesc: 'Whether you\'re an ex-NYSC band member or a passionate supporter, there\'s a place for you at GTMB.'
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
    trivia: [
        { id: 1, question: 'The princess of the Zambouli Tribe, who was renamed queen of the jungle who would not live on a plain, what sequence?', answer: 'Sheena Hills' },
        { id: 2, question: 'It was so large to be hung on a shelf so it stood on the floor for ninety years. It was even taller than the owner.', answer: 'Grandfather\'s Clock' },
        { id: 3, question: 'Award winning Netflix Lacasa de Papels theme song.', answer: 'Bella Ciao' },
        { id: 4, question: 'Canis Lupus familiaries that is hot.', answer: 'Hotdog' },
        { id: 5, question: 'Mother is Gold in an indigenous dialect.', answer: 'Iya ni Wura' },
        { id: 6, question: 'Neither consider the things of the old, Behold, I will do a new thing; now it shall?', answer: 'Spring Forth' },
        { id: 7, question: 'Unidade in (English) the language of the colonial masters.', answer: 'Unity' },
        { id: 8, question: 'Sequence that goes with the German tune \'Valderi Valdera\'.', answer: 'Scotland' }
    ],
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
        tenor: []
    },
    settings: {
        password: 'admin123'
    }
};

// ============================================================
// DATA LOADING FUNCTIONS
// ============================================================

export async function loadAllData() {
    try {
        const data = { pages: {}, trivia: [], executives: {}, settings: {} };

        // Load pages
        const pagesRef = collection(db, 'pages');
        const pagesSnapshot = await getDocs(pagesRef);
        pagesSnapshot.forEach(doc => {
            data.pages[doc.id] = doc.data();
        });

        // Load trivia
        const triviaRef = collection(db, 'trivia');
        const triviaSnapshot = await getDocs(query(triviaRef, orderBy('id')));
        triviaSnapshot.forEach(doc => {
            data.trivia.push(doc.data());
        });

        // Load executives
        const execDoc = await getDoc(doc(db, 'executives', 'all'));
        if (execDoc.exists()) {
            data.executives = execDoc.data();
        }

        // Load settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
        if (settingsDoc.exists()) {
            data.settings = settingsDoc.data();
        }

        // Merge with defaults
        return mergeWithDefaults(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}

export async function loadPage(pageName) {
    try {
        const docRef = doc(db, 'pages', pageName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return DEFAULT_DATA.pages[pageName] || null;
    } catch (error) {
        console.error(`Error loading page ${pageName}:`, error);
        return DEFAULT_DATA.pages[pageName] || null;
    }
}

export async function loadTrivia() {
    try {
        const triviaRef = collection(db, 'trivia');
        const snapshot = await getDocs(query(triviaRef, orderBy('id')));
        const trivia = [];
        snapshot.forEach(doc => {
            trivia.push(doc.data());
        });
        return trivia.length > 0 ? trivia : DEFAULT_DATA.trivia;
    } catch (error) {
        console.error('Error loading trivia:', error);
        return DEFAULT_DATA.trivia;
    }
}

export async function loadExecutives() {
    try {
        const docRef = doc(db, 'executives', 'all');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return DEFAULT_DATA.executives;
    } catch (error) {
        console.error('Error loading executives:', error);
        return DEFAULT_DATA.executives;
    }
}

export async function loadSettings() {
    try {
        const docRef = doc(db, 'settings', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { password: 'admin123' };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { password: 'admin123' };
    }
}

// ============================================================
// DATA SAVING FUNCTIONS
// ============================================================

export async function saveAllData(data) {
    try {
        const batch = writeBatch(db);

        // Save pages
        for (const [pageName, pageData] of Object.entries(data.pages)) {
            const docRef = doc(db, 'pages', pageName);
            batch.set(docRef, pageData);
        }

        // Save trivia - clear and re-add
        const triviaRef = collection(db, 'trivia');
        const snapshot = await getDocs(triviaRef);
        snapshot.forEach(doc => batch.delete(doc.ref));

        for (const item of data.trivia) {
            const newDocRef = doc(triviaRef);
            batch.set(newDocRef, item);
        }

        // Save executives
        const execRef = doc(db, 'executives', 'all');
        batch.set(execRef, data.executives);

        // Save settings
        const settingsRef = doc(db, 'settings', 'admin');
        batch.set(settingsRef, data.settings);

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

export async function savePage(pageName, pageData) {
    try {
        const docRef = doc(db, 'pages', pageName);
        await setDoc(docRef, pageData);
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
        const docRef = await addDoc(triviaRef, { id: newId, question, answer });
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
            const data = docSnap.data();
            if (data.id === questionId) {
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
        const docRef = doc(db, 'executives', 'all');
        await setDoc(docRef, executivesData);
        return true;
    } catch (error) {
        console.error('Error updating executives:', error);
        return false;
    }
}

export async function updatePassword(newPassword) {
    try {
        const docRef = doc(db, 'settings', 'admin');
        await setDoc(docRef, { password: newPassword });
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
    const docRef = doc(db, 'pages', pageName);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(DEFAULT_DATA.pages[pageName] || null);
        }
    });
}

export function subscribeToTrivia(callback) {
    const triviaRef = collection(db, 'trivia');
    return onSnapshot(query(triviaRef, orderBy('id')), (snapshot) => {
        const trivia = [];
        snapshot.forEach(doc => trivia.push(doc.data()));
        callback(trivia);
    });
}

// ============================================================
// MERGE FUNCTION
// ============================================================
function mergeWithDefaults(data) {
    const merged = {
        pages: { ...DEFAULT_DATA.pages, ...data.pages },
        trivia: data.trivia.length > 0 ? data.trivia : DEFAULT_DATA.trivia,
        executives: { ...DEFAULT_DATA.executives, ...data.executives },
        settings: { ...DEFAULT_DATA.settings, ...data.settings }
    };
    // Ensure all executive roles exist
    for (const role of Object.keys(DEFAULT_DATA.executives)) {
        if (!merged.executives[role]) merged.executives[role] = [];
    }
    return merged;
}

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
    app, db, auth,
    signIn, signOut, getCurrentUser, isAdmin, createAdminUser, onAuthChange,
    adminLogin,
    loadAllData, loadPage, loadTrivia, loadExecutives, loadSettings,
    saveAllData, savePage, addTriviaItem, deleteTriviaItem,
    updateExecutives, updatePassword,
    subscribeToPage, subscribeToTrivia,
    escapeHtml, showToast,
    DEFAULT_DATA
};