import { reactive } from 'vue';

// Define the structure for a single listener entry
export interface ListenerEntry {
  callback: Function;
  keepAlive: boolean;
}

export interface ListenerMap {
  [windowId: number]: ListenerEntry[]; // Store an array of listener entries
}

const eventBus = reactive({
  listeners: {} as ListenerMap, // Store listeners for each window ID

  // Updated subscribe method to prioritize keepAlive
  subscribe(windowId: number, callback: Function, keepAlive: boolean = false) {
    let finalKeepAlive = keepAlive;

    // Check if there's an existing listener entry for this window ID
    // Note: We assume only one entry per windowId due to overwrite logic
    const existingEntry = this.listeners[windowId]?.[0]; 
    if (existingEntry) {
      // Prioritize keepAlive: if either existing or new is true, final is true
      finalKeepAlive = existingEntry.keepAlive || keepAlive;
    }

    const newListenerEntry: ListenerEntry = { callback, keepAlive: finalKeepAlive };
    
    // Replace the existing listeners array with a new array containing only the new entry
    this.listeners[windowId] = [newListenerEntry];
    
    console.log(`EventBus: Window ${windowId} registered listener. Final keepAlive: ${finalKeepAlive} (Previous: ${existingEntry?.keepAlive ?? 'N/A'}, New: ${keepAlive})`);
  },

  // Updated unsubscribe method: removes based on windowId, respects keepAlive unless forced
  unsubscribe(windowId: number, force: boolean = false) {
    const entry = this.listeners[windowId]?.[0]; // Get the entry if it exists

    if (entry) {
      if (force || !entry.keepAlive) {
        delete this.listeners[windowId]; // Remove the entry for this window ID
        console.log(`EventBus: Removed listener for window ${windowId}. KeepAlive: ${entry.keepAlive}, Forced: ${force}`);
      } else {
        // KeepAlive is true and force is false
        console.log(`EventBus: Did not remove listener for window ${windowId} because keepAlive is true and force is false.`);
      }
    } else {
      // No listener found for this ID
      console.log(`EventBus: No listener found for window ${windowId} to unsubscribe.`);
    }
  },

  publish(senderId: number, receiverId: number, message: any) {
    if (this.listeners[receiverId]) {
      // Iterate through listener entries and invoke their callbacks
      this.listeners[receiverId].forEach(entry => {
        entry.callback(senderId, message);
      });
      console.log(`EventBus: Message from window ${senderId} delivered to window ${receiverId}`);
    } else {
      console.warn(`EventBus: No listeners found for window ID: ${receiverId}`);
    }
  }
});

export default eventBus; 