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
      let timestamp = new Date().getTime();
      await commonUtils.downloadImagesToLocal(
        creditMemoJson.fileUploads.propertyPics,
        timestamp
      );
      await PDFNet.startDeallocateStack();
      let flatJson = commonUtils.getFlatObject(creditMemoJson);
      flatJson = Object.assign(flatJson, creditMemoJson);
      console.log(flatJson);

      let docxFilledDoc = await docxFiller.run(
        PDFNet,
        flatJson,
        "./files/copy_of_finalised_template_tron_28Jul_2.docx"
      );
      let templatesDoc = await PDFNet.PDFDoc.createFromFilePath(
        "./files/header_templates.pdf"
      );
      let temp_before_PDFEMBED_doc = docxFilledDoc;
      let pageCount = await temp_before_PDFEMBED_doc.getPageCount();
      console.log(pageCount, "PageCount");
      let newSplitDoc = await PDFNet.PDFDoc.create();
      newSplitDoc.initSecurityHandler();
      let newSplitDocIterator = await newSplitDoc.getPageIterator();
      let copy_pages = [];
      let docArray = [];
      let pending = true;
      let templatePageNumber = 1;
      for (let i = 1; i <= pageCount; ++i) {
        const page = await temp_before_PDFEMBED_doc.getPage(i);
        const txt = await PDFNet.TextExtractor.create();
        await txt.begin(page);
        line = await txt.getFirstLine();
        console.log(
          "Page Number",
          i,
          await line.isValid(),
          "Is valid========================================"
        );
        let lineText = "";
        for (; await line.isValid(); line = await line.getNextLine()) {
          for (
            word = await line.getFirstWord();
            await word.isValid();
            word = await word.getNextWord()
          ) {
            lineText += await word.getString();
          }
          console.log(lineText);
          if (lineText === "_embedpdf") {
            break;
          }
          lineText = "";
        }
        if (lineText === "_embedpdf") {
          console.log(lineText);
          copy_pages.push(page);
          let imported_pages = await newSplitDoc.importPages(copy_pages);
          for (var m = 0; m < imported_pages.length; ++m) {
            newSplitDoc.pagePushBack(imported_pages[m]);
          }
          docArray.push(newSplitDoc);
          let embeddedDoc = await pdfAttacher.run2(
            PDFNet,
            templatesDoc,
            templatePageNumber,
            creditMemoJson.files[templatePageNumber - 1]
          );
          docArray.push(embeddedDoc);
          templatePageNumber++;
          newSplitDoc = await PDFNet.PDFDoc.create();
          newSplitDoc.initSecurityHandler();
          newSplitDocIterator = await newSplitDoc.getPageIterator();
          copy_pages = [];
          pending = false;
        } else {
          pending = true;
          copy_pages.push(page);
        }
      }
      if (pending) {
        console.log("pending");
        let imported_pages = await newSplitDoc.importPages(copy_pages);
        for (var m = 0; m < imported_pages.length; ++m) {
          newSplitDoc.pagePushBack(imported_pages[m]);
        }
        docArray.push(newSplitDoc);
      }
      console.log(docArray.length, "Length of final array");
      await saveDoc.runv3(PDFNet, docArray, outputFilePDFTron);
      await PDFNet.endDeallocateStack();
    } catch (err) {
      console.log(err);
    }

    // try {
    //   await PDFNet.startDeallocateStack();
    //   let docxFilledDoc = await docxFiller.run(
    //     PDFNet,
    //     creditMemoJson,
    //     inputFile
    //   );
    //   let pdfAttachedDoc1 = await pdfAttacher.run(
    //     PDFNet,
    //     "dummyTitle.pdf",
    //     "newsletter.pdf"
    //   );
    //   await saveDoc.runv3(
    //     PDFNet,
    //     [docxFilledDoc, pdfAttachedDoc1],
    //     outputFilePDFTron
    //   );
    //   await PDFNet.endDeallocateStack();
    //   PDFNet.shutdown();
    // } catch (err) {
    //   console.log(err);
    // }
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
