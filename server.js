const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4300;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Default route serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
