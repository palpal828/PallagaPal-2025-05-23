const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

const DATA_FILE = path.join(__dirname, 'users.json');

// Middleware-ek
app.use(express.static('public'));
app.use(express.json());

// Kezdeti adatok betöltése vagy létrehozása
async function initializeData() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        // Ha nem létezik a fájl, letöltjük a kezdeti adatokat
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await response.json();
        await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
    }
}

// HTML oldal generálása
const generateHTML = (users) => `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Felhasználók Kezelése</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .user { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; }
        form { margin: 20px 0; padding: 20px; border: 1px solid #eee; }
        input { margin: 5px; padding: 5px; }
        .actions { margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Felhasználók Kezelése (Lokális JSON)</h1>
    
    <!-- Új felhasználó űrlap -->
    <form id="addForm">
        <h2>Új felhasználó</h2>
        <input type="number" name="id" placeholder="ID" required>
        <input type="text" name="name" placeholder="Név" required>
        <input type="text" name="username" placeholder="Felhasználónév" required>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit">Hozzáadás</button>
    </form>

    <!-- Felhasználók listája -->
    <div class="users">
        ${users.map(user => `
        <div class="user" data-id="${user.id}">
            <h3>${user.name} (ID: ${user.id})</h3>
            <p>Felhasználónév: ${user.username}</p>
            <p>Email: ${user.email}</p>
            <div class="actions">
                <button onclick="editUser(${user.id})">Szerkesztés</button>
                <button onclick="deleteUser(${user.id})">Törlés</button>
            </div>
        </div>
        `).join('')}
    </div>

    <script>
        // Új felhasználó hozzáadása
        document.getElementById('addForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            
            try {
                const response = await fetch('/ujuser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    alert('Felhasználó sikeresen hozzáadva!');
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(error.error);
                }
            } catch (error) {
                console.error('Hiba:', error);
            }
        });

        // Felhasználó törlése
        async function deleteUser(id) {
            if (confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) {
                try {
                    const response = await fetch(\`/delete/\${id}\`, { method: 'DELETE' });
                    if (response.ok) {
                        alert('Felhasználó sikeresen törölve!');
                        location.reload();
                    }
                } catch (error) {
                    console.error('Hiba:', error);
                }
            }
        }

        // Felhasználó szerkesztése
        async function editUser(id) {
            const userResponse = await fetch(\`/users/\${id}\`);
            const user = await userResponse.json();
            
            const newName = prompt('Új név:', user.name);
            const newUsername = prompt('Új felhasználónév:', user.username);
            const newEmail = prompt('Új email:', user.email);
            
            if (newName && newUsername && newEmail) {
                try {
                    const response = await fetch(\`/users/\${id}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            id: id,
                            name: newName,
                            username: newUsername,
                            email: newEmail
                        })
                    });
                    
                    if (response.ok) {
                        alert('Felhasználó sikeresen módosítva!');
                        location.reload();
                    }
                } catch (error) {
                    console.error('Hiba:', error);
                }
            }
        }
    </script>
</body>
</html>
`;

// Adatok olvasása a JSON fájlból
async function readUsers() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Hiba a fájl olvasásakor:', error);
        return [];
    }
}

// Adatok írása a JSON fájlba
async function writeUsers(users) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Hiba a fájl írásakor:', error);
    }
}

// GET / - Összes felhasználó megjelenítése
app.get('/', async (req, res) => {
    try {
        const users = await readUsers();
        res.send(generateHTML(users));
    } catch (error) {
        console.error('Hiba történt:', error);
        res.status(500).send('Hiba történt az adatok lekérésekor');
    }
});

// GET /users/:id - Egy felhasználó lekérése
app.get('/users/:id', async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id == req.params.id);
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Felhasználó nem található' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Hiba a felhasználó lekérésekor' });
    }
});

// POST /ujuser - Új felhasználó hozzáadása
app.post('/ujuser', async (req, res) => {
    try {
        if (!req.body.id) {
            return res.status(400).json({ error: 'Az ID kötelező!' });
        }

        const users = await readUsers();
        
        // Ellenőrizzük, hogy létezik-e már ilyen ID
        if (users.some(u => u.id == req.body.id)) {
            return res.status(400).json({ error: 'Ez az ID már foglalt!' });
        }

        users.push(req.body);
        await writeUsers(users);
        res.status(201).json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Hiba a felhasználó létrehozásakor' });
    }
});

// PUT /users/:id - Felhasználó módosítása
app.put('/users/:id', async (req, res) => {
    try {
        const users = await readUsers();
        const index = users.findIndex(u => u.id == req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }

        // Megtartjuk az eredeti ID-t
        req.body.id = parseInt(req.params.id);
        users[index] = req.body;
        await writeUsers(users);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Hiba a módosításnál' });
    }
});

// DELETE /delete/:id - Felhasználó törlése
app.delete('/delete/:id', async (req, res) => {
    try {
        let users = await readUsers();
        const initialLength = users.length;
        
        users = users.filter(u => u.id != req.params.id);
        
        if (users.length === initialLength) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }

        await writeUsers(users);
        res.json({ message: 'Felhasználó törölve' });
    } catch (error) {
        res.status(500).json({ error: 'Hiba a törlésnél' });
    }
});

// Szorgalmi: POST /reset - Visszaállítás alapértelmezett adatokra
app.post('/reset', async (req, res) => {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const defaultUsers = await response.json();
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultUsers, null, 2));
        res.json({ message: 'Adatok visszaállítva' });
    } catch (error) {
        res.status(500).json({ error: 'Hiba a visszaállításnál' });
    }
});

// Szerver indítása
initializeData().then(() => {
    app.listen(port, () => {
        console.log(`Szerver fut: http://localhost:${port}`);
    });
});