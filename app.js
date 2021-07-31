const { PDFNet } = require("@pdftron/pdfnet-node");
const express = require("express");
const cors = require("cors");
const path = require("path");

const mimeType = require("./modules/mimeType");

const docxFiller = require("./helpers/docxFiller");

const jsonProcessor = require("./helpers/jsonProcessor");
const saveDoc = require("./helpers/savePDF");

const inputFile = "./creditMemoPDFTron.docx";
const outputFilePDFTron = "/tmp/creditMemoPDFTron.pdf";
const commonUtils = require("./utils/common");

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
      // Variable initializations
      await PDFNet.startDeallocateStack();
      let docArray = [];
      let capRateJson = {};
      let capIndex = 0;
      let picDetailsJson = {};
      let picIndex = 0;
      let fileTypeInfo = [];

      // Download all the files listed in fileuploads section of json to the tmp location
      for (var fileType in creditMemoJson.fileUploads) {
        await commonUtils.downloadFileUploads(
          creditMemoJson.fileUploads[fileType]
        );

        if (fileType != "propertyPics") {
          fileTypeInfo[fileType] = creditMemoJson.fileUploads[fileType].length;
        }
      }
      console.log(fileTypeInfo);

      // Process Json Array objects to make a flat json object out of them
      jsonProcessor.getCapRateJson(creditMemoJson, capRateJson, capIndex);
      jsonProcessor.getSitePicturesJson(
        creditMemoJson,
        picDetailsJson,
        picIndex
      );

      // Create a flatJson using the raw json and all the processed json objects
      let flatJson = {
        ...creditMemoJson.loanGenericDetails,
        ...creditMemoJson.loanStructure,
        ...creditMemoJson.loanStructureAndCreditEnhancements,
        ...creditMemoJson.propertyDetails,
        ...creditMemoJson.borrowerAnalysis,
        ...creditMemoJson.propertyFinancials,
        ...capRateJson,
        ...picDetailsJson,
      };
      flatJson["createdOn"] = creditMemoJson.createdOn;

      // Fill out the docx templates with values from flatjson and push to the docArray
      for (var template of commonUtils.templates) {
        let templateFilled = await docxFiller.run(
          PDFNet,
          flatJson,
          "./templates/" + template
        );
        docArray.push(templateFilled);
      }

      // Find the available files other than images in the tmp folder and push to the docArray
      for (var fileType in fileTypeInfo) {
        if (fileTypeInfo[fileType] > 0) {
          let pdfDoc = await PDFNet.PDFDoc.createFromFilePath(
            "./tmp/" + creditMemoJson.fileUploads[fileType][0].fileName
          );
          // We might have to do splice on docArray to inset docs at specific location
          docArray.push(pdfDoc);
        }
      }

      // Build the final pdf using all the docs in the docArray
      await saveDoc.runv3(PDFNet, docArray, outputFilePDFTron);
      await PDFNet.endDeallocateStack();
    } catch (err) {
      console.log(err);
    } finally {
      // Delete the tmp folder
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
