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

  unsubscribe(windowId: number, callback: Function) {
    if (this.listeners[windowId]) {
      // Filter based on the callback function within the ListenerEntry object
      this.listeners[windowId] = this.listeners[windowId].filter(entry => entry.callback !== callback);
      
      if (this.listeners[windowId].length === 0) {
        delete this.listeners[windowId];
        console.log(`EventBus: Removed all listeners for window ${windowId}`);
      } else {
        console.log(`EventBus: Removed a listener from window ${windowId}, ${this.listeners[windowId].length} remaining`);
      }
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