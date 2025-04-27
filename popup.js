const Notes = [
  {
    title: "Learn jQuery",
    note: "Understand how to create and manipulate DOM elements.",
    color: "red",
  },
  {
    title: "Practice JavaScript",
    note: "Solve problems daily to get better at logic.",
    color: "purple",
  },
  {
    title: "Build Projects",
    note: "Start small projects like a todo app or notes app.",
    color: "brown",
  },
  {
    title: "Master Git",
    note: "Learn basic commands like commit, push, pull, and branch.",
    color: "blue",
  },
  {
    title: "Explore React",
    note: "Get familiar with components, props, and state.",
    color: "red",
  },
];

let currentPage = 0;

async function loadUserNotes() {
  const userNote = await chrome.storage.local.get(["notes"]);
  return JSON.parse(userNote);
}

async function saveUserNote(notes) {
  Notes.push(notes);
  await chrome.storage.local.set({ key: JSON.stringify(Notes) });
}

$("#back-btn").on("click", () => {
  // console.log(currentPage)
  if (currentPage == 1) {
    currentPage--;
    render(createNoteComponent());
  }
});

function listNotesCompnent() {
  const component = $("#notes").clone();
  component.css("display", "grid");
  for (let i = 0; i < Notes.length; i++) {
    const card = $(
      `<div class='card card-content' data-color="${Notes[i].color}"><p>${Notes[i].note}</p></div>`
    );
    component.append(card);
  }
  return component;
}

function notesComponent() {
  const component = $("#create-note").clone();
  component.css("display", "flex");
  let dropdownMenu = component.find("#dropdownMenu");
  component.find("#menuButton").on("click", () => {
    if (!dropdownMenu) return;
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

function render(component) {
  $("#main").empty();
  $("#main").append(component);
}

if (Notes.length <= 0) render(createNoteComponent());
// render(listNotesCompnent());
render(createNoteComponent());
