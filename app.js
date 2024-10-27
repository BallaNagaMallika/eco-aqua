const express = require('express');
const session = require('express-session');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');

const app = express();
const credentials = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const PORT = 9000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/parameters', (req, res) => {
    res.render('parameters');
});

app.get('/agriculture', (req, res) => {
    res.render('agriculture');
});

app.get('/electricity', (req, res) => {
    res.render('electricity');
});

app.get('/construction', (req, res) => {
    res.render('construction');
});

app.get('/domestic', (req, res) => {
    res.render('domestic');
});

app.get('/industry', (req, res) => {
    res.render('industry');
});

app.get('/reports', (req, res) => {
    res.render('reports');
});

app.get('/sensors', (req, res) => {
    res.render('sensors');
});

app.get('/standards', (req, res) => {
    res.render('standards');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/more-details', (req, res) => {
    res.render('buynow');
});

app.get('/sample-data', (req, res) => {
    res.render('sample-data');
});

app.get('/test', (req, res) => {
    res.render('test');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/sign_up', (req, res) => {
    res.render('sign_up');
});

app.get('/view-reports', (req, res) => {
    res.render('view_reports');
});

app.get('/view-report', async (req, res) => {
    try {
        const response = await fetch('https://run.mocky.io/v3/e17dc0d4-33cc-469f-a51d-2855ea40eda9');
        const data = await response.json();
        res.render('view_report', { report: data });
    } catch (error) {
        console.error('Error fetching the report:', error);
        res.status(500).send('Error fetching the report.');
    }
});

app.get('/download-sample-report', (req, res) => {
    const file = path.join(__dirname, 'public', 'sample-report.pdf');
    res.download(file, 'sample-report.pdf', (err) => {
        if (err) {
            console.error('Error downloading the file:', err);
            res.status(500).send('Error downloading the file.');
        } else {
            // Redirect to the view_reports page after the file download
            res.redirect('/view-reports');
        }
    });
});

app.post('/login_process', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (userSnapshot.empty) {
            return res.status(400).send('User not found');
        }
        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = user;
            req.session.user.uid = userDoc.id;
            res.redirect('/index');
        } else {
            res.status(400).send('Invalid password or user');
        }
    } catch (error) {
        res.status(500).send('Error occurred in login: ' + error.message);
    }
});

app.post('/signup_process', async (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password || !confirm_password) {
        return res.status(400).send('Name, email, and password are required');
    }

    if (password !== confirm_password) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const existing = await db.collection('users').where('email', '==', email).get();
        if (!existing.empty) {
            return res.status(400).send('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').add({
            name,
            email,
            password: hashedPassword
        });
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Error occurred: ' + error.message);
    }
});

app.get('/index', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index', { user: req.session.user });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
