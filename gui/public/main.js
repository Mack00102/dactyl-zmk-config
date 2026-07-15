document.addEventListener('DOMContentLoaded', () => {
    const leftKeyboardEl = document.getElementById('left-keyboard');
    const rightKeyboardEl = document.getElementById('right-keyboard');
    const keyPaletteEl = document.getElementById('key-palette');
    const rawKeymapEl = document.getElementById('raw-keymap');
    const saveBtn = document.getElementById('save-btn');
    const pushBtn = document.getElementById('push-btn');
    const layerTabs = document.querySelectorAll('.layer-tab');
    
    let fullFileContent = '';
    let layersData = {
        default_layer: [],
        settings_layer: []
    };
    let currentLayer = 'default_layer';
    let selectedKeyEl = null;
    
    // ZMK keycodes for palette
    const commonKeys = [
        '&none', '&trans', 
        '&kp A', '&kp B', '&kp C', '&kp D', '&kp E', '&kp F', '&kp G', '&kp H', '&kp I', '&kp J', '&kp K', '&kp L', '&kp M', '&kp N', '&kp O', '&kp P', '&kp Q', '&kp R', '&kp S', '&kp T', '&kp U', '&kp V', '&kp W', '&kp X', '&kp Y', '&kp Z',
        '&kp N1', '&kp N2', '&kp N3', '&kp N4', '&kp N5', '&kp N6', '&kp N7', '&kp N8', '&kp N9', '&kp N0', 
        '&kp F1', '&kp F2', '&kp F3', '&kp F4', '&kp F5', '&kp F6', '&kp F7', '&kp F8', '&kp F9', '&kp F10', '&kp F11', '&kp F12',
        '&kp GRAVE', '&kp MINUS', '&kp EQUAL', '&kp LBKT', '&kp RBKT', '&kp BSLH', '&kp SEMI', '&kp SQT', '&kp COMMA', '&kp DOT', '&kp FSLH',
        '&kp ESC', '&kp TAB', '&kp RET', '&kp SPACE', '&kp BSPC', '&kp DEL', '&kp INS', '&kp CAPS', '&kp PSCRN', '&kp SLCK', '&kp PAUSE_BREAK',
        '&kp LSHFT', '&kp RSHFT', '&kp LCTRL', '&kp RCTRL', '&kp LALT', '&kp RALT', '&kp LGUI', '&kp RGUI',
        '&kp HOME', '&kp END', '&kp PG_UP', '&kp PG_DN', '&kp UP', '&kp DOWN', '&kp LEFT', '&kp RIGHT',
        '&kp KP_N1', '&kp KP_N2', '&kp KP_N3', '&kp KP_N4', '&kp KP_N5', '&kp KP_N6', '&kp KP_N7', '&kp KP_N8', '&kp KP_N9', '&kp KP_N0',
        '&kp KP_NUM', '&kp KP_DIVIDE', '&kp KP_MULTIPLY', '&kp KP_MINUS', '&kp KP_PLUS', '&kp KP_ENTER', '&kp KP_DOT',
        '&mo 1', '&mo 2', '&mo 3',
        '&kp C_VOL_UP', '&kp C_VOL_DN', '&kp C_MUTE', '&kp C_PLAY_PAUSE', '&kp C_NEXT', '&kp C_PREV', '&kp C_BRI_UP', '&kp C_BRI_DN',
        '&bt BT_CLR', '&bt BT_SEL 0', '&bt BT_SEL 1', '&bt BT_SEL 2', '&bt BT_SEL 3', '&bt BT_SEL 4',
        '&out OUT_USB', '&out OUT_BLE'
    ];

    // Layout configuration
    const leftLayout = [
        { row: 0, cols: 6, indices: [0, 1, 2, 3, 4, 5] },
        { row: 1, cols: 6, indices: [12, 13, 14, 15, 16, 17] },
        { row: 2, cols: 6, indices: [24, 25, 26, 27, 28, 29] },
        { row: 3, cols: 6, indices: [36, 37, 38, 39, 40, 41] },
        { row: 4, cols: 6, isThumb: true, indices: [48, 49, 50, 51, 52, 53] },
        { row: 5, cols: 4, isThumb: true, offset: 2, indices: [60, 61, 62, 63] },
        { row: 6, cols: 2, isThumb: true, offset: 4, indices: [68, 69] },
        { row: 7, cols: 2, isThumb: true, offset: 4, indices: [72, 73] }
    ];

    const rightLayout = [
        { row: 0, cols: 6, indices: [6, 7, 8, 9, 10, 11] },
        { row: 1, cols: 6, indices: [18, 19, 20, 21, 22, 23] },
        { row: 2, cols: 6, indices: [30, 31, 32, 33, 34, 35] },
        { row: 3, cols: 6, indices: [42, 43, 44, 45, 46, 47] },
        { row: 4, cols: 6, isThumb: true, indices: [54, 55, 56, 57, 58, 59] },
        { row: 5, cols: 4, isThumb: true, suffixOffset: 2, indices: [64, 65, 66, 67] },
        { row: 6, cols: 2, isThumb: true, suffixOffset: 4, indices: [70, 71] },
        { row: 7, cols: 2, isThumb: true, suffixOffset: 4, indices: [74, 75] }
    ];

    // Initialize palette
    commonKeys.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key';
        keyEl.draggable = true;
        keyEl.textContent = key.replace('&kp ', '').replace('&', '');
        keyEl.dataset.keycode = key;
        keyEl.title = key;
        
        keyEl.addEventListener('dragstart', handleDragStart);
        keyPaletteEl.appendChild(keyEl);
    });

    // Layer Tabs
    layerTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            layerTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentLayer = e.target.dataset.layer;
            if (selectedKeyEl) {
                selectedKeyEl.classList.remove('selected');
                selectedKeyEl = null;
            }
            renderCurrentLayer();
        });
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
        ['default_layer', 'settings_layer'].forEach(layerName => {
            const regex = new RegExp(layerName + '\\s*\\{[^}]*bindings\\s*=\\s*<([^>]+)>');
            const match = content.match(regex);
            
            if (match) {
                const bindingsText = match[1];
                const bindingRegex = /&[a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)?/g;
                layersData[layerName] = [...bindingsText.matchAll(bindingRegex)].map(m => m[0].trim().replace(/\s+/g, ' '));
            }
        });
        
        renderCurrentLayer();
    }

    function renderCurrentLayer() {
        if (!layersData[currentLayer] || layersData[currentLayer].length === 0) return;
        renderKeyboard(leftKeyboardEl, leftLayout);
        renderKeyboard(rightKeyboardEl, rightLayout);
    }

    function renderKeyboard(container, layout) {
        container.innerHTML = '';

        layout.forEach(rowDef => {
            const rowEl = document.createElement('div');
            rowEl.className = `kb-row ${rowDef.isThumb ? 'thumb-row' : ''}`;
            
            if (rowDef.offset) {
                for (let i = 0; i < rowDef.offset; i++) {
                    const spacer = document.createElement('div');
                    spacer.style.width = '3.5rem';
                    rowEl.appendChild(spacer);
                }
            }

            for (let c = 0; c < rowDef.cols; c++) {
                const currentIndex = rowDef.indices[c];
                const keycode = layersData[currentLayer][currentIndex];
                const keyEl = document.createElement('div');
                
                keyEl.className = `key ${(keycode === '&none' || keycode === '&trans') ? 'empty' : ''}`;
                keyEl.textContent = keycode ? keycode.replace('&kp ', '').replace('&', '') : '';
                keyEl.dataset.index = currentIndex;
                keyEl.dataset.keycode = keycode || '&none';
                keyEl.title = keycode || '&none';
                
                keyEl.addEventListener('dragover', handleDragOver);
                keyEl.addEventListener('dragleave', handleDragLeave);
                keyEl.addEventListener('drop', handleDrop);
                keyEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    updateKey(keyEl, '&none');
                });
                
                keyEl.addEventListener('click', (e) => {
                    if (selectedKeyEl) selectedKeyEl.classList.remove('selected');
                    if (selectedKeyEl === keyEl) {
                        selectedKeyEl = null;
                    } else {
                        selectedKeyEl = keyEl;
                        selectedKeyEl.classList.add('selected');
                    }
                });

                rowEl.appendChild(keyEl);
            }
            
            if (rowDef.suffixOffset) {
                for (let i = 0; i < rowDef.suffixOffset; i++) {
                    const spacer = document.createElement('div');
                    spacer.style.width = '3.5rem';
                    rowEl.appendChild(spacer);
                }
            }
            
            container.appendChild(rowEl);
        });
    }

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
        layersData[currentLayer][index] = newKeycode;
        
        keyEl.dataset.keycode = newKeycode;
        keyEl.title = newKeycode;
        keyEl.textContent = newKeycode.replace('&kp ', '').replace('&', '');
        
        if (newKeycode === '&none' || newKeycode === '&trans') {
            keyEl.classList.add('empty');
        } else {
            keyEl.classList.remove('empty');
        }
        
        rebuildKeymapText();
    }

    function rebuildKeymapText() {
        ['default_layer', 'settings_layer'].forEach(layerName => {
            if (!layersData[layerName] || layersData[layerName].length === 0) return;
            
            const regex = new RegExp('(' + layerName + '\\s*\\{[^}]*bindings\\s*=\\s*<)([^>]+)(>)');
            
            let newBindingsText = '\n';
            
            const rows = [
                [0, 11],   // R0
                [12, 23],  // R1
                [24, 35],  // R2
                [36, 47],  // R3
                [48, 59],  // R4
                [60, 67],  // R5
                [68, 71],  // R6
                [72, 75]   // R7
            ];
            
            rows.forEach(([start, end]) => {
                const chunk = layersData[layerName].slice(start, end + 1);
                let line = chunk.join(' ');
                
                if (chunk.length === 12) {
                    line = chunk.slice(0, 6).join(' ') + '   ' + chunk.slice(6, 12).join(' ');
                } else if (chunk.length === 8) {
                    line = '                ' + chunk.slice(0, 4).join(' ') + '    ' + chunk.slice(4, 8).join(' ');
                } else if (chunk.length === 4) {
                    line = '                                   ' + chunk.slice(0, 2).join(' ') + '   ' + chunk.slice(2, 4).join(' ');
                }
                
                newBindingsText += '                ' + line + '\n';
            });
            
            fullFileContent = fullFileContent.replace(regex, `$1${newBindingsText}            $3`);
        });
        
        rawKeymapEl.value = fullFileContent;
    }

    document.addEventListener('keydown', (e) => {
        if (!selectedKeyEl) return;
        
        e.preventDefault();
        
        let zmkCode = null;
        
        if (e.code.startsWith('Key')) zmkCode = '&kp ' + e.code.replace('Key', '');
        else if (e.code.startsWith('Digit')) zmkCode = '&kp N' + e.code.replace('Digit', '');
        else if (e.code.startsWith('F') && e.code.length <= 3 && !isNaN(e.code.slice(1))) zmkCode = '&kp ' + e.code;
        else if (e.code.startsWith('Numpad')) {
            const numMap = { 'Numpad0': '&kp KP_N0', 'Numpad1': '&kp KP_N1', 'Numpad2': '&kp KP_N2', 'Numpad3': '&kp KP_N3', 'Numpad4': '&kp KP_N4', 'Numpad5': '&kp KP_N5', 'Numpad6': '&kp KP_N6', 'Numpad7': '&kp KP_N7', 'Numpad8': '&kp KP_N8', 'Numpad9': '&kp KP_N9', 'NumpadDecimal': '&kp KP_DOT', 'NumpadEnter': '&kp KP_ENTER', 'NumpadAdd': '&kp KP_PLUS', 'NumpadSubtract': '&kp KP_MINUS', 'NumpadMultiply': '&kp KP_MULTIPLY', 'NumpadDivide': '&kp KP_DIVIDE' };
            zmkCode = numMap[e.code];
        }
        else {
            const map = {
                'Space': '&kp SPACE', 'Enter': '&kp RET', 'Backspace': '&kp BSPC',
                'Escape': '&kp ESC', 'Tab': '&kp TAB', 'CapsLock': '&kp CAPS',
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
                'End': '&kp END', 'PageUp': '&kp PG_UP', 'PageDown': '&kp PG_DN',
                'Insert': '&kp INS', 'PrintScreen': '&kp PSCRN', 'ScrollLock': '&kp SLCK', 'Pause': '&kp PAUSE_BREAK'
            };
            zmkCode = map[e.code];
        }
        
        if (zmkCode) {
            updateKey(selectedKeyEl, zmkCode);
            selectedKeyEl.classList.remove('selected');
            selectedKeyEl = null;
        } else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') {
            updateKey(selectedKeyEl, '&none');
            selectedKeyEl.classList.remove('selected');
            selectedKeyEl = null;
        }
    });

    const profileNameInput = document.getElementById('profile-name');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileListEl = document.getElementById('profile-list');

    function loadProfiles() {
        const profiles = JSON.parse(localStorage.getItem('keymapProfiles') || '{}');
        profileListEl.innerHTML = '';
        Object.keys(profiles).forEach(name => {
            const li = document.createElement('li');
            li.className = 'profile-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '1rem';
            
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.onclick = () => {
                fullFileContent = profiles[name];
                rawKeymapEl.value = fullFileContent;
                parseAndRenderKeymap(fullFileContent);
                showToast(`Profile "${name}" loaded! Don't forget to click "Save Keymap" if you want to write it to disk.`);
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => {
                delete profiles[name];
                localStorage.setItem('keymapProfiles', JSON.stringify(profiles));
                loadProfiles();
            };
            
            actionsDiv.appendChild(loadBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(nameSpan);
            li.appendChild(actionsDiv);
            profileListEl.appendChild(li);
        });
    }

    saveProfileBtn.addEventListener('click', () => {
        const name = profileNameInput.value.trim();
        if (!name) return showToast('Please enter a profile name', true);
        
        const profiles = JSON.parse(localStorage.getItem('keymapProfiles') || '{}');
        profiles[name] = fullFileContent;
        localStorage.setItem('keymapProfiles', JSON.stringify(profiles));
        
        profileNameInput.value = '';
        loadProfiles();
        showToast(`Profile "${name}" saved to browser!`);
    });

    loadProfiles();

    saveBtn.addEventListener('click', async () => {
        try {
            saveBtn.textContent = 'Saving...';
            fullFileContent = rawKeymapEl.value; 
            const res = await fetch('/api/keymap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: fullFileContent })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast('Keymap saved successfully!');
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
