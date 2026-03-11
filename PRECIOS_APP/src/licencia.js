import { invoke } from '@tauri-apps/api/core';

export async function validarLicencia() {
    try {
        const esValida = await invoke('validar_licencia');
        
        if (esValida) {
            return { valida: true };
        } else {
            return { valida: false, mensaje: "🔒 Aplicación no Registrada. Por favor, cargue una Licencia válida." };
        }
    } catch (error) {
        return { valida: false, mensaje: "⚠️ Error crítico validando software auténtico." };
    }
}
