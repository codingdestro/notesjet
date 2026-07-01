/**
 * NotificationService creates animated toast notifications.
 */
class NotificationService {
  constructor() {
    this.containerId = 'toast-container';
    this.initContainer();
  }

  initContainer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Display a notification toast
   * @param {string} message The text to show
   * @param {'success' | 'error' | 'info'} type Style type
   * @param {number} duration Visual duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon/emoji based on type
    let emoji = 'ℹ️';
    if (type === 'success') emoji = '✅';
    if (type === 'error') emoji = '❌';

    toast.innerHTML = `
      <span class="toast-icon">${emoji}</span>
      <span class="toast-message">${this.escapeHTML(message)}</span>
      <button class="toast-close">&times;</button>
    `;

    this.container.appendChild(toast);

    // Animation entry is triggered by rendering.
    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  }

  dismiss(toast) {
    if (toast.classList.contains('toast-exit')) return;
    toast.classList.add('toast-exit');
    // Remove element after exit animation finishes (300ms)
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  escapeHTML(str) {
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
}

// Export for window scope
window.NotificationService = NotificationService;
