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
    const recordsList = document.getElementById('records-list');
    const totalVolumeEl = document.getElementById('total-volume');
    // 1. Referencia al nuevo elemento en el HTML
    const totalQtyEl = document.getElementById('total-qty'); 
    
    recordsList.innerHTML = '';
    
    let totalAccumulated = 0;
    let totalTrozos = 0; // 2. Nueva variable para sumar los trozos

    // Mostrar del último al primero
    [...records].reverse().forEach((record, index) => {
        // 3. Vamos sumando el volumen y la cantidad de trozos
        totalAccumulated += record.volume;
        totalTrozos += record.quantity; 

        const paloNum = records.length - index; 

        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        recordDiv.innerHTML = `
            <div class="record-info">
                <div class="record-details">#${paloNum} - D: <b>${record.diameter}</b>cm | L: ${record.length}m | Cant: ${record.quantity}</div>
            </div>
            <div class="record-vol">${record.volume.toFixed(4)} m³</div>
        `;
        recordsList.appendChild(recordDiv);
    });

    // 4. Actualizamos los textos en la pantalla
    totalVolumeEl.textContent = totalAccumulated.toFixed(4);
    
    // Si el elemento existe, actualiza el número
    if (totalQtyEl) {
        totalQtyEl.textContent = totalTrozos;
    }
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
// Agrega esta llamada dentro de tu función init() existente
// setupExportButton();

// --- 11. EXPORTAR A EXCEL (CSV) ---
function setupExportButton() {
    const btnExport = document.getElementById('btn-export');
    if (!btnExport) return;

    btnExport.onclick = () => {
        if (records.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        // 1. Agrupar los datos para hacer el resumen
        const summary = {};
        let totalGeneralTrozos = 0;
        let totalGeneralVolumen = 0;

        records.forEach(record => {
            // Creamos una "llave" única combinando diámetro y largo (ej: "20-4.5")
            const key = `${record.diameter}-${record.length}`;
            
            // Si esta combinación no existe en el resumen, la creamos
            if (!summary[key]) {
                summary[key] = { 
                    diameter: record.diameter, 
                    length: record.length, 
                    quantity: 0, 
                    volume: 0 
                };
            }
            
            // Sumamos las cantidades a ese grupo específico
            const qty = parseInt(record.quantity) || 1;
            summary[key].quantity += qty;
            summary[key].volume += record.volume;
            
            // Sumamos a los totales generales
            totalGeneralTrozos += qty;
            totalGeneralVolumen += record.volume;
        });

        // 2. Preparar el texto CSV
        // Fundamento: En Chile/Latinoamérica, Excel usa punto y coma (;) para separar columnas 
        // y coma (,) para los decimales.
        let csvContent = "Diametro (cm);Largo (m);Cantidad (trozos);Volumen (m3)\n";

        // Convertimos el resumen a un arreglo y lo ordenamos de menor a mayor diámetro
        const summaryArray = Object.values(summary).sort((a, b) => a.diameter - b.diameter);

        summaryArray.forEach(row => {
            const d = row.diameter;
            // Cambiamos el punto por coma para que el Excel en español lo lea como número decimal
            const l = row.length.toString().replace('.', ','); 
            const q = row.quantity;
            const v = row.volume.toFixed(4).replace('.', ',');
            
            csvContent += `${d};${l};${q};${v}\n`;
        });

        // Añadir una fila final con los totales absolutos
        csvContent += `\nTOTAL;;${totalGeneralTrozos};${totalGeneralVolumen.toFixed(4).replace('.', ',')}\n`;

        // 3. Crear el archivo y forzar la descarga en el celular
        // El "\ufeff" asegura que los caracteres especiales se lean bien (BOM UTF-8)
        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        // Generar un nombre de archivo con la fecha actual
        const fecha = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `Resumen_Carga_${fecha}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerVibration();
    };
}
init();
