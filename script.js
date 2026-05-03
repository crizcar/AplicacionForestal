// --- 1. VARIABLES GLOBALES ---
let records = [];
let backupRecords = [];

// --- 2. ESPERAR AL HTML (Blindaje) ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// --- 3. INICIALIZACIÓN ---
function init() {
    generateDiameterButtons();
    loadFromLocalStorage();
    renderList();
    setupActionButtons(); // Activa los botones de borrar
    setupExportButton();  // Activa el nuevo botón de Excel
}

// --- 4. BOTONES DE DIÁMETRO ---
function generateDiameterButtons() {
    const diameterGrid = document.getElementById('diameter-grid');
    if (!diameterGrid) return;
    
    diameterGrid.innerHTML = ''; 

    for (let i = 12; i <= 60; i += 2) {
        const btn = document.createElement('button');
        btn.className = 'btn-dia';
        btn.textContent = i;
        btn.onclick = () => addRecord(i);
        diameterGrid.appendChild(btn);
    }
}

// --- 5. LÓGICA DE CÁLCULO ---
function addRecord(diameterCm) {
    const lengthInput = document.getElementById('length-input');
    const qtyInput = document.getElementById('qty-input');

    const length = parseFloat(lengthInput.value.replace(',', '.'));
    if (isNaN(length) || length <= 0) {
        alert("Por favor, ingrese un largo válido primero (ej: 4.5).");
        lengthInput.focus();
        return;
    }

    const qty = parseInt(qtyInput.value) || 1;

    const diameterMeters = diameterCm / 100;
    const volume = Math.pow(diameterMeters, 2) * length * qty;

    const newRecord = {
        id: Date.now(),
        diameter: diameterCm,
        length: length,
        quantity: qty,
        volume: volume
    };

    saveBackup(); 
    records.push(newRecord);
    
    saveAndRender();
}

// --- 6. CONFIGURACIÓN DE BOTONES DE ACCIÓN ---
function setupActionButtons() {
    const btnDeleteLast = document.getElementById('btn-delete-last');
    const btnClearAll = document.getElementById('btn-clear-all');
    const btnUndo = document.getElementById('btn-undo');

    if (btnDeleteLast) {
        btnDeleteLast.onclick = () => {
            if (records.length === 0) return;
            saveBackup(); 
            records.pop(); 
            saveAndRender();
        };
    }

    if (btnClearAll) {
        btnClearAll.onclick = () => {
            if (records.length === 0) return;
            if (confirm("¿Estás seguro de eliminar TODOS los registros?")) {
                saveBackup();
                records = [];
                saveAndRender();
            }
        };
    }

    if (btnUndo) {
        btnUndo.onclick = () => {
            if (backupRecords.length >= 0) {
                records = [...backupRecords]; 
                saveAndRender();
                btnUndo.disabled = true; 
            }
        };
    }
}

// --- 7. EXPORTAR A EXCEL (CSV) ---
function setupExportButton() {
    const btnExport = document.getElementById('btn-export');
    if (!btnExport) return;

    btnExport.onclick = () => {
        if (records.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        const summary = {};
        let totalGeneralTrozos = 0;
        let totalGeneralVolumen = 0;

        records.forEach(record => {
            const key = `${record.diameter}-${record.length}`;
            
            if (!summary[key]) {
                summary[key] = { 
                    diameter: record.diameter, 
                    length: record.length, 
                    quantity: 0, 
                    volume: 0 
                };
            }
            
            const qty = parseInt(record.quantity) || 1;
            summary[key].quantity += qty;
            summary[key].volume += record.volume;
            
            totalGeneralTrozos += qty;
            totalGeneralVolumen += record.volume;
        });

        let csvContent = "Diametro (cm);Largo (m);Cantidad (trozos);Volumen (m3)\n";
        const summaryArray = Object.values(summary).sort((a, b) => a.diameter - b.diameter);

        summaryArray.forEach(row => {
            const d = row.diameter;
            const l = row.length.toString().replace('.', ','); 
            const q = row.quantity;
            const v = row.volume.toFixed(4).replace('.', ',');
            
            csvContent += `${d};${l};${q};${v}\n`;
        });

        csvContent += `\nTOTAL;;${totalGeneralTrozos};${totalGeneralVolumen.toFixed(4).replace('.', ',')}\n`;

        const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const fecha = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `Resumen_Carga_${fecha}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerVibration();
    };
}

// --- 8. RENDERIZADO Y PERSISTENCIA ---
function saveAndRender() {
    saveToLocalStorage();
    renderList();
    triggerVibration();
}

function saveBackup() {
    backupRecords = [...records];
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) btnUndo.disabled = false; 
}

function renderList() {
    const recordsList = document.getElementById('records-list');
    const totalVolumeEl = document.getElementById('total-volume');
    const totalQtyEl = document.getElementById('total-qty'); 
    
    if (!recordsList) return;
    recordsList.innerHTML = '';
    
    let totalAccumulated = 0;
    let totalTrozos = 0; 

    [...records].reverse().forEach((record, index) => {
        totalAccumulated += record.volume;
        const cantidadSegura = parseInt(record.quantity) || 1;
        totalTrozos += cantidadSegura; 

        const paloNum = records.length - index; 

        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        recordDiv.innerHTML = `
            <div class="record-info">
                <div class="record-details">#${paloNum} - D: <b>${record.diameter}</b>cm | L: ${record.length}m | Cant: ${cantidadSegura}</div>
            </div>
            <div class="record-vol">${record.volume.toFixed(4)} m³</div>
        `;
        recordsList.appendChild(recordDiv);
    });

    if (totalVolumeEl) totalVolumeEl.textContent = totalAccumulated.toFixed(4);
    if (totalQtyEl) totalQtyEl.textContent = totalTrozos;
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
    if (navigator.vibrate) navigator.vibrate(50);
}
