let records = [];
let backupRecords = []; // Guarda el estado anterior para la función "Deshacer"

const diameterGrid = document.getElementById('diameter-grid');
const lengthInput = document.getElementById('length-input');
const qtyInput = document.getElementById('qty-input');
const totalVolumeEl = document.getElementById('total-volume');
const recordsList = document.getElementById('records-list');

const btnDeleteLast = document.getElementById('btn-delete-last');
const btnClearAll = document.getElementById('btn-clear-all');
const btnUndo = document.getElementById('btn-undo');

function init() {
    generateDiameterButtons();
    loadFromLocalStorage();
    renderList();
}

function generateDiameterButtons() {
    for (let i = 16; i <= 60; i += 2) {
        const btn = document.createElement('button');
        btn.className = 'btn-dia';
        btn.textContent = i;
        // Al hacer clic, se ejecuta directamente la suma
        btn.onclick = () => addRecord(i);
        diameterGrid.appendChild(btn);
    }
}

function addRecord(diameterCm) {
    // 1. Validar el largo ingresado
    const lengthValue = lengthInput.value.replace(',', '.');
    const length = parseFloat(lengthValue);
    
    if (isNaN(length) || length <= 0) {
        alert("Por favor, ingrese un largo válido primero.");
        lengthInput.focus();
        return;
    }

    const qty = parseInt(qtyInput.value) || 1; // Si está vacío, asume 1

    // 2. Cálculo Teórico y Conversión de Unidades
    // El diámetro está en centímetros, pero el volumen se calcula en metros cúbicos.
    // Por lo tanto, dividimos el diámetro por 100.
    const diameterMeters = diameterCm / 100;
    
    // Volumen = (D_metros)² * largo * cantidad
    const volume = Math.pow(diameterMeters, 2) * length * qty;

    // 3. Crear y guardar registro
    const newRecord = {
        id: Date.now(),
        diameter: diameterCm,
        length: length,
        quantity: qty,
        volume: volume
    };

    saveBackup(); // Guardamos el estado actual por si luego queremos deshacer una eliminación futura
    records.push(newRecord);
    
    saveToLocalStorage();
    renderList();
    triggerVibration();
    
    // Nota: El largo y la cantidad NO se limpian, quedan fijos para el siguiente palo.
}

// --- LÓGICA DE ELIMINACIÓN Y DESHACER ---

btnDeleteLast.onclick = () => {
    if (records.length === 0) return;
    saveBackup(); // Copiamos el arreglo antes de modificarlo
    records.pop(); // Elimina el último elemento del arreglo
    saveToLocalStorage();
    renderList();
    triggerVibration();
};

btnClearAll.onclick = () => {
    if (records.length === 0) return;
    const confirmed = confirm("¿Eliminar todos los registros?");
    if (confirmed) {
        saveBackup();
        records = [];
        saveToLocalStorage();
        renderList();
        triggerVibration();
    }
};

btnUndo.onclick = () => {
    if (backupRecords.length >= 0) {
        records = [...backupRecords]; // Restauramos el arreglo desde la copia de seguridad
        saveToLocalStorage();
        renderList();
        // Desactivar el botón después de usarlo para evitar confusiones
        btnUndo.disabled = true; 
        triggerVibration();
    }
};

// Guarda una copia exacta del arreglo 'records' en 'backupRecords'
function saveBackup() {
    backupRecords = [...records];
    btnUndo.disabled = false; // Habilita el botón de deshacer
}

// --- RENDERIZADO Y PERSISTENCIA ---

function renderList() {
    recordsList.innerHTML = '';
    let totalAccumulated = 0;

    // Mostramos la lista invertida para ver el último palo agregado arriba
    [...records].reverse().forEach((record, index) => {
        totalAccumulated += record.volume;

        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        
        // Calculamos un índice visual para saber qué número de palo es
        const paloNum = records.length - index; 

        recordDiv.innerHTML = `
            <div class="record-info">
                <div class="record-details">#${paloNum} - D: <b>${record.diameter}</b>cm | L: ${record.length}m | Cant: ${record.quantity}</div>
            </div>
            <div class="record-vol">${record.volume.toFixed(4)} m³</div>
        `;
        recordsList.appendChild(recordDiv);
    });

    // Mostrar con 4 decimales para mayor precisión en madera
    totalVolumeEl.textContent = totalAccumulated.toFixed(4);
}

function saveToLocalStorage() {
    localStorage.setItem('forestryData', JSON.stringify(records));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('forestryData');
    if (savedData) {
        records = JSON.parse(savedData);
    }
}

function triggerVibration() {
    if (navigator.vibrate) { navigator.vibrate(50); }
}

init();
