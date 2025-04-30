let Notes = [];
let currentPage = 0;
let noteToDelete = null;

function genereateID() {
  const dataSet = "abcdefghikjlmnopqrstuvwxyz123456789".split("");
  let id = [];
  for (let i = 0; i < 4; i++) {
    id.push(dataSet[Math.floor(Math.random() * (dataSet.length - 1))]);
  }
  return id.join("");
}

function generateColor() {
  const colors = ["red", "blue", "brown", "gray"];

  return colors[Math.floor(Math.random() * (colors.length - 1))];
}

async function loadUserNotes() {
  const { notes } = await chrome.storage.local.get(["notes"]);
  if (!notes) return;
  Notes = JSON.parse(notes);
}

async function saveUserNote(notes) {
  Notes.push(notes);
  await chrome.storage.local.set({ notes: JSON.stringify(Notes) });
}

async function deleteNote(index) {
  // Notes.splice(index, 1);
  Notes = Notes.filter((ele) => ele.id != noteToDelete);
  await chrome.storage.local.set({ notes: JSON.stringify(Notes) });
  render(listNotesCompnent());
}

$("#back-btn").on("click", () => {
  if (currentPage == 1 && Notes.length == 0) {
    currentPage--;
    render(createNoteComponent());
  } else {
    render(listNotesCompnent());
  }
});

function listNotesCompnent() {
  const component = $("#notes").clone();
  component.find(".add-btn").on("click", () => {
    currentPage++;
    render(notesComponent());
  });

  component.css("display", "grid");
  for (let i = 0; i < Notes.length; i++) {
    const card = $(
      `<div class='card card-content' data-color="${Notes[i].color}">
        <p>${Notes[i].title}</p>
        <button class="delete-note-btn" data-index="${Notes[i].id}">
          <img src="icons/bin.png" alt="Delete" class="delete-icon">
        </button>
      </div>`
    );
    component.append(card);
  }

  // Add delete button click handlers
  component.find(".delete-note-btn").on("click", function (e) {
    e.stopPropagation();
    const index = $(this).data("index");
    noteToDelete = index;
    $("#deleteModal").fadeIn(200);
  });

  return component;
}

// Modal event handlers
function notesComponent() {
  const component = $("#create-note").clone();
  component.css("display", "flex");
  let dropdownMenu = component.find("#dropdownMenu");
  component.find("#menuButton").on("click", () => {
    if (!dropdownMenu) return;
    dropdownMenu.toggleClass("show");
  });

  dropdownMenu.find("#save-btn").on("click", () => {
    const val = component.find("textarea").val();
    const title = component.find("input").val();
    saveUserNote({
      id: genereateID(),
      title,
      note: val,
      color: "red",
    });
    dropdownMenu.toggleClass("show");
  });

  return component;
}

function createNoteComponent() {
  const $component = $("#create-card").clone();
  $component.css("display", "flex");

  $component.find(".add-btn").on("click", () => {
    currentPage++;
    render(notesComponent());
  });

  return $component;
}

function selectNote(idx) {
  const component = $("#create-note").clone();
  component.css("display", "flex");
  let dropdownMenu = component.find("#dropdownMenu");
  component.find("#menuButton").on("click", () => {
    if (!dropdownMenu) return;
    dropdownMenu.toggleClass("show");
  });

  dropdownMenu.find("#save-btn").on("click", () => {
    const val = component.find("textarea").val();
    const title = component.find("input").val();
    saveUserNote({
      title,
      note: val,
      color: generateColor(),
    });
    dropdownMenu.toggleClass("show");
  });
}

function render(component) {
  $("#main").empty();
  $("#main").append(component);

  $(".cancel-btn").on("click", () => {
    $("#deleteModal").fadeOut(200);
    noteToDelete = null;
  });

  $(".delete-btn").on("click", async () => {
    if (noteToDelete !== null) {
      console.log("delelte the current note");
      await deleteNote(noteToDelete);
      $("#deleteModal").fadeOut(200);
      noteToDelete = null;
    }
  });

  // Close modal when clicking outside
  $("#deleteModal").on("click", function (e) {
    if (e.target === this) {
      $(this).fadeOut(200);
      noteToDelete = null;
    }
  });
}

loadUserNotes().then(() => {
  if (Notes.length <= 0) render(createNoteComponent());
  else render(listNotesCompnent());
});
