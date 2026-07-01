/**
 * StorageService wraps Chrome storage / LocalStorage to provide
 * notes and notebooks loading, saving, importing, and exporting.
 */
class StorageService {
  constructor() {
    this.storageKey = 'notesjet_notebooks_data';
  }

  /**
   * Helper to check if running inside a Chrome Extension context
   */
  isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  /**
   * Load all notebooks from storage
   * @returns {Promise<Array>} List of notebooks
   */
  async loadNotebooks() {
    if (this.isExtensionContext()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([this.storageKey], (result) => {
          if (result[this.storageKey]) {
            try {
              resolve(JSON.parse(result[this.storageKey]));
            } catch (e) {
              console.error("Error parsing notebooks from extension storage", e);
              resolve([]);
            }
          } else {
            resolve(this.getDefaultNotebooks());
          }
        });
      });
    } else {
      // Fallback for direct browser testing
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error("Error parsing notebooks from local storage", e);
          return [];
        }
      }
      return this.getDefaultNotebooks();
    }
  }

  /**
   * Save all notebooks to storage
   * @param {Array} notebooks List of notebooks to save
   */
  async saveNotebooks(notebooks) {
    const serialized = JSON.stringify(notebooks);
    if (this.isExtensionContext()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [this.storageKey]: serialized }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem(this.storageKey, serialized);
      return Promise.resolve();
    }
  }

  /**
   * Get default starter notebooks and notes
   */
  getDefaultNotebooks() {
    const now = Date.now();
    return [
      {
        id: 'notebook-work',
        name: '💼 Work',
        color: 'emerald',
        notes: [
          {
            id: 'note-w1',
            title: 'Meeting Agenda & Sync',
            content: 'Discussing key updates:\n1. Refactor Chrome extension structures\n2. Implement beautiful note taking templates\n3. Set up JSON import/export validation mechanisms',
            color: 'emerald',
            archived: false,
            lastModified: now
          },
          {
            id: 'note-w2',
            title: 'CI/CD Pipeline Details',
            content: '- Verify lint controls before merging\n- Maintain documentation comments\n- Zip assets via standard build scripts\n- Upload manually on developer dashboard',
            color: 'ocean',
            archived: false,
            lastModified: now - 3600000
          }
        ]
      },
      {
        id: 'notebook-personal',
        name: '🏠 Personal',
        color: 'lavender',
        notes: [
          {
            id: 'note-p1',
            title: 'Weekly Grocery Essentials',
            content: '- Whole grain bread\n- Organic fresh milk\n- Avocados & bananas\n- Ground coffee beans',
            color: 'sunset',
            archived: false,
            lastModified: now
          },
          {
            id: 'note-p2',
            title: 'Archived Workout Goals',
            content: 'Gym Target:\n- Cardio 30 minutes\n- Strength training 45 minutes\n- Stay hydrated throughout the session',
            color: 'rose',
            archived: true,
            lastModified: now - 7200000
          }
        ]
      }
    ];
  }

  /**
   * Export all notes data as a JSON file download
   */
  async exportData() {
    const notebooks = await this.loadNotebooks();
    const exportObj = {
      version: "2.0",
      timestamp: Date.now(),
      data: notebooks
    };
    return JSON.stringify(exportObj, null, 2);
  }

  /**
   * Validate and import JSON notes data
   * @param {string} jsonString Raw JSON import
   * @returns {Promise<Array>} Loaded notebooks if validation passes
   */
  async importData(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Invalid JSON format. Please upload a valid JSON file.");
    }

    if (!parsed || !Array.isArray(parsed.data)) {
      throw new Error("Invalid structure. JSON must contain a 'data' array of notebooks.");
    }

    // Basic structure validation
    const validatedNotebooks = parsed.data.map(notebook => {
      if (!notebook.id || !notebook.name) {
        throw new Error("Malformed notebook: Each notebook must have an 'id' and 'name'.");
      }
      return {
        id: String(notebook.id),
        name: String(notebook.name),
        color: String(notebook.color || 'emerald'),
        notes: Array.isArray(notebook.notes) ? notebook.notes.map(note => ({
          id: String(note.id || Math.random().toString(36).substr(2, 9)),
          title: String(note.title || 'Untitled Note'),
          content: String(note.content || ''),
          color: String(note.color || 'emerald'),
          archived: Boolean(note.archived),
          lastModified: Number(note.lastModified || Date.now())
        })) : []
      };
    });

    await this.saveNotebooks(validatedNotebooks);
    return validatedNotebooks;
  }
}

// Export for window scope
window.StorageService = StorageService;
