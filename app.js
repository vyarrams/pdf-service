const { PDFNet } = require("@pdftron/pdfnet-node");
const express = require("express");
const cors = require("cors");
const path = require("path");

const mimeType = require("./modules/mimeType");

const docxFiller = require("./helpers/docxFiller");

const pdfAttacher = require("./helpers/pdfAttacher");
const saveDoc = require("./helpers/savePDF");

const inputFile = "./creditMemoPDFTron.docx";
const outputFilePDFTron = "/tmp/creditMemoPDFTron.pdf";

process.env.inputPath = "./files/";
process.env.outputPath = "./";

const app = express();
app.use(cors({ origin: "*" }));
app.use(cors({ credentials: true }));
app.options("*", cors());
const fs = require("fs");

const { generatePDF, outputFile } = require("./generatePDF");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is eProLend-CreditMemo PDF Generation API");
});

app.post("/generatePDF", async (req, res) => {
  const creditMemoJson = req.body;
  try {
    await generatePDF(creditMemoJson);
    var data = fs.readFileSync(outputFile);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");
    res.set("Access-Control-Allow-Methods", "*");
    res.set("Access-Control-Allow-Credentials", true);
    res.set("Content-Type", "application/pdf");
    res.end(data, "base64");
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Something went wrong: " + err });
  }
});

app.post("/generateUsingPDFTron", async (req, res) => {
  const creditMemoJson = req.body;

  const main = async () => {
    try {
      await PDFNet.startDeallocateStack();
      let docxFilledDoc = await docxFiller.run(
        PDFNet,
        creditMemoJson,
        inputFile
      );
      let pdfAttachedDoc1 = await pdfAttacher.run(
        PDFNet,
        "dummyTitle.pdf",
        "newsletter.pdf"
      );
      await saveDoc.runv3(
        PDFNet,
        [docxFilledDoc, pdfAttachedDoc1],
        outputFilePDFTron
      );
      await PDFNet.endDeallocateStack();
      PDFNet.shutdown();
    } catch (err) {
      console.log(err);
    }
  };

  PDFNetEndpoint(main, outputFilePDFTron, res);
});

const PDFNetEndpoint = (main, pathname, res) => {
  PDFNet.runWithCleanup(main) // you can add the key to PDFNet.runWithCleanup(main, process.env.PDFTRONKEY)
    .then(() => {
      PDFNet.shutdown();
      fs.readFile(pathname, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(pathname).ext;
          res.setHeader("Content-type", mimeType[ext] || "text/plain");
          res.end(data);
        }
      });
    })
    .catch((error) => {
      res.statusCode = 500;
      res.end(error);
    });
};

module.exports = app;
