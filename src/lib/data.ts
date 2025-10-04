import { PlaceHolderImages } from './placeholder-images';

const getAvatar = (id: string) => {
  return PlaceHolderImages.find(p => p.id === id)?.imageUrl || '';
}

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
};

export type Room = {
  id: string;
  name: string;
  messages: Message[];
};

export const users: User[] = [
  { id: '1', name: 'Alice', avatarUrl: getAvatar('user-1') },
  { id: '2', name: 'Bob', avatarUrl: getAvatar('user-2') },
  { id: '3', name: 'Charlie', avatarUrl: getAvatar('user-3') },
  { id: '4', name: 'David', avatarUrl: getAvatar('user-4') },
];

export const currentUser: User = { id: '5', name: 'You', avatarUrl: getAvatar('current-user') };

export const rooms: Omit<Room, 'messages'>[] = [
  { id: '1', name: 'General' },
  { id: '2', name: 'Random' },
  { id: '3', name: 'Tech Talk' },
];

const allMessages: Message[] = [
  { id: 'm1', text: 'Hey everyone! How is it going?', timestamp: '10:30 AM', userId: '1' },
  { id: 'm2', text: 'Pretty good, just working on a new project.', timestamp: '10:31 AM', userId: '2' },
  { id: 'm3', text: 'That sounds exciting! What is it about?', timestamp: '10:31 AM', userId: '1' },
  { id: 'm4', text: 'It is a real-time chat application!', timestamp: '10:32 AM', userId: '5' },
  { id: 'm5', text: 'Wow, meta!', timestamp: '10:33 AM', userId: '3' },
  { id: 'm6', text: 'Has anyone seen the latest Next.js update?', timestamp: '10:40 AM', userId: '4' },
  { id: 'm7', text: 'Yeah, server components look amazing.', timestamp: '10:41 AM', userId: '2' },
  { id: 'm8', text: 'What is the best pizza topping?', timestamp: '11:00 AM', userId: '3' },
  { id: 'm9', text: 'Pineapple, obviously.', timestamp: '11:01 AM', userId: '1' },
  { id: 'm10', text: 'I am leaving this room.', timestamp: '11:01 AM', userId: '2' },
];

export const roomData: Room[] = [
  {
    id: '1',
    name: 'General',
    messages: allMessages.slice(0, 5),
  },
  {
    id: '2',
    name: 'Random',
    messages: allMessages.slice(7, 10),
  },
  {
    id: '3',
    name: 'Tech Talk',
    messages: allMessages.slice(5, 7),
  },
];

export const findUserById = (id: string): User | undefined => [...users, currentUser].find(u => u.id === id);
export const findRoomById = (id: string): Room | undefined => roomData.find(r => r.id === id);
