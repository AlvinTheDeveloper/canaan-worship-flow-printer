/**
 * Canaan Worship Flow Printer — Apps Script entrypoints.
 */

/** Runs when the spreadsheet/document is opened (add-on / bound script). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Worship Flow Printer")
    .addItem("Print worship flow", "printWorshipFlow")
    .addToUi();
}

/** Placeholder entrypoint for printing the worship flow. */
function printWorshipFlow() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "Worship Flow Printer",
    "Printer workflow is not implemented yet.",
    ui.ButtonSet.OK,
  );
}
