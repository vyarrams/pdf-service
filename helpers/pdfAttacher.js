exports.pdfImageInserter = async  (PDFNet, docArray,tempDir,flatJson) => {

  let currentPosition =1;
  console.log(docArray.length,'len of docarray')

  let noDocs = docArray.length
  for (let j=0;j<docArray.length;j++){
    console.log(docArray[j],'doc')

    let temp_before_PDFEMBED_doc = docArray[j];
    let pageCount = await temp_before_PDFEMBED_doc.getPageCount();   
    console.log(pageCount,'PageCount');
    
    let newSplitDoc = await PDFNet.PDFDoc.create();
    newSplitDoc.initSecurityHandler();
    let newSplitDocIterator = await newSplitDoc.getPageIterator();
    let copy_pages = [];
   // let docArray = [];
    let pending = false;
    let templatePageNumber =1;
    let foundPDFPic = 0;
    for (let i = 1; i <= pageCount; ++i) {
      console.log(i,'Printing i');
      const page = await temp_before_PDFEMBED_doc.getPage(i);
      const txt = await PDFNet.TextExtractor.create();
      await txt.begin(page);
      line = await txt.getFirstLine();
    //  console.log('Page Number', i ,await line.isValid(),'Is valid========================================');
      let lineText = '';
      for (; (await line.isValid()); line = (await line.getNextLine())) {
        for (word = await line.getFirstWord(); await word.isValid(); word = await word.getNextWord()) {
          lineText += await word.getString();
        }
        console.log(lineText)
        if(lineText.includes('_pdfPicture')){
          break;
        }
        lineText = '';
      }
      if(lineText.includes('_pdfPicture')){
          //copy_pages.push(page)
          console.log(lineText,'==============================================================================================================')
          let embeddedImageDoc = await PDFNet.PDFDoc.createFromFilePath(
            flatJson[lineText].image_url
          );
          docArray[j] = embeddedImageDoc;
          j++;
          templatePageNumber++
        }
    }
    // if(pending){
    //   console.log('pending===============',j)
    //   let imported_pages =  await newSplitDoc.importPages(copy_pages);
    //   for (var m = 0; m < imported_pages.length; ++m) {
    //     newSplitDoc.pagePushBack(imported_pages[m]); 
    //   }
    //   if(foundPDFPic){
    //     docArray.splice(currentPosition,0,newSplitDoc)
    //     j++;
    //   }else{
    //     docArray[currentPosition] = newSplitDoc
    //   }

    //   currentPosition++;
    // }
    console.log(docArray.length,'Length of final array')
  }
  return docArray
}

exports.run2 = async (PDFNet, templateDoc, pageNumber, clientFileName) => {
  //console.log(`${inputPath}${templateFileName}`)
  console.log("Pdf attach function started");
  const newDoc = await PDFNet.PDFDoc.create();
  const clientDoc = await PDFNet.PDFDoc.createFromFilePath(
    `${process.env.inputPath}${clientFileName}`
  );

  newDoc.initSecurityHandler();
  clientDoc.initSecurityHandler();

  const newDocIterator = await newDoc.getPageIterator();
  const clientDocIterator = await clientDoc.getPageIterator();

  console.log("Insert Dummy pages for stamping");
  const pageCount = await clientDoc.getPageCount();
  console.log("Embedded page count", pageCount);
  while (await clientDocIterator.hasNext()) {
    newDoc.pageInsert(newDocIterator, await templateDoc.getPage(pageNumber)); //todo change dynamic
    clientDocIterator.next();
  }
  console.log("Embedded page count", pageCount);

  const stamper = await PDFNet.Stamper.create(
    PDFNet.Stamper.SizeType.e_relative_scale,
    1,
    0.9
  );
  for (let i = 1; i <= pageCount; ++i) {
    const srcPage = await clientDoc.getPage(i);
    await srcPage.getCropBox();
    const media_box = await PDFNet.Rect.init(0, 0, 450.88, 861.69);
    await srcPage.setMediaBox(media_box);
    const pgSet = await PDFNet.PageSet.createRange(i, i);
    console.log(pgSet);
    await stamper.stampPage(newDoc, srcPage, pgSet);
  }
  return newDoc;
  //await sampleDoc.save(  'pdfAttached1.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
};
