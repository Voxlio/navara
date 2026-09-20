const express = require('express');
const path = require('path');
const app = express();

// Serve static files (CSS, images, JS) with automatic .html extension resolution
app.use(express.static(__dirname, { extensions: ['html'] }));

// Route /home to index.html
app.get(['/', '/home'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Local preview running at: http://localhost:${PORT}`);
});