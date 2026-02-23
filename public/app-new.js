// API base URL
const API_URL = '/api/products';

// DOM elements
const productForm = document.getElementById('productForm');
const productsList = document.getElementById('productsList');
const searchInput = document.getElementById('searchInput');
const addModal = document.getElementById('addModal');
const addProductBtn = document.getElementById('addProductBtn');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeBtns = document.querySelectorAll('.close');
const cancelBtn = document.getElementById('cancelBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const editImageInput = document.getElementById('editImage');
const editImagePreview = document.getElementById('editImagePreview');

let allProducts = [];

// Event listeners
addProductBtn.addEventListener('click', () => { addModal.style.display = 'block'; });
productForm.addEventListener('submit', handleAddProduct);
searchInput.addEventListener('input', handleSearch);
editForm.addEventListener('submit', handleUpdateProduct);
closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
cancelBtn.addEventListener('click', closeModal);
cancelAddBtn.addEventListener('click', closeAddModal);
window.addEventListener('load', loadProducts);

// Vista previa de imagen
imageInput.addEventListener('change', (e) => {
    previewImage(e.target, imagePreview);
});

editImageInput.addEventListener('change', (e) => {
    previewImage(e.target, editImagePreview);
});

function previewImage(input, previewElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Cargar productos
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar productos');
        
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar productos', 'error');
    }
}

// Mostrar productos
function displayProducts(products) {
    if (products.length === 0) {
        productsList.innerHTML = '<p class="empty-state">No hay productos registrados</p>';
        return;
    }

    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? `<div class="product-image"><img src="${product.image}" alt="${escapeHtml(product.name)}"></div>` : '<div class="product-image-placeholder">📦</div>'}
            <div class="product-content">
                <h3>${escapeHtml(product.name)}</h3>
                <span class="category">${escapeHtml(product.category)}</span>
                
                ${product.description ? `<p class="description">${escapeHtml(product.description)}</p>` : ''}
                
                <div class="product-info">
                    <div class="info-item">
                        <label>Cantidad</label>
                        <div class="value quantity ${product.quantity < 10 ? 'low' : ''}">
                            ${product.quantity} unidades
                        </div>
                    </div>
                    <div class="info-item">
                        <label>Precio Unitario</label>
                        <div class="value price">$${parseFloat(product.price).toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="info-item">
                        <label>Valor Total</label>
                        <div class="value price">$${(product.quantity * product.price).toFixed(2)}</div>
                    </div>
                    <div class="info-item">
                        <label>Creado</label>
                        <div class="value">${new Date(product.createdAt).toLocaleDateString('es-ES')}</div>
                    </div>
                </div>

                <div class="product-actions">
                    <button class="btn btn-warning" onclick="editProduct(${product.id})">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Agregar producto
async function handleAddProduct(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('quantity', parseInt(document.getElementById('quantity').value));
    formData.append('price', parseFloat(document.getElementById('price').value));
    formData.append('category', document.getElementById('category').value);
    
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Error al agregar producto');

        showAlert('Producto agregado exitosamente', 'success');
        productForm.reset();
        imagePreview.innerHTML = '';
        closeAddModal();
        await loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al agregar producto', 'error');
    }
}

// Editar producto
function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editDescription').value = product.description;
    document.getElementById('editQuantity').value = product.quantity;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;
    
    // Mostrar imagen actual si existe
    if (product.image) {
        editImagePreview.innerHTML = `<img src="${product.image}" alt="${escapeHtml(product.name)}">`;
    } else {
        editImagePreview.innerHTML = '';
    }
    
    editImageInput.value = '';

    editModal.style.display = 'block';
}

// Actualizar producto
async function handleUpdateProduct(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('description', document.getElementById('editDescription').value);
    formData.append('quantity', parseInt(document.getElementById('editQuantity').value));
    formData.append('price', parseFloat(document.getElementById('editPrice').value));
    formData.append('category', document.getElementById('editCategory').value);
    
    if (editImageInput.files[0]) {
        formData.append('image', editImageInput.files[0]);
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) throw new Error('Error al actualizar producto');

        showAlert('Producto actualizado exitosamente', 'success');
        closeModal();
        await loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al actualizar producto', 'error');
    }
}

// Eliminar producto
async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar producto');

        showAlert('Producto eliminado exitosamente', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar producto', 'error');
    }
}

// Buscar productos
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    displayProducts(filtered);
}

// Modal functions
function closeModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

function closeAddModal() {
    addModal.style.display = 'none';
    productForm.reset();
    imagePreview.innerHTML = '';
}

window.onclick = (event) => {
    if (event.target === editModal) {
        closeModal();
    }
    if (event.target === addModal) {
        closeAddModal();
    }
};

// Mostrar alertas
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('main');
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => alert.remove(), 3000);
}

// Escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
