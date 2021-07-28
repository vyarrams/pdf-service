const fs = require('fs');
const axios = require('axios');
exports.download_image = (url, image_path) =>{
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );
}

exports.downloadImagesToLocal = async(imageObjects,timestamp) =>{
  try{
    let promiseArray = [];
    imageObjects.forEach(image => {
      promiseArray.push(exports.download_image(image.location, `./tmp/${image.fileName}`)); //todo dynamic for each request
    });
    await Promise.all(promiseArray)
    console.log('Image download completed')
  }catch(e){
    console.log(e,'Download image error');

  }  
}

exports.getFlatObject = (object)=> {
  function iter(o, p) {
      if (o && typeof o === 'object') { Object.keys(o).forEach(function (k) { iter(o[k], p.concat(k)); }); return; }
      path[p.join('.')] = o;
  }
  var path = {}; iter(object, []);
  return path;
}