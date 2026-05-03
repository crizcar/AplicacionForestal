// --- 1. Variables Globales ---
let records = [];
let selectedDiameter = null;

// --- 2. Referencias al DOM ---
const diameterGrid = document.getElementById('diameter-grid');
const lengthInput = document.getElementById('length-input');
const qtyInput = document.getElementById('qty-input');
const btnAdd = document.getElementById('btn-add');
const btnClear = document.getElementById('btn-clear');
const recordsList = document.getElementById('records-list');
const totalVolumeEl = document.getElementById('total-volume');

// --- 3. Inicialización de la Aplicación ---
function init() {
    generateDiameterButtons();
    loadFromLocalStorage();
    renderList();
}

// --- 4. Lógica de Interfaz ---

// Genera los botones del 12 al 60 (avanzando de 2 en 2)
function generateDiameterButtons() {
    for (let i = 12; i <= 60; i += 2) {
        const btn = document.createElement('button');
        btn.className = 'btn-dia';
        btn.textContent = i;
        btn.onclick = () => selectDiameter(i, btn);
        diameterGrid.appendChild(btn);
    }
}

// Maneja la selección visual y lógica del diámetro
function selectDiameter(value, btnElement) {
    triggerVibration(); // Vibrar al tocar
    selectedDiameter = value;

    // Quitar la clase 'active' de todos los botones
    const allButtons = document.querySelectorAll('.btn-dia');
    allButtons.forEach(b => b.classList.remove('active'));

    // Resaltar el botón presionado
    btnElement.classList.add('active');
}

// --- 5. Lógica Principal: Agregar Carga ---
btnAdd.onclick = () => {
    // 1. Validaciones
    if (!selectedDiameter) {
        alert("Por favor, seleccione un diámetro primero.");
        return;
    }

    // Convertir coma a punto de forma automática para evitar errores de tipeo
    const lengthValue = lengthInput.value.replace(',', '.');
    const length = parseFloat(lengthValue);
    
    if (isNaN(length) || length <= 0) {
        alert("El largo ingresado no es válido. Ejemplos válidos: 4.5 o 4,5");
        return;
    }

    const qty = parseInt(qtyInput.value);
    if (isNaN(qty) || qty <= 0) {
        alert("La cantidad debe ser un número entero positivo.");
        return;
    }

    // 2. Cálculo (Fórmula: D² × largo × cantidad)
    // Usamos Math.pow() para elevar el diámetro al cuadrado
    const volume = Math.pow(selectedDiameter, 2) * length * qty;

    // 3. Crear el nuevo registro
    const newRecord = {
        id: Date.now(), // ID único basado en la fecha exacta
        diameter: selectedDiameter,
        length: length,
        quantity: qty,
        volume: volume
    };

    // 4. Guardar y actualizar
    records.push(newRecord);
    saveToLocalStorage();
    renderList();
    triggerVibration();

    // 5. Limpiar inputs de texto, pero mantener el diámetro seleccionado (útil por si los siguientes palos son iguales)
    lengthInput.value = '';
    qtyInput.value = '';
    lengthInput.focus(); 
};

// --- 6. Renderizado de la Lista y Cálculo del Total ---
function renderList() {
    recordsList.innerHTML = '';
    let totalAccumulated = 0;

    // Recorremos el arreglo de registros de atrás hacia adelante para que el más nuevo salga arriba
    [...records].reverse().forEach(record => {
        totalAccumulated += record.volume;

        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        
        // Plantilla HTML para cada registro
        recordDiv.innerHTML = `
            <div class="record-info">
                <span class="record-details">D: ${record.diameter}cm | L: ${record.length}m | Cant: ${record.quantity}</span>
                <span class="record-vol">Vol: ${record.volume.toLocaleString('es-CL')}</span>
            </div>
            <button class="btn-del" onclick="deleteRecord(${record.id})">Borrar</button>
        `;
        recordsList.appendChild(recordDiv);
    });

    // Actualizar el contador grande superior (formateado con separador de miles)
    totalVolumeEl.textContent = totalAccumulated.toLocaleString('es-CL');
}

// --- 7. Eliminar Registros ---
window.deleteRecord = function(id) {
    triggerVibration();
    // Filtramos el arreglo dejando todos menos el que coincida con el ID
    records = records.filter(record => record.id !== id);
    saveToLocalStorage();
    renderList();
};

// --- 8. Limpiar Toda la Carga ---
btnClear.onclick = () => {
    if (records.length === 0) return;
    
    // Pide confirmación para evitar borrados accidentales
    const confirmed = confirm("¿Estás seguro de que deseas eliminar TODOS los registros de este camión?");
    if (confirmed) {
        triggerVibration();
        records = [];
        saveToLocalStorage();
        renderList();
    }
};

// --- 9. Persistencia de Datos (LocalStorage) ---
function saveToLocalStorage() {
    // Convertimos el arreglo a texto (JSON) para poder guardarlo en el navegador
    localStorage.setItem('forestryData', JSON.stringify(records));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('forestryData');
    if (savedData) {
        records = JSON.parse(savedData); // Convertimos el texto de vuelta a arreglo
    }
}

// --- 10. Extras (Vibración Móvil) ---
function triggerVibration() {
    // Comprueba si el dispositivo soporta la API de vibración
    if (navigator.vibrate) {
        navigator.vibrate(50); // Vibra por 50 milisegundos
    }
}

// --- Arrancar el sistema ---
init();
