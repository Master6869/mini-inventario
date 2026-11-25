const express = require('express');
const path = require('node:path');

const app = express();

app.get('/health', (_request, response) => response.json({ status: 'ok' }));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 3000);
