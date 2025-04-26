const Notes = [];

async function loadUserNotes() {
  const userNote = await chrome.storage.local.get(["notes"]);
  return JSON.parse(userNote);
}

async function saveUserNote(notes) {
  Notes.push(notes);
  await chrome.storage.local.set({ key: JSON.stringify(Notes) });
}

function createNoteComponent() {
  const $component = $("#create-card").clone();
  $component.css("display", "flex");
  $component.find(".add-btn").on('click',()=>alert("hello world"))
  return $component;
}

function render(component) {
  $("#main").empty();
  $("#main").append(component);
}

render(createNoteComponent())