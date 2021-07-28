exports.run = async (PDFNet, templateFileName, clientFileName) => {
  //console.log(`${inputPath}${templateFileName}`)
  console.log("Pdf attach function started");
  const sampleDoc = await PDFNet.PDFDoc.createFromFilePath(
    `${process.env.inputPath}${templateFileName}`
  );
  const clientDoc = await PDFNet.PDFDoc.createFromFilePath(
    `${process.env.inputPath}${clientFileName}`
  );

  sampleDoc.initSecurityHandler();
  clientDoc.initSecurityHandler();

  const sampleDocIterator = await sampleDoc.getPageIterator();
  const clientDocIterator = await clientDoc.getPageIterator();

  console.log("Insert Dummy pages for stamping");
  while (await clientDocIterator.hasNext()) {
    sampleDoc.pageInsert(sampleDocIterator, await sampleDoc.getPage(1));
    clientDocIterator.next();
  }
  const pageCount = await clientDoc.getPageCount();
  console.log("sampleDoc page count", pageCount);
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
    await stamper.stampPage(sampleDoc, srcPage, pgSet);
  }
  return sampleDoc;
  //await sampleDoc.save(  'pdfAttached1.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
};

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
