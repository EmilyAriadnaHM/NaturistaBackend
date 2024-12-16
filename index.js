const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const connection = require('./db');
const app = express();
app.use(cors());

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://127.0.0.1:3000',
  'http://localhost:8081',
  'http://192.168.137.80', //movil
  'http://192.168.1.165', //movil
  'http://192.168.1.94', //pc
  'exp://192.168.1.165:19000',
  'http://192.168.137.206',
  'http://10.168.3.11',
  'https://naturistaweb.onrender.com'
];

// Configuración de CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para analizar JSON
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes desde la carpeta 'uploads'
app.use('/uploads', express.static('uploads'));

// Clave secreta para JWT
const JWT_SECRET = 'tu_secreto_aqui';

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `producto-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Ruta para registrar usuarios
app.post('/api/usuarios', async (req, res) => {
  const { nombre_usuario, contraseña, rol = 'cliente' } = req.body;
  if (!nombre_usuario || !contraseña) {
    return res.status(400).json({ error: 'Los campos nombre_usuario y contraseña son obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const sql = 'INSERT INTO usuarios (nombre_usuario, contraseña, rol) VALUES (?, ?, ?)';
    connection.query(sql, [nombre_usuario, hashedPassword, rol], (err, results) => {
      if (err) {
        console.error('Error al insertar el usuario:', err);
        return res.status(500).json({ error: 'Error al insertar el usuario' });
    }
    res.status(201).json({ 
        message: 'Usuario registrado con éxito', 
        id: results.insertId, 
        nombre_usuario,
        rol
    });
    });
    } catch (error) {
    console.error('Error al encriptar la contraseña:', error);
    res.status(500).json({ error: 'Error al encriptar la contraseña' });
    }
    });

// Ruta para inicio de sesión
app.post('/api/login', async (req, res) => {
  const { nombre_usuario, contraseña } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE nombre_usuario = ?';

  connection.query(sql, [nombre_usuario], async (err, results) => {
    if (err) {
      console.error('Error al buscar el usuario:', err);
      return res.status(500).json({ error: 'Error al buscar el usuario' });
    }

    if (results.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];
    const match = await bcrypt.compare(contraseña, user.contraseña);
    if (!match) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
        { id: user.id_usuario, nombre_usuario: user.nombre_usuario, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ 
        message: 'Inicio de sesión exitoso', 
        token, 
        rol: user.rol 
    });
  });
});

// Middleware para verificar el token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado: token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Acceso denegado: token no válido' });

      req.user = user;
      next();
  });
}

// CRUD Productos con imágenes
app.post('/api/productos', authenticateToken, upload.single('imagen'), (req, res) => {
  const { nombre_producto, precio, cantidad, id_categoria } = req.body;
  const imagen_url = req.file ? `https://naturistaweb.onrender.com/uploads/${req.file.filename}` : null;
  

  const sql = 'INSERT INTO productos (nombre_producto, precio, cantidad, id_categoria, imagen_url) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [nombre_producto, precio, cantidad, id_categoria, imagen_url], (err, results) => {
    if (err) {
      console.error('Error al agregar producto:', err);
      return res.status(500).json({ error: 'Error al agregar producto' });
  }
  res.status(201).json({ message: 'Producto agregado con éxito', id_producto: results.insertId, nombre_producto, precio, cantidad, id_categoria });
});
});

app.get('/api/productos', authenticateToken, (req, res) => {
  const sql = 'SELECT id_producto, nombre_producto, precio, cantidad, id_categoria, imagen_url FROM productos';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
  }
  res.json(results);
});
});

app.put('/api/productos/:id', authenticateToken, upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, cantidad, id_categoria } = req.body;
  const imagen_url = req.file ? `https://naturistaweb.onrender.com/uploads/${req.file.filename}` : null;
  

  // Construir la consulta SQL y los parámetros
  const baseSql = 'UPDATE productos SET nombre_producto = ?, precio = ?, cantidad = ?, id_categoria = ?';
  const params = [nombre_producto, precio, cantidad, id_categoria];

  let sql = baseSql; // Inicializamos la consulta base
  if (imagen_url) {
    sql += ', imagen_url = ?';
    params.push(imagen_url);
  }

  sql += ' WHERE id_producto = ?';
  params.push(id);

  // Ejecutar la consulta SQL
  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ 
      message: 'Producto actualizado con éxito',
      id_producto: id,
      nombre_producto,
      precio,
      cantidad,
      id_categoria,
      imagen_url
    });
  });
});

app.delete('/api/productos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM productos WHERE id_producto = ?';
  connection.query(sql, [id], (err, results) => {
    if (err) {
        console.error('Error al eliminar producto:', err);
        return res.status(500).json({ error: 'Error al eliminar producto' });
    }
    res.status(200).json({ message: 'Producto eliminado con éxito' });
});
});

// CRUD para categorías
app.post('/api/categorias', authenticateToken, (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    const sql = 'INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)';

    connection.query(sql, [nombre_categoria, descripcion], (err, results) => {
        if (err) {
            console.error('Error al agregar categoría:', err);
            return res.status(500).json({ error: 'Error al agregar categoría' });
        }
        res.status(201).json({ message: 'Categoría agregada con éxito', id_categoria: results.insertId, nombre_categoria, descripcion });
    });
});

app.get('/api/categorias', authenticateToken, (req, res) => {
    const sql = 'SELECT id_categoria, nombre_categoria, descripcion FROM categorias';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener categorías:', err);
            return res.status(500).json({ error: 'Error al obtener categorías' });
        }
        res.json(results);
    });
});

app.put('/api/categorias/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre_categoria, descripcion } = req.body;
    const sql = 'UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?';

    connection.query(sql, [nombre_categoria, descripcion, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'El nombre de la categoría ya existe' });
            }
            console.error('Error al actualizar categoría:', err);
            return res.status(500).json({ error: 'Error al actualizar categoría' });
        }
    
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
    
        res.json({ message: 'Categoría actualizada con éxito', id_categoria: id, nombre_categoria, descripcion });
    });
    
});

app.delete('/api/categorias/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM categorias WHERE id_categoria = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar categoría:', err);
            return res.status(500).json({ error: 'Error al eliminar categoría' });
        }
        res.status(200).json({ message: 'Categoría eliminada con éxito' });
    });
});

// CRUD para clientes
app.post('/api/clientes', authenticateToken, (req, res) => {
    const { nombre, apellido, correo, telefono, direccion } = req.body;
    const sql = 'INSERT INTO clientes (nombre, apellido, correo, telefono, direccion) VALUES (?, ?, ?, ?, ?)';

    connection.query(sql, [nombre, apellido, correo, telefono, direccion], (err, results) => {
        if (err) {
            console.error('Error al agregar cliente:', err);
            return res.status(500).json({ error: 'Error al agregar cliente' });
        }
        res.status(201).json({ message: 'Cliente agregado con éxito', id_cliente: results.insertId, nombre, apellido, correo, telefono, direccion });
    });
});

app.get('/api/clientes', authenticateToken, (req, res) => {
    const sql = 'SELECT id_cliente, nombre, apellido, correo, telefono, direccion FROM clientes';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener clientes:', err);
            return res.status(500).json({ error: 'Error al obtener clientes' });
        }
        res.json(results);
    });
});

app.put('/api/clientes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, direccion } = req.body;
    const sql = 'UPDATE clientes SET nombre = ?, apellido = ?, correo = ?, telefono = ?, direccion = ? WHERE id_cliente = ?';

    connection.query(sql, [nombre, apellido, correo, telefono, direccion, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar cliente:', err);
            return res.status(500).json({ error: 'Error al actualizar cliente' });
        }
        res.json({ message: 'Cliente actualizado con éxito', id_cliente: id, nombre, apellido, correo, telefono, direccion });
    });
});

app.delete('/api/clientes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM clientes WHERE id_cliente = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar cliente:', err);
            return res.status(500).json({ error: 'Error al eliminar cliente' });
        }
        res.status(200).json({ message: 'Cliente eliminado con éxito' });
    });
});

// Agregar producto al carrito
app.post('/api/carrito', authenticateToken, (req, res) => {
  const { id_producto, cantidad } = req.body;

  // Validar datos
  if (!id_producto || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'id_producto y cantidad son obligatorios, cantidad debe ser > 0' });
  }

  const sql = 'INSERT INTO carrito_items (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)';
  connection.query(sql, [req.user.id, id_producto, cantidad], (err, results) => {
    if (err) {
      console.error('Error al agregar al carrito:', err);
      return res.status(500).json({ error: 'Error al agregar al carrito' });
    }

    res.status(201).json({ 
      message: 'Producto agregado al carrito con éxito', 
      id_item: results.insertId,
      id_producto,
      cantidad
    });
  });
});

// Obtener productos del carrito del usuario
app.get('/api/carrito', authenticateToken, (req, res) => {
  // Unir la tabla carrito con la de productos para obtener detalle del producto
  const sql = `
    SELECT 
      ci.id_item, 
      ci.id_producto, 
      ci.cantidad AS cantidad_en_carrito, 
      p.nombre_producto, 
      p.precio, 
      p.imagen_url, 
      p.cantidad AS stock
    FROM carrito_items ci
    JOIN productos p ON ci.id_producto = p.id_producto
    WHERE ci.id_usuario = ?
  `;

  connection.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error('Error al obtener el carrito:', err);
      return res.status(500).json({ error: 'Error al obtener el carrito' });
    }

    res.json(results);
  });
});

// Actualizar la cantidad de un producto en el carrito
app.put('/api/carrito/:id_item', authenticateToken, (req, res) => {
  const { id_item } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'La cantidad es obligatoria y debe ser mayor que 0' });
  }


  const sql = 'UPDATE carrito_items SET cantidad = ? WHERE id_item = ? AND id_usuario = ?';
  connection.query(sql, [cantidad, id_item, req.user.id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el carrito:', err);
      return res.status(500).json({ error: 'Error al actualizar el carrito' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado en tu carrito' });
    }

    res.json({ message: 'Cantidad actualizada con éxito', id_item, cantidad });
  });
});

// Eliminar un producto del carrito
app.delete('/api/carrito/:id_item', authenticateToken, (req, res) => {
  const { id_item } = req.params;

  // Asegurarse de eliminar solo ítems pertenecientes al usuario actual
  const sql = 'DELETE FROM carrito_items WHERE id_item = ? AND id_usuario = ?';
  connection.query(sql, [id_item, req.user.id], (err, results) => {
    if (err) {
      console.error('Error al eliminar del carrito:', err);
      return res.status(500).json({ error: 'Error al eliminar del carrito' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado en tu carrito' });
    }

    res.json({ message: 'Producto eliminado del carrito con éxito', id_item });
  });
});

app.post('/api/comprar', authenticateToken, (req, res) => {
  const { carrito } = req.body;

  // Validar si el carrito está vacío
  if (!carrito || carrito.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  //operación de compra (reducir stock, generar factura, etc.)
  const errores = [];
  const operacionesExitosas = [];

  carrito.forEach((item) => {
    const sql = `
      UPDATE productos 
      SET cantidad = cantidad - ? 
      WHERE id_producto = ? AND cantidad >= ?`;

    connection.query(
      sql,
      [item.cantidad_en_carrito, item.id_producto, item.cantidad_en_carrito],
      (err, results) => {
        if (err) {
          console.error(`Error al procesar producto ID ${item.id_producto}:`, err);
          errores.push({ id_producto: item.id_producto, error: err.message });
          return;
        }

        if (results.affectedRows === 0) {
          errores.push({
            id_producto: item.id_producto,
            error: 'No hay suficiente stock.',
          });
        } else {
          operacionesExitosas.push(item);
        }

        if (operacionesExitosas.length + errores.length === carrito.length) {
          if (errores.length > 0) {
            return res.status(200).json({
              message: 'Compra procesada parcialmente.',
              errores,
              operacionesExitosas,
            });
          }

          res.status(200).json({
            message: 'Compra realizada con éxito.',
            operacionesExitosas,
          });
        }
      }
    );
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor iniciado en el puerto ${PORT}');
});



