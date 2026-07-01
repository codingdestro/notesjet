$(document).ready(async () => {
  const storage = new window.StorageService();
  const notifier = new window.NotificationService();

  let notebooks = [];
  let activeNotebookId = null;
  let activeEditingNote = null; // Tracks note currently open in editor: { notebookId, note }

  // Color Palette Constants
  const COLORS = ['emerald', 'lavender', 'ocean', 'sunset', 'rose', 'crimson', 'clay', 'charcoal', 'amber'];

  // Initialize Theme
  function initTheme() {
    const savedTheme = localStorage.getItem('notes_theme') || 'light';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      $('body').addClass('dark-theme').removeClass('light-theme');
      $('#theme-toggle').html('<i class="fa-solid fa-sun"></i> Light Mode');
      localStorage.setItem('notes_theme', 'dark');
    } else {
      $('body').addClass('light-theme').removeClass('dark-theme');
      $('#theme-toggle').html('<i class="fa-solid fa-moon"></i> Dark Mode');
      localStorage.setItem('notes_theme', 'light');
    }
  }

  // Toggle Theme Click Handler
  $('#theme-toggle').on('click', () => {
    const isDark = $('body').hasClass('dark-theme');
    setTheme(isDark ? 'light' : 'dark');
    notifier.show(`Theme switched to ${isDark ? 'Light' : 'Dark'} Mode`, 'info');
  });

  // Initialize Sidebar Collapse State
  function initSidebarState() {
    const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (collapsed) {
      $('.sidebar').addClass('collapsed');
    }
  }

  // Load and Render App
  async function initApp() {
    initTheme();
    initSidebarState();
    notebooks = await storage.loadNotebooks();
    if (notebooks.length > 0) {
      activeNotebookId = notebooks[0].id;
    }
    renderSidebar();
    renderActiveNotebook();
    initEditorColorSelector();
    bindSidebarEvents();
  }

  function bindSidebarEvents() {
    // Collapse click
    $('#sidebar-collapse-btn').on('click', () => {
      $('.sidebar').addClass('collapsed');
      $('#sidebar-expand-btn').fadeIn(150);
      localStorage.setItem('sidebar_collapsed', 'true');
    });

    // Expand click
    $(document).on('click', '#sidebar-expand-btn', () => {
      $('.sidebar').removeClass('collapsed');
      $('#sidebar-expand-btn').fadeOut(150);
      localStorage.setItem('sidebar_collapsed', 'false');
    });
  }

  // Render Notebooks in Sidebar
  function renderSidebar() {
    const $sidebarList = $('#sidebar-notebooks');
    $sidebarList.empty();

    if (notebooks.length === 0) {
      $sidebarList.append('<div class="no-buckets-msg">No notebooks. Click "+" to create one!</div>');
      return;
    }

    notebooks.forEach(notebook => {
      const activeClass = notebook.id === activeNotebookId ? 'active' : '';
      const noteCount = notebook.notes ? notebook.notes.filter(n => !n.archived).length : 0;
      const badgeHtml = noteCount > 0 ? `<span class="notebook-badge">${noteCount}</span>` : '';

      const $item = $(`
        <div class="notebook-item ${activeClass}" data-id="${notebook.id}">
          <span class="notebook-dot color-dot-${notebook.color}"></span>
          <span class="notebook-name">${escapeHtml(notebook.name)}</span>
          ${badgeHtml}
        </div>
      `);

      $item.on('click', () => {
        activeNotebookId = notebook.id;
        renderSidebar();
        renderActiveNotebook();
      });

      $sidebarList.append($item);
    });
  }

  // Render Active Notebook Content
  function renderActiveNotebook() {
    const $mainContent = $('#active-notebook-container');
    $mainContent.empty();

    const activeNotebook = notebooks.find(n => n.id === activeNotebookId);

    if (!activeNotebook) {
      $mainContent.html(`
        <div class="empty-state-view">
          <h2>No Active Notebook</h2>
          <p>Create a notebook from the sidebar to start writing notes.</p>
          <button id="empty-state-add-btn" class="action-btn-primary">➕ Create New Notebook</button>
        </div>
      `);
      $('#empty-state-add-btn').on('click', () => $('#add-notebook-btn').trigger('click'));
      return;
    }

    if (!activeNotebook.notes) activeNotebook.notes = [];

    const activeNotes = activeNotebook.notes.filter(n => !n.archived);
    const archivedNotes = activeNotebook.notes.filter(n => n.archived);

    const isSidebarCollapsed = $('.sidebar').hasClass('collapsed');
    const expandStyle = isSidebarCollapsed ? 'display: inline-block;' : 'display: none;';

    const $notebookView = $(`
      <div class="notebook-view-header" data-color="${activeNotebook.color}">
        <div class="notebook-title-section">
          <button id="sidebar-expand-btn" class="sidebar-expand-btn" title="Expand sidebar" style="${expandStyle}"><i class="fa-solid fa-bars"></i></button>
          <input type="text" class="notebook-title-input" value="${escapeHtml(activeNotebook.name)}" placeholder="Notebook Name" />
          <button class="delete-notebook-trigger" title="Delete Notebook"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="color-palette-container">
          <div class="custom-dropdown-container">
            <button type="button" id="notebook-color-trigger" class="color-trigger-btn bg-dot-${activeNotebook.color}" title="Choose theme color"></button>
            <div id="notebook-color-dropdown" class="custom-color-dropdown-panel" style="display: none;">
              <div class="color-grid-panel">
                <button type="button" class="color-option-dot bg-dot-emerald" data-color="emerald" title="emerald"></button>
                <button type="button" class="color-option-dot bg-dot-lavender" data-color="lavender" title="lavender"></button>
                <button type="button" class="color-option-dot bg-dot-ocean" data-color="ocean" title="ocean"></button>
                <button type="button" class="color-option-dot bg-dot-sunset" data-color="sunset" title="sunset"></button>
                <button type="button" class="color-option-dot bg-dot-rose" data-color="rose" title="rose"></button>
                <button type="button" class="color-option-dot bg-dot-crimson" data-color="crimson" title="crimson"></button>
                <button type="button" class="color-option-dot bg-dot-clay" data-color="clay" title="clay"></button>
                <button type="button" class="color-option-dot bg-dot-charcoal" data-color="charcoal" title="charcoal"></button>
                <button type="button" class="color-option-dot bg-dot-amber" data-color="amber" title="amber"></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="notes-section">
        <h3 class="notes-section-title">Notes (${activeNotes.length})</h3>
        <div class="notes-grid-layout" id="active-notes-grid">
          <!-- Note cards + Add trigger -->
        </div>
      </div>

      <div class="notes-section">
        <h3 class="archived-header">
          <span>Archived Notes (${archivedNotes.length})</span>
          <button id="toggle-archived-visibility" class="toggle-btn-small">Show/Hide</button>
        </h3>
        <div class="archived-notes-wrapper collapsed" id="archived-notes-section">
          <div class="notes-grid-layout" id="archived-notes-grid"></div>
        </div>
      </div>
    `);

    $mainContent.append($notebookView);

    // Toggle Notebook Color Dropdown Grid
    $notebookView.find('#notebook-color-trigger').on('click', function(e) {
      e.stopPropagation();
      $notebookView.find('#notebook-color-dropdown').fadeToggle(150);
    });

    // Select color dot from grid
    $notebookView.find('#notebook-color-dropdown .color-option-dot').on('click', function() {
      const newColor = $(this).data('color');
      activeNotebook.color = newColor;
      saveAndRefresh();
      notifier.show(`Notebook theme changed to ${newColor}`, 'success');
    });

    // Delete Notebook listener
    $notebookView.find('.delete-notebook-trigger').on('click', () => {
      $('#delete-notebook-modal').fadeIn(200);
    });

    // Rename Notebook on blur/change
    const $titleInput = $notebookView.find('.notebook-title-input');
    $titleInput.on('blur change', function() {
      const newName = $(this).val().trim();
      if (newName && newName !== activeNotebook.name) {
        activeNotebook.name = newName;
        saveAndRefresh();
      }
    });

    // Collapse/Expand Archived Notes Section
    const isArchivedCollapsed = localStorage.getItem('archived_collapsed') === 'true';
    if (!isArchivedCollapsed) {
      $('#archived-notes-section').removeClass('collapsed');
    }
    $('#toggle-archived-visibility').on('click', () => {
      const $section = $('#archived-notes-section');
      $section.toggleClass('collapsed');
      localStorage.setItem('archived_collapsed', $section.hasClass('collapsed'));
    });

    // Populate active notes grid
    const $activeGrid = $('#active-notes-grid');
    
    // Add note card trigger
    const $addCard = $(`
      <div class="create-note-card">
        <i class="fa-solid fa-plus create-note-card-icon"></i>
        <span class="create-note-card-text">New Note</span>
      </div>
    `);
    $addCard.on('click', () => openNewNoteEditor(activeNotebook.id));
    $activeGrid.append($addCard);

    // Populate actual active note cards
    renderNoteCards(activeNotes, $activeGrid, activeNotebook.id);

    // Populate archived note cards
    const $archivedGrid = $('#archived-notes-grid');
    renderNoteCards(archivedNotes, $archivedGrid, activeNotebook.id);
  }

  // Render list of note cards inside a specific grid container
  function renderNoteCards(notesList, $targetGrid, notebookId) {
    if (notesList.length === 0 && $targetGrid.attr('id') === 'archived-notes-grid') {
      $targetGrid.parent().html('<div class="empty-list-msg">No archived notes in this notebook</div>');
      return;
    }

    notesList.forEach(note => {
      const formattedDate = new Date(note.lastModified).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const archiveBadge = note.archived ? '<span class="note-card-archive-badge">Archived</span>' : '';
      const contentSnippet = note.content ? escapeHtml(note.content) : '<i>No content</i>';

      const $card = $(`
        <div class="note-card" data-id="${note.id}" data-color="${note.color}">
          <h4 class="note-card-title">${escapeHtml(note.title)}</h4>
          <p class="note-card-excerpt">${contentSnippet}</p>
          <div class="note-card-footer">
            <span class="note-card-date">${formattedDate}</span>
            ${archiveBadge}
          </div>
        </div>
      `);

      $card.on('click', () => openNoteEditor(notebookId, note));
      $targetGrid.append($card);
    });
  }

  // --- Note Editor Dialog Panel logic ---

  // Initialize note color select listener
  function initEditorColorSelector() {
    // Toggle Note Editor Color Dropdown Panel
    $('#editor-note-color-trigger').on('click', function(e) {
      e.stopPropagation();
      $('#editor-note-color-dropdown').fadeToggle(150);
    });

    // Select color dot from editor grid
    $('#editor-note-color-dropdown .color-option-dot').on('click', function() {
      if (!activeEditingNote) return;
      const selectedColor = $(this).data('color');
      activeEditingNote.note.color = selectedColor;
      
      // Update visual trigger dot preview
      $('#editor-note-color-trigger').removeClass().addClass(`color-trigger-btn bg-dot-${selectedColor}`);
      
      saveAndRefresh();
      notifier.show(`Note color changed to ${selectedColor}`, 'success');
      $('#editor-note-color-dropdown').fadeOut(150);
    });
  }

  // Open note editor for creating a new note
  function openNewNoteEditor(notebookId) {
    const notebook = notebooks.find(n => n.id === notebookId);
    const newNote = {
      id: 'note-' + Date.now() + Math.random().toString(36).substr(2, 4),
      title: 'Untitled Note',
      content: '',
      color: notebook ? notebook.color : 'emerald',
      archived: false,
      lastModified: Date.now()
    };

    if (notebook) {
      if (!notebook.notes) notebook.notes = [];
      notebook.notes.push(newNote);
    }

    openNoteEditor(notebookId, newNote, true);
  }

  // Open Note Editor overlay
  function openNoteEditor(notebookId, note, isNew = false) {
    activeEditingNote = { notebookId, note };

    // Fill fields
    $('#editor-note-title').val(note.title);
    $('#editor-note-content').val(note.content);
    $('#editor-archive-btn').html(note.archived ? '<i class="fa-solid fa-arrow-up-from-bracket"></i> Restore Note' : '<i class="fa-solid fa-box-archive"></i> Archive Note');
    
    const formattedDate = new Date(note.lastModified).toLocaleString();
    $('#editor-last-modified').text(`Last modified: ${formattedDate}`);

    // Configure trigger preview color and reset dropdown open state
    $('#editor-note-color-trigger').removeClass().addClass(`color-trigger-btn bg-dot-${note.color}`);
    $('#editor-note-color-dropdown').hide();

    // Slide open overlay
    $('#note-editor-overlay').fadeIn(200);

    if (isNew) {
      $('#editor-note-title').focus().select();
    }
  }

  // Save active note changes to storage
  function saveActiveEditingNote() {
    if (!activeEditingNote) return;
    const { notebookId, note } = activeEditingNote;
    const titleVal = $('#editor-note-title').val().trim() || 'Untitled Note';
    const contentVal = $('#editor-note-content').val();

    if (note.title !== titleVal || note.content !== contentVal) {
      note.title = titleVal;
      note.content = contentVal;
      note.lastModified = Date.now();
      saveAndRefresh();
    }
  }

  // Close Editor panel
  function closeEditor() {
    saveActiveEditingNote();
    $('#note-editor-overlay').fadeOut(180);
    activeEditingNote = null;
  }

  // Close button trigger
  $('#editor-close-btn').on('click', () => closeEditor());

  // Close editor by clicking overlay backdrop
  $('#note-editor-overlay').on('click', function(e) {
    if (e.target === this) {
      closeEditor();
    }
  });

  // Archive Note inside editor
  $('#editor-archive-btn').on('click', () => {
    if (!activeEditingNote) return;
    const { note } = activeEditingNote;
    note.archived = !note.archived;
    note.lastModified = Date.now();
    
    saveAndRefresh();
    notifier.show(
      note.archived ? 'Note archived and moved to archived group!' : 'Note restored to active workspace!',
      note.archived ? 'success' : 'info'
    );
    closeEditor();
  });

  // Delete Note inside editor
  $('#editor-delete-btn').on('click', () => {
    if (!activeEditingNote) return;
    const { notebookId, note } = activeEditingNote;
    const notebook = notebooks.find(n => n.id === notebookId);
    
    if (notebook) {
      notebook.notes = notebook.notes.filter(n => n.id !== note.id);
      saveAndRefresh();
      notifier.show('Note deleted', 'info');
    }
    
    // Close editor directly without saving since it's deleted
    $('#note-editor-overlay').fadeOut(150);
    activeEditingNote = null;
  });

  // Editor manual save note button
  $('#editor-save-btn').on('click', () => {
    saveActiveEditingNote();
    const formattedDate = new Date(activeEditingNote.note.lastModified).toLocaleString();
    $('#editor-last-modified').text(`Last modified: ${formattedDate}`);
    notifier.show('Note saved successfully', 'success');
  });

  // Auto-save typing listeners inside editor
  let autosaveTimer;
  $('#editor-note-title, #editor-note-content').on('input', () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveActiveEditingNote();
    }, 1000); // Autosaves 1 second after user stops typing
  });

  // Save notebooks state and refresh both sidebar list and active panel
  async function saveAndRefresh() {
    await storage.saveNotebooks(notebooks);
    renderSidebar();
    renderActiveNotebook();
  }

  // --- Sidebar Actions ---

  // Add Notebook trigger
  $('#add-notebook-btn').on('click', () => {
    $('#new-notebook-name').val('');
    $('#create-notebook-modal').fadeIn(200);
    $('#new-notebook-name').focus();
  });

  // Close modal prompts
  $('.modal-cancel-btn').on('click', () => {
    $('.modal-overlay-custom').fadeOut(200);
  });

  // Confirm notebook creation
  $('#confirm-create-notebook-btn').on('click', () => {
    const name = $('#new-notebook-name').val().trim();
    if (!name) {
      notifier.show('Notebook name cannot be empty', 'error');
      return;
    }

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNotebook = {
      id: 'notebook-' + Date.now(),
      name: name,
      color: randomColor,
      notes: []
    };

    notebooks.push(newNotebook);
    activeNotebookId = newNotebook.id;
    saveAndRefresh();
    $('#create-notebook-modal').fadeOut(200);
    notifier.show(`Notebook "${name}" created!`, 'success');
  });

  $('#new-notebook-name').on('keydown', (e) => {
    if (e.key === 'Enter') $('#confirm-create-notebook-btn').trigger('click');
  });

  // Confirm deleting a notebook
  $('#confirm-delete-notebook-btn').on('click', () => {
    if (!activeNotebookId) return;

    notebooks = notebooks.filter(n => n.id !== activeNotebookId);
    activeNotebookId = notebooks.length > 0 ? notebooks[0].id : null;
    
    saveAndRefresh();
    $('#delete-notebook-modal').fadeOut(200);
    notifier.show(`Notebook deleted`, 'info');
  });

  // --- Export / Import operations ---

  // Export JSON file
  $('#export-data-btn').on('click', async () => {
    try {
      const jsonStr = await storage.exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `notesjet_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      notifier.show('Data exported successfully!', 'success');
    } catch (e) {
      console.error(e);
      notifier.show('Failed to export data.', 'error');
    }
  });

  // Import JSON file click
  $('#import-data-btn').on('click', () => {
    $('#import-file-input').trigger('click');
  });

  $('#import-file-input').on('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target.result;
        notebooks = await storage.importData(fileContent);
        if (notebooks.length > 0) {
          activeNotebookId = notebooks[0].id;
        } else {
          activeNotebookId = null;
        }
        saveAndRefresh();
        notifier.show('Data imported successfully!', 'success');
      } catch (err) {
        console.error(err);
        notifier.show(err.message || 'Failed to import notes backup.', 'error');
      }
    };
    reader.readAsText(file);
    $(this).val('');
  });

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Backdrop close for overlay dialogs
  $('.modal-overlay-custom').on('click', function(e) {
    if (e.target === this) {
      $(this).fadeOut(200);
    }
  });

  // Close all custom dropdown color panels when clicking outside
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.custom-dropdown-container').length) {
      $('.custom-color-dropdown-panel').fadeOut(150);
    }
  });

  // Initialize Application
  await initApp();
});
