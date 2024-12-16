require('dotenv').config(); // Importar dotenv para cargar las variables de entorno

const mysql = require('mysql2');

// Crear la conexión utilizando las variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,       // Host desde el .env
    user: process.env.DB_USER,       // Usuario desde el .env
    password: process.env.DB_PASSWORD, // Contraseña desde el .env
    database: process.env.DB_NAME,   // Base de datos desde el .env
    port: process.env.DB_PORT        // Puerto desde el .env
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL.');
});

module.exports = connection;
