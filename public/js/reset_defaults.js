// Script utilitário para resetar presets no servidor e localmente (pode rodar no console do navegador)
function resetPresetsToSbcIdentity() {
    ['pessoas', 'time', 'barra', 'medaltable', 'problemstats', 'globalcolors'].forEach(type => {
        localStorage.removeItem('broadcast_preset_' + type);
    });
    if (typeof socket !== 'undefined') {
        socket.emit('reset-presets');
    }
    alert('Presets resetados para o padrão SBC em todos os painéis!');
}
