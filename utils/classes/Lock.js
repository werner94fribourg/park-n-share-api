class Lock {
  constructor() {
    this.isLocked = false;
  }

  async acquire() {
    while (this.isLocked) {
      // Wait for a short period before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Acquire the lock
    this.isLocked = true;
  }

  release() {
    // Release the lock
    this.isLocked = false;
  }
}

module.exports = Lock;
