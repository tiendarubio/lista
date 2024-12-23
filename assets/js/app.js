// Módulo: Variables Globales de API
// ===================================
// API Key para Google Sheets
const googleSheetsApiKey = 'AIzaSyAvWylEG-2jRlgYXZBEcPtAWvV-fyBPZgo';

// API Key o Access Key para JSONBin.io
const jsonBinApiKey = '$2a$10$qmB/eQH.qDgT2BmwIf98seyFbgFIhAns2U3g8jsMah7/Z4XApa.IS';  // Reemplaza con la API Key correcta

// Identificadores de Bin en JSONBin.io
const binIds = {
    lista_sexta_calle: '67619af2ad19ca34f8dcbcad',
    lista_centro_comercial: '67619b51acd3cb34a8bb3a22',
    lista_avenida_morazan: '67619b66ad19ca34f8dcbcef',
    sala_venta_sexta_calle: '67619b0cad19ca34f8dcbcc0',  // Identificador para Sala de Venta Sexta Calle
    sala_venta_centro_comercial: '67619b2de41b4d34e46703c2'  // Identificador para Sala de Venta Centro Comercial
};


// Módulo: Función para cargar listas desde JSONBin.io
// ====================================================
// Cargar lista de pedidos desde JSONBin.io basado en la tienda seleccionada
function loadListFromJSONBin(store) {
    const binId = binIds[store];
    
    return fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
            'X-Access-Key': jsonBinApiKey  // Aquí usas la API Key de JSONBin.io
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => data.record.data || [])
    .catch(error => {
        console.error('Error al cargar los datos desde JSONBin.io:', error);
        return [];
    });
}

// Módulo: Función para cargar productos desde Google Sheets
// =========================================================
// Cargar productos desde Google Sheets utilizando la API
function loadProductsFromGoogleSheets() {
    const sheetId = '1b5B9vp0GKc4T_mORssdj-J2vgc-xEO5YAFkcrVX-nHI';
    const sheetRange = 'bd!A2:C5000';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=${googleSheetsApiKey}`;
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => data.values || [])
        .catch(error => {
            console.error('Error al cargar los datos de Google Sheets:', error);
            return [];
        });
}

// Módulo: Función para guardar listas en JSONBin.io
// =================================================
// Guardar lista de pedidos en JSONBin.io basado en la tienda seleccionada
function saveListToJSONBin(store, listData) {
    const binId = binIds[store];
    const payload = { data: listData };
    
    return fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': jsonBinApiKey  // Aquí usas la API Key de JSONBin.io
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos guardados correctamente:', data);
        return data;
    })
    .catch(error => {
        console.error('Error al guardar los datos en JSONBin.io:', error);
    });
}

// Módulo: Función de inicialización de la página (DOM Loaded)
// ============================================================
// Manejar eventos y carga de datos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const store = urlParams.get('store');

    let storeName = '';

    if (store) {
        loadListFromJSONBin(store).then(renderList).then(updateButtonsState);

        const storeTitle = {
            'lista_sexta_calle': 'SEXTA CALLE - Lista de Pedido a Bodega',
            'lista_avenida_morazan': 'AVENIDA MORAZÁN - Lista de Pedido a Bodega',
            'lista_centro_comercial': 'CENTRO COMERCIAL - Lista de Pedido a Bodega',
            'sala_venta_sexta_calle': 'SEXTA CALLE - Lista de Pedido a Sala de Venta',
            'sala_venta_centro_comercial': 'CENTRO COMERCIAL - Lista de Pedido a Sala de Venta'
        };
        storeName = storeTitle[store];
        document.getElementById('storeTitle').textContent = `Tienda: ${storeName}`;

        // Manejo del botón de cambio de tipo de lista
        const switchButton = document.getElementById('switchToSalaVenta');
        if (['lista_sexta_calle', 'lista_centro_comercial'].includes(store)) {
            switchButton.style.display = 'block';
            switchButton.onclick = () => {
                const newStoreType = store.replace('lista_', 'sala_venta_');
                window.location.href = `lista.html?store=${newStoreType}`;
            };
        } else if (['sala_venta_sexta_calle', 'sala_venta_centro_comercial'].includes(store)) {
            switchButton.style.display = 'block';
            switchButton.onclick = () => {
                const newStoreType = store.replace('sala_venta_', 'lista_');
                window.location.href = `lista.html?store=${newStoreType}`;
            };
        } else {
            switchButton.style.display = 'none';
        }
    }

    // Módulo: Búsqueda y sugerencias en Google Sheets
    // ===============================================
    const searchInput = document.getElementById('searchInput');
    const suggestions = document.getElementById('suggestions');
    const clearListButton = document.getElementById('clearList');
    const saveListButton = document.getElementById('saveList');
    const generatePDFButton = document.getElementById('generatePDF');
    const printPDFButton = document.getElementById('printPDF');

    let currentFocus = -1;

    // Búsqueda en Google Sheets mientras se escribe
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        suggestions.innerHTML = '';
        currentFocus = -1;
        
        // Cargar productos desde Google Sheets y filtrar los resultados
        loadProductsFromGoogleSheets().then(rows => {
            const filteredData = rows.filter(row => row[0].toLowerCase().includes(searchTerm));
            if (searchTerm) {
                filteredData.forEach((producto, index) => {
                    const suggestionItem = document.createElement('li');
                    suggestionItem.className = 'list-group-item';
                    suggestionItem.textContent = producto[0];
                    suggestionItem.addEventListener('click', () => addProductToPedido(producto));
                    suggestions.appendChild(suggestionItem);
                });
            }
        });
    });

    // Módulo: Navegación con teclado en las sugerencias
    // =================================================
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestions.getElementsByTagName('li');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                items[currentFocus].click();
            }
        }
    });

    // Añadir la clase "active" a los elementos seleccionados
    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('active');
    }

    // Quitar la clase "active" de los elementos
    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('active');
        }
    }

    // Módulo: Función para añadir productos al pedido
    // ===============================================
    function addProductToPedido(producto) {
        const pedidoList = document.getElementById('pedidoList');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td></td>
            <td>${producto[0]}</td>
            <td><input type="text" class="form-control" placeholder="Cantidad/Comentario"></td>
            <td>${producto[1]}</td>
            <td>${producto[2]}</td>
            <td><button class="btn btn-danger btn-custom btn-sm" onclick="removeProduct(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
        `;

        // Insertar la nueva fila en la primera posición de la tabla
        pedidoList.insertBefore(row, pedidoList.firstChild);

        // Actualizar los números de las filas
        updateRowNumbers();

        searchInput.value = '';
        suggestions.innerHTML = '';

        // Posicionar el cursor en el campo "Cantidad/Comentario"
        const commentInput = row.querySelector('input');
        commentInput.focus();

        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchInput.focus();
            }
        });

        updateButtonsState(); // Actualiza el estado de los botones
    }

    // Módulo: Función para guardar la lista de productos
    // ==================================================
    saveListButton.addEventListener('click', () => {
        const pedidoList = document.getElementById('pedidoList');
        const listData = [];
        const rows = pedidoList.getElementsByTagName('tr');

        Array.from(rows).forEach((row) => {
            const productData = {
                PRODUCTO: row.cells[1].innerText,
                CANTIDAD_COMENTARIO: row.cells[2].querySelector('input').value,
                CODIGO: row.cells[3].innerText,
                BODEGA: row.cells[4].innerText
            };
            listData.push(productData);
        });

        saveListToJSONBin(store, listData);

        Swal.fire('Guardado', 'La lista ha sido guardada.', 'success');
    });

    // Módulo: Función para eliminar productos
    // =======================================
    window.removeProduct = function(button) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                const row = button.parentElement.parentElement;
                row.remove();
                updateRowNumbers();
                updateListDataInJSONBin();
                updateButtonsState(); // Actualiza el estado de los botones
                Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
            }
        });
    };

    // Módulo: Función para limpiar la lista de pedidos
    // ================================================
    clearListButton.addEventListener('click', () => {
        const pedidoList = document.getElementById('pedidoList');
        if (pedidoList.rows.length === 0) {
            Swal.fire('Error', 'No hay productos en la lista para eliminar.', 'error');
            return;
        }

        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar lista'
        }).then((result) => {
            if (result.isConfirmed) {
                pedidoList.innerHTML = '';
                updateListDataInJSONBin();
                updateButtonsState(); // Actualiza el estado de los botones
                Swal.fire('Eliminada', 'La lista ha sido eliminada.', 'success');
            }
        });
    });

    // Módulo: Función para generar un PDF de la lista de pedidos
    // ==========================================================
    generatePDFButton.addEventListener('click', () => {
        const pedidoList = document.getElementById('pedidoList');
        if (pedidoList.rows.length === 0) {
            Swal.fire('Error', 'No hay productos en la lista para generar PDF.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf; // Accede a jsPDF desde el módulo UMD
        const doc = new jsPDF();
        doc.text(`Tienda: ${storeName}`, 10, 10); // Añadir el nombre de la tienda en el PDF
        doc.autoTable({ 
            startY: 20, // Añade un poco de espacio después del título de la tienda
            head: [['#', 'Producto', 'Cantidad/Comentario', 'Código', 'Bodega']],
            body: Array.from(pedidoList.rows).map(row => [
                row.cells[0].innerText,
                row.cells[1].innerText,
                row.cells[2].querySelector('input').value,
                row.cells[3].innerText,
                row.cells[4].innerText
            ])
        });
        doc.save('lista_pedido.pdf');
    });

    // Módulo: Función para imprimir un PDF de la lista de pedidos
    // ===========================================================
    printPDFButton.addEventListener('click', () => {
        const pedidoList = document.getElementById('pedidoList');
        if (pedidoList.rows.length === 0) {
            Swal.fire('Error', 'No hay productos en la lista para imprimir.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Tienda: ${storeName}`, 10, 10);
        doc.autoTable({
            startY: 20,
            head: [['#', 'Producto', 'Cantidad/Comentario', 'Código', 'Bodega']],
            body: Array.from(pedidoList.rows).map(row => [
                row.cells[0].innerText,
                row.cells[1].innerText,
                row.cells[2].querySelector('input').value,
                row.cells[3].innerText,
                row.cells[4].innerText
            ])
        });
        doc.output('dataurlnewwindow'); // Abre el PDF en una nueva ventana
    });

    // Módulo: Función para actualizar los datos en JSONBin.io
    // ========================================================
    function updateListDataInJSONBin() {
        const pedidoList = document.getElementById('pedidoList');
        const listData = [];
        const rows = pedidoList.getElementsByTagName('tr');

        Array.from(rows).forEach((row) => {
            const productData = {
                PRODUCTO: row.cells[1].innerText,
                CANTIDAD_COMENTARIO: row.cells[2].querySelector('input').value,
                CODIGO: row.cells[3].innerText,
                BODEGA: row.cells[4].innerText
            };
            listData.push(productData);
        });

        saveListToJSONBin(store, listData);
    }

    // Módulo: Función para actualizar los números de fila
    // ===================================================
    function updateRowNumbers() {
        const rows = document.getElementById('pedidoList').getElementsByTagName('tr');
        Array.from(rows).forEach((row, index) => {
            row.cells[0].innerText = rows.length - index; // Mostrar el número de fila en orden descendente
        });
    }

    // Módulo: Función para actualizar el estado de los botones
    // ========================================================
    function updateButtonsState() {
        const pedidoList = document.getElementById('pedidoList');
        const hasItems = pedidoList.rows.length > 0;
        clearListButton.disabled = !hasItems;
        generatePDFButton.disabled = !hasItems;
        printPDFButton.disabled = !hasItems;
    }

    // Módulo: Función para renderizar la lista de productos
    // =====================================================
    function renderList(listData) {
        const pedidoList = document.getElementById('pedidoList');
        pedidoList.innerHTML = '';
        listData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.PRODUCTO}</td>
                <td><input type="text" class="form-control" value="${item.CANTIDAD_COMENTARIO}" placeholder="Cantidad/Comentario"></td>
                <td>${item.CODIGO}</td>
                <td>${item.BODEGA}</td>
                <td><button class="btn btn-danger btn-custom btn-sm" onclick="removeProduct(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
            `;
            pedidoList.insertBefore(row, pedidoList.firstChild);
        });
        updateRowNumbers();
    }
});
