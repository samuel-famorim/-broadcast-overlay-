// Script utilitário para limpar presets caso o usuário precise (pode rodar no console do navegador)
function resetPresetsToSbcIdentity() {
    ['pessoas', 'time', 'barra', 'medaltable', 'problemstats', 'globalcolors'].forEach(type => {
        localStorage.removeItem('broadcast_preset_' + type);
    });
    alert('Presets limpos! Recarregue a página para os padrões aparecerem.');
}
