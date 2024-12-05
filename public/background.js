chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setStorage") {
    chrome.storage.local.set(message.obj, () => {
      sendResponse({ status: "success", message: "storage儲存成功" });
    });

    return true;
  }

  if (message.action === "getStorage") {
    chrome.storage.local.get(message.key, (result) => {
      sendResponse({ status: "success", message: result[message.key] });
    });

    return true;
  }

  if (message.action === "deleteStorage") {
    chrome.storage.local.remove(message.keys, () => {
      sendResponse({ status: "success", message: "storage刪除成功" });
    });

    return true;
  }
});
