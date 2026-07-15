document.addEventListener('DOMContentLoaded', () => {
    const leftKeyboardEl = document.getElementById('left-keyboard');
    const rightKeyboardEl = document.getElementById('right-keyboard');
    const keyPaletteEl = document.getElementById('key-palette');
    const rawKeymapEl = document.getElementById('raw-keymap');
    const saveBtn = document.getElementById('save-btn');
    const pushBtn = document.getElementById('push-btn');
    
    let fullFileContent = '';
    let parsedBindings = [];
    let selectedKeyEl = null;
    
    // ZMK keycodes for palette
    const commonKeys = [
        '&none', '&kp A', '&kp B', '&kp C', '&kp D', '&kp E', '&kp F', '&kp G', '&kp H', '&kp I', '&kp J', '&kp K', '&kp L', '&kp M', '&kp N', '&kp O', '&kp P', '&kp Q', '&kp R', '&kp S', '&kp T', '&kp U', '&kp V', '&kp W', '&kp X', '&kp Y', '&kp Z',
        '&kp N1', '&kp N2', '&kp N3', '&kp N4', '&kp N5', '&kp N6', '&kp N7', '&kp N8', '&kp N9', '&kp N0', 
        '&kp MINUS', '&kp PLUS', '&kp EQUAL', '&kp BSLH', '&kp SEMI', '&kp SQT', '&kp COMMA', '&kp DOT', '&kp FSLH', '&kp GRAVE',
        '&kp ESC', '&kp TAB', '&kp LSHFT', '&kp RSHFT', '&kp LCTRL', '&kp RCTRL', '&kp LALT', '&kp RALT', '&kp RGUI', '&kp LGUI',
        '&kp RET', '&kp SPACE', '&kp BSPC', '&kp DEL', '&kp HOME', '&kp END', '&kp PG_UP', '&kp PG_DN', '&kp UP', '&kp DOWN', '&kp LEFT', '&kp RIGHT',
        '&mo 1', '&mo 2'
    ];

    // Layout configuration
    const leftLayout = [
        { row: 0, cols: 6 },
        { row: 1, cols: 6 },
        { row: 2, cols: 6 },
        { row: 3, cols: 6 },
        { row: 4, cols: 6, isThumb: true },
        { row: 5, cols: 4, isThumb: true, offset: 2 },
        { row: 6, cols: 2, isThumb: true, offset: 4 },
        { row: 7, cols: 2, isThumb: true, offset: 4 }
    ];

    const rightLayout = [
        { row: 0, cols: 6 },
        { row: 1, cols: 6 },
        { row: 2, cols: 6 },
        { row: 3, cols: 6 },
        { row: 4, cols: 6, isThumb: true },
        { row: 5, cols: 4, isThumb: true },
        { row: 6, cols: 2, isThumb: true },
        { row: 7, cols: 2, isThumb: true }
    ];

    // Initialize palette
    commonKeys.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key';
        keyEl.draggable = true;
        keyEl.textContent = key.replace('&kp ', '').replace('&', '');
        keyEl.dataset.keycode = key;
        
        keyEl.addEventListener('dragstart', handleDragStart);
        keyPaletteEl.appendChild(keyEl);
    });

    async function loadKeymap() {
        try {
            const res = await fetch('/api/keymap');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            fullFileContent = data.content;
            rawKeymapEl.value = fullFileContent;
            parseAndRenderKeymap(fullFileContent);
        } catch (err) {
            showToast('Error loading keymap: ' + err.message, true);
        }
    }

    function parseAndRenderKeymap(content) {
        // Find default layer bindings block
        const defaultLayerRegex = /default_layer\s*\{[^}]*bindings\s*=\s*<([^>]+)>/;
        const match = content.match(defaultLayerRegex);
        
        if (!match) {
            showToast('Could not find default_layer bindings', true);
            return;
        }

        const bindingsText = match[1];
        // Extract all keycodes (matches &something and optional argument)
        const bindingRegex = /&[a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)?/g;
        parsedBindings = [...bindingsText.matchAll(bindingRegex)].map(m => m[0].trim().replace(/\s+/g, ' '));
        
        renderKeyboard(leftKeyboardEl, leftLayout, 0);
        renderKeyboard(rightKeyboardEl, rightLayout, 38); // Left has 38 keys
    }

    function renderKeyboard(container, layout, startIndex) {
        container.innerHTML = '';
        let currentIndex = startIndex;

        layout.forEach(rowDef => {
            const rowEl = document.createElement('div');
            rowEl.className = `kb-row ${rowDef.isThumb ? 'thumb-row' : ''}`;
            
            // Add spacer blocks for left thumb cluster offsets
            if (rowDef.offset) {
                for (let i = 0; i < rowDef.offset; i++) {
                    const spacer = document.createElement('div');
                    spacer.style.width = '3.5rem';
                    rowEl.appendChild(spacer);
                }
            }

            for (let c = 0; c < rowDef.cols; c++) {
                const keycode = parsedBindings[currentIndex];
                const keyEl = document.createElement('div');
                
                keyEl.className = `key ${keycode === '&none' ? 'empty' : ''}`;
                keyEl.textContent = keycode ? keycode.replace('&kp ', '').replace('&', '') : '';
                keyEl.dataset.index = currentIndex;
                keyEl.dataset.keycode = keycode || '&none';
                
                keyEl.addEventListener('dragover', handleDragOver);
                keyEl.addEventListener('dragleave', handleDragLeave);
                keyEl.addEventListener('drop', handleDrop);
                // Allow removing keys via right click
                keyEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    updateKey(keyEl, '&none');
                });
                
                keyEl.addEventListener('click', (e) => {
                    if (selectedKeyEl) selectedKeyEl.classList.remove('selected');
                    if (selectedKeyEl === keyEl) {
                        selectedKeyEl = null; // Toggle off
                    } else {
                        selectedKeyEl = keyEl;
                        selectedKeyEl.classList.add('selected');
                    }
                });

                rowEl.appendChild(keyEl);
                currentIndex++;
            }
            container.appendChild(rowEl);
        });
    }

    // Drag and Drop Handlers
    let draggedKeycode = null;

    function handleDragStart(e) {
        draggedKeycode = e.target.dataset.keycode;
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (draggedKeycode) {
            updateKey(e.currentTarget, draggedKeycode);
        }
    }

    function updateKey(keyEl, newKeycode) {
        const index = parseInt(keyEl.dataset.index);
        parsedBindings[index] = newKeycode;
        
        keyEl.dataset.keycode = newKeycode;
        keyEl.textContent = newKeycode.replace('&kp ', '').replace('&', '');
        
        if (newKeycode === '&none') {
            keyEl.classList.add('empty');
        } else {
            keyEl.classList.remove('empty');
        }
        
        rebuildKeymapText();
    }

    function rebuildKeymapText() {
        // We will reconstruct the bindings string and replace it in the fullFileContent
        const defaultLayerRegex = /(default_layer\s*\{[^}]*bindings\s*=\s*<)([^>]+)(>)/;
        
        // Format nicely
        let newBindingsText = '\n';
        let i = 0;
        
        // Reconstruct left and right interwoven? No, they are sequential in the array.
        // We can just chunk them to look decent, or just output one per line, but ZMK users like columns.
        // For simplicity, we just output them in a big grid
        for (let row = 0; row < parsedBindings.length; row+=12) {
            const chunk = parsedBindings.slice(row, row+12);
            newBindingsText += '                ' + chunk.join(' ') + '\n';
        }
        
        fullFileContent = fullFileContent.replace(defaultLayerRegex, `$1${newBindingsText}            $3`);
        rawKeymapEl.value = fullFileContent;
    }

    // Keyboard input handling
    document.addEventListener('keydown', (e) => {
        if (!selectedKeyEl) return;
        
        e.preventDefault();
        
        let zmkCode = null;
        
        if (e.code.startsWith('Key')) zmkCode = '&kp ' + e.code.replace('Key', '');
        else if (e.code.startsWith('Digit')) zmkCode = '&kp N' + e.code.replace('Digit', '');
        else {
            const map = {
                'Space': '&kp SPACE', 'Enter': '&kp RET', 'Backspace': '&kp BSPC',
                'Escape': '&kp ESC', 'Tab': '&kp TAB',
                'ShiftLeft': '&kp LSHFT', 'ShiftRight': '&kp RSHFT',
                'ControlLeft': '&kp LCTRL', 'ControlRight': '&kp RCTRL',
                'AltLeft': '&kp LALT', 'AltRight': '&kp RALT',
                'MetaLeft': '&kp LGUI', 'MetaRight': '&kp RGUI',
                'ArrowUp': '&kp UP', 'ArrowDown': '&kp DOWN',
                'ArrowLeft': '&kp LEFT', 'ArrowRight': '&kp RIGHT',
                'Minus': '&kp MINUS', 'Equal': '&kp EQUAL', 'BracketLeft': '&kp LBKT',
                'BracketRight': '&kp RBKT', 'Backslash': '&kp BSLH', 'Semicolon': '&kp SEMI',
                'Quote': '&kp SQT', 'Comma': '&kp COMMA', 'Period': '&kp DOT', 'Slash': '&kp FSLH',
                'Backquote': '&kp GRAVE', 'Delete': '&kp DEL', 'Home': '&kp HOME',
                'End': '&kp END', 'PageUp': '&kp PG_UP', 'PageDown': '&kp PG_DN'
            };
            zmkCode = map[e.code];
        }
        
        if (zmkCode) {
            updateKey(selectedKeyEl, zmkCode);
            selectedKeyEl.classList.remove('selected');
            selectedKeyEl = null;
        }
    });

    // Buttons
    saveBtn.addEventListener('click', async () => {
        try {
            saveBtn.textContent = 'Saving...';
            // Use the textarea value in case user edited it manually
            fullFileContent = rawKeymapEl.value; 
            const res = await fetch('/api/keymap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fullFileContent })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast('Keymap saved successfully!');
            // Re-parse to update UI just in case
            parseAndRenderKeymap(fullFileContent);
        } catch (err) {
            showToast('Failed to save: ' + err.message, true);
        } finally {
            saveBtn.textContent = 'Save Keymap';
        }
    });

    pushBtn.addEventListener('click', async () => {
        try {
            pushBtn.textContent = 'Pushing...';
            const res = await fetch('/api/push', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast('Successfully pushed to GitHub! Actions build triggered.');
        } catch (err) {
            showToast('Failed to push: ' + err.message, true);
        } finally {
            pushBtn.textContent = 'Push to GitHub';
        }
    });

    function showToast(msg, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = `toast show ${isError ? 'error' : ''}`;
        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    loadKeymap();
});
