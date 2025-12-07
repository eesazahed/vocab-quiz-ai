window.initVocabQuiz = function () {
  if (!window.vocab) return;

  const wordBank = document.getElementById("word-bank");
  const container = document.querySelector(".matching-container");
  wordBank.innerHTML = "";
  container.innerHTML = "";

  const shuffledWords = [...window.vocab].sort(() => Math.random() - 0.5);

  shuffledWords.forEach((item) => {
    const word = document.createElement("div");
    word.className = "word";
    word.dataset.word = item.term;
    word.textContent = item.term;
    word.style.height = "50px";
    wordBank.appendChild(word);
  });

  const shuffledDefs = [...window.vocab].sort(() => Math.random() - 0.5);

  shuffledDefs.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    const def = document.createElement("div");
    def.className = "definition";
    def.textContent = item.definition;

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.correct = item.term;

    row.appendChild(def);
    row.appendChild(slot);
    container.appendChild(row);
  });

  initDragAndDrop();
};

function initDragAndDrop() {
  const wordBank = document.getElementById("word-bank");
  const slots = Array.from(document.querySelectorAll(".slot"));
  const words = Array.from(document.querySelectorAll(".word"));

  let draggedWord = null;
  let offsetX = 0;
  let offsetY = 0;

  function moveAt(pageX, pageY) {
    if (!draggedWord) return;
    draggedWord.style.left = pageX - offsetX + "px";
    draggedWord.style.top = pageY - offsetY + "px";

    slots.forEach((slot) => slot.classList.remove("highlight"));
    draggedWord.currentHoverSlot = null;

    slots.forEach((slot) => {
      const rect = slot.getBoundingClientRect();
      if (
        pageX >= rect.left + window.scrollX &&
        pageX <= rect.right + window.scrollX &&
        pageY >= rect.top + window.scrollY &&
        pageY <= rect.bottom + window.scrollY
      ) {
        slot.classList.add("highlight");
        draggedWord.currentHoverSlot = slot;
      }
    });
  }

  function resetWordToBank(word) {
    word.style.position = "relative";
    word.style.left = "";
    word.style.top = "";
    word.style.width = "auto";
    word.style.height = "50px";
    word.style.zIndex = "";
    word.classList.remove("dragging", "snapped");
  }

  words.forEach((word) => {
    word.addEventListener("mousedown", (e) => {
      draggedWord = word;
      offsetX = e.offsetX;
      offsetY = e.offsetY;

      word.classList.add("dragging");
      word.style.position = "absolute";
      word.style.zIndex = 1000;
      word.style.height = "50px";
      word.style.width = "auto";
      word.style.margin = "0";
      document.body.appendChild(word);

      moveAt(e.pageX, e.pageY);
    });
  });

  document.addEventListener("mousemove", (e) => moveAt(e.pageX, e.pageY));

  document.addEventListener("mouseup", () => {
    if (!draggedWord) return;

    if (draggedWord.currentHoverSlot) {
      const slot = draggedWord.currentHoverSlot;

      if (slot.firstChild)
        resetWordToBank(slot.firstChild), wordBank.appendChild(slot.firstChild);

      draggedWord.classList.add("snapped");
      draggedWord.style.position = "relative";
      draggedWord.style.top = "0";
      draggedWord.style.left = "0";
      draggedWord.style.width = "100%";
      draggedWord.style.height = "100%";
      draggedWord.style.margin = "0";
      slot.appendChild(draggedWord);
    } else {
      wordBank.appendChild(draggedWord);
      resetWordToBank(draggedWord);
    }

    slots.forEach((slot) => slot.classList.remove("highlight"));
    draggedWord.currentHoverSlot = null;
    draggedWord = null;
  });

  const checkBtn = document.getElementById("check-btn");
  checkBtn.addEventListener("click", () => {
    let correctCount = 0;
    slots.forEach((slot) => {
      const word = slot.querySelector(".word");
      const def = slot.parentElement.querySelector(".definition");
      if (word && word.dataset.word === slot.dataset.correct) {
        def.style.backgroundColor = "#bbf7d0";
        correctCount++;
      } else {
        def.style.backgroundColor = "#fecaca";
      }
    });
    document.getElementById(
      "result"
    ).textContent = `You got ${correctCount} out of ${slots.length} correct!`;
  });
}
