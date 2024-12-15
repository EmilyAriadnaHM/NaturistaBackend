const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // Asegúrate de que este usuario exista y tenga permisos
    password: 'Contraseña123!',  // Cambia a la contraseña correcta
    database: 'Naturista' // Cambia al nombre correcto de la base de datos
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL.');
});


module.exports = connection;