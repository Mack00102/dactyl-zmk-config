const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const KEYMAP_PATH = path.join(__dirname, '..', 'config', 'dactyl.keymap');

// Get the current keymap contents
app.get('/api/keymap', (req, res) => {
    try {
        const content = fs.readFileSync(KEYMAP_PATH, 'utf-8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read keymap file' });
    }
});

// Update the keymap contents
app.post('/api/keymap', (req, res) => {
    try {
        const { content } = req.body;
        if (!content) throw new Error('No content provided');
        fs.writeFileSync(KEYMAP_PATH, content, 'utf-8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write keymap file' });
    }
});

// Push changes to GitHub
app.post('/api/push', (req, res) => {
    const cwd = path.join(__dirname, '..');
    const cmd = `git add config/dactyl.keymap && git commit -m "Update keymap via GUI" && git push origin main`;
    
    exec(cmd, { cwd }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ success: true, stdout });
    });
});

app.listen(port, () => {
    console.log(`Dactyl Keymap GUI running at http://localhost:${port}`);
});
