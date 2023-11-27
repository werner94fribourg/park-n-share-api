/**
 * Lock module, containing the Lock prototype function used to handle the lock of a global ressource to avoid simultaneous access on it.
 * @module Lock
 */

/**
 * Lock prototype function, used to create a lock for a specific global ressource.
 */
class Lock {
  /**
   * Constructor function used to generate a new instance of a Lock object.
   */
  constructor() {
    /**
     * @private
     * @readonly
     */
    this.isLocked = false;
  }

  /**
   * Async function used to request the acquisition of the lock on a global resource. wait for a timeout of 100ms before trying to access it another time.
   */
  async acquire() {
    while (this.isLocked) {
      // Wait for a short period before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Acquire the lock
    this.isLocked = true;
  }

  /**
   * Function used to release the lock on a global resource
   */
  release() {
    // Release the lock
    this.isLocked = false;
  }
}

module.exports = Lock;
