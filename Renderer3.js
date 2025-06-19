window.addEventListener('DOMContentLoaded', () => {
    const convertBtn = document.getElementById('convertBtn');
    const editor = document.getElementById('inputEditor');
    const output = document.getElementById('outputText');
  
    convertBtn.addEventListener('click', () => {
      const converted = editor.innerHTML;
      output.value = converted;
    });
  });
  
  function formatText(command) {
    const editor = document.getElementById('inputEditor');
    editor.focus(); // bring focus back to editor
  
    document.execCommand(command, false, null);
  }