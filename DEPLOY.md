# 🚀 Desplegar en Render (Gratis)

## Paso 1: Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta (si no tienes)
2. Haz clic en "New repository"
3. Nombre: `inventario-web` (o lo que prefieras)
4. Marca "Public" (necesario para tier gratis de Render)
5. Click en "Create repository"

## Paso 2: Subir tu código a GitHub

Abre PowerShell en tu carpeta del proyecto y ejecuta:

```powershell
# Inicializar git (si no lo has hecho)
git init

# Añadir todos los archivos
git add .

# Hacer commit
git commit -m "Versión inicial del inventario"

# Configurar rama principal (reemplaza URL con la de tu repo)
git branch -M main
git remote add origin https://github.com/TU_USUARIO/inventario-web.git

# Subir a GitHub
git push -u origin main
```

Serás pedido que ingrese credenciales. Si es primera vez:
- Usuario: tu email o username de GitHub
- Contraseña: usa un "Personal Access Token" (ve a GitHub Settings > Developer settings > Personal access tokens)

## Paso 3: Desplegar en Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Haz clic en "New +" → "Web Service"
3. Selecciona "Connect a repository" y conecta tu repo de GitHub
4. **Configuración:**
   - **Name:** inventario-web
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (gratis)
5. Click en "Create Web Service"

## Paso 4: Esperar y acceder

Render va a desplegar automáticamente (toma 2-5 minutos). Verás una URL como:
```
https://inventario-web.onrender.com
```

✅ ¡Tu inventario está online!

---

## ⚠️ Nota importante: Almacenamiento de datos

**Problema:** Render tiene filesystem efímero, lo que significa que los archivos JSON (`data/products.json`) se pierden cada vez que redeploy.

### Solución 1: Usar MongoDB (Recomendado)
Instala MongoDB Atlas (gratis):
1. Ve a [mongodb.com/cloud](https://mongodb.com/cloud)
2. Crea un cluster gratis
3. Obtén la connection string
4. En tu proyecto, instala: `npm install mongoose`
5. Modifica `src/server.js` para usar MongoDB en lugar de JSON

### Solución 2: Guardar datos en GitHub
Sube los datos directamente al repo (menos escalable pero funciona para inventarios pequeños).

### Solución 3: Usar Render Disk (Pago)
Render ofrece discos persistentes, pero cuesta dinero ($7/mes).

---

## 🔄 Actualizar tu app

Cada vez que hagas cambios en tu PC:

```powershell
git add .
git commit -m "Descripción del cambio"
git push origin main
```

Render detectará el cambio y redesplegará automáticamente. ✨

