const diagnosisForm = document.querySelector("#spatial-diagnosis-form");
const resultPlaceholder = document.querySelector("#result-placeholder");
const resultLoading = document.querySelector("#result-loading");
const resultError = document.querySelector("#result-error");
const resultErrorText = document.querySelector("#result-error-text");
const resultContent = document.querySelector("#result-content");
const resultContact = document.querySelector("#result-contact");
const resultJudgement = document.querySelector("#result-judgement");
const resultTheme = document.querySelector("#result-theme");
const resultDirections = document.querySelector("#result-directions");
const resultKeywords = document.querySelector("#result-keywords");
const resultSummary = document.querySelector("#result-summary");
const generateButton = document.querySelector("#generate-button");
const copyButton = document.querySelector("#copy-result");
const regenerateButton = document.querySelector("#regenerate-button");

const STORAGE_KEY = "jili-diagnosis-form";
const LAST_PAYLOAD_KEY = "jili-diagnosis-payload";

function sentenceCase(text) {
  return String(text || "").replace(/[。！；;，,]+$/g, "").trim();
}

/* ---------- localStorage auto-save ---------- */
function saveForm() {
  if (!diagnosisForm) return;
  const data = {};
  diagnosisForm.querySelectorAll("input, select, textarea").forEach((field) => {
    data[field.name] = field.value;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function restoreForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    diagnosisForm.querySelectorAll("input, select, textarea").forEach((field) => {
      if (data[field.name]) {
        field.value = data[field.name];
      }
    });
  } catch {}
}

function clearFormStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_PAYLOAD_KEY);
  } catch {}
}

if (diagnosisForm) {
  diagnosisForm.addEventListener("input", () => {
    clearTimeout(diagnosisForm._saveTimer);
    diagnosisForm._saveTimer = setTimeout(saveForm, 400);
  });
  restoreForm();
}

/* ---------- fetch with timeout and retry ---------- */
function fetchWithTimeout(url, options, timeoutMs = 15000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("请求超时，请检查网络后重试。")), timeoutMs)
    ),
  ]);
}

async function submitDiagnosis(payload) {
  const response = await fetchWithTimeout("/api/diagnosis", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "生成失败，请稍后再试。");
  }

  return data;
}

async function submitWithRetry(payload, maxRetries = 1) {
  try {
    return await submitDiagnosis(payload);
  } catch (error) {
    if (maxRetries > 0 && error.message.includes("超时")) {
      return submitWithRetry(payload, maxRetries - 1);
    }
    throw error;
  }
}

/* ---------- scroll helper (account for header) ---------- */
function scrollToElement(el) {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.offsetHeight + 16 : 72;
  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
  window.scrollTo({ top, behavior: "smooth" });
}

/* ---------- render result ---------- */
function renderResult(data, payload) {
  resultContact.textContent = `${payload.contactName} / ${payload.contactPhone}`;
  resultJudgement.textContent = data.judgement;
  resultTheme.textContent = data.theme;

  resultDirections.innerHTML = "";
  data.directions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    resultDirections.appendChild(li);
  });

  resultKeywords.innerHTML = "";
  data.keywords.forEach((word) => {
    const tag = document.createElement("span");
    tag.className = "keyword-tag";
    tag.textContent = word;
    resultKeywords.appendChild(tag);
  });

  resultSummary.textContent = data.summary;

  resultLoading.hidden = true;
  resultContent.hidden = false;
  scrollToElement(resultContent);
}

/* ---------- form submit ---------- */
if (diagnosisForm) {
  diagnosisForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(diagnosisForm);

    const payload = {
      contactName: sentenceCase(formData.get("contactName")),
      contactPhone: sentenceCase(formData.get("contactPhone")),
      city: sentenceCase(formData.get("city")),
      spaceType: formData.get("spaceType"),
      problem: sentenceCase(formData.get("problem")),
      audience: sentenceCase(formData.get("audience")),
      mood: sentenceCase(formData.get("mood")),
      goal: formData.get("goal"),
    };

    try {
      localStorage.setItem(LAST_PAYLOAD_KEY, JSON.stringify(payload));
    } catch {}

    resultPlaceholder.hidden = true;
    resultError.hidden = true;
    resultContent.hidden = true;
    resultLoading.hidden = false;
    generateButton.disabled = true;
    generateButton.textContent = "生成中…";

    try {
      const data = await submitWithRetry(payload);
      renderResult(data, payload);
    } catch (error) {
      resultLoading.hidden = true;
      resultError.hidden = false;
      resultErrorText.textContent = error.message || "生成失败，请稍后再试。";
      scrollToElement(resultError);
    } finally {
      generateButton.disabled = false;
      generateButton.textContent = "生成诊断";
    }
  });
}

/* ---------- copy result ---------- */
function getResultText() {
  const lines = [];
  lines.push("【几里造物 · 空间文化轻升级诊断】\n");
  lines.push(`联系信息：${resultContact.textContent}`);
  lines.push(`\n空间判断：${resultJudgement.textContent}`);
  lines.push(`\n文化母题：${resultTheme.textContent}`);
  lines.push("\n轻升级方向：");
  resultDirections.querySelectorAll("li").forEach((li, i) => {
    lines.push(`${i + 1}. ${li.textContent}`);
  });
  lines.push("\n传播关键词：");
  const keywords = [];
  resultKeywords.querySelectorAll(".keyword-tag").forEach((tag) => {
    keywords.push(tag.textContent);
  });
  lines.push(keywords.join(" / "));
  lines.push(`\n提案摘要：${resultSummary.textContent}`);
  lines.push("\n—— 几里造物文化科技有限公司");
  return lines.join("\n");
}

function showCopyFeedback(el) {
  const original = el.textContent;
  el.textContent = "已复制";
  el.classList.add("is-copied");
  setTimeout(() => {
    el.textContent = original;
    el.classList.remove("is-copied");
  }, 1800);
}

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const text = getResultText();
    try {
      await navigator.clipboard.writeText(text);
      showCopyFeedback(copyButton);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopyFeedback(copyButton);
    }
  });
}

/* ---------- regenerate ---------- */
if (regenerateButton) {
  regenerateButton.addEventListener("click", async () => {
    let payload;
    try {
      const raw = localStorage.getItem(LAST_PAYLOAD_KEY);
      if (raw) payload = JSON.parse(raw);
    } catch {}

    if (!payload) {
      resultError.hidden = false;
      resultErrorText.textContent = "无法重新生成，请重新填写表单。";
      scrollToElement(resultError);
      return;
    }

    resultPlaceholder.hidden = true;
    resultError.hidden = true;
    resultContent.hidden = true;
    resultLoading.hidden = false;
    regenerateButton.disabled = true;
    regenerateButton.textContent = "重新生成中…";

    try {
      const data = await submitWithRetry(payload);
      renderResult(data, payload);
    } catch (error) {
      resultLoading.hidden = true;
      resultError.hidden = false;
      resultErrorText.textContent = error.message || "重新生成失败，请稍后再试。";
      scrollToElement(resultError);
    } finally {
      regenerateButton.disabled = false;
      regenerateButton.textContent = "重新生成";
    }
  });
}
