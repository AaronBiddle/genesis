import { reactive } from 'vue';

interface ListenerMap {
  [windowId: number]: Function[];
}

const eventBus = reactive({
  listeners: {} as ListenerMap, // Store listeners for each window ID

  subscribe(windowId: number, callback: Function) {
    if (!this.listeners[windowId]) {
      this.listeners[windowId] = [];
    }
    this.listeners[windowId].push(callback);
  },

  unsubscribe(windowId: number, callback: Function) {
    if (this.listeners[windowId]) {
      this.listeners[windowId] = this.listeners[windowId].filter(cb => cb !== callback);
      if (this.listeners[windowId].length === 0) {
        delete this.listeners[windowId];
      }
    }
  },

  publish(senderId: number, receiverId: number, message: any) {
    if (this.listeners[receiverId]) {
      this.listeners[receiverId].forEach(callback => {
        callback(senderId, message);
      });
    } else {
      console.warn(`No listeners found for window ID: ${receiverId}`);
    }
  }
});

export default eventBus; 