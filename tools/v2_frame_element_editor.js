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
let layout;
let manifest;
let frameRules;
let selectedId = "damage_type_icon";
let drag = null;
let undoStack = [];
let viewBox = { minX: 0, minY: -20, width: 120, height: 150 };

function assetUrl(relativePath) {
  return encodeURI("../data/" + relativePath);
}

function legacyAssetUrl(source) {
  if (!source || source === "$main") return "";
  return encodeURI("../data/aaf-v1/" + source.replace(/^\.\.\/\.\.\//, ""));
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

  if (layer.type === "text") {
    const width = Number(layer.boxWidth || 16);
    const height = Number(layer.boxHeight || 12);
    node.style.left = `${toStageX(x - anchorX) }px`;
    node.style.top = `${toStageY(y - anchorY)}px`;
    node.style.width = `${width * stageScale}px`;
    node.style.height = `${height * stageScale}px`;
    node.style.transform = `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    node.textContent = layer.text || "";
    node.classList.add("frame-text-layer");
    stage.appendChild(node);
    return;
  }

  if (layer.source === "$main" || layer.fitMode) {
    const width = Number(layer.boxWidth || 64);
    const height = Number(layer.boxHeight || 59);
    node.style.left = `${toStageX(x - anchorX)}px`;
    node.style.top = `${toStageY(y - anchorY)}px`;
    node.style.width = `${width * stageScale}px`;
    node.style.height = `${height * stageScale}px`;
    node.style.transform = `rotate(${rotation}deg)`;
    node.classList.add("main-box-guide");
    node.textContent = "main";
    stage.appendChild(node);
    return;
  }

  const img = document.createElement("img");
  img.src = legacyAssetUrl(layer.source);
  img.style.transform = `scale(${scaleX}, ${scaleY})`;
  node.style.left = `${toStageX(x - anchorX * scaleX)}px`;
  node.style.top = `${toStageY(y - anchorY * scaleY)}px`;
  node.style.transform = `rotate(${rotation}deg)`;
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
