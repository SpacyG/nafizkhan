
const RESPONSE_CONFIG = {
  tab: 'Form Responses 1',
  name: 'Display name',
  message: 'Feedback',
  consent: 'Show my feedback on the portfolio?',
  consentValue: 'Yes',
  limit: 20
};

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, character => entities[character]);
}

function doGet() {
  const id = PropertiesService.getScriptProperties().getProperty('RESPONSE_SPREADSHEET_ID');
  const config = RESPONSE_CONFIG;
  let body = '<p>No public feedback yet.</p>';
  if (!id) return feedbackPage('<p>The feedback feed is being set up.</p>');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(config.tab);
  if (!sheet || !sheet.getLastRow()) return feedbackPage(body);
  const [headers, ...rows] = sheet.getDataRange().getDisplayValues();
  const [name, message, consent] = [config.name, config.message, config.consent].map(header => headers.indexOf(header));
  if ([name, message, consent].includes(-1)) return feedbackPage('<p>The feedback feed is being set up.</p>');

  const entries = rows.reverse()
    .filter(row => row[consent].trim() === config.consentValue && row[name].trim() && row[message].trim())
    .slice(0, config.limit);
  if (entries.length) {
    body = entries.map(row => '<blockquote><p>' + escapeHtml(row[message].trim()) +
      '</p><footer>' + escapeHtml(row[name].trim()) + '</footer></blockquote>').join('');
  }
  return feedbackPage(body);
}

function feedbackPage(body) {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><style>' +
    'body{margin:0;padding:12px;background:#f5f0e6;color:#15130f;font:1rem/1.5 system-ui,sans-serif}' +
    'blockquote{margin:0 0 10px;padding:12px;background:#fffaf1;border-left:2px solid #a82c19;overflow-wrap:anywhere}' +
    'p{margin:0;white-space:pre-wrap}footer{margin-top:8px;color:#5e554b;font-weight:600}' +
    '</style></head><body>' + body + '</body></html>'
  ).addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('Public feedback')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

