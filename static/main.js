const initVocabQuiz = () => {
  if (!window.vocab) return;

  const wordBank = document.getElementById("word-bank");
  const container = document.querySelector(".matching-container");
  wordBank.innerHTML = "";
  container.innerHTML = "";

  const createWordElement = (term) => {
    const word = document.createElement("div");
    word.className = "word";
    word.dataset.word = term;
    word.textContent = term;
    word.style.height = "50px";
    return word;
  };

  const createDefinitionRow = ({ term, definition }) => {
    const row = document.createElement("div");
    row.className = "row";

    const def = document.createElement("div");
    def.className = "definition";
    def.textContent = definition;

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.correct = term;

    row.append(def, slot);
    return row;
  };

  [...window.vocab]
    .sort(() => Math.random() - 0.5)
    .forEach((item) => wordBank.appendChild(createWordElement(item.term)));

  [...window.vocab]
    .sort(() => Math.random() - 0.5)
    .forEach((item) => container.appendChild(createDefinitionRow(item)));

  initDragAndDrop();
};

const initDragAndDrop = () => {
  const wordBank = document.getElementById("word-bank");
  const slots = Array.from(document.querySelectorAll(".slot"));
  const words = Array.from(document.querySelectorAll(".word"));

  let draggedWord = null;
  let offsetX = 0;
  let offsetY = 0;

  const moveAt = (pageX, pageY) => {
    if (!draggedWord) return;
    draggedWord.style.left = `${pageX - offsetX}px`;
    draggedWord.style.top = `${pageY - offsetY}px`;

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
  };

  const resetWordToBank = (word) => {
    word.style.cssText =
      "position: relative; left: ''; top: ''; width: auto; height: 50px; z-index: '';";
    word.classList.remove("dragging", "snapped");
  };

  words.forEach((word) => {
    word.addEventListener("mousedown", (e) => {
      draggedWord = word;
      offsetX = e.offsetX;
      offsetY = e.offsetY;

      word.classList.add("dragging");
      word.style.cssText =
        "position: absolute; z-index: 1000; height: 50px; width: auto; margin: 0;";
      document.body.appendChild(word);

      moveAt(e.pageX, e.pageY);
    });
  });

  document.addEventListener("mousemove", (e) => moveAt(e.pageX, e.pageY));

  document.addEventListener("mouseup", () => {
    if (!draggedWord) return;

    if (draggedWord.currentHoverSlot) {
      const slot = draggedWord.currentHoverSlot;

      if (slot.firstChild) {
        resetWordToBank(slot.firstChild);
        wordBank.appendChild(slot.firstChild);
      }

      draggedWord.classList.add("snapped");
      draggedWord.style.cssText =
        "position: relative; top: 0; left: 0; width: 100%; height: 100%; margin: 0;";
      slot.appendChild(draggedWord);
    } else {
      wordBank.appendChild(draggedWord);
      resetWordToBank(draggedWord);
    }

    slots.forEach((slot) => slot.classList.remove("highlight"));
    draggedWord.currentHoverSlot = null;
    draggedWord = null;
  });

  document.getElementById("check-btn").addEventListener("click", () => {
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
};

const handlePreloadedQuiz = (preloadedData) => {
  try {
    window.vocab =
      typeof preloadedData === "string"
        ? JSON.parse(preloadedData)
        : preloadedData;

    document.getElementById("quiz-container").style.display = "block";
    initVocabQuiz();

    const notesContainer = document.querySelector("#notes-text").closest("div");
    notesContainer.style.display = "none";
    document.getElementById("generate-btn").style.display = "none";
    document.getElementById("save-btn").style.display = "none";
  } catch (e) {
    console.error("Failed to load preloaded quiz:", e);
  }
};

const setupEventListeners = () => {
  document
    .getElementById("generate-btn")
    .addEventListener("click", async () => {
      const notes = document.getElementById("notes-text").value.trim();
      if (!notes) return alert("Please paste your notes.");

      document.getElementById("generate-btn").style.display = "none";
      const loadingContainer = document.getElementById("loading-container");
      loadingContainer.style.display = "block";

      try {
        const res = await fetch("/vocab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes_text: notes }),
        });

        const data = await res.json();
        if (res.ok) {
          window.vocab = data.vocab;
          document.getElementById("quiz-container").style.display = "block";
          initVocabQuiz();

          document.querySelector("#notes-text").closest("div").style.display =
            "none";
          document.getElementById("generate-btn").style.display = "none";
        } else {
          alert(data.error || "Error generating vocab.");
        }
      } catch (err) {
        alert("Network error: " + err.message);
      } finally {
        loadingContainer.style.display = "none";
      }
    });

  /*
  document.getElementById("save-btn").addEventListener("click", async () => {
    if (!window.vocab) return alert("No quiz to save.");
    const saveBtn = document.getElementById("save-btn");

    try {
      const res = await fetch("/save_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz: window.vocab }),
      });
      const data = await res.json();

      if (res.ok && data.quiz_id) {
        const link = `${window.location.origin}/quiz/${data.quiz_id}`;
        document.getElementById(
          "share-link"
        ).innerHTML = `Share your quiz: <a href="${link}" target="_blank">${link}</a>`;
        saveBtn.textContent = "Saved!";
        saveBtn.disabled = true;
      } else {
        alert(data.error || "Failed to save quiz");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  });*/
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  if (window.preloadedQuiz) handlePreloadedQuiz(window.preloadedQuiz);
});

window.initVocabQuiz = initVocabQuiz;
