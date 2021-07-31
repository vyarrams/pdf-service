const fs = require("fs");
const axios = require("axios");
var request = require("request");
const { DownloaderHelper } = require("node-downloader-helper");

exports.download_image = (url, image_path) => {
  axios({
    url,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on("finish", () => resolve())
          .on("error", (e) => reject(e));
      })
  );
};

exports.downloadImagesToLocal = async (imageObjects) => {
  try {
    let promiseArray = [];
    imageObjects.forEach((image) => {
      promiseArray.push(
        exports.download_image(image.location, `./tmp/${image.fileName}`)
      ); //todo dynamic for each request
    });
    await Promise.all(promiseArray);
    console.log("Image download completed");
  } catch (e) {
    console.log(e, "Download image error");
  }
};

exports.downloadFileUploads = async (listOfFiles) => {
  listOfFiles.forEach(function (file) {
    console.log("Downloading " + file.fileName);
    download(file, `./tmp/${file.fileName}`, function () {
      // download(file, `./temp`, function () {
      console.log("Finished Downloading..." + file.fileName);
    });
  });
};

var download = async function (file, dest, callback) {
  await request
    .get(file.location)
    .on("error", function (err) {
      console.log(err);
    })
    .pipe(fs.createWriteStream(dest))
    .on("close", callback);
};

exports.getFlatObject = (object) => {
  function iter(o, p) {
    if (o && typeof o === "object") {
      Object.keys(o).forEach(function (k) {
        iter(o[k], p.concat(k));
      });
      return;
    }
    path[p.join(".")] = o;
  }
  var path = {};
  iter(object, []);
  return path;
};

exports.templates = [
  "Page_1_Cover_page.docx",
  "Page_2_LoanGenerics_Others.docx",
  "Page_3_Site_Details.docx",
  "Page_4_Site_Photos.docx",
  "Page_5_Prop_Finance.docx",
  "Page_6_Borrower_Analysis.docx",
  "Page_7_Loan_Addendum.docx",
];
