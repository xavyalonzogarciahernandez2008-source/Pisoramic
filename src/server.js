require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para guardar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes: jpeg, jpg, png, gif'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Conectar a MongoDB
const mongoOptions = {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ Conectado a MongoDB exitosamente');
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.error('Verifica que:');
    console.error('1. Tu IP esté en la lista de acceso de MongoDB Atlas');
    console.error('2. Las credenciales sean correctas');
    console.error('3. Tu conexión a internet sea estable');
    process.exit(1);
  });

// Definir esquema y modelo de Producto
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  unit: {
    type: String,
    default: 'unidades'
  },
  image: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

// API Routes

// GET todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET producto por ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST crear nuevo producto
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, quantity, price, category, unit } = req.body;

    if (!name || quantity === undefined || price === undefined) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Campos requeridos: name, quantity, price' });
    }

    const newProduct = new Product({
      name,
      description: description || '',
      quantity: parseInt(quantity),
      price: parseFloat(price),
      category: category || 'General',
      unit: unit || 'unidades',
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT actualizar producto
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, quantity, price, category, unit } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.quantity = quantity !== undefined ? parseInt(quantity) : product.quantity;
    product.price = price !== undefined ? parseFloat(price) : product.price;
    product.category = category || product.category;
    product.unit = unit || product.unit;

    // Manejar imagen
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (product.image) {
        const oldImagePath = path.join(__dirname, '../public', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = `/uploads/${req.file.filename}`;
    }

    product.updatedAt = new Date();
    await product.save();
    res.json(product);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imagen si existe
    if (product.image) {
      const imagePath = path.join(__dirname, '../public', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Producto eliminado', product });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de inventario corriendo en http://localhost:${PORT}`);
});
