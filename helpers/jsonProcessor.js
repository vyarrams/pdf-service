var path = require('path')

exports.getCapRateJson = async (creditMemoJson, capRateJson, capIndex) => {
  for (var item of creditMemoJson.capRateSensitivityData) {
    capRateJson["capRate" + capIndex] = item.capRate;
    capRateJson["capRateProposedValue" + capIndex] = item.capRateProposedValue;
    capRateJson["capRateMaxLoanAmount" + capIndex] = item.capRateMaxLoanAmount;
    capIndex++;
  }
  return capIndex;
};

exports.getSitePicturesJson = async (
  creditMemoJson,
  picDetailsJson,
  picIndex,
  tempDir
) => {
  for (var pic of creditMemoJson.fileUploads.propertyPics) {
    console.log('Forloop')
    console.log('Hello',pic.fileName,path.extname(pic.fileName),'Filename')
    if(path.extname(pic.fileName)==='.pdf'){
      picDetailsJson["propertyPics" + picIndex] = `_pdfPicture${picIndex}`
      picDetailsJson[`_pdfPicture${picIndex}`] = {
        image_url: tempDir + pic.fileName,
        width: 150,
        height: 150,
      };
    }else{
      picDetailsJson["propertyPics" + picIndex] = {
        image_url: tempDir + pic.fileName,
        width: 150,
        height: 150,
      };
    }

    picIndex++;
  }
  return picIndex;
};
