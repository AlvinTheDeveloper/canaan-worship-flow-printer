function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index');
}

// 搜尋歌名或首句歌詞
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
    if ((mode === "name" && name.indexOf(query) >= 0) ||
        (mode === "lyric" && firstLine.indexOf(query) >= 0)) {
      matches.push({
        code: data[i][0],
        name: data[i][1],
        tone: data[i][3],
        key: data[i][4]
      });
      if (matches.length >= 100) break;
    }
  }
  return matches;
}

function onExportClick() {
  // 假設 songs 已經由前端表單收集好
  const flowList = songs.map(song => ({
    code: song.code,
    name: song.name,
    tone: song.tone,
    key: song.key,
    music: song.music,
    remarks: song.remarks
  }));

  const date = document.getElementById("dateInput").value;
  const session = document.getElementById("sessionInput").value;
  const leaderName = document.getElementById("leaderNameInput").value;
  const leaderPhone = document.getElementById("leaderPhoneInput").value;

  console.log("送去後端嘅 flowList:", flowList);

  google.script.run.withSuccessHandler(function(res){
    if (res && res.wordUrl) {
      window.open(res.wordUrl, "_blank");
    }
  }).exportWord(flowList, date, session, leaderName, leaderPhone);
}


function exportWord(flowList, dateStr, sessionStr, leaderName, leaderPhone) {
  if (!flowList || !Array.isArray(flowList) || flowList.length === 0) {
    return { wordUrl: null, error: "流程表冇歌，無法輸出 Word" };
  }

  var templateFile = DriveApp.getFileById("1G-K5OSWBMdYb6WI1Xjn0lO85yCVgfpnvAjXkA_g2iAI");
  var doc = DocumentApp.openById(templateFile.getId());
  var body = doc.getBody();

  var titleText = dateStr + sessionStr + "敬拜流程";
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

  body.insertParagraph(1, "領詩：" + leaderName + "（電話：" + leaderPhone + "）");
  body.insertParagraph(2, "日期：" + dateStr + " " + sessionStr);

  var tables = body.getTables();
if (tables && tables.length > 0) {
  var table = tables[0];

  // ⚠️ 先刪除舊歌行（保留前 3 行 header）
  while (table.getNumRows() > 1) {
    table.removeRow(1);
  }

  // 再插入新歌
  for (var i = 0; i < flowList.length; i++) {
    var song = flowList[i];
    var newRow = table.appendTableRow();

// 判斷奇偶行：偶數行灰色，奇數行白色
  var bgColor = (i % 2 === 0) ? "#FFFFFF" : "#FFFFBB";  // 白色 / 淺灰色


    // 確保每行有 6 個 cell
    for (var c = 0; c < 6; c++) {
     var cell = newRow.appendTableCell("");
        cell.setBackgroundColor(bgColor);   // 設定底色
    }

    newRow.getCell(0).setText(song.code || "");
    newRow.getCell(1).setText(song.name || "");
    newRow.getCell(2).setText(song.tone || "");
    newRow.getCell(3).setText(song.key || "");
    newRow.getCell(4).setText(song.music || "");
    newRow.getCell(5).setText(song.remarks || "");
  }
} else {
  return { wordUrl: null, error: "⚠️ 模板冇表格，歌曲冇更新" };
}

  doc.saveAndClose();
  var newFile = templateFile.makeCopy(titleText);
  return { wordUrl: "https://docs.google.com/document/d/" + newFile.getId() + "/export?format=docx" };
}



function exportPDF(flowList, dateStr, sessionStr, leaderName, leaderPhone) {
  if (!flowList || !Array.isArray(flowList) || flowList.length === 0) {
    return { wordUrl: null, error: "流程表冇歌，無法輸出 PDF" };
  }

  var templateFile = DriveApp.getFileById("1G-K5OSWBMdYb6WI1Xjn0lO85yCVgfpnvAjXkA_g2iAI");
  var doc = DocumentApp.openById(templateFile.getId());
  var body = doc.getBody();

  var titleText = dateStr + sessionStr + "敬拜流程";
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

  body.insertParagraph(1, "領詩：" + leaderName + "（電話：" + leaderPhone + "）");
  body.insertParagraph(2, "日期：" + dateStr + " " + sessionStr);

  var tables = body.getTables();
if (tables && tables.length > 0) {
  var table = tables[0];

  // ⚠️ 先刪除舊歌行（保留前 3 行 header）
  while (table.getNumRows() > 1) {
    table.removeRow(1);
  }

  // 再插入新歌
  for (var i = 0; i < flowList.length; i++) {
    var song = flowList[i];
    var newRow = table.appendTableRow();

// 判斷奇偶行：偶數行灰色，奇數行白色
  var bgColor = (i % 2 === 0) ? "#FFFFFF" : "#FFFFBB";  // 白色 / 淺灰色


    // 確保每行有 6 個 cell
    for (var c = 0; c < 6; c++) {
     var cell = newRow.appendTableCell("");
        cell.setBackgroundColor(bgColor);   // 設定底色
    }

    newRow.getCell(0).setText(song.code || "");
    newRow.getCell(1).setText(song.name || "");
    newRow.getCell(2).setText(song.tone || "");
    newRow.getCell(3).setText(song.key || "");
    newRow.getCell(4).setText(song.music || "");
    newRow.getCell(5).setText(song.remarks || "");
  }
} else {
  return { wordUrl: null, error: "⚠️ 模板冇表格，歌曲冇更新" };
}

  doc.saveAndClose();

  // ⚠️ 直接輸出 PDF
  var newFile = templateFile.makeCopy(titleText);
  var pdfBlob = newFile.getAs("application/pdf");
  var pdfFile = DriveApp.createFile(pdfBlob);
  pdfFile.setName(titleText + ".pdf");

  return {
    pdfUrl: "https://drive.google.com/uc?export=download&id=" + pdfFile.getId()
  };
}








function exportFullPDF(selectedFileIds, date, session, leaderName, leaderPhone) {
  // 1. 先生成流程表 PDF
  const flowPdfFile = exportPDF(flowList, date, session, leaderName, leaderPhone);
  const flowPdfId = flowPdfFile.getId();

  // 2. 將流程表 PDF + 歌譜 PDF 合併
  const allFileIds = [flowPdfId].concat(selectedFileIds);

  // ⚠️ Apps Script 原生唔支援 PDF 合併，需要 Drive Advanced Service
  // 下面係示意，實際要用 Drive API 合併 PDF
  const resource = {
    title: date + " " + session + " 敬拜流程合成譜.pdf",
    mimeType: "application/pdf"
  };

  // TODO: 用 Drive API 或外部 PDF API 合併 allFileIds
  // 暫時只係示意，唔會真合併
  return { pdfUrl: DriveApp.getFileById(flowPdfId).getUrl() };
}


function findSongFiles(code) {
  if (!code) {
    throw new Error("必須傳入編號，例如 '02-021'");
  }
  var rootFolder = DriveApp.getFolderById("1nqixSJbc_leRJug74JLPt5xZ1i4PBzWN");
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
      if (file.getName().startsWith(code)) {
        results.push({id: file.getId(), name: file.getName()});
      }
    }
  }
  return results;
}


function testFindSongFiles() {
  var res = findSongFiles("02-021");
  Logger.log(res);
}

function exportSongPDF(selectedFileIds, dateStr, sessionStr) {
  var title = dateStr + sessionStr + "敬拜合成譜";
  var blobs = selectedFileIds.map(id => DriveApp.getFileById(id).getBlob());

  var combinedBlob = blobs[0];
  for (var i = 1; i < blobs.length; i++) {
    combinedBlob = Utilities.newBlob(
      combinedBlob.getBytes().concat(blobs[i].getBytes()),
      "application/pdf",
      title + ".pdf"
    );
  }

  var rootFolder = DriveApp.getFolderById("1nqixSJbc_leRJug74JLPt5xZ1i4PBzWN");
  var newFile = rootFolder.createFile(combinedBlob);
  return {pdfUrl: newFile.getUrl()};
}




