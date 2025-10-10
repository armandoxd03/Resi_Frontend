// This script adds CORS headers to responses from the specified domain
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    const headers = details.responseHeaders || [];
    headers.push({ name: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' });
    headers.push({ name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' });
    headers.push({ name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' });
    headers.push({ name: 'Access-Control-Allow-Credentials', value: 'true' });
    return { responseHeaders: headers };
  },
  {
    urls: ['https://resilinked-backend.onrender.com/*'],
    types: ['xmlhttprequest']
  },
  ['blocking', 'responseHeaders', 'extraHeaders']
);