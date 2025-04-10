import { reactive } from 'vue';

interface ListenerMap {
  [windowId: string]: Function[];
}

const eventBus = reactive({
  listeners: {} as ListenerMap, // Store listeners for each window ID

  subscribe(windowId: string, callback: Function) {
    if (!this.listeners[windowId]) {
      this.listeners[windowId] = [];
    }
    this.listeners[windowId].push(callback);
  },

  unsubscribe(windowId: string, callback: Function) {
    if (this.listeners[windowId]) {
      this.listeners[windowId] = this.listeners[windowId].filter(cb => cb !== callback);
      if (this.listeners[windowId].length === 0) {
        delete this.listeners[windowId];
      }
    }
  },

  publish(senderId: string, receiverId: string, message: any) {
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