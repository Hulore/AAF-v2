const stage = document.querySelector("#stage");
const layerSelect = document.querySelector("#layerSelect");
const damageSample = document.querySelector("#damageSample");
const elementSamples = document.querySelector("#elementSamples");
const jsonBox = document.querySelector("#jsonBox");
const undoBtn = document.querySelector("#undoBtn");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const titleNode = document.querySelector("#title");
const fields = {
  x: document.querySelector("#xInput"),
  y: document.querySelector("#yInput"),
  width: document.querySelector("#widthInput"),
  height: document.querySelector("#heightInput"),
  gapX: document.querySelector("#gapXInput"),
  gapY: document.querySelector("#gapYInput"),
  rotation: document.querySelector("#rotationInput"),
  visible: document.querySelector("#visibleInput")
};

const config = document.body.dataset;
const stageScale = 4;
const localUrl = "http://127.0.0.1:8791/tools/" + window.location.pathname.split(/[\\/]/).pop();
let layout;
let manifest;
let frameRules;
let selectedId = "damage_type_icon";
let drag = null;
let undoStack = [];
let viewBox = { minX: 0, minY: -20, width: 120, height: 150 };
const previewUrlCache = new Map();

function assetUrl(relativePath) {
  return encodeURI("../data/" + relativePath);
}

function legacyAssetUrl(source) {
  if (!source || source === "$main") return "";
  return encodeURI("../data/aaf-v1/" + source.replace(/^\.\.\/\.\.\//, ""));
}

function recolorSvgText(text) {
  let result = text;
  for (const [from, to] of Object.entries(frameRules.preview_recolor || {})) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), to);
  }
  if (frameRules.preview_recolor?.["#111111"]) {
    result = result.replace(/rgb\(\s*17\s*,\s*17\s*,\s*17\s*\)/gi, frameRules.preview_recolor["#111111"]);
  }
  return result;
}

async function previewLegacyAsset(source) {
  if (previewUrlCache.has(source)) return previewUrlCache.get(source);
  const url = legacyAssetUrl(source);
  if (!url) return "";
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return url;
    const text = recolorSvgText(await response.text());
    const previewUrl = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    previewUrlCache.set(source, previewUrl);
    return previewUrl;
  } catch (_error) {
    return url;
  }
}

function normalizedKey(value) {
  return String(value || "").trim().toLowerCase();
}

function toStageX(value) {
  return (value - viewBox.minX) * stageScale;
}

function toStageY(value) {
  return (value - viewBox.minY) * stageScale;
}

function parseViewBox(raw) {
  const parts = String(raw || "0 -20 120 150").split(/\s+/).map(Number);
  return { minX: parts[0] || 0, minY: parts[1] || 0, width: parts[2] || 120, height: parts[3] || 150 };
}

function estimatedTextWidth(text, fontSize) {
  return String(text || "").length * fontSize * 0.62;
}

function fitBoxFont(layer) {
  const boxWidth = Number(layer.boxWidth || 18);
  const boxHeight = Number(layer.boxHeight || 13);
  const minFontSize = Number(layer.minFontSize || 4);
  let fontSize = Number(layer.fontSize || 12);
  while (fontSize > minFontSize) {
    if (estimatedTextWidth(layer.text || "0", fontSize) <= boxWidth && fontSize <= boxHeight) {
      return fontSize;
    }
    fontSize -= 0.25;
  }
  return minFontSize;
}

function layerTransform(x, y, scaleX, scaleY, rotation) {
  return [
    `translate(${toStageX(x)}px, ${toStageY(y)}px)`,
    `rotate(${rotation}deg)`,
    `scale(${scaleX}, ${scaleY})`
  ].join(" ");
}

function elementEntries() {
  return Object.entries(layout.elements);
}

function selectedElement() {
  return layout.elements[selectedId];
}

function selectedAssetFor(elementId) {
  if (elementId === "damage_type_icon") {
    return manifest.damageTypes[damageSample.value];
  }
  return manifest.upgradedDiamond;
}

function selectedElementAssets() {
  return elementSamples.value
    .split(",")
    .map(value => normalizedKey(value))
    .filter(Boolean)
    .map(key => manifest.elements[key] || manifest.elements[key.replace(/\s+/g, "")])
    .filter(Boolean);
}

function pushUndo() {
  undoStack.push(JSON.stringify(layout));
  if (undoStack.length > 50) undoStack.shift();
  undoBtn.disabled = false;
}

function undoLast() {
  const previous = undoStack.pop();
  if (!previous) return;
  layout = JSON.parse(previous);
  undoBtn.disabled = undoStack.length === 0;
  render();
}

function syncControls() {
  const item = selectedElement();
  fields.x.value = item.x;
  fields.y.value = item.y;
  fields.width.value = item.width;
  fields.height.value = item.height;
  fields.gapX.value = item.gapX || 0;
  fields.gapY.value = item.gapY || 0;
  fields.rotation.value = item.rotation || 0;
  fields.visible.checked = item.visible !== false;
}

function layerMetrics(elementId, item) {
  if (elementId !== "element_icon") {
    return {
      width: item.width,
      height: item.height,
      originX: item.x - item.width / 2,
      originY: item.y - item.height / 2
    };
  }
  const count = Math.max(1, selectedElementAssets().length);
  const gapX = Number(item.gapX || 0);
  const gapY = Number(item.gapY || 0);
  const width = item.width * count + gapX * (count - 1);
  const height = item.height + Math.abs(gapY) * (count - 1);
  return {
    width,
    height,
    originX: item.x - item.width / 2,
    originY: item.y - item.height / 2 + Math.min(0, gapY * (count - 1))
  };
}

function renderFrameLayer(layer) {
  if (layer.visible === false) return;
  const node = document.createElement("div");
  node.className = "frame-layer";
  const x = Number(layer.x || 0);
  const y = Number(layer.y || 0);
  const scaleX = Number(layer.scaleX || 1);
  const scaleY = Number(layer.scaleY || 1);
  const rotation = Number(layer.rotation || 0);
  const anchorX = Number(layer.anchorX || 0);
  const anchorY = Number(layer.anchorY || 0);
  node.style.transform = layerTransform(x, y, scaleX, scaleY, rotation);

  if (layer.type === "text") {
    const width = Number(layer.boxWidth || 16);
    const height = Number(layer.boxHeight || 12);
    const textNode = document.createElement("div");
    textNode.className = "frame-text-layer";
    textNode.style.width = `${width * stageScale}px`;
    textNode.style.height = `${height * stageScale}px`;
    textNode.style.color = layer.fill || "#000000";
    textNode.style.fontFamily = `"${layer.fontFamily || "MewgenicsMain"}", Arial, sans-serif`;
    textNode.style.transform = `translate(${-anchorX * stageScale}px, ${-anchorY * stageScale}px)`;
    const textValue = document.createElement("span");
    textValue.className = "frame-text-value";
    textValue.style.fontSize = `${fitBoxFont(layer) * stageScale}px`;
    textValue.textContent = layer.text || "0";
    textNode.appendChild(textValue);
    node.appendChild(textNode);
    stage.appendChild(node);
    return;
  }

  if (layer.source === "$main" || layer.fitMode) {
    const width = Number(layer.boxWidth || 64);
    const height = Number(layer.boxHeight || 59);
    const guide = document.createElement("div");
    guide.className = "main-box-guide";
    guide.style.width = `${width * stageScale}px`;
    guide.style.height = `${height * stageScale}px`;
    guide.style.transform = `translate(${-anchorX * stageScale}px, ${-anchorY * stageScale}px)`;
    guide.textContent = "main";
    node.appendChild(guide);
    stage.appendChild(node);
    return;
  }

  const img = document.createElement("img");
  img.src = legacyAssetUrl(layer.source);
  previewLegacyAsset(layer.source).then(url => {
    if (url) img.src = url;
  });
  img.style.transform = `translate(${-anchorX * stageScale}px, ${-anchorY * stageScale}px) scale(${stageScale})`;
  node.appendChild(img);
  stage.appendChild(node);
}

function renderV2Layer(elementId, item) {
  const node = document.createElement("div");
  const metrics = layerMetrics(elementId, item);
  node.className = "layer" + (elementId === selectedId ? " selected" : "");
  node.dataset.id = elementId;
  node.style.width = `${metrics.width * stageScale}px`;
  node.style.height = `${metrics.height * stageScale}px`;
  node.style.transform = [
    `translate(${toStageX(metrics.originX)}px, ${toStageY(metrics.originY)}px)`,
    `rotate(${item.rotation || 0}deg)`
  ].join(" ");
  node.style.display = item.visible === false ? "none" : "block";

  if (elementId === "element_icon") {
    const assets = selectedElementAssets();
    const gapX = Number(item.gapX || 0);
    const gapY = Number(item.gapY || 0);
    const yOffset = gapY < 0 ? Math.abs(gapY) * Math.max(0, assets.length - 1) : 0;
    assets.forEach((asset, index) => {
      const img = document.createElement("img");
      img.src = assetUrl(asset);
      img.style.width = `${item.width * stageScale}px`;
      img.style.height = `${item.height * stageScale}px`;
      img.style.left = `${index * (item.width + gapX) * stageScale}px`;
      img.style.top = `${(yOffset + index * gapY) * stageScale}px`;
      node.appendChild(img);
    });
  } else {
    const img = document.createElement("img");
    img.src = assetUrl(selectedAssetFor(elementId));
    node.appendChild(img);
  }

  const anchor = document.createElement("span");
  anchor.className = "anchor";
  anchor.style.left = `${item.width * stageScale / 2}px`;
  anchor.style.top = `${item.height * stageScale / 2}px`;
  node.appendChild(anchor);

  node.addEventListener("pointerdown", event => {
    if (elementId !== selectedId) return;
    event.preventDefault();
    pushUndo();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      layerId: elementId,
      x: item.x,
      y: item.y
    };
    node.setPointerCapture(event.pointerId);
  });

  node.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId || drag.layerId !== elementId) return;
    const target = layout.elements[elementId];
    target.x = Math.round((drag.x + (event.clientX - drag.startX) / stageScale) * 4) / 4;
    target.y = Math.round((drag.y + (event.clientY - drag.startY) / stageScale) * 4) / 4;
    syncControls();
    render();
  });

  node.addEventListener("pointerup", () => {
    drag = null;
  });

  stage.appendChild(node);
}

function render() {
  stage.querySelectorAll(".frame-layer, .layer").forEach(node => node.remove());
  layerSelect.innerHTML = "";
  for (const layer of frameRules.layers || []) {
    renderFrameLayer(layer);
  }
  for (const [elementId, item] of elementEntries()) {
    const option = document.createElement("option");
    option.value = elementId;
    option.textContent = item.label || elementId;
    option.selected = elementId === selectedId;
    layerSelect.appendChild(option);
    renderV2Layer(elementId, item);
  }
  syncControls();
  jsonBox.value = JSON.stringify(layout, null, 2);
}

function updateSelected() {
  const item = selectedElement();
  item.x = Number(fields.x.value || 0);
  item.y = Number(fields.y.value || 0);
  item.width = Number(fields.width.value || 0);
  item.height = Number(fields.height.value || 0);
  item.gapX = Number(fields.gapX.value || 0);
  item.gapY = Number(fields.gapY.value || 0);
  item.rotation = Number(fields.rotation.value || 0);
  item.visible = fields.visible.checked;
  item.anchor = "center";
  if (item.id === "element_icon" || selectedId === "element_icon") {
    item.direction = "left-to-right";
  }
  render();
}

async function init() {
  titleNode.textContent = config.title || "AAF v2 Frame Element Editor";
  if (window.location.protocol === "file:") {
    stage.textContent = "";
    const notice = document.createElement("div");
    notice.className = "notice";
    notice.textContent = "Open this editor through the local server: " + localUrl;
    stage.appendChild(notice);
    jsonBox.value = "The editor loads JSON/SVG files with fetch(), so it needs http://127.0.0.1:8791/ instead of file://.";
    return;
  }
  const [layoutResponse, manifestResponse, frameResponse] = await Promise.all([
    fetch(config.layout),
    fetch("../data/asset-manifest.json"),
    fetch(config.frameRules)
  ]);
  layout = await layoutResponse.json();
  manifest = await manifestResponse.json();
  frameRules = await frameResponse.json();
  viewBox = parseViewBox(frameRules.canvas?.viewBox);
  stage.style.width = `${viewBox.width * stageScale}px`;
  stage.style.height = `${viewBox.height * stageScale}px`;

  for (const key of Object.keys(manifest.damageTypes)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    damageSample.appendChild(option);
  }
  damageSample.value = "physical";

  layerSelect.addEventListener("change", () => {
    selectedId = layerSelect.value;
    render();
  });
  damageSample.addEventListener("change", render);
  elementSamples.addEventListener("input", render);
  Object.values(fields).forEach(input => input.addEventListener("input", updateSelected));
  undoBtn.addEventListener("click", undoLast);
  exportBtn.addEventListener("click", () => {
    jsonBox.value = JSON.stringify(layout, null, 2);
    jsonBox.select();
  });
  importBtn.addEventListener("click", () => {
    pushUndo();
    layout = JSON.parse(jsonBox.value);
    render();
  });

  undoBtn.disabled = true;
  render();
}

init().catch(error => {
  jsonBox.value = String(error.stack || error);
});
