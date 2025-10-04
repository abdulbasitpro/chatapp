
export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
};

export type Message = {
  id: string;
  content: string;
  timestamp: any;
  senderId: string;
  userName: string;
  userAvatar: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

export type Room = {
  id: string;
  name: string;
  creatorId: string;
};

export type Status = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl?: string;
  text?: string;
  createdAt: any;
  expiresAt: any;
};

    