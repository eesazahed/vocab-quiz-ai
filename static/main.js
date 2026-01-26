const notesEl = document.getElementById("notes");
const generateBtn = document.getElementById("generate");
const statusEl = document.getElementById("status");
const quizEl = document.getElementById("quiz");
const inputSection = document.getElementById("input-section");

let questions = [],
  currentIndex = 0;

generateBtn.onclick = async () => {
  const notes = notesEl.value.trim();
  if (!notes) return;

  inputSection.hidden = true;
  statusEl.hidden = false;

  const res = await fetch("/vocab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  questions = shuffle(
    JSON.parse((await res.json()).choices[0].message.content)
  );
  currentIndex = 0;

  statusEl.hidden = true;
  quizEl.hidden = false;
  renderQuestion();
};

function renderQuestion() {
  const q = questions[currentIndex];
  const options = shuffle([
    q.definition,
    ...shuffle(
      questions.filter((x) => x.term !== q.term).map((x) => x.definition)
    ).slice(0, 3),
  ]);

  quizEl.innerHTML = `
    <h2>Define: ${q.term}</h2>
    <div id="options">${options
      .map((opt) => `<button class="answer">${opt}</button>`)
      .join("")}</div>
    <button id="next-btn" style="display:none;margin-top:12px;">Next!</button>
    <p>${currentIndex + 1} / ${questions.length}</p>
  `;

  document.querySelectorAll(".answer").forEach(
    (btn) =>
      (btn.onclick = () => {
        document.querySelectorAll(".answer").forEach((b) => {
          b.disabled = true;
          if (b.textContent === q.definition) {
            b.classList.add("correct");
          } else {
            b.classList.add("wrong");
          }
        });
        document.getElementById("next-btn").style.display = "inline-block";
      })
  );

  document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    currentIndex < questions.length
      ? renderQuestion()
      : (quizEl.innerHTML = "<h2>Quiz Complete!</h2>");
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
