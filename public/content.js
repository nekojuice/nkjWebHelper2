// ## 分頁全域變數
let _enable = {};

let domLocatorEnable = false;
let domLocatorMode = "xPath";

let referenceElementXPath;
let targetElementXPath;

// ## 事件監聽
document.addEventListener("DOMContentLoaded", async () => {});

window.addEventListener("load", async () => {
  console.log("nkjWebHelper 擴充功能已啟用");

  _enable = (await getStorage("cache")) || _enable;

  if (_enable.domLocatorHotkey) {
    document.addEventListener("keydown", handleHotKeyEvent);
  }
  if (_enable.nkjythelper) {
    await delay(1000);
    initNkjythelper();
  }
  if (_enable.drawUrl) {
    initDrawUrlEventListener(250);
  }
});

function handleHotKeyEvent(event) {
  if (event.ctrlKey && event.key === "q") {
    updateDomLocatorStatus(!domLocatorEnable);
  }
}

// ## 元素定位器
function updateDomLocatorStatus(newEnable = null, newMode = null) {
  // mode
  if (newMode != null && domLocatorMode != newMode) {
    domLocatorMode = newMode;
    console.log(`模式切換: ${domLocatorMode}`);
  }

  // enable
  if (newEnable == null || domLocatorEnable == newEnable) {
    return;
  }
  domLocatorEnable = newEnable;

  if (domLocatorEnable) {
    document.addEventListener("click", domLocatorEvent, { capture: true });
    console.log(`dom定位器已啟用, 模式: ${domLocatorMode}, 點選目標將自動複製到剪貼簿`);
  } else {
    document.removeEventListener("click", domLocatorEvent, { capture: true });
    console.log(`dom定位器已停用`);
  }
}

function domLocatorEvent(event) {
  event.stopPropagation();
  event.preventDefault();

  if (domLocatorMode == "css") {
    const cssSelector = getCSS(event.target);
    console.log(cssSelector);
    navigator.clipboard.writeText(cssSelector);
  }
  if (domLocatorMode == "xPath") {
    const xpath = getXPath(event.target).toLowerCase();
    console.log("//" + xpath);
    navigator.clipboard.writeText("//" + xpath);
  }

  if (domLocatorMode == "relativexPath") {
    if (event.shiftKey && event.button === 0) {
      referenceElementXPath = getXPath(event.target).toLowerCase();
      console.log("參考元素:", `//${referenceElementXPath}`);
    } else if (event.button === 0) {
      targetElementXPath = getXPath(event.target).toLowerCase();
      console.log("目標元素:", `//${targetElementXPath}`);
    }

    if (referenceElementXPath && targetElementXPath) {
      const relativeTargetXPath = getRelativeXPath("//" + referenceElementXPath, "//" + targetElementXPath);
      console.log("已查詢相對元素", getElementByXPath(relativeTargetXPath));
      navigator.clipboard.writeText(relativeTargetXPath);
    }
  }

  //   const root = document.compatMode === "CSS1Compat" ? document.documentElement : document.body;
  //   const mxy = [event.clientX + root.scrollLeft, event.clientY + root.scrollTop];
  //   const txy = getPageXY(event.target);
  //   console.log("offset", mxy[0] - txy[0], mxy[1] - txy[1]);
}

// reference: https://stackoverflow.com/questions/2631820/how-do-i-ensure-saved-click-coordinates-can-be-reload-to-the-same-place-even-if/2631931#2631931

function getXPath(element) {
  //   if (element.id !== "") return 'id("' + element.id + '")';
  if (element === document.body) return element.tagName;

  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === element) return getXPath(element.parentNode) + "/" + element.tagName + "[" + (ix + 1) + "]";
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
  }
}

function getPageXY(element) {
  var x = 0,
    y = 0;
  while (element) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return [x, y];
}

function getCSS(element, root = document.body) {
  if (element === root) return element.tagName.toLowerCase();

  const dynamicClasses = ["p-focus", "p-inputwrapper-filled", "p-inputwrapper-focus", "p-overlay-open", "p-highlight"];

  const filterClasses = (classList) => {
    return Array.from(classList).filter((className) => !dynamicClasses.some((dc) => className.startsWith(dc) || className === dc));
  };

  const escapeClassName = (className) => {
    return className.replace(/[:]/g, "\\$&");
  };

  const classes = filterClasses(element.classList);

  if (classes.length > 0) {
    const classSelector = "." + classes.map(escapeClassName).join(".");
    try {
      if (root.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    } catch (e) {
      console.warn("Invalid selector:", classSelector);
    }
  }

  const tagWithClass = element.tagName.toLowerCase() + (classes.length ? "." + classes.map(escapeClassName).join(".") : "");

  try {
    if (root.querySelectorAll(tagWithClass).length === 1) {
      return tagWithClass;
    }
  } catch (e) {
    console.warn("Invalid selector:", tagWithClass);
  }

  const siblings = Array.from(element.parentNode.children);
  const index = siblings.indexOf(element) + 1;
  const nthSelector = `${tagWithClass}:nth-child(${index})`;

  try {
    if (root.querySelectorAll(nthSelector).length === 1) {
      return nthSelector;
    }
  } catch (e) {
    console.warn("Invalid selector:", nthSelector);
  }

  return getCSS(element.parentNode, root) + " > " + nthSelector;
}

function getElementByXPath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

/**
 * 從參考點找到最近的符合目標的 XPath
 * @param {string} referenceXpath - 參考點的 XPath
 * @param {string} targetXpath - 目標的 XPath
 * @returns {string} - 相對於參考點的 XPath，或直接返回目標 XPath
 */
function getRelativeXPath(referenceXpath, targetXpath) {
  const referenceElement = getElementByXPath(referenceXpath);
  const targetElement = getElementByXPath(targetXpath);

  if (!referenceElement || !targetElement) {
    console.warn("無法找到參考點或目標元素");
    return targetXpath;
  }

  if (targetElement.tagName === "INPUT") {
    return `${referenceXpath}/following::input[1]`;
  } else if (targetElement.tagName === "TEXTAREA") {
    return `${referenceXpath}/following::textarea[1]`;
  }

  return targetXpath;
}

// ## nkjythelper
async function initNkjythelper() {
  if (window.location.href == "https://www.youtube.com/") {
    await monitorElementChanges("#contents", await getTargetElements(), labelstyle, 2000);
  }

  async function monitorElementChanges(parentSelector, childElements, callback, bufferTime = 2000) {
    const parentElement = document.querySelector(parentSelector);
    if (!parentElement) return;

    let timeoutId;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleChanges = async () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await delay(bufferTime);

        for (const child of childElements) await callback(await child);
      }, 0);
    };

    new MutationObserver(handleChanges).observe(parentElement, { childList: true, subtree: true });
  }

  async function getTargetElements() {
    //const targetsByClassName = Array.from(
    //  document.querySelectorAll('.style-scope.ytd-video-display-full-buttoned-and-button-group-renderer.yt-simple-endpoint')
    //).map((el) => getParentAtLevel(el, 9));

    const targetsByTagName = Array.from(document.querySelectorAll("ytd-ad-slot-renderer")).map((el) => getParentAtLevel(el, 2));

    //return [...new Set([...targetsByClassName, ...targetsByTagName])].filter(Boolean);
    return [...new Set([...targetsByTagName])].filter(Boolean);
  }

  async function getParentAtLevel(element, level) {
    let current = element;
    let count = 0;
    while (current && count < level) {
      current = current.parentElement;
      count++;
    }
    return current;
  }

  async function labelstyle(element) {
    element.style.backgroundColor = "red";
    element.style.display = "none";
  }
}

// ## drawUrl
// initDrawUrlEventListener
async function initRadialMenu(actions = [], longPressDelay = 250) {
  let mouseDownTimer = null;
  let isLongPress = false;
  let overlay = null;
  let startPoint = { x: 0, y: 0 };
  let svg = null;
  let currentHoverIndex = -1;

  const eventHandlers = {
    mousedown: null,
    mouseup: null,
    contextmenu: null,
    mouseout: null,
    mousemove: null
  };

  eventHandlers.mousedown = async (e) => {
    if (e.button === 2) {
      isLongPress = false;
      startPoint = { x: e.clientX, y: e.clientY };
      mouseDownTimer = setTimeout(async () => {
        isLongPress = true;
        await showRadialMenu(startPoint);
        document.addEventListener("mousemove", eventHandlers.mousemove);
      }, longPressDelay);
    }
  };

  async function showRadialMenu(center) {
    if (!overlay) {
      overlay = createOverlay();
    }
    svg = createSVG(center, actions);
    overlay.appendChild(svg);
  }

  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
    overlay.style.pointerEvents = "auto";
    overlay.style.zIndex = "9999";
    document.body.appendChild(overlay);
    return overlay;
  }

  function createSVG(center, actions) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";

    // 中心圓，使用非半透明灰色，並調高圖層
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", center.x);
    centerCircle.setAttribute("cy", center.y);
    centerCircle.setAttribute("r", "50");
    centerCircle.setAttribute("fill", "rgba(255,165,0,0.8)");
    centerCircle.setAttribute("stroke", "rgba(128,128,128,1)");
    centerCircle.setAttribute("stroke-width", "2");
    centerCircle.setAttribute("data-index", "-1"); // 加入 data-index 屬性
    svg.appendChild(centerCircle);

    // 中心圓的標籤
    const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerText.setAttribute("x", center.x);
    centerText.setAttribute("y", center.y);
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("alignment-baseline", "middle");
    centerText.setAttribute("fill", "black");
    centerText.textContent = "";
    svg.appendChild(centerText);

    // 當沒有動作時不進行繪製
    if (actions.length === 0) return svg;

    const totalActions = actions.length;
    const anglePerAction = 360 / totalActions;

    actions.forEach((action, index) => {
      const startAngle = index * anglePerAction;
      const endAngle = (index + 1) * anglePerAction;

      const sector = createSector(center.x, center.y, 150, startAngle, endAngle, action.label, index);
      svg.appendChild(sector);
    });

    return svg;
  }

  function createSector(centerX, centerY, radius, startAngle, endAngle, label, index) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.index = index;

    // 扇形路徑
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    const d = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ");

    path.setAttribute("d", d);
    path.setAttribute("fill", `rgba(128,128,128,0.3)`);
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "1");
    group.appendChild(path);

    // 標籤
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const textRadius = radius * 0.7;
    const textX = centerX + textRadius * Math.cos(midRad);
    const textY = centerY + textRadius * Math.sin(midRad);

    text.setAttribute("x", textX);
    text.setAttribute("y", textY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("fill", "black");
    text.textContent = label;
    group.appendChild(text);

    return group;
  }

  eventHandlers.mousemove = (e) => {
    if (!isLongPress) return;

    const distance = Math.sqrt(Math.pow(e.clientX - startPoint.x, 2) + Math.pow(e.clientY - startPoint.y, 2));

    // 更新hover效果
    const angle = calcAngle(startPoint, { x: e.clientX, y: e.clientY });
    const hoveredIndex = distance <= 50 ? -1 : selectSectorIndexByAngle(svg, angle);

    if (currentHoverIndex !== hoveredIndex) {
      const centerCircle = svg.querySelector("circle");
      const prevSector = svg.querySelector(`g[data-index="${currentHoverIndex}"] path`);

      if (distance <= 50) {
        if (centerCircle) {
          centerCircle.setAttribute("fill", "rgba(255,165,0,0.8)");
        }
        if (prevSector) {
          prevSector.setAttribute("fill", `rgba(128,128,128,0.3)`);
        }
      }
      if (distance > 50) {
        if (centerCircle) {
          centerCircle.setAttribute("fill", "rgba(128,128,128,0.8)");
        }
        if (currentHoverIndex !== -1) {
          if (prevSector) {
            prevSector.setAttribute("fill", `rgba(128,128,128,0.3)`);
          }
        }

        // 如果距離大於50px且找到扇形
        const currentSector = svg.querySelector(`g[data-index="${hoveredIndex}"] path`);
        if (distance > 50 && hoveredIndex !== -1) {
          if (currentSector) {
            currentSector.setAttribute("fill", "rgba(255,165,0,0.7)");
          }
        }
      }

      currentHoverIndex = hoveredIndex;
    }
  };

  eventHandlers.mouseup = (e) => {
    if (e.button === 2 && isLongPress) {
      const distance = Math.sqrt(Math.pow(e.clientX - startPoint.x, 2) + Math.pow(e.clientY - startPoint.y, 2));

      // 超出50px範圍才觸發
      if (distance > 50) {
        const angle = calcAngle(startPoint, { x: e.clientX, y: e.clientY });
        const selectedAction = selectActionByAngle(actions, angle);

        if (selectedAction) {
          if (selectedAction.action === "link") {
            window.location.replace(selectedAction.data);
            // window.open(selectedAction.data, "_blank");
          }
        }
      }

      clearTimeout(mouseDownTimer);
      removeRadialMenu();
    }
  };

  function calcAngle(center, point) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // 調整角度，使12點鐘方向為0度
    angle = (angle + 360) % 360;
    return angle;
  }

  function selectActionByAngle(actions, angle) {
    if (actions.length === 0) return null;
    const anglePerAction = 360 / actions.length;
    const index = Math.floor(angle / anglePerAction);
    return actions[index];
  }

  function selectSectorIndexByAngle(svg, angle) {
    if (!svg) return -1;
    const g = svg.querySelectorAll("g[data-index]");
    const anglePerAction = 360 / g.length;
    const index = Math.floor(angle / anglePerAction);
    return index;
  }

  function removeRadialMenu() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    document.removeEventListener("mousemove", eventHandlers.mousemove);
    currentHoverIndex = -1;
  }

  eventHandlers.contextmenu = (e) => {
    clearTimeout(mouseDownTimer);
    removeRadialMenu();

    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  document.addEventListener("mousedown", eventHandlers.mousedown);
  document.addEventListener("mouseup", eventHandlers.mouseup);
  document.addEventListener("contextmenu", eventHandlers.contextmenu);

  return function removeRadialMenuListener() {
    removeRadialMenu();
    document.removeEventListener("mousedown", eventHandlers.mousedown);
    document.removeEventListener("mouseup", eventHandlers.mouseup);
    document.removeEventListener("contextmenu", eventHandlers.contextmenu);
  };
}

// 使用範例
const actions = [
  { label: "Google", action: "link", data: "https://www.google.com/" },
  { label: "Youtube", action: "link", data: "https://www.youtube.com/" },
  { label: "GitHub", action: "link", data: "https://github.com/" },
  { label: "ChatGPT", action: "link", data: "https://chat.openai.com/" }
];

const removeListener = initRadialMenu(actions);

// ## 公用方法
async function getStorage(key) {
  const response = await chrome.runtime.sendMessage({ action: "getStorage", key: key });
  return response.message;
}

async function delay(ms) {
  new Promise((resolve) => setTimeout(resolve, ms));
}

// ## tab message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // DOM locator
  if (request.action === "updateDomLocatorStatus") {
    updateDomLocatorStatus(request.data.domLocatorEnable, request.data.domLocatorMode);
    sendResponse({ status: "success" });
  }

  if (request.action == "getDomLocatorStatus") {
    sendResponse({ status: "success", message: { domLocatorEnable: domLocatorEnable, domLocatorMode: domLocatorMode } });
  }

  // init nkjythelper
  if (request.action === "initNkjythelper") {
    initNkjythelper();
    sendResponse({ status: "success" });
  }
});
