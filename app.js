const express = require('express');
const cors = require("cors");

const app = express();
app.use(cors({ origin: '*' }));
app.use(cors({ credentials: true }));
app.options("*", cors());
const fs = require('fs');


const {
    generatePDF, outputFile
} = require('./generatePDF');

app.use(express.json());

app.get('/', (req, res) => {
    res.send('This is eProLend-CreditMemo PDF Generation API');
});

app.post('/generatePDF', async (req, res) => {
    const creditMemoJson = req.body;
    try {
        await generatePDF(creditMemoJson);
        var data = fs.readFileSync(outputFile);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', '*');
        res.set('Access-Control-Allow-Methods', '*');
        res.set('Access-Control-Allow-Credentials', true);        
        res.set('Content-Type', 'application/pdf');      
        res.end(data, 'base64')
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: 'Something went wrong: ' + err });
    }
});

app.post('/generatePDFTron', async (req, res) => {
    const creditMemoJson = req.body;
    try {
        await generatePDF(creditMemoJson);
        var data = fs.readFileSync(outputFile);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', '*');
        res.set('Access-Control-Allow-Methods', '*');
        res.set('Access-Control-Allow-Credentials', true);        
        res.set('Content-Type', 'application/pdf');      
        res.end(data, 'base64')
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: 'Something went wrong: ' + err });
    }
});


// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//     console.log(`listening on port: ` + port);
// });
module.exports = app;
