import { ChatMessage } from '../types/chat';

export const chatService = {
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "This is a mock response. Implement real API integration here.";
  }
};
