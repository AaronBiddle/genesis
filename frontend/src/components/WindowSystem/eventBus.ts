import { reactive } from 'vue';

interface ListenerMap {
  [windowId: number]: Function[];
}

const eventBus = reactive({
  listeners: {} as ListenerMap, // Store listeners for each window ID

  subscribe(windowId: number, callback: Function) {
    // Replace the existing listeners array with a new array containing only the new callback
    this.listeners[windowId] = [callback];
    console.log(`EventBus: Window ${windowId} registered a new listener (overwriting any previous listeners)`);
  },

  unsubscribe(windowId: number, callback: Function) {
    if (this.listeners[windowId]) {
      this.listeners[windowId] = this.listeners[windowId].filter(cb => cb !== callback);
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
      this.listeners[receiverId].forEach(callback => {
        callback(senderId, message);
      });
      console.log(`EventBus: Message from window ${senderId} delivered to window ${receiverId}`);
    } else {
      console.warn(`EventBus: No listeners found for window ID: ${receiverId}`);
    }
  }
});

export default eventBus; 