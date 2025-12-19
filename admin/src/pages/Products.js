import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardActionArea
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, DragIndicator as DragIcon, AddShoppingCart } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import DownloadIcon from '@mui/icons-material/Download';
import SearchBar from '../components/SearchBar/SearchBar';

const AVAILABLE_SIZES = ['unitalla', 'L', 'XL', '1XL', '2XL', '3XL', '4XL', '5XL'];

function SortableImage({ image, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        width: 100,
        height: 100,
        position: 'relative',
        '&:hover .delete-button': {
          opacity: 1
        },
        cursor: 'grab'
      }}
    >
      <CardActionArea {...attributes} {...listeners}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            p: 0.5,
            borderRadius: '4px 0 4px 0'
          }}
        >
          <DragIcon />
        </Box>
        <CardMedia
          component="img"
          image={image}
          alt={`Imagen ${index + 1}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <IconButton
          className="delete-button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image);
          }}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </CardActionArea>
    </Card>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    images: [],
    category: '',
    featured: false,
    inventory: {},
    variants: []
  });
  const [newImage, setNewImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        sizes: data.sizes || []
      };
    });
    setProducts(productsList);
    setFilteredProducts(productsList);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categoriesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCategories(categoriesList);
  };

  const handleOpen = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        ...product,
        price: product.price.toString(),
        images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
        images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
        inventory: product.inventory || {},
        variants: product.variants || []
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        images: [],
        category: '',
        featured: false,
        inventory: AVAILABLE_SIZES.reduce((acc, size) => {
          acc[`new__${size}`] = 0;
          acc[`new__${size}`] = 0;
          return acc;
        }, {}),
        variants: []
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleInventoryChange = (size, value) => {
    const sizeKey = `${selectedProduct ? selectedProduct.id : 'new'}__${size}`;
    setFormData({
      ...formData,
      inventory: {
        ...formData.inventory,
        [sizeKey]: parseInt(value) || 0
      }
    });
  };

  // --- Logic for Variants ---
  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          id: crypto.randomUUID(),
          color: '',
          images: [],
          inventory: AVAILABLE_SIZES.reduce((acc, size) => ({ ...acc, [size]: 0 }), {})
        }
      ]
    });
  };

  const handleRemoveVariant = (variantId) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter(v => v.id !== variantId)
    });
  };

  const handleVariantChange = (variantId, field, value) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId ? { ...v, [field]: value } : v
      )
    });
  };

  const handleVariantInventoryChange = (variantId, size, value) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId ? {
          ...v,
          inventory: {
            ...v.inventory,
            [size]: parseInt(value) || 0
          }
        } : v
      )
    });
  };

  const handleAddVariantImage = (variantId, newImageUrl) => {
    if (!newImageUrl.trim()) return;
    const urls = newImageUrl.split(/[,\n]/).map(url => url.trim()).filter(Boolean);

    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId ? {
          ...v,
          images: [...v.images, ...urls]
        } : v
      )
    });
  };

  const handleRemoveVariantImage = (variantId, imageUrl) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId ? {
          ...v,
          images: v.images.filter(img => img !== imageUrl)
        } : v
      )
    });
  };
  // --------------------------

  const handleAddImage = () => {
    if (!newImage.trim()) return;

    // Dividir las URLs por comas o saltos de línea
    const urls = newImage
      .split(/[,\n]/)
      .map(url => url.trim())
      .filter(url => url && !formData.images.includes(url));

    if (urls.length > 0) {
      setFormData(prevData => ({
        ...prevData,
        images: [...prevData.images, ...urls]
      }));
      setNewImage('');
    }
  };

  const handleRemoveImage = (imageToRemove) => {
    setFormData({
      ...formData,
      images: formData.images.filter(img => img !== imageToRemove),
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFormData((prevData) => {
        const oldIndex = prevData.images.indexOf(active.id);
        const newIndex = prevData.images.indexOf(over.id);

        return {
          ...prevData,
          images: arrayMove(prevData.images, oldIndex, newIndex)
        };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.name.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('El precio del producto es obligatorio y debe ser mayor a 0');
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      alert('Debe agregar al menos una imagen al producto');
      return;
    }
    if (!formData.category) {
      alert('La categoría del producto es obligatoria');
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (selectedProduct) {
        const filteredInventory = Object.entries(productData.inventory).reduce((acc, [key, value]) => {
          // If it's a new input (new__SIZE), rename it to properly match ID
          if (key.startsWith('new__')) {
            const realKey = `${selectedProduct.id}__${key.split('__')[1]}`;
            if (value > 0) acc[realKey] = value;
          } else {
            // Keep existing keys if they have value
            if (value > 0) acc[key] = value;
          }
          return acc;
        }, {});

        await updateDoc(doc(db, 'products', selectedProduct.id), {
          ...productData,
          inventory: filteredInventory
        });
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          inventory: {}
        });

        const formattedInventory = AVAILABLE_SIZES.reduce((acc, size) => {
          const stock = formData.inventory[`new__${size}`] || 0;
          if (stock > 0) {
            acc[`${docRef.id}__${size}`] = stock;
          }
          return acc;
        }, {});

        await updateDoc(docRef, {
          inventory: formattedInventory,
          variants: formData.variants || []
        });
      }
      handleClose();
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const newFeaturedStatus = !product.featured;

      // Optimistic update
      const updateList = (list) =>
        list.map(p => p.id === product.id ? { ...p, featured: newFeaturedStatus } : p);

      setProducts(prev => updateList(prev));
      setFilteredProducts(prev => updateList(prev));

      await updateDoc(doc(db, 'products', product.id), {
        featured: newFeaturedStatus
      });
    } catch (error) {
      console.error('Error updating featured status:', error);
      // Revert on error
      fetchProducts();
    }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Nombre', 'Precio', 'Descripción', 'Categoría', 'Imágenes', 'Inventario', 'Destacado'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => {
        const inventory = AVAILABLE_SIZES.map(size => {
          const sizeKey = `${product.id}__${size}`;
          const stock = product.inventory?.[sizeKey] || 0;
          return `${size}:${stock}`;
        }).filter(Boolean).join(';');

        const images = Array.isArray(product.images) ? product.images.join(';') : product.image || '';

        return [
          product.id,
          `"${product.name}"`,
          product.price,
          `"${product.description || ''}"`,
          `"${product.category || ''}"`,
          `"${images}"`,
          `"${inventory}"`,
          product.featured ? 'Sí' : 'No'
        ].join(',');
      })

    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'productos.csv';
    link.click();
  };

  const downloadJSON = () => {
    const jsonData = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || '',
      category: product.category || '',
      images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
      inventory: AVAILABLE_SIZES.reduce((acc, size) => {
        const sizeKey = `${product.id}__${size}`;
        const stock = product.inventory?.[sizeKey] || 0;
        if (stock > 0) {
          acc[size] = stock;
        }
        return acc;
      }, {}),
      featured: product.featured || false
    }));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'productos.json';
    link.click();
  };

  // Función para filtrar productos
  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (!searchValue) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const searchFields = [
        product.name,
        product.description,
        product.category,
        product.id,
        product.sku
      ];

      return searchFields.some(field =>
        field && field.toString().toLowerCase().includes(searchValue)
      );
    });

    setFilteredProducts(filtered);
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Productos
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadCSV}
            sx={{ mr: 1 }}
          >
            Descargar CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadJSON}
          >
            Descargar JSON
          </Button>
        </Box>
      </Box>
      <SearchBar
        searchTerm={searchTerm}
        onSearch={handleSearch}
        placeholder="Buscar por nombre, descripción, categoría, ID o SKU..."
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Agregar Producto
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Imágenes</TableCell>
              <TableCell>Inventario</TableCell>
              <TableCell>Destacado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  {product.variants && product.variants.length > 0 ? (
                    <Box>
                      <Typography variant="body2">{product.variants.length} variantes</Typography>
                      <Typography variant="caption" color="textSecondary">
                        ({product.variants.map(v => v.color).join(', ')})
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={{ height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <Typography variant="body2">
                        {Array.isArray(product.images) ? product.images.length : 1} imagen(es)
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {product.variants && product.variants.length > 0 ? (
                    <Typography variant="body2">Ver detalle en edición</Typography>
                  ) : (
                    AVAILABLE_SIZES.map(size => {
                      const sizeKey = `${product.id}__${size}`;
                      const stock = product.inventory?.[sizeKey] || 0;
                      if (stock > 0) {
                        return `${size}: ${stock}, `;
                      }
                      return null;
                    }).filter(Boolean)
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={product.featured || false}
                        onChange={() => handleToggleFeatured(product)}
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Editar Producto' : 'Agregar Producto'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? "El nombre es obligatorio" : ""}
          />
          <TextField
            margin="dense"
            name="price"
            label="Precio"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleChange}
            required
            error={!formData.price || parseFloat(formData.price) <= 0}
            helperText={(!formData.price || parseFloat(formData.price) <= 0) ? "El precio es obligatorio y debe ser mayor a 0" : ""}
          />
          <TextField
            margin="dense"
            name="description"
            label="Descripción"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Imágenes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label="URLs de las imágenes"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                multiline
                rows={3}
                placeholder="Ingresa las URLs de las imágenes separadas por comas o saltos de línea"
                helperText="Puedes agregar múltiples URLs separadas por comas o saltos de línea"
              />
              <Button
                onClick={handleAddImage}
                variant="contained"
                disabled={!newImage.trim()}
              >
                Agregar Imágenes
              </Button>
            </Box>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formData.images}
                strategy={horizontalListSortingStrategy}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    minHeight: '100px',
                    p: 1,
                    border: '1px dashed #ccc',
                    borderRadius: 1,
                    backgroundColor: '#fafafa'
                  }}
                >
                  {formData.images.map((image, index) => (
                    <SortableImage
                      key={image}
                      image={image}
                      index={index}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
          <FormControl fullWidth margin="dense" required error={!formData.category}>
            <InputLabel>Categoría</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Categoría"
            >
              <MenuItem value="">
                <em>Selecciona una categoría</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            {!formData.category && (
              <Typography color="error" variant="caption">
                La categoría es obligatoria
              </Typography>
            )}
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.featured}
                onChange={handleChange}
                name="featured"
              />
            }
            label="Producto Destacado"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Inventario por talla
            </Typography>
            <Grid container spacing={2}>
              {AVAILABLE_SIZES.map((size) => (
                <Grid item xs={6} sm={4} md={3} key={size}>
                  <TextField
                    label={`Talla ${size}`}
                    type="number"
                    value={formData.inventory[`${selectedProduct ? selectedProduct.id : 'new'}__${size}`] || 0}
                    onChange={(e) => handleInventoryChange(size, e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 3, mb: 2, borderTop: '1px solid #eee', pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Variantes / Colores</Typography>
              <Button variant="outlined" onClick={handleAddVariant} startIcon={<AddShoppingCart />}>
                Agregar Variante
              </Button>
            </Box>

            {formData.variants && formData.variants.map((variant, index) => (
              <Box key={variant.id} sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: '#f9f9f9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Variante #{index + 1}</Typography>
                  <IconButton color="error" onClick={() => handleRemoveVariant(variant.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <TextField
                  label="Color / Nombre de Variante"
                  value={variant.color}
                  onChange={(e) => handleVariantChange(variant.id, 'color', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  placeholder="Ej: Rojo, Azul Marino, Estampado floral"
                />

                {/* Variant Images */}
                <Typography variant="caption" display="block" gutterBottom>Imágenes de la variante</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="URL de imagen"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddVariantImage(variant.id, e.target.value);
                        e.target.value = '';
                        e.preventDefault();
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {variant.images && variant.images.map((img, i) => (
                    <Box key={i} sx={{ position: 'relative', width: 60, height: 60 }}>
                      <img src={img} alt="Variant" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'rgba(255,255,255,0.8)', p: 0.5 }}
                        onClick={() => handleRemoveVariantImage(variant.id, img)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* Variant Inventory */}
                <Typography variant="caption" display="block" gutterBottom>Inventario por talla</Typography>
                <Grid container spacing={1}>
                  {AVAILABLE_SIZES.map((size) => (
                    <Grid item xs={4} sm={3} key={size}>
                      <TextField
                        label={size}
                        type="number"
                        size="small"
                        value={variant.inventory?.[size] || 0}
                        onChange={(e) => handleVariantInventoryChange(variant.id, size, e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedProduct ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Products;