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
    picDetailsJson["propertyPics" + picIndex] = {
      image_url: tempDir + pic.fileName,
      width: 150,
      height: 150,
    };
    picIndex++;
  }
  return picIndex;
};
