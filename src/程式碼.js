function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index");
}

// 搜尋歌名或首句歌詞（資料來自 bound Google Sheet 的 SongDB）
function searchSongs(query, mode) {
  query = String(query || "").trim().toLowerCase();
  if (!query) return [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var songSheet = ss.getSheetByName("SongDB");
  if (!songSheet) return [];
  var data = songSheet.getDataRange().getValues();
  var matches = [];
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][1] || "").trim().toLowerCase();
    var firstLine = String(data[i][4] || "").trim().toLowerCase();
    if (
      (mode === "name" && name.indexOf(query) >= 0) ||
      (mode === "lyric" && firstLine.indexOf(query) >= 0)
    ) {
      matches.push({
        code: data[i][0],
        name: data[i][1],
        tone: data[i][3],
        key: data[i][4],
      });
      if (matches.length >= 100) break;
    }
  }
  return matches;
}

var FLOW_TEMPLATE_ID_ = "1G-K5OSWBMdYb6WI1Xjn0lO85yCVgfpnvAjXkA_g2iAI";
var CHART_ROOT_FOLDER_ID_ = "1nqixSJbc_leRJug74JLPt5xZ1i4PBzWN";
// pdf-lib hosted in Drive (avoids UrlFetchApp / external_request scope).
var PDF_LIB_DRIVE_FILE_ID_ = "16D1j0XPuuB_m01rvqISsbXkZCdurNP91";

function exportWord(flowList, dateStr, sessionStr, leaderName, leaderPhone) {
  var built = buildFlowDocument_(flowList, dateStr, sessionStr, leaderName, leaderPhone);
  if (built.error) return { wordUrl: null, error: built.error };
  return {
    wordUrl:
      "https://docs.google.com/document/d/" +
      built.fileId +
      "/export?format=docx",
    fileId: built.fileId,
  };
}

function exportPDF(flowList, dateStr, sessionStr, leaderName, leaderPhone) {
  var built = buildFlowDocument_(flowList, dateStr, sessionStr, leaderName, leaderPhone);
  if (built.error) return { pdfUrl: null, error: built.error };

  var docFile = DriveApp.getFileById(built.fileId);
  var pdfBlob = docFile.getAs(MimeType.PDF);
  pdfBlob.setName(built.titleText + ".pdf");
  var pdfFile = DriveApp.createFile(pdfBlob);

  return {
    pdfUrl: "https://drive.google.com/uc?export=download&id=" + pdfFile.getId(),
    fileId: pdfFile.getId(),
  };
}

/**
 * Copy the Google Doc template first, then fill it (never mutate the shared template).
 */
function buildFlowDocument_(flowList, dateStr, sessionStr, leaderName, leaderPhone) {
  if (!flowList || !Array.isArray(flowList) || flowList.length === 0) {
    return { error: "流程表冇歌，無法輸出" };
  }

  var titleText = String(dateStr || "") + String(sessionStr || "") + "敬拜流程";
  var templateFile = DriveApp.getFileById(FLOW_TEMPLATE_ID_);
  var copyFile = templateFile.makeCopy(titleText);
  var doc = DocumentApp.openById(copyFile.getId());
  var body = doc.getBody();

  var paragraphs = body.getParagraphs();
  if (paragraphs.length > 0) {
    paragraphs[0].setText(titleText);
    paragraphs[0].setHeading(DocumentApp.ParagraphHeading.TITLE);
  } else {
    body.insertParagraph(0, titleText).setHeading(DocumentApp.ParagraphHeading.TITLE);
  }

  for (var i = paragraphs.length - 1; i >= 0; i--) {
    var text = paragraphs[i].getText();
    if (text.indexOf("領詩：") !== -1 || text.indexOf("日期：") !== -1) {
      body.removeChild(paragraphs[i]);
    }
  }

  body.insertParagraph(
    1,
    "領詩：" + (leaderName || "") + "（電話：" + (leaderPhone || "") + "）"
  );
  body.insertParagraph(2, "日期：" + (dateStr || "") + " " + (sessionStr || ""));

  var tables = body.getTables();
  if (!tables || tables.length === 0) {
    doc.saveAndClose();
    copyFile.setTrashed(true);
    return { error: "⚠️ 模板冇表格，歌曲冇更新" };
  }

  var table = tables[0];
  while (table.getNumRows() > 1) {
    table.removeRow(1);
  }

  for (var r = 0; r < flowList.length; r++) {
    var song = flowList[r];
    var newRow = table.appendTableRow();
    var bgColor = r % 2 === 0 ? "#FFFFFF" : "#FFFFBB";

    for (var c = 0; c < 6; c++) {
      newRow.appendTableCell("").setBackgroundColor(bgColor);
    }

    newRow.getCell(0).setText(song.code || "");
    newRow.getCell(1).setText(song.name || "");
    newRow.getCell(2).setText(song.tone || "");
    newRow.getCell(3).setText(song.key || "");
    newRow.getCell(4).setText(song.music || "");
    newRow.getCell(5).setText(song.remarks || "");
  }

  doc.saveAndClose();
  return { fileId: copyFile.getId(), titleText: titleText };
}

/**
 * Merge flow-sheet PDF + chart PDFs with pdf-lib.
 * flowList is optional; when provided, a fresh flow PDF is prepended.
 */
async function exportFullPDF(
  selectedFileIds,
  date,
  session,
  leaderName,
  leaderPhone,
  flowList
) {
  if (!selectedFileIds || !selectedFileIds.length) {
    return { pdfUrl: null, error: "冇揀到歌譜檔案" };
  }

  var blobs = [];
  var title =
    String(date || "") + " " + String(session || "") + " 敬拜流程合成譜";

  if (flowList && flowList.length) {
    var flowPdf = exportPDF(flowList, date, session, leaderName, leaderPhone);
    if (flowPdf.error) return { pdfUrl: null, error: flowPdf.error };
    blobs.push(DriveApp.getFileById(flowPdf.fileId).getBlob());
  }

  for (var i = 0; i < selectedFileIds.length; i++) {
    blobs.push(DriveApp.getFileById(selectedFileIds[i]).getBlob());
  }

  var mergedBlob = await mergePdfBlobs_(blobs, title + ".pdf");
  var outFolder = DriveApp.getFolderById(CHART_ROOT_FOLDER_ID_);
  var newFile = outFolder.createFile(mergedBlob);
  return { pdfUrl: newFile.getUrl(), fileId: newFile.getId() };
}

function findSongFiles(code) {
  code = String(code || "").trim();
  // Return empty instead of throwing so the UI can report "找不到檔案".
  if (!code || code === "新歌") {
    return [];
  }

  var rootFolder = DriveApp.getFolderById(CHART_ROOT_FOLDER_ID_);
  var results = [];

  // 從編號前綴判斷子資料夾，例如 "02-021" → "02字"
  var prefix = code.split("-")[0];
  var subFolderName = prefix + "字";

  var subFolders = rootFolder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    var subFolder = subFolders.next();
    var files = subFolder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      if (file.getName().indexOf(code) === 0) {
        results.push({ id: file.getId(), name: file.getName() });
      }
    }
  }
  return results;
}

function testFindSongFiles() {
  var res = findSongFiles("02-021");
  Logger.log(res);
}

/**
 * Merge selected chart PDFs into one file using pdf-lib.
 */
async function exportSongPDF(selectedFileIds, dateStr, sessionStr) {
  try {
    if (!selectedFileIds || !selectedFileIds.length) {
      return { pdfUrl: null, error: "冇揀到歌譜檔案，無法合成" };
    }

    var title = String(dateStr || "") + String(sessionStr || "") + "敬拜合成譜";
    var blobs = selectedFileIds.map(function (id) {
      return DriveApp.getFileById(id).getBlob();
    });

    var mergedBlob = await mergePdfBlobs_(blobs, title + ".pdf");
    var rootFolder = DriveApp.getFolderById(CHART_ROOT_FOLDER_ID_);
    var newFile = rootFolder.createFile(mergedBlob);
    return { pdfUrl: newFile.getUrl(), fileId: newFile.getId() };
  } catch (err) {
    return {
      pdfUrl: null,
      error: "輸出合成譜失敗：\n" + (err && err.message ? err.message : String(err)),
    };
  }
}

/** Load pdf-lib from Drive (no UrlFetchApp / external_request needed). */
function ensurePdfLib_() {
  if (typeof PDFLib !== "undefined") return;
  var js = DriveApp.getFileById(PDF_LIB_DRIVE_FILE_ID_).getBlob().getDataAsString();
  js = js.replace(/setTimeout\(.*?,.*?(\d*?)\)/g, "Utilities.sleep($1);return t();");
  eval(js);
  if (typeof PDFLib === "undefined") {
    throw new Error("pdf-lib 載入失敗（PDFLib undefined）");
  }
}

/**
 * Merge PDF blobs with pdf-lib. Returns a Drive-ready Blob.
 */
async function mergePdfBlobs_(blobs, outputName) {
  ensurePdfLib_();
  var pdfDoc = await PDFLib.PDFDocument.create();

  for (var i = 0; i < blobs.length; i++) {
    var bytes = new Uint8Array(blobs[i].getBytes());
    var src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    var pageIndices = src.getPageIndices();
    var pages = await pdfDoc.copyPages(src, pageIndices);
    for (var p = 0; p < pages.length; p++) {
      pdfDoc.addPage(pages[p]);
    }
  }

  var merged = await pdfDoc.save();
  return Utilities.newBlob(
    Array.from(new Uint8Array(merged)),
    MimeType.PDF,
    outputName || "merged.pdf"
  );
}
