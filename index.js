const $prompt = document.getElementById("prompt");
const $output = document.getElementById("output");
const $form = document.getElementById("prompt-form");
const $askBtn = document.getElementById("ask-btn");
const ai = window.ai;
let ranOnce = false;

const INSTRUCTIONS = `
Respond in the style of Captain Jack Sparrow. Give brief answers.
---
`.trim();

async function isPromptApiAvailable() {
  return (await ai.canCreateTextSession()) !== "no";
}

async function run() {
  if (!await isPromptApiAvailable()) {
    $output.innerHTML += "Prompt API unavailable.";
    return;
  }
  
  $form.onsubmit = handleUserQuery;
  
  $prompt.disabled = false;
  $askBtn.disabled = false;
  
  $output.innerHTML = "Ready for your questions.";
}

async function handleUserQuery(e) {
  e.preventDefault();
  
  $askBtn.disabled = true;
  
  if (!ranOnce) {
    $output.innerHTML = "";
    ranOnce = true;
  }
  
  const query = new FormData($form).get("prompt");
  appendToOutput("Q. " + query);
  $prompt.value = "";
  $prompt.focus();
  
  const session = await ai.createTextSession({
    topK: 30,
    temperature: 0.5
  });

  const stream = session.promptStreaming(INSTRUCTIONS + "\n\n" + query);
  await streamToOutput(stream);

  $askBtn.disabled = false;

  await session.destroy();
}

function appendToOutput(text) {
  const $div = document.createElement("div");
  $div.className = "question";
  $div.textContent = text;
  $output.append($div);
}

async function streamToOutput(stream) {
  const $div = document.createElement("div");
  $output.append($div);
  $div.className = "answer";
  
  let result = '';
  let prevLength = 0;
  for await (const chunk of stream) {
    const newActualChunk = chunk.slice(prevLength);
    prevLength = chunk.length;
    result += newActualChunk;
    $div.textContent += newActualChunk;
  }
  
  return result;
}

run();