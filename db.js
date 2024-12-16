require('dotenv').config(); // Importar dotenv para cargar las variables de entorno

const mysql = require('mysql2');

// Crear un pool de conexiones utilizando las variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // Host desde el .env
    user: process.env.DB_USER,       // Usuario desde el .env
    password: process.env.DB_PASSWORD, // Contraseña desde el .env
    database: process.env.DB_NAME,   // Base de datos desde el .env
    port: process.env.DB_PORT,       // Puerto desde el .env
    waitForConnections: true,        // Espera hasta que haya una conexión disponible
    connectionLimit: 10,             // Límite de conexiones simultáneas (puedes ajustarlo según tus necesidades)
    queueLimit: 0                    // Límite de la cola de conexiones (0 significa sin límite)
});

// Usar el pool para ejecutar consultas
pool.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
        console.error('Error al ejecutar la consulta:', err.stack);
        return;
    }
    console.log('Resultados de la consulta:', results);
});

// Exportar el pool para usarlo en otras partes de la aplicación
module.exports = pool;
