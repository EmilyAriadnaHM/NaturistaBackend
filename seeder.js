const connection = require('./db'); // Asegúrate de que el archivo de conexión esté en el mismo directorio

const scriptSQL = `
-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS Ejemplo;
USE Ejemplo;

-- Crear tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(255) NOT NULL,
    descripcion TEXT
);

-- Insertar datos en categorias
INSERT INTO categorias (id_categoria, nombre_categoria, descripcion) VALUES
(1, 'Suplementos Alimenticios', 'Productos que ayudan a complementar la dieta diaria con vitaminas, minerales y nutrientes.'),
(2, 'Tés e Infusiones Naturales', 'Variedad de tés de hierbas y plantas que promueven la relajación, digestión y el bienestar.'),
(3, 'Vitaminas', 'Vitaminas y minerales para el bienestar.'),
(4, 'Cosméticos Naturales', 'Productos de belleza hechos con ingredientes naturales. Sin químicos añadidos'),
(5, 'Alimentos Orgánicos', 'Alimentos cultivados sin químicos ni pesticidas.'),
(6, 'Cuidado natural para el cabello', 'Productos naturales para mantener el cabello saludable y libre de químicos dañinos.'),
(7, 'Cuidado de la piel y belleza natural', 'Productos naturales como cremas, aceites, jabones, para mantener la piel sana e hidratada, sin químicos agresivos'),
(8, 'Productos para la salud digestiva', 'Suplementos y productos naturales que apoyan una digestión saludable y alivian malestares.'),
(9, 'Aceites esenciales y aromaterapia', 'Aceites naturales que se utilizan para mejorar el bienestar emocional y físico a través de la aromaterapia.'),
(10, 'Productos para la desintoxicación', 'Suplementos y tés naturales que ayudan a purificar el cuerpo y eliminar toxinas para mejorar la salud general.'),
(11, 'Ola como estás', 'Bien. Y tu');

-- Crear tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT
);

-- Insertar datos en clientes
INSERT INTO clientes (id_cliente, nombre, apellido, correo, telefono, direccion) VALUES
(1, 'Juan', 'Pérez', 'juan.perez@example.com', '555-1234', 'Calle Falsa 123, Ciudad, País'),
(2, 'María', 'Gómez', 'maria.gomez@example.com', '555-5678', 'Avenida Siempre Viva 456, Ciudad, País'),
(3, 'Carlos', 'Martínez', 'carlos.martinez@example.com', '555-8765', 'Boulevard de los Sueños 789, Ciudad, País'),
(4, 'Lucía', 'Hernández', 'lucia.hernandez@example.com', '555-4321', 'Calle del Sol 321, Ciudad, País'),
(5, 'Pedro', 'López', 'pedro.lopez@example.com', '555-6789', 'Pasaje de la Luna 654, Ciudad, País');

-- Crear tabla productos
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    cantidad INT NOT NULL,
    id_categoria INT NOT NULL,
    imagen_url VARCHAR(255),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Insertar datos en productos
INSERT INTO productos (id_producto, nombre_producto, precio, cantidad, id_categoria, imagen_url) VALUES
(3, 'Jabon de manos con flores primavera', 95.00, 4, 4, 'http://192.168.137.85:3000/uploads/producto-1733865350551.jpg'),
(10, 'Jabon de arroz', 80.00, 25, 4, 'http://192.168.137.85:3000/uploads/producto-1733865178330.jpg'),
(15, 'Omega 3 premium', 381.00, 26, 3, 'http://192.168.137.85:3000/uploads/producto-1733865125920.jpg');

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL
);

-- Insertar datos en usuarios
INSERT INTO usuarios (id_usuario, nombre_usuario, contraseña, rol) VALUES
(1, 'emily', '$2a$10$IoDpw1xmJMSGvkY3U/Iv7uP0jbNfPGU0Mk5SLbyl.mFSnkiJ7HlUO', 'cliente'),
(2, 'Allan M', '$2a$10$jDP9G6GTdvR2cB7oFvUGxOzYkTdxCM1G5VeZqn.RBe99HB6RUstTC', 'cliente');

-- Crear tabla carrito_items
CREATE TABLE IF NOT EXISTS carrito_items (
    id_item INT AUTO_INCREMENT PRIzMARY KEY,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Insertar datos en carrito_items
INSERT INTO carrito_items (id_item, id_usuario, id_producto, cantidad) VALUES
(4, 7, 3, 2),
(10, 7, 40, 2),
(15, 6, 3, 1),
(23, 7, 3, 3),
(26, 20, 42, 1);`;

connection.query(scriptSQL, (err, results) => {
    if (err) {
        console.error('Error al ejecutar el script:', err);
        return;
    }
    console.log('Base de datos y tablas creadas correctamente.');
});

connection.end();
