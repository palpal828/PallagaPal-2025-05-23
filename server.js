const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware a statikus fájlok kiszolgálásához 
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send("működik a backend hehe")
});
app.get('/users', async (req, res) => {
    try {
        // Felhasználók lekérése a JSONPlaceholder API-ról
        const response = await axios.get('https://jsonplaceholder.typicode.com/users');
        const users = response.data;

        // HTML generálása
        let html = `
        <!DOCTYPE html>
        <html lang="hu">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Felhasználók listája</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
                h1 { color: #333; }
                .user { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
                .user h2 { margin-top: 0; color: #444; }
                .user p { margin: 5px 0; }
                .address, .company { margin-left: 20px; color: #666; }
            </style>
        </head>
        <body>
            <h1>Felhasználók listája</h1>
        `;

        // Felhasználók hozzáadása a HTML-hez
        users.forEach(user => {
            html += `
            <div class="user">
                <h2>${user.name}</h2>
                <p><strong>Felhasználónév:</strong> ${user.username}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Telefonszám:</strong> ${user.phone}</p>
                <p><strong>Weboldal:</strong> <a href="${user.website}" target="_blank">${user.website}</a></p>
                
                <div class="address">
                    <h3>Cím</h3>
                    <p>${user.address.street}, ${user.address.suite}</p>
                    <p>${user.address.city}, ${user.address.zipcode}</p>
                    <p><strong>Koordináták:</strong> ${user.address.geo.lat}, ${user.address.geo.lng}</p>
                </div>
                
                <div class="company">
                    <h3>Cég</h3>
                    <p><strong>Név:</strong> ${user.company.name}</p>
                    <p><strong>Mottó:</strong> ${user.company.catchPhrase}</p>
                    <p><strong>Tevékenység:</strong> ${user.company.bs}</p>
                </div>
            </div>
            `;
        });

        html += `</body></html>`;

        res.send(html);
    } catch (error) {
        console.error('Hiba történt:', error);
        res.status(500).send('Hiba történt az adatok lekérése közben');
    }
});

// Szerver indítása
app.listen(port, () => {
    console.log(`A szerver fut a http://localhost:${port} címen`);
});