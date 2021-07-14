const app = require('./app.js');
const port = process.env.PORT || 5000;

// Server
app.listen(port, () => {
   console.log(`Listening on: http://localhost:${port}`);
});